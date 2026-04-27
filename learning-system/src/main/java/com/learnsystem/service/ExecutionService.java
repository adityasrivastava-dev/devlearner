package com.learnsystem.service;

import com.learnsystem.dto.CompileError;
import com.learnsystem.dto.ExecuteResponse;
import com.learnsystem.dto.SyntaxCheckResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import javax.tools.*;
import java.io.*;
import java.net.URI;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;
import java.util.regex.*;

/**
 * ExecutionService — compiles and runs Java code.
 *
 * Compile strategy (in order):
 *  1. ToolProvider.getSystemJavaCompiler() — uses the JDK's built-in compiler API.
 *     Works in any JDK without needing javac on PATH. Gives exact line/column numbers.
 *  2. javac subprocess fallback — used only if running inside a plain JRE (no JDK).
 *     Parses javac's text output with a regex to extract line/column.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExecutionService {

    private final CodeSafetyScanner safetyScanner;

private static final int  TIMEOUT_SECONDS  = 10;
private static final long MAX_OUTPUT_BYTES = 10_000;

private static final Set<String> VALID_VERSIONS = Set.of("8","11","17","21");
private static final String      DEFAULT_VERSION = "17";

/**
 * TWO-GATE concurrency model
 * ──────────────────────────
 * Gate 1 — submission gate (max-concurrent, default 25):
 *   Controls how many COMPILATIONS run simultaneously.
 *   Compilation uses the in-process Java Compiler API so it's cheap on RAM,
 *   but we still cap it to bound queue depth and temp-dir creation.
 *
 * Gate 2 — process gate (max-processes, default 16):
 *   Controls how many JVM CHILD PROCESSES / Docker containers exist at any moment.
 *   Each child uses -Xmx128m ≈ 180 MB (heap + JVM overhead).
 *   16 × 180 MB = 2.88 GB — safe headroom on a 4 GB server.
 *
 * Why two gates?
 *   executeAll() now runs N test cases in parallel.  Without Gate 2, a single
 *   submission with 8 test cases would spawn 8 JVM processes while holding only
 *   1 Gate-1 slot.  With 25 Gate-1 slots in use that's 200 live processes
 *   (200 × 180 MB = 36 GB → OOM).  Gate 2 prevents this regardless of how many
 *   test cases each submission has or how many users are active.
 */
@Value("${execution.max-concurrent:25}")
private int maxConcurrent;

@Value("${execution.max-processes:16}")
private int maxProcesses;

// ── Docker execution settings ─────────────────────────────────────────────
// When dockerEnabled=true, code runs inside a Docker container instead of a
// bare JVM child process. This gives true isolation: System.exit kills only
// the container, memory/CPU limits are cgroup-enforced, network is disabled.
// Set execution.docker.enabled=true on any host where Docker daemon is running.

@Value("${execution.docker.enabled:false}")
private boolean dockerEnabled;

@Value("${execution.docker.image:eclipse-temurin:17-jre-alpine}")
private String dockerImage;

@Value("${execution.docker.memory-mb:256}")
private int dockerMemoryMb;

@Value("${execution.docker.cpus:0.5}")
private String dockerCpus;

@Value("${execution.docker.timeout-seconds:15}")
private int dockerTimeoutSeconds;

// Lazily initialised so @Value is injected before first use
private volatile Semaphore concurrencyGate;
private volatile Semaphore processGate;
private volatile ExecutorService ioPool;

/** Gate 1 — limits concurrent compilations */
private Semaphore gate() {
    if (concurrencyGate == null) {
        synchronized (this) {
            if (concurrencyGate == null) concurrencyGate = new Semaphore(maxConcurrent, true);
        }
    }
    return concurrencyGate;
}

/** Gate 2 — limits total live JVM child processes (RAM safety) */
private Semaphore processGate() {
    if (processGate == null) {
        synchronized (this) {
            if (processGate == null) processGate = new Semaphore(maxProcesses, true);
        }
    }
    return processGate;
}

/**
 * Single shared thread pool for stdout/stderr reading.
 * Sized to serve up to maxProcesses concurrent child processes, each needing
 * 2 I/O reader threads (stdout + stderr).
 */
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

/**
 * Pre-warm the Java Compiler API on startup.
 *
 * ToolProvider.getSystemJavaCompiler() loads several classes from tools.jar on first use.
 * Running a trivial compile here pays that one-time cost at boot instead of
 * making the first real user request absorb it (~150-300ms saved on first compile).
 */
@PostConstruct
public void warmUp() {
    try {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) return;
        String dummy = "public class _Warmup { public static void main(String[] a) {} }";
        Path tmp = Files.createTempDirectory("learnsystem_warmup_");
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
        log.info("Java Compiler API pre-warmed successfully");
    } catch (Exception e) {
        log.warn("Compiler warm-up skipped: {}", e.getMessage());
    }
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Merge user code with an optional hidden harness.
 *
 * When a problem has a codeHarness AND the user's code has no main():
 *   - Appended to the user's code in the same .java file (valid multi-class file)
 *   - The harness class is always named __Runner__ with a public static void main
 *   - Execution runs `java __Runner__` instead of `java Solution`
 *   - Safety scanner is called ONLY on the user's code (harness is trusted backend content)
 */
private boolean hasMain(String code) {
    return code != null && code.contains("public static void main");
}

private String wrapWithHarness(String userCode, String harness) {
    if (harness == null || harness.isBlank()) return userCode;
    if (hasMain(userCode)) return userCode;
    return userCode + "\n\n" + harness;
}

public ExecuteResponse execute(String code, String stdin, String javaVersion) {
    return execute(code, stdin, javaVersion, null);
}

public ExecuteResponse execute(String code, String stdin, String javaVersion, String harness) {
    // 1. Safety scan on USER code only — harness is trusted
    CodeSafetyScanner.ScanResult scan = safetyScanner.scan(code);
    if (!scan.safe()) {
        return ExecuteResponse.builder()
                .success(false).status("BLOCKED")
                .error(scan.reason()).build();
    }

    boolean useHarness = harness != null && !harness.isBlank() && !hasMain(code);
    String fullCode  = useHarness ? wrapWithHarness(code, harness) : code;
    String className = extractPublicClassName(code);   // always based on user's class name
    String runClass  = useHarness ? "__Runner__" : className;

    // 2. Concurrency gate — hard cap on simultaneous JVM processes
    if (!gate().tryAcquire()) {
        log.warn("Execution capacity reached ({} slots full) — rejecting request", maxConcurrent);
        throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Server is busy. Please retry in a few seconds.");
    }
    Path tempDir = null;
    try {
        tempDir = Files.createTempDirectory("learnsystem_");
        Path sourceFile = tempDir.resolve(className + ".java");
        Files.writeString(sourceFile, fullCode);

        CompileResult cr = compile(tempDir, sourceFile, fullCode, javaVersion);
        if (!cr.success()) {
            return ExecuteResponse.builder()
                    .success(false).status("COMPILE_ERROR")
                    .error(formatCompileErrors(cr.errors()))
                    .compileErrors(cr.errors()).build();
        }
        return run(tempDir, stdin, runClass);
    } catch (ResponseStatusException rse) {
        throw rse;
    } catch (Exception e) {
        log.error("Execution failed", e);
        return ExecuteResponse.builder().success(false)
                .status("RUNTIME_ERROR").error("Internal error: " + e.getMessage()).build();
    } finally {
        gate().release();
        cleanup(tempDir);
    }
}

public ExecuteResponse execute(String code, String stdin) {
    return execute(code, stdin, DEFAULT_VERSION, null);
}

public List<ExecuteResponse> executeAll(String code, List<String> inputs, String javaVersion) {
    return executeAll(code, inputs, javaVersion, null);
}

public List<ExecuteResponse> executeAll(String code, List<String> inputs, String javaVersion, String harness) {
    // Safety scan on USER code only — harness is trusted
    CodeSafetyScanner.ScanResult scan = safetyScanner.scan(code);
    if (!scan.safe()) {
        ExecuteResponse blocked = ExecuteResponse.builder()
                .success(false).status("BLOCKED").error(scan.reason()).build();
        return Collections.nCopies(inputs.size(), blocked);
    }

    boolean useHarness = harness != null && !harness.isBlank() && !hasMain(code);
    String fullCode  = useHarness ? wrapWithHarness(code, harness) : code;
    String className = extractPublicClassName(code);
    String runClass  = useHarness ? "__Runner__" : className;

    if (!gate().tryAcquire()) {
        log.warn("Execution capacity reached ({} slots full) — rejecting batch request", maxConcurrent);
        throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                "Server is busy. Please retry in a few seconds.");
    }
    Path tempDir = null;
    try {
        tempDir = Files.createTempDirectory("learnsystem_");
        Path sourceFile = tempDir.resolve(className + ".java");
        Files.writeString(sourceFile, fullCode);

        CompileResult cr = compile(tempDir, sourceFile, fullCode, javaVersion);
        if (!cr.success()) {
            ExecuteResponse compileErr = ExecuteResponse.builder()
                    .success(false).status("COMPILE_ERROR")
                    .error(formatCompileErrors(cr.errors()))
                    .compileErrors(cr.errors()).build();
            return Collections.nCopies(inputs.size(), compileErr);
        }

        // Run all test cases in parallel — compile once, spawn N processes concurrently.
        final Path finalTempDir = tempDir;
        final String finalClass = runClass;

        List<CompletableFuture<ExecuteResponse>> futures = inputs.stream()
                .map(input -> CompletableFuture.supplyAsync(() -> {
                    try { return run(finalTempDir, input, finalClass); }
                    catch (Exception e) {
                        return ExecuteResponse.builder().success(false)
                                .status("RUNTIME_ERROR")
                                .error("Internal error: " + e.getMessage()).build();
                    }
                }, ioPool()))
                .collect(Collectors.toList());

        List<ExecuteResponse> results = new ArrayList<>(inputs.size());
        for (CompletableFuture<ExecuteResponse> f : futures) {
            try {
                results.add(f.get(TIMEOUT_SECONDS + 5L, TimeUnit.SECONDS));
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

    } catch (ResponseStatusException rse) {
        throw rse;
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
        tempDir = Files.createTempDirectory("learnsystem_syntax_");
        String className = extractPublicClassName(code);
        Path sourceFile = tempDir.resolve(className + ".java");
        Files.writeString(sourceFile, code);

        CompileResult cr = compile(tempDir, sourceFile, code, javaVersion);
        long errors   = cr.errors().stream().filter(e -> "error"  .equals(e.getSeverity())).count();
        long warnings = cr.errors().stream().filter(e -> "warning".equals(e.getSeverity())).count();

        return SyntaxCheckResponse.builder()
                .valid(cr.success())
                .errors(cr.errors())
                .errorCount((int) errors)
                .warningCount((int) warnings)
                .build();
    } catch (Exception e) {
        log.error("Syntax check failed", e);
        return SyntaxCheckResponse.builder().valid(false)
                .errors(List.of(CompileError.builder().line(1).column(1)
                        .severity("error").message("Internal error: " + e.getMessage()).build()))
                .errorCount(1).warningCount(0).build();
    } finally { cleanup(tempDir); }
}

public SyntaxCheckResponse syntaxCheck(String code) {
    return syntaxCheck(code, DEFAULT_VERSION);
}

// ── Compile ───────────────────────────────────────────────────────────────

private CompileResult compile(Path tempDir, Path sourceFile, String code, String version)
        throws Exception {
    String safeVersion = VALID_VERSIONS.contains(version) ? version : DEFAULT_VERSION;

    // ── Strategy 1: Java Compiler API (preferred) ─────────────────────────
    // ToolProvider.getSystemJavaCompiler() works inside any JDK without needing
    // javac on PATH. Returns null when running in a plain JRE (no tools.jar).
    JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
    if (compiler != null) {
        return compileWithApi(compiler, sourceFile, code, safeVersion);
    }

    // ── Strategy 2: javac subprocess fallback ─────────────────────────────
    // Only reached when running inside a plain JRE. Parses javac text output.
    log.warn("ToolProvider.getSystemJavaCompiler() returned null — falling back to javac subprocess. " +
            "Run with a JDK (not JRE) for reliable syntax checking.");
    return compileWithProcess(tempDir, sourceFile, code, safeVersion);
}

/**
 * Compile using the Java Compiler API.
 * Gives exact Diagnostic objects — no regex parsing needed.
 */
private CompileResult compileWithApi(JavaCompiler compiler, Path sourceFile,
                                     String code, String version) {
    DiagnosticCollector<JavaFileObject> diagnostics = new DiagnosticCollector<>();
    List<CompileError> errors = new ArrayList<>();

    try (StandardJavaFileManager fm =
                 compiler.getStandardFileManager(diagnostics, null, null)) {

        // Build compile options
        List<String> options = new ArrayList<>();
        // --release requires JDK 9+. For 8, use -source/-target
        if (!version.equals("8")) {
            options.addAll(List.of("--release", version));
        } else {
            options.addAll(List.of("-source", "8", "-target", "8"));
        }
        options.addAll(List.of(
                "-Xlint:all",          // enable all lint warnings
                "-Xlint:-serial",      // suppress serialVersionUID warnings (noise for students)
                "-proc:none"           // skip annotation processing (faster)
        ));

        Iterable<? extends JavaFileObject> compilationUnits =
                fm.getJavaFileObjectsFromPaths(List.of(sourceFile));

        JavaCompiler.CompilationTask task = compiler.getTask(
                null, fm, diagnostics, options, null, compilationUnits);
        boolean success = task.call();

        // Convert Diagnostics → CompileError
        String[] sourceLines = code.split("\n", -1);
        for (Diagnostic<? extends JavaFileObject> d : diagnostics.getDiagnostics()) {
            if (d.getKind() == Diagnostic.Kind.NOTE) continue; // skip info notes

            String severity = d.getKind() == Diagnostic.Kind.ERROR ? "error" : "warning";
            int    line     = (int) Math.max(d.getLineNumber(), 1);
            int    col      = (int) Math.max(d.getColumnNumber(), 1);
            String msg      = cleanMessage(d.getMessage(Locale.ENGLISH));
            String codeLine = (line <= sourceLines.length) ? sourceLines[line - 1].trim() : "";

            errors.add(CompileError.builder()
                    .line(line).column(col)
                    .severity(severity)
                    .message(msg)
                    .code(codeLine)
                    .build());
        }

        return new CompileResult(success && errors.stream()
                .noneMatch(e -> "error".equals(e.getSeverity())),
                "", errors);

    } catch (Exception e) {
        log.error("Java Compiler API failed", e);
        return new CompileResult(false, e.getMessage(), List.of(
                CompileError.builder().line(1).column(1).severity("error")
                        .message("Compiler error: " + e.getMessage()).build()));
    }
}

/**
 * Compile using javac subprocess (fallback when not in JDK).
 * Parses javac's text output with regex.
 */
private CompileResult compileWithProcess(Path tempDir, Path sourceFile,
                                         String code, String version) throws Exception {
    List<String> cmd = new ArrayList<>(List.of(
            "javac", "--release", version, "-Xlint:all", sourceFile.toString()));

    ProcessBuilder pb = new ProcessBuilder(cmd)
            .directory(tempDir.toFile()).redirectErrorStream(true);
    Process process = pb.start();
    String rawOutput = readStream(process.getInputStream(), MAX_OUTPUT_BYTES);
    boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

    if (!finished) { process.destroyForcibly(); return new CompileResult(false, "Compilation timed out", List.of()); }

    if (process.exitValue() != 0 && rawOutput.contains("invalid flag")) {
        // retry without --release (very old JDK)
        ProcessBuilder pb2 = new ProcessBuilder("javac", "-Xlint:all", sourceFile.toString())
                .directory(tempDir.toFile()).redirectErrorStream(true);
        Process p2 = pb2.start();
        String out2 = readStream(p2.getInputStream(), MAX_OUTPUT_BYTES);
        boolean fin2 = p2.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        if (!fin2) { p2.destroyForcibly(); return new CompileResult(false, "Timed out", List.of()); }
        if (p2.exitValue() != 0) return new CompileResult(false, out2, parseJavacOutput(out2, code));
        return new CompileResult(true, out2, parseJavacOutput(out2, code));
    }

    if (process.exitValue() != 0) return new CompileResult(false, rawOutput, parseJavacOutput(rawOutput, code));
    return new CompileResult(true, rawOutput, parseJavacOutput(rawOutput, code));
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

        int    lineNum  = Integer.parseInt(m.group(1));
        String severity = m.group(2);
        String message  = m.group(3).trim();
        int    col      = 1;
        String codeLine = "";

        if (i + 2 < lines.length) {
            codeLine = lines[i + 1];
            String caretLine = lines[i + 2];
            int caretPos = caretLine.indexOf('^');
            col = caretPos >= 0 ? caretPos + 1 : 1;
            i += 2;
        }
        if (codeLine.isBlank() && lineNum > 0 && lineNum <= sourceLines.length) {
            codeLine = sourceLines[lineNum - 1].trim();
        }

        errors.add(CompileError.builder()
                .line(lineNum).column(col).severity(severity)
                .message(message.replaceFirst("^(error|warning):\\s*", ""))
                .code(codeLine.trim()).build());
    }
    return errors;
}

/** Strip the class/method path prefix javac adds: "int x = ...; ..." → "int x = ..." */
private String cleanMessage(String msg) {
    if (msg == null) return "Unknown error";
    // Remove path like "/tmp/xxx/Main.java:5: " prefix that some JDKs include in message
    return msg.replaceAll("^.*\\.java:\\d+:\\s*", "")
            .replaceAll("\\s+", " ").trim();
}

/** Format compile errors as readable text for the error panel */
private String formatCompileErrors(List<CompileError> errors) {
    if (errors == null || errors.isEmpty()) return "Compilation failed";
    StringBuilder sb = new StringBuilder();
    for (CompileError e : errors) {
        sb.append(e.getSeverity().toUpperCase())
                .append(" at Line ").append(e.getLine())
                .append(", Col ").append(e.getColumn())
                .append(": ").append(e.getMessage());
        if (e.getCode() != null && !e.getCode().isBlank()) {
            sb.append("\n  → ").append(e.getCode());
        }
        sb.append("\n");
    }
    return sb.toString().trim();
}

// ── Run — routes to Docker or local JVM based on config ──────────────────

private ExecuteResponse run(Path tempDir, String stdin, String className) throws Exception {
    return dockerEnabled ? runInDocker(tempDir, stdin, className)
                         : runLocal(tempDir, stdin, className);
}

/**
 * Run compiled .class files inside a Docker container.
 *
 * Why compile locally but run in Docker?
 *   - Compilation uses the Java Compiler API (in-process, fast, exact error locations).
 *     There is no benefit to compiling inside the container.
 *   - Execution is where isolation matters: System.exit, infinite loops, memory bombs.
 *     The container provides cgroup-enforced memory/CPU limits and network isolation.
 *
 * Container flags:
 *   --rm               auto-remove after exit (no zombie containers)
 *   -m {N}m            hard memory limit — cgroup kills at OOM (exit 137)
 *   --memory-swap {N}m disable swap (same value disables it)
 *   --cpus {N}         fractional CPU limit
 *   --network none     no inbound or outbound network — replaces socket scanner checks
 *   --pids-limit 64    prevents fork bombs inside the container
 *   -v {dir}:/sandbox:ro  mount .class files read-only — container cannot write them
 */
private ExecuteResponse runInDocker(Path tempDir, String stdin, String className) throws Exception {
    if (!processGate().tryAcquire(dockerTimeoutSeconds + 5L, TimeUnit.SECONDS)) {
        return ExecuteResponse.builder().success(false).status("TIMEOUT")
                .error("Server busy — no execution slot available")
                .executionTimeMs(0).build();
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

        ProcessBuilder pb = new ProcessBuilder(cmd);
        Process process = pb.start();

        if (stdin != null && !stdin.isBlank()) {
            try (OutputStream os = process.getOutputStream()) {
                os.write(stdin.getBytes(java.nio.charset.StandardCharsets.UTF_8));
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

        String stdout = stdoutFuture.get(2, TimeUnit.SECONDS);
        String stderr = stderrFuture.get(2, TimeUnit.SECONDS);
        int exitCode = process.exitValue();

        if (exitCode != 0) {
            // Exit 137 = SIGKILL from Docker OOM killer
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

/**
 * Run compiled .class files directly in a child JVM process (no Docker).
 * Used when execution.docker.enabled=false (default).
 */
private ExecuteResponse runLocal(Path tempDir, String stdin, String className) throws Exception {
    // Gate 2: acquire a process slot before spawning any JVM child.
    if (!processGate().tryAcquire(TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
        return ExecuteResponse.builder().success(false).status("TIMEOUT")
                .error("Server busy — could not acquire execution slot within timeout")
                .executionTimeMs(0).build();
    }
    try {
    ProcessBuilder pb = new ProcessBuilder(
            "java",
            "-cp",          tempDir.toString(),
            "-Xmx128m",
            "-XX:MaxMetaspaceSize=64m",
            "-Xss1m",
            "-XX:+UseSerialGC",
            "-XX:TieredStopAtLevel=1",
            "-Djava.net.preferIPv4Stack=true",
            "-Dfile.encoding=UTF-8",
            "-Djava.awt.headless=true",
            className)
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

/** Extract the name of the public class from Java source code. Falls back to "Main". */
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