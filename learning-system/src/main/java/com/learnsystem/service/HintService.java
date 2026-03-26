package com.learnsystem.service;

import com.learnsystem.dto.SubmitResponse.TestCaseResult;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HintService {

    /**
     * Analyse failing test results and produce a helpful hint.
     */
    public String generateHint(List<TestCaseResult> results) {
        long compileErrors = results.stream()
                .filter(r -> "COMPILE_ERROR".equals(r.getStatus())).count();
        long runtimeErrors = results.stream()
                .filter(r -> "RUNTIME_ERROR".equals(r.getStatus())).count();
        long timeouts = results.stream()
                .filter(r -> "TIMEOUT".equals(r.getStatus())).count();
        long wrongAnswers = results.stream()
                .filter(r -> "FAIL".equals(r.getStatus())).count();

        if (compileErrors > 0) {
            return "Your code has a compilation error. Check syntax: missing semicolons, " +
                   "unclosed brackets, or wrong class/method names.";
        }

        if (timeouts > 0) {
            return "Your solution is timing out. Check for infinite loops or " +
                   "consider a more efficient algorithm (O(log n) instead of O(n)).";
        }

        if (runtimeErrors > 0) {
            return "Runtime error detected. Common causes: NullPointerException, " +
                   "ArrayIndexOutOfBoundsException, or StackOverflowError. " +
                   "Add null checks and verify your array bounds.";
        }

        if (wrongAnswers > 0) {
            TestCaseResult first = results.stream()
                    .filter(r -> "FAIL".equals(r.getStatus()))
                    .findFirst().orElse(null);

            if (first != null) {
                return buildWrongAnswerHint(first);
            }
        }

        return "Some test cases failed. Review your logic carefully.";
    }

    private String buildWrongAnswerHint(TestCaseResult result) {
        String expected = result.getExpected();
        String actual   = result.getActual();

        if (actual == null || actual.isBlank()) {
            return "Your program produced no output. Did you forget System.out.println()?";
        }

        // Off-by-one detection
        try {
            int exp = Integer.parseInt(expected.trim());
            int act = Integer.parseInt(actual.trim());
            if (Math.abs(exp - act) == 1) {
                return "Your answer is off by 1. This is a classic off-by-one error. " +
                       "Check your loop bounds — use < vs <= carefully.";
            }
            if (act == -1 && exp >= 0) {
                return "You returned -1 (not found) but the answer exists. " +
                       "Check your search condition or boundary update.";
            }
        } catch (NumberFormatException ignored) {}

        // Check extra spaces or newlines
        if (expected.equals(actual.trim()) || expected.trim().equals(actual)) {
            return "Almost correct! Your output has extra whitespace or a newline. " +
                   "Use .trim() or check your print statements.";
        }

        return "Expected: [" + expected + "] but got: [" + actual + "]. " +
               "Trace through your logic with this input step by step.";
    }
}
