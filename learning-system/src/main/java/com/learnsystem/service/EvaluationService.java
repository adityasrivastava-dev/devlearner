package com.learnsystem.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.dto.ExecuteResponse;
import com.learnsystem.dto.SubmitRequest;
import com.learnsystem.dto.SubmitResponse;
import com.learnsystem.model.Problem;
import com.learnsystem.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationService {

private final ProblemRepository problemRepository;
private final ExecutionService executionService;
private final HintService hintService;
private final ObjectMapper objectMapper;
private final AlgorithmDetectorService algorithmDetector;

public SubmitResponse evaluate(SubmitRequest request) {
    Problem problem = problemRepository.findById(request.getProblemId())
            .orElseThrow(() -> new RuntimeException("Problem not found: " + request.getProblemId()));

    List<Map<String, String>> testCases = parseTestCases(problem.getTestCases());

    if (testCases.isEmpty()) {
        return SubmitResponse.builder()
                .allPassed(false).totalTests(0).passedTests(0)
                .results(List.of())
                .hint("No automated test cases are configured for this problem.")
                .build();
    }

    // BUG FIX (performance): previously execute() was called inside the loop, which compiled
    // the same source file once per test case.  N test cases = N compile steps.
    // Now: collect all inputs, compile once via executeAll(), iterate the results.
    String javaVersion = request.getJavaVersion() != null ? request.getJavaVersion() : "17";

    List<String> inputs = testCases.stream()
            .map(tc -> tc.getOrDefault("input", ""))
            .collect(Collectors.toList());

    // BUG FIX (javaVersion): SubmitRequest.javaVersion was missing, so the Java version
    // the user selected in the editor was silently ignored during submission.
    // Pass the problem's codeHarness so method-based problems run correctly.
    List<ExecuteResponse> execResults = executionService.executeAll(
            request.getCode(), inputs, javaVersion, problem.getCodeHarness());

    List<SubmitResponse.TestCaseResult> results = new ArrayList<>();
    int passed = 0;

    for (int i = 0; i < testCases.size(); i++) {
        Map<String, String> tc = testCases.get(i);
        // Support both "expectedOutput" (new) and "output" (legacy seed format)
        String expected = tc.containsKey("expectedOutput")
                ? tc.getOrDefault("expectedOutput", "")
                : tc.getOrDefault("output", "");
        expected = expected != null ? expected.trim() : "";
        ExecuteResponse exec = execResults.get(i);

        boolean testPassed = exec.isSuccess() &&
                normalizeOutput(exec.getOutput()).equals(normalizeOutput(expected));

        if (testPassed) passed++;

        results.add(SubmitResponse.TestCaseResult.builder()
                .testNumber(i + 1)
                .passed(testPassed)
                .input(inputs.get(i))
                .expected(expected)
                .actual(exec.isSuccess() ? exec.getOutput() : exec.getError())
                .status(resolveStatus(exec, testPassed))
                .executionTimeMs(exec.getExecutionTimeMs())
                .build());
    }

    boolean allPassed = passed == testCases.size();
    String hint = allPassed ? null : hintService.generateHint(results);

    // ── Phase 1: Algorithm detection ─────────────────────────────────────────
    AlgorithmDetectorService.DetectionResult detection =
            algorithmDetector.detect(request.getCode());

    return SubmitResponse.builder()
            .allPassed(allPassed)
            .totalTests(testCases.size())
            .passedTests(passed)
            .hint(hint)
            .results(results)
            .detectedPattern(detection.pattern())
            .methodologyExplanation(detection.explanation())
            .optimizationNote(detection.optimizationNote())
            .build();
}

// ── Helpers ──────────────────────────────────────────────────────────────

private List<Map<String, String>> parseTestCases(String json) {
    try {
        return objectMapper.readValue(json, new TypeReference<>() {});
    } catch (Exception e) {
        log.error("Could not parse test cases JSON", e);
        return List.of();
    }
}

/**
 * Normalize: trim whitespace, unify line endings.
 */
private String normalizeOutput(String s) {
    if (s == null) return "";
    return s.trim().replaceAll("\\r\\n", "\n").replaceAll("\\r", "\n");
}

private String resolveStatus(ExecuteResponse exec, boolean passed) {
    if (!exec.isSuccess()) return exec.getStatus();
    return passed ? "PASS" : "FAIL";
}
}