package com.learnsystem.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
public class VisualizationRequest {

    @NotNull
    private String algorithm; // "BINARY_SEARCH", "BUBBLE_SORT", etc.

    private List<Integer> array;

    private Integer target; // for search algorithms

    private Integer size;   // auto-generate random array if array is null
}
