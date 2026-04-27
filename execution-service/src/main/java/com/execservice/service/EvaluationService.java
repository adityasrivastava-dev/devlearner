package com.execservice.service;

import com.execservice.dto.ExecuteResponse;
import com.execservice.dto.InternalSubmitRequest;
import com.execservice.dto.SubmitResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Stateless evaluation service.
 *
 * Unlike the main API's EvaluationService, this one receives test cases in the request
 * rather than fetching them from a database. The main API is responsible for fetching
 * hidden test cases and including them in the /internal/submit payload.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final ExecutionService executionService;

    public SubmitResponse evaluate(InternalSubmitRequest req) {
        List<InternalSubmitRequest.TestCaseInput> testCases = req.getTestCases();

        if (testCases == null || testCases.isEmpty()) {
            return SubmitResponse.builder()
                    .allPassed(false).totalTests(0).passedTests(0)
                    .results(List.of()).build();
        }

        String javaVersion = req.getJavaVersion() != null ? req.getJavaVersion() : "17";

        List<String> inputs = testCases.stream()
                .map(tc -> tc.getInput() != null ? tc.getInput() : "")
                .toList();

        List<ExecuteResponse> execResults = executionService.executeAll(
                req.getCode(), inputs, javaVersion, req.getHarness());

        List<SubmitResponse.TestCaseResult> results = new ArrayList<>();
        int passed = 0;

        for (int i = 0; i < testCases.size(); i++) {
            String expected = testCases.get(i).getExpectedOutput();
            expected = expected != null ? expected.trim() : "";
            ExecuteResponse exec = execResults.get(i);

            boolean testPassed = exec.isSuccess()
                    && normalizeOutput(exec.getOutput()).equals(normalizeOutput(expected));

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

        return SubmitResponse.builder()
                .allPassed(passed == testCases.size())
                .totalTests(testCases.size())
                .passedTests(passed)
                .results(results)
                .build();
    }

    private String normalizeOutput(String s) {
        if (s == null) return "";
        return s.trim().replaceAll("\\r\\n", "\n").replaceAll("\\r", "\n");
    }

    private String resolveStatus(ExecuteResponse exec, boolean passed) {
        if (!exec.isSuccess()) return exec.getStatus();
        return passed ? "PASS" : "FAIL";
    }
}
