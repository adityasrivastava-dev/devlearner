package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * Persists every submit (run against full test-cases).
 * One row per user per problem per submit.
 */
@Entity
@Table(name = "submissions",
		indexes = {
				@Index(name = "idx_sub_user",    columnList = "user_id"),
				@Index(name = "idx_sub_problem", columnList = "problem_id"),
				@Index(name = "idx_sub_up",      columnList = "user_id,problem_id")
		})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Submission {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

// Nullable — anonymous users can still submit (stored without user link)
@Column(name = "user_id")
private Long userId;

@Column(name = "problem_id", nullable = false)
private Long problemId;

@Column(nullable = false)
private String status;           // "ACCEPTED" | "WRONG_ANSWER" | "COMPILE_ERROR" | "RUNTIME_ERROR" | "TLE"

@Column(name = "passed_tests")
private Integer passedTests;

@Column(name = "total_tests")
private Integer totalTests;

@Column(name = "execution_time_ms")
private Long executionTimeMs;    // max across all test cases

@Column(name = "solve_time_secs")
private Long solveTimeSecs;      // seconds from problem open → submit (sent by frontend)

@Column(columnDefinition = "TEXT")
private String code;             // submitted code snapshot

@Column(name = "hint_assisted")
private Boolean hintAssisted;

@Column(name = "java_version", length = 10)
private String javaVersion;

@Column(name = "created_at")
private LocalDateTime createdAt;

@PrePersist
protected void onCreate() {
	this.createdAt = LocalDateTime.now();
}
}