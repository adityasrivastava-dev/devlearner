package com.learnsystem.dto;

import lombok.Data;

@Data
public class DebugRequest {
    private String code;
    private String stdin;
    private String javaVersion; // "8" | "11" | "17" | "21" — defaults to "17"
}
