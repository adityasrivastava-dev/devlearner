package com.learnsystem.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Data
public class TraceRequest {

    @NotBlank
    private String algorithm;   // "BINARY_SEARCH"

    private List<Integer> array;

    private Integer target;

    private Integer size;       // generate random array if array is null
}
