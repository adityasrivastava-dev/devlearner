package com.execservice.dto;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ExecuteResponse {
    private boolean success;
    private String  output;
    private String  error;
    private long    executionTimeMs;
    private String  status;           // SUCCESS | COMPILE_ERROR | RUNTIME_ERROR | TIMEOUT | BLOCKED | MEMORY_LIMIT
    private List<CompileError> compileErrors;
    private Long    memoryKb;
}
