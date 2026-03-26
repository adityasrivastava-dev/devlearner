package com.learnsystem.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

// ── Execute (just run code, no evaluation) ──────────────────
@Data
public class ExecuteRequest {
    @NotBlank(message = "Code cannot be empty")
    private String code;

    private String stdin;        // optional stdin for the program
    private String javaVersion;  // "8" | "11" | "17" | "21" — defaults to "17"
}