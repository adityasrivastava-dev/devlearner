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

@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final ProblemRepository problemRepository;
    private final ExecutionService executionService;
    private final HintService hintService;
    private final ObjectMapper objectMapper;

    public SubmitResponse evaluate(SubmitRequest request) {
        Problem problem = problemRepository.findById(request.getProblemId())
                .orElseThrow(() -> new RuntimeException("Problem not found: " + request.getProblemId()));

        List<Map<String, String>> testCases = parseTestCases(problem.getTestCases());
        List<SubmitResponse.TestCaseResult> results = new ArrayList<>();

        int passed = 0;

        for (int i = 0; i < testCases.size(); i++) {
            Map<String, String> tc = testCases.get(i);
            String input    = tc.getOrDefault("input", "");
            String expected = tc.getOrDefault("expectedOutput", "").trim();

            ExecuteResponse exec = executionService.execute(request.getCode(), input);

            boolean testPassed = exec.isSuccess() &&
                    normalizeOutput(exec.getOutput()).equals(normalizeOutput(expected));

            if (testPassed) passed++;

            results.add(SubmitResponse.TestCaseResult.builder()
                    .testNumber(i + 1)
                    .passed(testPassed)
                    .input(input)
                    .expected(expected)
                    .actual(exec.isSuccess() ? exec.getOutput() : exec.getError())
                    .status(resolveStatus(exec, testPassed))
                    .executionTimeMs(exec.getExecutionTimeMs())
                    .build());
        }

        boolean allPassed = passed == testCases.size();
        String hint = allPassed ? null : hintService.generateHint(results);

        return SubmitResponse.builder()
                .allPassed(allPassed)
                .totalTests(testCases.size())
                .passedTests(passed)
                .hint(hint)
                .results(results)
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
