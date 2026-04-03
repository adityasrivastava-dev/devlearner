package com.learnsystem.service;

import com.learnsystem.dto.CompileError;
import com.learnsystem.dto.ExecuteResponse;
import com.learnsystem.dto.SyntaxCheckResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.tools.*;
import java.io.*;
import java.net.URI;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
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
public class ExecutionService {

private static final int  TIMEOUT_SECONDS  = 10;
private static final long MAX_OUTPUT_BYTES = 10_000;

private static final Set<String> VALID_VERSIONS = Set.of("8","11","17","21");
private static final String      DEFAULT_VERSION = "17";

// ── Public API ────────────────────────────────────────────────────────────

public ExecuteResponse execute(String code, String stdin, String javaVersion) {
    Path tempDir = null;
    try {
        tempDir = Files.createTempDirectory("learnsystem_");
        Path sourceFile = tempDir.resolve("Main.java");
        Files.writeString(sourceFile, code);

        CompileResult cr = compile(tempDir, sourceFile, code, javaVersion);
        if (!cr.success()) {
            return ExecuteResponse.builder()
                    .success(false).status("COMPILE_ERROR")
                    .error(formatCompileErrors(cr.errors()))
                    .compileErrors(cr.errors()).build();
        }
        return run(tempDir, stdin);
    } catch (Exception e) {
        log.error("Execution failed", e);
        return ExecuteResponse.builder().success(false)
                .status("RUNTIME_ERROR").error("Internal error: " + e.getMessage()).build();
    } finally { cleanup(tempDir); }
}

public ExecuteResponse execute(String code, String stdin) {
    return execute(code, stdin, DEFAULT_VERSION);
}

public List<ExecuteResponse> executeAll(String code, List<String> inputs, String javaVersion) {
    Path tempDir = null;
    try {
        tempDir = Files.createTempDirectory("learnsystem_");
        Path sourceFile = tempDir.resolve("Main.java");
        Files.writeString(sourceFile, code);

        CompileResult cr = compile(tempDir, sourceFile, code, javaVersion);
        if (!cr.success()) {
            ExecuteResponse compileErr = ExecuteResponse.builder()
                    .success(false).status("COMPILE_ERROR")
                    .error(formatCompileErrors(cr.errors()))
                    .compileErrors(cr.errors()).build();
            return Collections.nCopies(inputs.size(), compileErr);
        }

        List<ExecuteResponse> results = new ArrayList<>(inputs.size());
        for (String input : inputs) results.add(run(tempDir, input));
        return results;

    } catch (Exception e) {
        log.error("Batch execution failed", e);
        ExecuteResponse err = ExecuteResponse.builder().success(false)
                .status("RUNTIME_ERROR").error("Internal error: " + e.getMessage()).build();
        return Collections.nCopies(inputs.size(), err);
    } finally { cleanup(tempDir); }
}

public SyntaxCheckResponse syntaxCheck(String code, String javaVersion) {
    Path tempDir = null;
    try {
        tempDir = Files.createTempDirectory("learnsystem_syntax_");
        Path sourceFile = tempDir.resolve("Main.java");
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
        Pattern.compile("^Main\\.java:(\\d+):\\s*(error|warning):\\s*(.+)$");

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
    return msg.replaceAll("^.*Main\\.java:\\d+:\\s*", "")
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

// ── Run ───────────────────────────────────────────────────────────────────

private ExecuteResponse run(Path tempDir, String stdin) throws Exception {
    ProcessBuilder pb = new ProcessBuilder(
            "java", "-cp", tempDir.toString(), "-Xmx128m", "-Xss8m", "Main")
            .directory(tempDir.toFile());

    long startTime = System.currentTimeMillis();
    Process process = pb.start();

    if (stdin != null && !stdin.isBlank()) {
        try (OutputStream os = process.getOutputStream()) {
            os.write(stdin.getBytes());
            os.flush();
        }
    }

    ExecutorService pool = Executors.newFixedThreadPool(2);
    Future<String> stdoutFuture = pool.submit(() -> readStream(process.getInputStream(), MAX_OUTPUT_BYTES));
    Future<String> stderrFuture = pool.submit(() -> readStream(process.getErrorStream(), MAX_OUTPUT_BYTES));

    boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
    long elapsed = System.currentTimeMillis() - startTime;

    if (!finished) {
        process.destroyForcibly();
        pool.shutdownNow();
        return ExecuteResponse.builder().success(false).status("TIMEOUT")
                .error("Program exceeded " + TIMEOUT_SECONDS + "s time limit")
                .executionTimeMs(elapsed).build();
    }

    pool.shutdown();
    String stdout = stdoutFuture.get(2, TimeUnit.SECONDS);
    String stderr = stderrFuture.get(2, TimeUnit.SECONDS);

    if (process.exitValue() != 0) {
        return ExecuteResponse.builder().success(false).status("RUNTIME_ERROR")
                .error(stderr.isBlank() ? "Exit code " + process.exitValue() : stderr)
                .executionTimeMs(elapsed).build();
    }
    return ExecuteResponse.builder().success(true).status("SUCCESS")
            .output(stdout).executionTimeMs(elapsed).build();
}

// ── Utils ─────────────────────────────────────────────────────────────────

private String readStream(InputStream is, long maxBytes) {
    try { return new String(is.readNBytes((int) maxBytes)).trim(); }
    catch (IOException e) { return ""; }
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