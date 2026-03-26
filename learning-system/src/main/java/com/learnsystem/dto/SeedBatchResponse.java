package com.learnsystem.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class SeedBatchResponse {
    private String  batchName;
    private int     topicsSeeded;
    private int     topicsSkipped;
    private int     examplesSeeded;
    private int     problemsSeeded;
    private boolean success;
    private String  message;
    private List<String> errors;
}