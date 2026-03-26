package com.learnsystem.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisualizationStep {

    private int stepNumber;
    private String action;       // "INIT", "CHECK_MID", "GO_RIGHT", "GO_LEFT", "FOUND", "NOT_FOUND"
    private String description;  // Human-readable explanation of this step

    // Binary Search specific
    private int low;
    private int high;
    private int mid;
    private int target;
    private boolean found;
    private List<Integer> array;
    private Integer foundIndex;  // null if not found yet

    // Generic highlight indices (for other algos later)
    private List<Integer> highlightIndices;
}
