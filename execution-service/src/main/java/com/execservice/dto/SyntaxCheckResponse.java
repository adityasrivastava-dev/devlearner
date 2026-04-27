package com.execservice.dto;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SyntaxCheckResponse {
    private boolean valid;
    private List<CompileError> errors;
    private int errorCount;
    private int warningCount;
}
