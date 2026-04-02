package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Phase 2 — Performance analytics per user per topic.
 *
 * Updated after every submission on a problem belonging to this topic.
 * Confidence score (0-100) is computed from accuracy, solve time,
 * hint usage, and recency.
 */
@Entity
@Table(name = "user_topic_performance",
		uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "topic_id"}),
		indexes = {
				@Index(name = "idx_perf_user", columnList = "user_id"),
				@Index(name = "idx_perf_conf", columnList = "user_id,confidence_score")
		})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTopicPerformance {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "user_id", nullable = false)
private Long userId;

@Column(name = "topic_id", nullable = false)
private Long topicId;

@Column(name = "topic_title", length = 200)
private String topicTitle;

@Column(name = "topic_category", length = 50)
private String topicCategory;

/** Total attempts (all submissions including wrong answers) */
@Column(name = "attempts")
@Builder.Default
private int attempts = 0;

/** Accepted submissions count */
@Column(name = "accepted")
@Builder.Default
private int accepted = 0;

/** Accuracy rate 0.0-1.0 = accepted / attempts */
@Column(name = "accuracy_rate")
@Builder.Default
private double accuracyRate = 0.0;

/** Average solve time in seconds across accepted submissions */
@Column(name = "avg_solve_time_secs")
@Builder.Default
private long avgSolveTimeSecs = 0;

/** Number of problems attempted from this topic */
@Column(name = "problems_attempted")
@Builder.Default
private int problemsAttempted = 0;

/** Number of distinct problems solved from this topic */
@Column(name = "problems_solved")
@Builder.Default
private int problemsSolved = 0;

/**
 * Confidence score 0-100 derived from:
 *  accuracy (40%) + solve speed (20%) + hint usage (20%) + recency (20%)
 */
@Column(name = "confidence_score")
@Builder.Default
private int confidenceScore = 0;

@Column(name = "last_attempted")
private LocalDateTime lastAttempted;

@Column(name = "created_at")
private LocalDateTime createdAt;

@PrePersist
protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}