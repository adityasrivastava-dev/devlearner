package com.execservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class InternalSubmitRequest {
    @NotBlank
    private String code;
    private String javaVersion = "17";
    private String harness;

    @NotNull
    private List<TestCaseInput> testCases;

    @Data
    public static class TestCaseInput {
        private String input;
        private String expectedOutput;
    }
}
