package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Phase 2 — Spaced Repetition (SM-2 algorithm).
 *
 * One row per user per item (topic or problem).
 * Drives the "Due for review" queue shown on the dashboard.
 *
 * SM-2 fields:
 *  - intervalDays  : current gap between reviews (starts at 1)
 *  - easeFactor    : how easy this item is for this user (default 2.5, min 1.3)
 *  - repetitions   : how many times reviewed with quality >= 3
 *  - nextReview    : next date this item should surface
 */
@Entity
@Table(name = "spaced_repetition_entries",
		uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "item_type", "item_id"}),
		indexes = {
				@Index(name = "idx_sre_user_next", columnList = "user_id,next_review_date")
		})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpacedRepetitionEntry {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "user_id", nullable = false)
private Long userId;

/** "TOPIC" or "PROBLEM" */
@Column(name = "item_type", length = 20, nullable = false)
private String itemType;

@Column(name = "item_id", nullable = false)
private Long itemId;

/** Human-readable label (topic title or problem title) — stored for display */
@Column(name = "item_title", length = 200)
private String itemTitle;

// ── SM-2 fields ───────────────────────────────────────────────────────────

@Column(name = "next_review_date", nullable = false)
@Builder.Default
private LocalDate nextReviewDate = LocalDate.now().plusDays(1);

@Column(name = "interval_days")
@Builder.Default
private int intervalDays = 1;

/** SM-2 ease factor. Default 2.5. Adjusted after each review. Min 1.3. */
@Column(name = "ease_factor")
@Builder.Default
private double easeFactor = 2.5;

/** Number of consecutive reviews with quality >= 3. Resets on failure. */
@Column(name = "repetitions")
@Builder.Default
private int repetitions = 0;

/** Quality of last review: 0-5 (0=complete blank, 5=perfect). */
@Column(name = "last_quality")
@Builder.Default
private int lastQuality = 0;

@Column(name = "created_at")
private LocalDateTime createdAt;

@Column(name = "last_reviewed_at")
private LocalDateTime lastReviewedAt;

@PrePersist
protected void onCreate() {
	this.createdAt = LocalDateTime.now();
}
}