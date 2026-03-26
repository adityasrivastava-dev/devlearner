package com.learnsystem.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyntaxCheckResponse {

    private boolean           valid;           // true = no compile errors
    private List<CompileError> errors;         // empty when valid = true
    private int               errorCount;
    private int               warningCount;
}
