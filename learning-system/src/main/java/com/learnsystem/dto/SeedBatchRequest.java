package com.learnsystem.dto;

import lombok.Data;
import java.util.List;
import com.fasterxml.jackson.databind.JsonNode;

/**
 * JSON structure for batch-seeding topics via POST /api/admin/seed-batch
 */
@Data
public class SeedBatchRequest {

private String batchName;
private boolean skipExisting = true;
private List<TopicSeedDto> topics;

@Data
public static class TopicSeedDto {
    private String title;
    private String category;
    private String description;
    private String timeComplexity;
    private String spaceComplexity;
    private String bruteForce;
    private String optimizedApproach;
    private String whenToUse;
    private String starterCode;
    // Phase 1 story fields
    private String story;
    private String analogy;
    private String memoryAnchor;
    private String firstPrinciples;
    private List<ExampleSeedDto> examples;
    private List<ProblemSeedDto> problems;
}

@Data
public static class ExampleSeedDto {
    private int    displayOrder;
    private String title;
    private String description;
    private String code;
    private String explanation;
    private String realWorldUse;
    // Phase 1 fields
    private String pseudocode;
    private String flowchartMermaid;
}

@Data
public static class ProblemSeedDto {
    private int    displayOrder;
    private String title;
    private String description;
    private String inputFormat;
    private String outputFormat;
    private String sampleInput;
    private String sampleOutput;
    private JsonNode testCases;
    private String difficulty;
    private String hint;
    private String starterCode;
    private String solutionCode;
    // Phase 1 hint fields
    private String hint1;
    private String hint2;
    private String hint3;
    private String pattern;
}
}