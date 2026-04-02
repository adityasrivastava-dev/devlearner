package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Phase 2 — Mistake Journal.
 *
 * Every wrong submission (WRONG_ANSWER, COMPILE_ERROR, RUNTIME_ERROR, TLE)
 * is recorded here. The frontend surfaces these before interviews:
 * "These are the 12 things you consistently get wrong."
 */
@Entity
@Table(name = "mistake_records",
		indexes = {
				@Index(name = "idx_mistake_user",       columnList = "user_id"),
				@Index(name = "idx_mistake_user_topic", columnList = "user_id,topic_id")
		})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MistakeRecord {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "user_id", nullable = false)
private Long userId;

@Column(name = "problem_id", nullable = false)
private Long problemId;

@Column(name = "problem_title", length = 200)
private String problemTitle;

@Column(name = "topic_id")
private Long topicId;

@Column(name = "topic_title", length = 200)
private String topicTitle;

/** WRONG_ANSWER | COMPILE_ERROR | RUNTIME_ERROR | TLE */
@Column(name = "error_type", length = 30)
private String errorType;

/** Algorithm pattern the user used (from AlgorithmDetectorService) */
@Column(name = "detected_pattern", length = 50)
private String detectedPattern;

/** Algorithm pattern that would have been correct (from Problem.pattern) */
@Column(name = "correct_pattern", length = 50)
private String correctPattern;

/** Snapshot of the failing code */
@Column(name = "submission_code", columnDefinition = "TEXT")
private String submissionCode;

@Column(name = "created_at")
private LocalDateTime createdAt;

@PrePersist
protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}