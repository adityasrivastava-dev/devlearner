package com.learnsystem.dto;

import lombok.Data;
import java.util.List;

/**
 * JSON structure for batch-seeding topics via POST /api/admin/seed-batch
 * One file = one batch = many topics.
 */
@Data
public class SeedBatchRequest {

    /** Optional batch label shown in logs */
    private String batchName;

    /** Whether to skip a topic if its title already exists in DB */
    private boolean skipExisting = true;

    private List<TopicSeedDto> topics;

    // ── Inner DTOs ────────────────────────────────────────────────────────────

    @Data
    public static class TopicSeedDto {
        private String title;
        private String category;        // DSA | JAVA | ADVANCED_JAVA | MYSQL | AWS
        private String description;
        private String timeComplexity;
        private String spaceComplexity;
        private String bruteForce;
        private String optimizedApproach;
        private String whenToUse;
        private String starterCode;
        private List<ExampleSeedDto>  examples;
        private List<ProblemSeedDto>  problems;
    }

    @Data
    public static class ExampleSeedDto {
        private int    displayOrder;
        private String title;
        private String description;
        private String code;
        private String explanation;
        private String realWorldUse;
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
        private String testCases;       // JSON string: [{input,expectedOutput}]
        private String difficulty;      // EASY | MEDIUM | HARD
        private String hint;
        private String starterCode;
    }
}