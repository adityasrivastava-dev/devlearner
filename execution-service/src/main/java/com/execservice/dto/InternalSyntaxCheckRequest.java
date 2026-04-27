package com.execservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InternalSyntaxCheckRequest {
    @NotBlank
    private String code;
    private String javaVersion = "17";
}
