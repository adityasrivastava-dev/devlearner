package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Phase 1 — stores one recall drill response per solve.
 * No scoring — pure retrieval practice (30-second free-text).
 */
@Entity
@Table(name = "recall_drills",
		indexes = {
				@Index(name = "idx_recall_user",       columnList = "user_id"),
				@Index(name = "idx_recall_user_topic",  columnList = "user_id,topic_id")
		})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecallDrill {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "user_id")
private Long userId;

@Column(name = "topic_id")
private Long topicId;

@Column(name = "topic_title", length = 200)
private String topicTitle;

@Column(name = "recall_text", columnDefinition = "TEXT", nullable = false)
private String recallText;

@Column(name = "created_at")
private LocalDateTime createdAt;

@PrePersist
protected void onCreate() {
	this.createdAt = LocalDateTime.now();
}
}