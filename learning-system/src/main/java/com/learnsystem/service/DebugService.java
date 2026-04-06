package com.learnsystem.service;

import com.learnsystem.dto.DebugRequest;
import com.learnsystem.dto.DebugResponse;
import com.learnsystem.dto.DebugStep;
import com.learnsystem.dto.ExecuteResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.*;

/**
 * Step-by-step debugger for Java code.
 *
 * Strategy:
 *  1. Parse user code line-by-line.
 *  2. Detect variable declarations, assignments, increments, and for-loop vars.
 *  3. Inject System.out.println("__DBG__:line:var=val|var=val") after each
 *     "interesting" line so we can track how variables change during execution.
 *  4. Execute the instrumented code via ExecutionService.
 *  5. Parse the debug lines from stdout into DebugStep objects.
 *  6. Return clean output (debug lines stripped) + the step list.
 *
 * Scope: primitives (int, long, double, float, boolean, char) + String.
 * Complex objects and arrays are tracked by reference toString only.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DebugService {

    private final ExecutionService executionService;

    private static final String DBG_PREFIX = "__DBG__";

    // Matches: [final] type varName = ...
    private static final Pattern VAR_DECLARE = Pattern.compile(
            "^\\s*(?:final\\s+)?(int|long|double|float|boolean|char|String|" +
            "Integer|Long|Double|Float|Boolean|Character)\\s+(\\w+)\\s*(?:=|;)");

    // Matches for-loop init: for (int i = ...)
    private static final Pattern FOR_INIT = Pattern.compile(
            "for\\s*\\(\\s*(?:final\\s+)?(int|long|double|float|boolean|char)\\s+(\\w+)\\s*=");

    // Matches simple or augmented assignment: x = ..., x += ..., x -= ..., etc.
    private static final Pattern ASSIGNMENT = Pattern.compile(
            "^\\s*(\\w+)\\s*(?:[+\\-*/%&|^]?=(?!=))");

    // Matches post/pre increment or decrement: i++, i--, ++i, --i
    private static final Pattern INCREMENT = Pattern.compile(
            "^\\s*(?:\\+\\+|--)?(\\w+)(?:\\+\\+|--)?\\s*;");

    // ── Public API ──────────────────────────────────────────────────────────

    public DebugResponse debug(DebugRequest request) {
        String code = request.getCode();
        if (code == null || code.isBlank()) {
            return error("Code cannot be empty");
        }

        // Syntax check before instrumenting
        var syntax = executionService.syntaxCheck(code, request.getJavaVersion());
        if (syntax.getErrors() != null && !syntax.getErrors().isEmpty()) {
            var e = syntax.getErrors().get(0);
            return error("Compile error at line " + e.getLine() + ": " + e.getMessage());
        }

        String[] originalLines = code.split("\n", -1);
        InstrumentResult instrumented = instrument(originalLines);
        log.debug("Instrumented code:\n{}", instrumented.code);

        ExecuteResponse result = executionService.execute(
                instrumented.code, request.getStdin(), request.getJavaVersion());

        if (!result.isSuccess()) {
            // Strip internal instrumentation errors from the message
            String errMsg = result.getError() != null
                    ? result.getError().replace(DBG_PREFIX, "").trim()
                    : "Runtime error";
            return error(errMsg);
        }

        List<DebugStep> steps = parseSteps(result.getOutput(), originalLines);
        String cleanOutput   = stripDebugLines(result.getOutput());

        return DebugResponse.builder()
                .success(true)
                .steps(steps)
                .output(cleanOutput)
                .executionTimeMs(result.getExecutionTimeMs())
                .build();
    }

    // ── Instrumentation ─────────────────────────────────────────────────────

    private InstrumentResult instrument(String[] lines) {
        List<String> out    = new ArrayList<>();
        Set<String> known   = new LinkedHashSet<>(); // declared variables in order
        String indent       = "        "; // 8 spaces — safe inside most method bodies

        for (int i = 0; i < lines.length; i++) {
            String line    = lines[i];
            int origLine   = i + 1;
            out.add(line);

            // 1. Detect for-loop variable (e.g. for (int i = 0; ...))
            Matcher forMatcher = FOR_INIT.matcher(line);
            if (forMatcher.find()) {
                known.add(forMatcher.group(2));
                // Inject capture after the for-statement line so we see i at start
                out.add(indent + buildCapture(origLine, known));
                continue;
            }

            // 2. Detect variable declaration
            Matcher declareMatcher = VAR_DECLARE.matcher(line);
            if (declareMatcher.find()) {
                String varName = declareMatcher.group(2);
                known.add(varName);
                // Only inject capture if the line has an assignment (not just `int x;`)
                if (line.contains("=")) {
                    out.add(indent + buildCapture(origLine, known));
                }
                continue;
            }

            // 3. Detect assignment to a known variable
            Matcher assignMatcher = ASSIGNMENT.matcher(line);
            if (assignMatcher.find()) {
                String varName = assignMatcher.group(1);
                if (known.contains(varName)) {
                    out.add(indent + buildCapture(origLine, known));
                }
                continue;
            }

            // 4. Detect increment/decrement on a known variable
            Matcher incrMatcher = INCREMENT.matcher(line);
            if (incrMatcher.find()) {
                String varName = incrMatcher.group(1);
                if (known.contains(varName)) {
                    out.add(indent + buildCapture(origLine, known));
                }
            }
        }

        return new InstrumentResult(String.join("\n", out));
    }

    /**
     * Builds: System.out.println("__DBG__:LINE:" + "x=" + x + "|y=" + y);
     *
     * Uses | as variable separator. Values are rendered via String.valueOf()
     * so null-safety is guaranteed without extra imports.
     */
    private String buildCapture(int lineNum, Set<String> vars) {
        StringBuilder sb = new StringBuilder();
        sb.append("System.out.println(\"").append(DBG_PREFIX).append(":").append(lineNum).append(":\"");

        boolean first = true;
        for (String var : vars) {
            if (!first) sb.append(" + \"|\"");
            sb.append(" + \"").append(var).append("=\" + ").append(var);
            first = false;
        }
        sb.append(");");
        return sb.toString();
    }

    // ── Output parsing ──────────────────────────────────────────────────────

    private List<DebugStep> parseSteps(String rawOutput, String[] originalLines) {
        List<DebugStep> steps = new ArrayList<>();
        if (rawOutput == null) return steps;

        for (String line : rawOutput.split("\n")) {
            line = line.trim();
            if (!line.startsWith(DBG_PREFIX + ":")) continue;

            // Format: __DBG__:lineNum:var=val|var=val
            String[] parts = line.split(":", 3);
            if (parts.length < 3) continue;

            int lineNum;
            try {
                lineNum = Integer.parseInt(parts[1].trim());
            } catch (NumberFormatException e) {
                continue;
            }

            Map<String, String> variables = parseVariables(parts[2]);
            String sourceCode = lineNum > 0 && lineNum <= originalLines.length
                    ? originalLines[lineNum - 1].trim() : "";

            steps.add(DebugStep.builder()
                    .lineNumber(lineNum)
                    .lineCode(sourceCode)
                    .variables(variables)
                    .phase(detectPhase(sourceCode))
                    .build());
        }
        return steps;
    }

    /**
     * Parses "x=5|y=8|z=13" into a map.
     * Splits on | only when followed by a word then = to handle values that
     * contain | themselves (e.g. String s = "a|b").
     */
    private Map<String, String> parseVariables(String raw) {
        Map<String, String> map = new LinkedHashMap<>();
        if (raw == null || raw.isBlank()) return map;

        String[] pairs = raw.split("\\|(?=\\w+=)");
        for (String pair : pairs) {
            int eq = pair.indexOf('=');
            if (eq > 0) {
                map.put(pair.substring(0, eq).trim(), pair.substring(eq + 1).trim());
            }
        }
        return map;
    }

    private String stripDebugLines(String rawOutput) {
        if (rawOutput == null) return "";
        StringBuilder sb = new StringBuilder();
        for (String line : rawOutput.split("\n")) {
            if (!line.trim().startsWith(DBG_PREFIX + ":")) {
                if (sb.length() > 0) sb.append("\n");
                sb.append(line);
            }
        }
        return sb.toString().trim();
    }

    private String detectPhase(String line) {
        if (line.startsWith("for") || line.startsWith("while") || line.startsWith("do")) return "LOOP";
        if (line.startsWith("if") || line.startsWith("else"))                              return "CONDITION";
        if (line.matches(".*\\b(int|long|double|float|boolean|char|String)\\b.*=.*"))      return "DECLARE";
        if (line.matches(".*\\w+\\s*[+\\-*/%&|^]?=(?!=).*"))                              return "ASSIGN";
        return "STATEMENT";
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private DebugResponse error(String message) {
        return DebugResponse.builder()
                .success(false)
                .steps(List.of())
                .error(message)
                .build();
    }

    private static class InstrumentResult {
        final String code;
        InstrumentResult(String code) { this.code = code; }
    }
}
