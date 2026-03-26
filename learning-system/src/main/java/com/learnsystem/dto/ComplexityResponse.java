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
public class ComplexityResponse {

    private String timeComplexity;         // e.g. "O(n²)"
    private String spaceComplexity;        // e.g. "O(n)"
    private String timeExplanation;        // "Nested loop over n elements"
    private String spaceExplanation;       // "HashMap stores up to n entries"
    private String confidence;             // "HIGH" | "MEDIUM" | "LOW"
    private List<String> detectedPatterns; // ["Nested loops","HashMap","Recursion"]
    private String dominantPattern;        // "Nested loops"
}