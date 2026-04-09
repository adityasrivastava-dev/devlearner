package com.learnsystem.dto;

import lombok.Data;
import java.util.List;

/**
 * JSON structure for batch-seeding algorithms.
 *
 * POST /api/admin/algorithms/seed-batch
 *
 * Seed file format:
 * {
 *   "batchName": "A01-searching",
 *   "skipExisting": true,
 *   "algorithms": [ { ... } ]
 * }
 */
@Data
public class AlgorithmSeedRequest {

private String  batchName;
private boolean skipExisting = true;
private List<AlgorithmDto> algorithms;

@Data
public static class AlgorithmDto {
	private String slug;
	private String name;
	private String category;
	private String emoji;
	private String difficulty;           // "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
	private String tags;                 // JSON array string: ["O(log n)", "Sorted Array"]
	private String timeComplexityBest;
	private String timeComplexityAverage;
	private String timeComplexityWorst;
	private String spaceComplexity;
	private String stability;            // "Stable" | "Unstable" | "N/A"
	private String analogy;
	private String story;
	private String whenToUse;
	private String howItWorks;
	private String javaCode;
	private String interviewTips;
	private String useCases;             // JSON string: [{"title":"...","desc":"..."}]
	private String pitfalls;             // JSON string: ["mistake 1", "mistake 2"]
	private String variants;             // JSON string: [{"name":"...","desc":"..."}]
	private Integer displayOrder;
}
}