package com.learnsystem.dto;

import lombok.Data;
import java.util.List;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

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
    private String subCategory;
    private Integer displayOrder;
    /** JSON array string or comma-separated YouTube URLs for this topic */
    private String youtubeUrls;
    private List<ExampleSeedDto> examples;
    private List<ProblemSeedDto> problems;
    /** Topic-specific interview Q&A — imported to interview_questions table on seed */
    private List<InterviewQuestionSeedDto> interviewQuestions;
}

@Data
public static class InterviewQuestionSeedDto {
    private String question;
    private String answer;        // maps to quickAnswer
    /** HIGH | MEDIUM — or EASY/MEDIUM/HARD (HARD→HIGH, EASY→MEDIUM) */
    private String difficulty;
    private String codeExample;   // optional code snippet
    private String keyPoints;     // optional JSON array string
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
    // Phase 2 tracer
    private String tracerSteps;
    // SQL visualizer
    private String tableData;
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
    // Per-problem editorial — overrides topic-level fields in editorial tab
    // Accepts either a plain string or a JSON array (array items are joined with \n)
    @JsonDeserialize(using = StringOrArrayDeserializer.class)
    private String constraints;
    // "hints": ["...", "...", "..."] in seed files maps to hint1/hint2/hint3
    private List<String> hints;
    private String bruteForce;
    private String optimizedApproach;
    // Editorial explanation shown after problem is solved
    private String editorial;
}
}