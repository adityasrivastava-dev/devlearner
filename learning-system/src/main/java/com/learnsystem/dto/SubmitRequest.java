package com.learnsystem.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Data
public class SubmitRequest {

    @NotNull(message = "Problem ID is required")
    private Long problemId;

    @NotBlank(message = "Code cannot be empty")
    private String code;
}
