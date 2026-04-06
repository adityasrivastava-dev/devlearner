package com.learnsystem.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DebugResponse {
    private boolean success;
    private List<DebugStep> steps;   // step-by-step variable snapshots
    private String output;           // final stdout with debug lines stripped
    private String error;            // compile/runtime error message if any
    private long executionTimeMs;
}
