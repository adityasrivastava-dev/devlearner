package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Algorithm entity — stores the full teaching content for each algorithm.
 *
 * Seeded via POST /api/admin/algorithms/seed-batch
 * or managed via the Admin Panel Algorithm section.
 *
 * Tags, useCases, pitfalls, and variants are stored as JSON strings
 * (same pattern as testCases in Problem) for simplicity — no extra join tables.
 */
@Entity
@Table(name = "algorithms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Algorithm {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

/** URL-safe unique slug, e.g. "binary-search" */
@Column(unique = true, nullable = false, length = 100)
private String slug;

@Column(nullable = false)
private String name;

/** Category string matching REGISTRY_CATEGORIES on the frontend */
@Column(nullable = false, length = 50)
private String category;

/** Single emoji character shown on card */
@Column(length = 10)
private String emoji;

@Enumerated(EnumType.STRING)
@Column(nullable = false, length = 20)
private Difficulty difficulty;

/** JSON array of strings, e.g. ["O(log n)", "Sorted Array"] */
@Column(columnDefinition = "TEXT")
private String tags;

// ── Time / Space complexity ────────────────────────────────────────────────
@Column(name = "time_complexity_best",    length = 50) private String timeComplexityBest;
@Column(name = "time_complexity_average", length = 50) private String timeComplexityAverage;
@Column(name = "time_complexity_worst",   length = 50) private String timeComplexityWorst;
@Column(name = "space_complexity",        length = 80) private String spaceComplexity;

/** "Stable" | "Unstable" | "N/A" */
@Column(length = 20)
private String stability;

// ── Teaching content ───────────────────────────────────────────────────────
@Column(columnDefinition = "TEXT") private String analogy;
@Column(columnDefinition = "TEXT") private String story;

@Column(name = "when_to_use",    columnDefinition = "TEXT") private String whenToUse;
@Column(name = "how_it_works",   columnDefinition = "TEXT") private String howItWorks;
@Column(name = "java_code",      columnDefinition = "TEXT") private String javaCode;
@Column(name = "interview_tips", columnDefinition = "TEXT") private String interviewTips;

/**
 * JSON array: [{"title":"...", "desc":"..."}, ...]
 * Parsed on the frontend — same approach as Problem.testCases
 */
@Column(name = "use_cases",  columnDefinition = "TEXT") private String useCases;

/**
 * JSON array of strings: ["Mistake 1", "Mistake 2", ...]
 */
@Column(columnDefinition = "TEXT") private String pitfalls;

/**
 * JSON array: [{"name":"...", "desc":"..."}, ...]
 */
@Column(columnDefinition = "TEXT") private String variants;

/**
 * Mermaid diagram definition for step-by-step visual walkthrough.
 * E.g. "graph TD\n  A[Start] --> B{mid == target?}\n  ..."
 */
@Column(name = "mermaid_diagram", columnDefinition = "TEXT") private String mermaidDiagram;

/** Controls display order within a category */
@Column(name = "display_order")
private Integer displayOrder;

/**
 * The single most important insight to memorize — the "aha moment".
 * Plain text. Shown prominently at top of Overview tab.
 */
@Column(name = "key_insight", columnDefinition = "TEXT") private String keyInsight;

/**
 * Comma-separated keywords/phrases in interview problems that signal this algorithm.
 * E.g. "find in sorted, O(log n), first/last position, search range, monotonic"
 */
@Column(name = "pattern_signal", columnDefinition = "TEXT") private String patternSignal;

/**
 * JSON array of must-solve practice problems:
 * [{"name":"...", "difficulty":"Easy|Medium|Hard", "hint":"..."}]
 */
@Column(name = "practice_problems", columnDefinition = "TEXT") private String practiceProblems;

// ── Enums ─────────────────────────────────────────────────────────────────
public enum Difficulty {
	BEGINNER, INTERMEDIATE, ADVANCED
}
}