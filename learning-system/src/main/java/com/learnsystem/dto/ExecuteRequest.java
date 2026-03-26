package com.learnsystem.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

// ── Execute (just run code, no evaluation) ──────────────────
@Data
public class ExecuteRequest {
    @NotBlank(message = "Code cannot be empty")
    private String code;

    private String stdin; // optional input for the program
}
