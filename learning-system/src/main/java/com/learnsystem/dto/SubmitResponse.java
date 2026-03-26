package com.learnsystem.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitResponse {

    private boolean allPassed;
    private int totalTests;
    private int passedTests;
    private String hint;               // shown when tests fail
    private List<TestCaseResult> results;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestCaseResult {
        private int testNumber;
        private boolean passed;
        private String input;
        private String expected;
        private String actual;
        private String status;         // "PASS", "FAIL", "COMPILE_ERROR", "RUNTIME_ERROR", "TIMEOUT"
        private long executionTimeMs;
    }
}
