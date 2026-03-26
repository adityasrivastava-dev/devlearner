package com.learnsystem.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompileError {

    private int    line;        // 1-based line number in the user's code
    private int    column;      // 1-based column
    private String message;     // human-readable error message
    private String severity;    // "error" | "warning"
    private String code;        // the source line that caused the error (for context)
}
