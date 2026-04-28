package com.learnsystem.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// ── Execute (just run code, no evaluation) ──────────────────
@Data
public class ExecuteRequest {
    @NotBlank(message = "Code cannot be empty")
    @Size(max = 100_000, message = "Code must be 100 KB or less")
    private String code;

    @Size(max = 10_000, message = "Stdin must be 10 KB or less")
    private String stdin;        // optional stdin for the program
    private String javaVersion;  // "8" | "11" | "17" | "21" — defaults to "17"
    private Long   problemId;    // optional — if set, harness from problem.codeHarness is used
}
