package com.execservice.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CompileError {
    private int    line;
    private int    column;
    private String severity;  // "error" | "warning"
    private String message;
    private String code;      // the source line that caused the error
}
