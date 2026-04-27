package com.execservice.service;

import com.execservice.dto.CompileError;
import com.execservice.dto.ExecuteResponse;
import com.execservice.dto.SyntaxCheckResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import javax.tools.*;
import java.io.*;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.*;
import java.util.stream.Collectors;

/**
 * ExecutionService for the execution microservice.
 *
 * Strategy:
 *   - Compile with the Java Compiler API (in-process, fast, exact error locations)
 *   - Run in Docker container when docker.enabled=true (default in this service)
 *   - Fall back to bare JVM child process when Docker is not available
 *
 * The execution service defaults Docker to ON — it should only be deployed on
 * a host where the Docker daemon is running.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExecutionService {

    private final CodeSafetyScanner safetyScanner;

    private static final int  TIMEOUT_SECONDS  = 10;
    private static final long MAX_OUTPUT_BYTES = 10_000;
    private static final Set<String> VALID_VERSIONS = Set.of("8", "11", "17", "21");
    private static final String      DEFAULT_VERSION = "17";

    @Value("${execution.max-concurrent:25}")
    private int maxConcurrent;

    @Value("${execution.max-processes:16}")
    private int maxProcesses;

    @Value("${execution.docker.enabled:true}")
    private boolean dockerEnabled;

    @Value("${execution.docker.image:eclipse-temurin:17-jre-alpine}")
    private String dockerImage;

    @Value("${execution.docker.memory-mb:256}")
    private int dockerMemoryMb;

    @Value("${execution.docker.cpus:0.5}")
    private String dockerCpus;

    @Value("${execution.docker.timeout-seconds:15}")
    private int dockerTimeoutSeconds;

    private volatile Semaphore concurrencyGate;
    private volatile Semaphore processGate;
    private volatile ExecutorService ioPool;

    private Semaphore gate() {
        if (concurrencyGate == null) {
            synchronized (this) {
                if (concurrencyGate == null) concurrencyGate = new Semaphore(maxConcurrent, true);
            }
        }
        return concurrencyGate;
    }

    private Semaphore processGate() {
        if (processGate == null) {
            synchronized (this) {
                if (processGate == null) processGate = new Semaphore(maxProcesses, true);
            }
        }
        return processGate;
    }

    private ExecutorService ioPool() {
        if (ioPool == null) {
            synchronized (this) {
                if (ioPool == null)
                    ioPool = Executors.newFixedThreadPool(maxProcesses * 2,
                            r -> { Thread t = new Thread(r, "exec-io"); t.setDaemon(true); return t; });
            }
        }
        return ioPool;
    }

    @PreDestroy
    public void shutdown() {
        if (ioPool != null) ioPool.shutdownNow();
    }

    @PostConstruct
    public void warmUp() {
        try {
            JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
            if (compiler == null) return;
            String dummy = "public class _Warmup { public static void main(String[] a) {} }";
            Path tmp = Files.createTempDirectory("execsvc_warmup_");
            try {
                Path src = tmp.resolve("_Warmup.java");
                Files.writeString(src, dummy);
                try (StandardJavaFileManager fm = compiler.getStandardFileManager(null, null, null)) {
                    compiler.getTask(null, fm, null,
                        List.of("--release", "17", "-proc:none"),
                        null, fm.getJavaFileObjectsFromPaths(List.of(src))).call();
                }
            } finally {
                cleanup(tmp);
            }
            log.info("Execution service ready. Docker mode: {}", dockerEnabled);
            if (dockerEnabled) {
                log.info("Docker image: {}, memory: {}m, cpus: {}", dockerImage, dockerMemoryMb, dockerCpus);
            }
        } catch (Exception e) {
            log.warn("Compiler warm-up skipped: {}", e.getMessage());
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    private boolean hasMain(String code) {
        return code != null && code.contains("public static void main");
    }

    private String wrapWithHarness(String userCode, String harness) {
        if (harness == null || harness.isBlank()) return userCode;
        if (hasMain(userCode)) return userCode;
        return userCode + "\n\n" + harness;
    }

    public ExecuteResponse execute(String code, String stdin, String javaVersion, String harness) {
        CodeSafetyScanner.ScanResult scan = safetyScanner.scan(code);
        if (!scan.safe()) {
            return ExecuteResponse.builder().success(false).status("BLOCKED")
                    .error(scan.reason()).build();
        }

        boolean useHarness = harness != null && !harness.isBlank() && !hasMain(code);
        String fullCode  = useHarness ? wrapWithHarness(code, harness) : code;
        String className = extractPublicClassName(code);
        String runClass  = useHarness ? "__Runner__" : className;

        if (!gate().tryAcquire()) {
            return ExecuteResponse.builder().success(false).status("TOO_MANY_REQUESTS")
                    .error("Server is busy. Please retry in a few seconds.").build();
        }
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("execsvc_");
            Path sourceFile = tempDir.resolve(className + ".java");
            Files.writeString(sourceFile, fullCode);

            CompileResult cr = compile(tempDir, sourceFile, fullCode, javaVersion);
            if (!cr.success()) {
                return ExecuteResponse.builder().success(false).status("COMPILE_ERROR")
                        .error(formatCompileErrors(cr.errors())).compileErrors(cr.errors()).build();
            }
            return run(tempDir, stdin, runClass);
        } catch (Exception e) {
            log.error("Execution failed", e);
            return ExecuteResponse.builder().success(false).status("RUNTIME_ERROR")
                    .error("Internal error: " + e.getMessage()).build();
        } finally {
            gate().release();
            cleanup(tempDir);
        }
    }

    public List<ExecuteResponse> executeAll(String code, List<String> inputs,
                                            String javaVersion, String harness) {
        CodeSafetyScanner.ScanResult scan = safetyScanner.scan(code);
        if (!scan.safe()) {
            ExecuteResponse blocked = ExecuteResponse.builder().success(false)
                    .status("BLOCKED").error(scan.reason()).build();
            return Collections.nCopies(inputs.size(), blocked);
        }

        boolean useHarness = harness != null && !harness.isBlank() && !hasMain(code);
        String fullCode  = useHarness ? wrapWithHarness(code, harness) : code;
        String className = extractPublicClassName(code);
        String runClass  = useHarness ? "__Runner__" : className;

        if (!gate().tryAcquire()) {
            ExecuteResponse busy = ExecuteResponse.builder().success(false)
                    .status("TOO_MANY_REQUESTS")
                    .error("Server is busy. Please retry in a few seconds.").build();
            return Collections.nCopies(inputs.size(), busy);
        }
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("execsvc_");
            Path sourceFile = tempDir.resolve(className + ".java");
            Files.writeString(sourceFile, fullCode);

            CompileResult cr = compile(tempDir, sourceFile, fullCode, javaVersion);
            if (!cr.success()) {
                ExecuteResponse compileErr = ExecuteResponse.builder().success(false)
                        .status("COMPILE_ERROR").error(formatCompileErrors(cr.errors()))
                        .compileErrors(cr.errors()).build();
                return Collections.nCopies(inputs.size(), compileErr);
            }

            final Path finalTempDir = tempDir;
            final String finalClass = runClass;

            List<CompletableFuture<ExecuteResponse>> futures = inputs.stream()
                    .map(input -> CompletableFuture.supplyAsync(() -> {
                        try { return run(finalTempDir, input, finalClass); }
                        catch (Exception e) {
                            return ExecuteResponse.builder().success(false)
                                    .status("RUNTIME_ERROR").error(e.getMessage()).build();
                        }
                    }, ioPool()))
                    .collect(Collectors.toList());

            List<ExecuteResponse> results = new ArrayList<>(inputs.size());
            int timeout = dockerEnabled ? dockerTimeoutSeconds : TIMEOUT_SECONDS;
            for (CompletableFuture<ExecuteResponse> f : futures) {
                try {
                    results.add(f.get(timeout + 5L, TimeUnit.SECONDS));
                } catch (TimeoutException e) {
                    f.cancel(true);
                    results.add(ExecuteResponse.builder().success(false).status("TIMEOUT")
                            .error("Test case timed out").build());
                } catch (Exception e) {
                    results.add(ExecuteResponse.builder().success(false).status("RUNTIME_ERROR")
                            .error(e.getMessage()).build());
                }
            }
            return results;

        } catch (Exception e) {
            log.error("Batch execution failed", e);
            ExecuteResponse err = ExecuteResponse.builder().success(false)
                    .status("RUNTIME_ERROR").error("Internal error: " + e.getMessage()).build();
            return Collections.nCopies(inputs.size(), err);
        } finally {
            gate().release();
            cleanup(tempDir);
        }
    }

    public SyntaxCheckResponse syntaxCheck(String code, String javaVersion) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory("execsvc_syntax_");
            String className = extractPublicClassName(code);
            Path sourceFile = tempDir.resolve(className + ".java");
            Files.writeString(sourceFile, code);

            CompileResult cr = compile(tempDir, sourceFile, code, javaVersion);
            long errors   = cr.errors().stream().filter(e -> "error"  .equals(e.getSeverity())).count();
            long warnings = cr.errors().stream().filter(e -> "warning".equals(e.getSeverity())).count();

            return SyntaxCheckResponse.builder().valid(cr.success()).errors(cr.errors())
                    .errorCount((int) errors).warningCount((int) warnings).build();
        } catch (Exception e) {
            return SyntaxCheckResponse.builder().valid(false)
                    .errors(List.of(CompileError.builder().line(1).column(1).severity("error")
                            .message("Internal error: " + e.getMessage()).build()))
                    .errorCount(1).warningCount(0).build();
        } finally { cleanup(tempDir); }
    }

    // ── Compile ───────────────────────────────────────────────────────────────

    private CompileResult compile(Path tempDir, Path sourceFile, String code, String version)
            throws Exception {
        String safeVersion = VALID_VERSIONS.contains(version) ? version : DEFAULT_VERSION;
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler != null) return compileWithApi(compiler, sourceFile, code, safeVersion);
        return compileWithProcess(tempDir, sourceFile, code, safeVersion);
    }

    private CompileResult compileWithApi(JavaCompiler compiler, Path sourceFile,
                                         String code, String version) {
        DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
        List<CompileError> errors = new ArrayList<>();
        try (StandardJavaFileManager fm = compiler.getStandardFileManager(diagnostics, null, null)) {
            List<String> options = new ArrayList<>();
            if (!version.equals("8")) {
                options.addAll(List.of("--release", version));
            } else {
                options.addAll(List.of("-source", "8", "-target", "8"));
            }
            options.addAll(List.of("-Xlint:all", "-Xlint:-serial", "-proc:none"));

            JavaCompiler.CompilationTask task = compiler.getTask(
                    null, fm, diagnostics, options, null,
                    fm.getJavaFileObjectsFromPaths(List.of(sourceFile)));
            boolean success = task.call();

            String[] sourceLines = code.split("\n", -1);
            for (Diagnostic<? extends JavaFileObject> d : diagnostics.getDiagnostics()) {
                if (d.getKind() == Diagnostic.Kind.NOTE) continue;
                String severity = d.getKind() == Diagnostic.Kind.ERROR ? "error" : "warning";
                int    line     = (int) Math.max(d.getLineNumber(), 1);
                int    col      = (int) Math.max(d.getColumnNumber(), 1);
                String msg      = cleanMessage(d.getMessage(Locale.ENGLISH));
                String codeLine = (line <= sourceLines.length) ? sourceLines[line - 1].trim() : "";
                errors.add(CompileError.builder().line(line).column(col)
                        .severity(severity).message(msg).code(codeLine).build());
            }
            return new CompileResult(success && errors.stream().noneMatch(e -> "error".equals(e.getSeverity())),
                    "", errors);
        } catch (Exception e) {
            return new CompileResult(false, e.getMessage(), List.of(
                    CompileError.builder().line(1).column(1).severity("error")
                            .message("Compiler error: " + e.getMessage()).build()));
        }
    }

    private CompileResult compileWithProcess(Path tempDir, Path sourceFile,
                                              String code, String version) throws Exception {
        List<String> cmd = new ArrayList<>(List.of(
                "javac", "--release", version, "-Xlint:all", sourceFile.toString()));
        ProcessBuilder pb = new ProcessBuilder(cmd).directory(tempDir.toFile()).redirectErrorStream(true);
        Process p = pb.start();
        String raw = readStream(p.getInputStream(), MAX_OUTPUT_BYTES);
        boolean done = p.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        if (!done) { p.destroyForcibly(); return new CompileResult(false, "Compilation timed out", List.of()); }
        if (p.exitValue() != 0) return new CompileResult(false, raw, parseJavacOutput(raw, code));
        return new CompileResult(true, raw, parseJavacOutput(raw, code));
    }

    private static final Pattern JAVAC_ERROR_PATTERN =
            Pattern.compile("^\\w+\\.java:(\\d+):\\s*(error|warning):\\s*(.+)$");

    private List<CompileError> parseJavacOutput(String raw, String sourceCode) {
        if (raw == null || raw.isBlank()) return List.of();
        String[] sourceLines = sourceCode.split("\n", -1);
        List<CompileError> errors = new ArrayList<>();
        String[] lines = raw.split("\n");
        for (int i = 0; i < lines.length; i++) {
            Matcher m = JAVAC_ERROR_PATTERN.matcher(lines[i].trim());
            if (!m.matches()) continue;
            int lineNum = Integer.parseInt(m.group(1));
            String severity = m.group(2);
            String message  = m.group(3).trim();
            int col = 1; String codeLine = "";
            if (i + 2 < lines.length) {
                codeLine = lines[i + 1];
                int caretPos = lines[i + 2].indexOf('^');
                col = caretPos >= 0 ? caretPos + 1 : 1;
                i += 2;
            }
            if (codeLine.isBlank() && lineNum > 0 && lineNum <= sourceLines.length)
                codeLine = sourceLines[lineNum - 1].trim();
            errors.add(CompileError.builder().line(lineNum).column(col).severity(severity)
                    .message(message.replaceFirst("^(error|warning):\\s*", "")).code(codeLine.trim()).build());
        }
        return errors;
    }

    private String cleanMessage(String msg) {
        if (msg == null) return "Unknown error";
        return msg.replaceAll("^.*\\.java:\\d+:\\s*", "").replaceAll("\\s+", " ").trim();
    }

    private String formatCompileErrors(List<CompileError> errors) {
        if (errors == null || errors.isEmpty()) return "Compilation failed";
        StringBuilder sb = new StringBuilder();
        for (CompileError e : errors) {
            sb.append(e.getSeverity().toUpperCase())
              .append(" at Line ").append(e.getLine())
              .append(", Col ").append(e.getColumn())
              .append(": ").append(e.getMessage());
            if (e.getCode() != null && !e.getCode().isBlank())
                sb.append("\n  → ").append(e.getCode());
            sb.append("\n");
        }
        return sb.toString().trim();
    }

    // ── Run — routes to Docker or local JVM ──────────────────────────────────

    private ExecuteResponse run(Path tempDir, String stdin, String className) throws Exception {
        return dockerEnabled ? runInDocker(tempDir, stdin, className)
                             : runLocal(tempDir, stdin, className);
    }

    /**
     * Run inside a Docker container.
     *
     * Compile happens locally (fast, good errors). Only the JVM run step
     * goes into the container. The .class files are mounted read-only at /sandbox.
     *
     *   --rm               auto-remove container on exit
     *   -m {N}m            cgroup memory limit; OOM = exit 137
     *   --memory-swap {N}m disables swap
     *   --cpus {N}         fractional CPU cap
     *   --network none     no network (cgroup-enforced, replaces socket scanner)
     *   --pids-limit 64    prevents fork bombs
     *   -v dir:/sandbox:ro read-only class file mount
     */
    private ExecuteResponse runInDocker(Path tempDir, String stdin, String className) throws Exception {
        if (!processGate().tryAcquire(dockerTimeoutSeconds + 5L, TimeUnit.SECONDS)) {
            return ExecuteResponse.builder().success(false).status("TIMEOUT")
                    .error("Server busy — no execution slot available").executionTimeMs(0).build();
        }
        try {
            long startTime = System.currentTimeMillis();

            List<String> cmd = new ArrayList<>(List.of(
                "docker", "run", "--rm",
                "-m",            dockerMemoryMb + "m",
                "--memory-swap", dockerMemoryMb + "m",
                "--cpus",        dockerCpus,
                "--network",     "none",
                "--pids-limit",  "64",
                "-i",
                "-v", tempDir.toAbsolutePath() + ":/sandbox:ro",
                dockerImage,
                "java",
                "-cp", "/sandbox",
                "-Xmx128m", "-XX:MaxMetaspaceSize=64m", "-Xss1m",
                "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1",
                "-Dfile.encoding=UTF-8", "-Djava.awt.headless=true",
                className
            ));

            Process process = new ProcessBuilder(cmd).start();

            if (stdin != null && !stdin.isBlank()) {
                try (OutputStream os = process.getOutputStream()) {
                    os.write(stdin.getBytes(StandardCharsets.UTF_8));
                }
            } else {
                process.getOutputStream().close();
            }

            ExecutorService pool = ioPool();
            Future<String> stdoutFuture = pool.submit(() -> readStream(process.getInputStream(), MAX_OUTPUT_BYTES));
            Future<String> stderrFuture = pool.submit(() -> readStream(process.getErrorStream(), MAX_OUTPUT_BYTES));

            boolean finished = process.waitFor(dockerTimeoutSeconds, TimeUnit.SECONDS);
            long elapsed = System.currentTimeMillis() - startTime;

            if (!finished) {
                process.destroyForcibly();
                stdoutFuture.cancel(true);
                stderrFuture.cancel(true);
                return ExecuteResponse.builder().success(false).status("TIMEOUT")
                        .error("Program exceeded " + dockerTimeoutSeconds + "s time limit")
                        .executionTimeMs(elapsed).build();
            }

            String stdout  = stdoutFuture.get(2, TimeUnit.SECONDS);
            String stderr  = stderrFuture.get(2, TimeUnit.SECONDS);
            int    exitCode = process.exitValue();

            if (exitCode != 0) {
                boolean oom = (exitCode == 137);
                String errMsg = oom ? "Memory limit exceeded (" + dockerMemoryMb + " MB)"
                        : stderr.isBlank() ? "Exit code " + exitCode : stderr;
                return ExecuteResponse.builder().success(false)
                        .status(oom ? "MEMORY_LIMIT" : "RUNTIME_ERROR")
                        .error(errMsg).executionTimeMs(elapsed).build();
            }

            return ExecuteResponse.builder().success(true).status("SUCCESS")
                    .output(stdout).executionTimeMs(elapsed).build();
        } finally {
            processGate().release();
        }
    }

    private ExecuteResponse runLocal(Path tempDir, String stdin, String className) throws Exception {
        if (!processGate().tryAcquire(TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
            return ExecuteResponse.builder().success(false).status("TIMEOUT")
                    .error("Server busy — could not acquire execution slot").executionTimeMs(0).build();
        }
        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "java", "-cp", tempDir.toString(),
                    "-Xmx128m", "-XX:MaxMetaspaceSize=64m", "-Xss1m",
                    "-XX:+UseSerialGC", "-XX:TieredStopAtLevel=1",
                    "-Djava.net.preferIPv4Stack=true", "-Dfile.encoding=UTF-8",
                    "-Djava.awt.headless=true", className)
                    .directory(tempDir.toFile());

            long startTime = System.currentTimeMillis();
            Process process = pb.start();

            if (stdin != null && !stdin.isBlank()) {
                try (OutputStream os = process.getOutputStream()) {
                    os.write(stdin.getBytes());
                    os.flush();
                }
            }

            ExecutorService pool = ioPool();
            Future<String> stdoutFuture = pool.submit(() -> readStream(process.getInputStream(), MAX_OUTPUT_BYTES));
            Future<String> stderrFuture = pool.submit(() -> readStream(process.getErrorStream(), MAX_OUTPUT_BYTES));

            boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            long elapsed = System.currentTimeMillis() - startTime;

            if (!finished) {
                process.destroyForcibly();
                stdoutFuture.cancel(true);
                stderrFuture.cancel(true);
                return ExecuteResponse.builder().success(false).status("TIMEOUT")
                        .error("Program exceeded " + TIMEOUT_SECONDS + "s time limit")
                        .executionTimeMs(elapsed).build();
            }

            String stdout = stdoutFuture.get(2, TimeUnit.SECONDS);
            String stderr = stderrFuture.get(2, TimeUnit.SECONDS);

            if (process.exitValue() != 0) {
                return ExecuteResponse.builder().success(false).status("RUNTIME_ERROR")
                        .error(stderr.isBlank() ? "Exit code " + process.exitValue() : stderr)
                        .executionTimeMs(elapsed).build();
            }
            return ExecuteResponse.builder().success(true).status("SUCCESS")
                    .output(stdout).executionTimeMs(elapsed).build();
        } finally {
            processGate().release();
        }
    }

    // ── Utils ─────────────────────────────────────────────────────────────────

    private String readStream(InputStream is, long maxBytes) {
        try { return new String(is.readNBytes((int) maxBytes)).trim(); }
        catch (IOException e) { return ""; }
    }

    private String extractPublicClassName(String code) {
        if (code == null) return "Main";
        Matcher m = Pattern.compile("public\\s+class\\s+(\\w+)").matcher(code);
        return m.find() ? m.group(1) : "Main";
    }

    private void cleanup(Path dir) {
        if (dir == null) return;
        try {
            Files.walk(dir).sorted(Comparator.reverseOrder())
                    .map(Path::toFile).forEach(File::delete);
        } catch (IOException e) { log.warn("Could not clean temp dir: {}", dir); }
    }

    private record CompileResult(boolean success, String rawOutput, List<CompileError> errors) {}
}
