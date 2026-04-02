package com.learnsystem.service;

import com.learnsystem.dto.CompileError;
import com.learnsystem.dto.ExecuteResponse;
import com.learnsystem.dto.SyntaxCheckResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.*;

@Slf4j
@Service
public class ExecutionService {

private static final int  TIMEOUT_SECONDS  = 10;
private static final long MAX_OUTPUT_BYTES = 10_000;

private static final Set<String> VALID_VERSIONS = Set.of("8","11","17","21");
private static final String      DEFAULT_VERSION = "17";

private static final Pattern JAVAC_ERROR_PATTERN =
        Pattern.compile("^Main\\.java:(\\d+):\\s*(error|warning):\\s*(.+)$");

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
                    .error(cr.rawOutput()).compileErrors(cr.errors()).build();
        }
        return run(tempDir, stdin);
    } catch (Exception e) {
        log.error("Execution failed", e);
        return ExecuteResponse.builder().success(false)
                .status("RUNTIME_ERROR").error("Internal error: " + e.getMessage()).build();
    } finally { cleanup(tempDir); }
}

// Backwards-compat overload (used by legacy callers)
public ExecuteResponse execute(String code, String stdin) {
    return execute(code, stdin, DEFAULT_VERSION);
}

/**
 * BUG FIX (performance): Compile once, run once per input.
 *
 * Previously EvaluationService called execute() in a loop — which creates a temp dir,
 * writes the source file, and compiles for every single test case.  A problem with 5 test
 * cases triggered 5 compile steps; only 1 is needed.
 *
 * This method compiles exactly once and then runs the compiled class against every input
 * in sequence, returning one ExecuteResponse per input in the same order.
 */
public List<ExecuteResponse> executeAll(String code, List<String> inputs, String javaVersion) {
    Path tempDir = null;
    try {
        tempDir = Files.createTempDirectory("learnsystem_");
        Path sourceFile = tempDir.resolve("Main.java");
        Files.writeString(sourceFile, code);

        CompileResult cr = compile(tempDir, sourceFile, code, javaVersion);
        if (!cr.success()) {
            // All test cases fail with the same compile error
            ExecuteResponse compileErr = ExecuteResponse.builder()
                    .success(false).status("COMPILE_ERROR")
                    .error(cr.rawOutput()).compileErrors(cr.errors()).build();
            return Collections.nCopies(inputs.size(), compileErr);
        }

        List<ExecuteResponse> results = new ArrayList<>(inputs.size());
        for (String input : inputs) {
            results.add(run(tempDir, input));
        }
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

        return SyntaxCheckResponse.builder().valid(cr.success()).errors(cr.errors())
                .errorCount((int)errors).warningCount((int)warnings).build();
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

// ── Private helpers ───────────────────────────────────────────────────────

private CompileResult compile(Path tempDir, Path sourceFile, String code, String version) throws Exception {
    String safeVersion = VALID_VERSIONS.contains(version) ? version : DEFAULT_VERSION;

    List<String> cmd = new ArrayList<>(List.of(
            "javac",
            "--release", safeVersion,
            "-Xlint:all",
            sourceFile.toString()
    ));

    ProcessBuilder pb = new ProcessBuilder(cmd)
            .directory(tempDir.toFile()).redirectErrorStream(true);

    Process process = pb.start();
    String rawOutput = readStream(process.getInputStream(), MAX_OUTPUT_BYTES);
    boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);

    if (!finished) { process.destroyForcibly(); return new CompileResult(false, "Compilation timed out", List.of()); }

    // If --release fails (e.g. requesting Java 8 on a JDK that doesn't support it), retry without
    if (process.exitValue() != 0 && rawOutput.contains("invalid flag")) {
        return compileWithoutRelease(tempDir, sourceFile, code);
    }
    if (process.exitValue() != 0) return new CompileResult(false, rawOutput, parseJavacOutput(rawOutput, code));
    return new CompileResult(true, rawOutput, parseJavacOutput(rawOutput, code));
}

private CompileResult compileWithoutRelease(Path tempDir, Path sourceFile, String code) throws Exception {
    ProcessBuilder pb = new ProcessBuilder("javac", "-Xlint:all", sourceFile.toString())
            .directory(tempDir.toFile()).redirectErrorStream(true);
    Process process = pb.start();
    String rawOutput = readStream(process.getInputStream(), MAX_OUTPUT_BYTES);

    // BUG FIX: the original code did not check the return value of waitFor().
    // If compilation timed out, process.exitValue() would throw IllegalThreadStateException
    // because the process was still running.
    boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
    if (!finished) {
        process.destroyForcibly();
        return new CompileResult(false, "Compilation timed out", List.of());
    }

    if (process.exitValue() != 0) return new CompileResult(false, rawOutput, parseJavacOutput(rawOutput, code));
    return new CompileResult(true, rawOutput, parseJavacOutput(rawOutput, code));
}

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

private ExecuteResponse run(Path tempDir, String stdin) throws Exception {
    ProcessBuilder pb = new ProcessBuilder("java", "-cp", tempDir.toString(), "-Xmx128m", "Main")
            .directory(tempDir.toFile());

    long startTime = System.currentTimeMillis();
    Process process = pb.start();

    if (stdin != null && !stdin.isBlank()) {
        try (OutputStream os = process.getOutputStream()) { os.write(stdin.getBytes()); os.flush(); }
    }

    ExecutorService pool = Executors.newFixedThreadPool(2);
    Future<String> stdoutFuture = pool.submit(() -> readStream(process.getInputStream(), MAX_OUTPUT_BYTES));
    Future<String> stderrFuture = pool.submit(() -> readStream(process.getErrorStream(), MAX_OUTPUT_BYTES));

    boolean finished = process.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
    long elapsed     = System.currentTimeMillis() - startTime;

    if (!finished) {
        // BUG FIX: pool.shutdown() was called unconditionally BEFORE this check.
        // On timeout the futures were never cancelled — the reader threads kept blocking on
        // the process streams, causing a thread leak until the OS eventually cleaned up.
        // Now: destroyForcibly() first (closes the streams), then shutdownNow() interrupts
        // and discards the pending futures immediately.
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

private String readStream(InputStream is, long maxBytes) {
    try { return new String(is.readNBytes((int) maxBytes)).trim(); } catch (IOException e) { return ""; }
}

private void cleanup(Path dir) {
    if (dir == null) return;
    try {
        Files.walk(dir).sorted(Comparator.reverseOrder()).map(Path::toFile).forEach(File::delete);
    } catch (IOException e) { log.warn("Could not clean temp dir: {}", dir); }
}

private record CompileResult(boolean success, String rawOutput, List<CompileError> errors) {}
}