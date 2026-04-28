package com.learnsystem.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "problems",
    indexes = {
        // Speeds up fetching problems for a given topic
        @Index(name = "idx_problem_topic_id",         columnList = "topic_id"),
        // Speeds up difficulty filter on the problems list page
        @Index(name = "idx_problem_topic_difficulty",  columnList = "topic_id, difficulty"),
        // Speeds up ordered problem lists within a topic
        @Index(name = "idx_problem_display_order",     columnList = "topic_id, display_order")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Problem {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@JsonIgnore
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "topic_id", nullable = false)
private Topic topic;

@Column(nullable = false)
private String title;

@Column(columnDefinition = "TEXT")
private String description;

@Column(name = "input_format", columnDefinition = "TEXT")
private String inputFormat;

@Column(name = "output_format", columnDefinition = "TEXT")
private String outputFormat;

@Column(name = "sample_input", columnDefinition = "TEXT")
private String sampleInput;

@Column(name = "sample_output", columnDefinition = "TEXT")
private String sampleOutput;

@Column(name = "test_cases", columnDefinition = "TEXT")
private String testCases; // JSON array: [{input, expectedOutput}]

@Enumerated(EnumType.STRING)
private Difficulty difficulty;

@Column(columnDefinition = "TEXT")
private String hint;

@Column(name = "starter_code", columnDefinition = "TEXT")
private String starterCode;

@Column(name = "solution_code", columnDefinition = "TEXT")
@JsonIgnore  // BUG 7 FIX: never expose solution in API responses — users could read it via DevTools
private String solutionCode;

@Column(name = "display_order")
private Integer displayOrder;

// ── Phase 1 Fields ────────────────────────────────────────────────────────

@Column(columnDefinition = "TEXT")
private String constraints;

// ── Editorial per-problem fields ───────────────────────────────────────────

@Column(name = "brute_force", columnDefinition = "TEXT")
private String bruteForce;

@Column(name = "optimized_approach", columnDefinition = "TEXT")
private String optimizedApproach;

// Editorial explanation shown after the student solves the problem
@Column(columnDefinition = "TEXT")
private String editorial;

@Column(name = "hint_1", columnDefinition = "TEXT")
private String hint1;

@Column(name = "hint_2", columnDefinition = "TEXT")
private String hint2;

@Column(name = "hint_3", columnDefinition = "TEXT")
private String hint3;

@Column(length = 100)
private String pattern;

/**
 * Hidden runner harness for method-based problems.
 *
 * When set, the user writes only the Solution class (no main).
 * This harness is appended to the user's code before execution — it provides
 * a main() that reads stdin, calls the user's method, and prints the result.
 * The user never sees this code; the safety scanner only scans user code.
 *
 * Example harness:
 *   class __Runner__ {
 *     public static void main(String[] args) throws Exception {
 *       java.util.Scanner sc = new java.util.Scanner(System.in);
 *       int[] nums = ...; int target = sc.nextInt();
 *       System.out.println(java.util.Arrays.toString(new Solution().twoSum(nums, target)));
 *     }
 *   }
 */
@Column(name = "code_harness", columnDefinition = "LONGTEXT")
private String codeHarness;

/** JSON array of company names, e.g. ["Amazon","Google","Microsoft"] */
@Column(columnDefinition = "TEXT")
private String companies;

// ── Audit ─────────────────────────────────────────────────────────────────

@Column(name = "created_at", updatable = false)
private LocalDateTime createdAt;

@Column(name = "updated_at")
private LocalDateTime updatedAt;

@PrePersist
protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

@PreUpdate
protected void onUpdate() { updatedAt = LocalDateTime.now(); }

public enum Difficulty {
    EASY, MEDIUM, HARD
}
}