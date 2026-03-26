package com.learnsystem.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Builder;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecuteResponse {

    private boolean success;                   // true = compiled + ran; false = error
    private String  output;                    // stdout
    private String  error;                     // raw stderr / compile error text
    private long    executionTimeMs;           // how long it took to run
    private String  status;                    // "SUCCESS" | "COMPILE_ERROR" | "RUNTIME_ERROR" | "TIMEOUT"

    // Structured compile errors — populated on COMPILE_ERROR so Monaco can show squiggles
    private List<CompileError> compileErrors;

    // Memory usage in KB (populated when available)
    private Long memoryKb;
}
