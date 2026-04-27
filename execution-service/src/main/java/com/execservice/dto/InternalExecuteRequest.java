package com.execservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InternalExecuteRequest {
    @NotBlank
    private String code;
    private String stdin;
    private String javaVersion = "17";
    private String harness;
}
