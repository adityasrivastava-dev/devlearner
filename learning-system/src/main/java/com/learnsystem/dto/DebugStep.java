package com.learnsystem.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class DebugStep {
    private int lineNumber;
    private String lineCode;               // the original source line
    private Map<String, String> variables; // varName -> current value
    private String phase;                  // DECLARE | ASSIGN | LOOP | CONDITION | STATEMENT
}
