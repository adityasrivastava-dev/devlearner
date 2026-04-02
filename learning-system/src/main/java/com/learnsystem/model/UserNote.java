package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Phase 2 — User notes attached to a topic.
 * Multiple notes allowed per user per topic.
 */
@Entity
@Table(name = "user_notes",
		indexes = {
				@Index(name = "idx_note_user_topic", columnList = "user_id,topic_id")
		})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserNote {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "user_id", nullable = false)
private Long userId;

@Column(name = "topic_id")
private Long topicId;

@Column(columnDefinition = "TEXT", nullable = false)
private String content;

@Column(name = "created_at")
private LocalDateTime createdAt;

@Column(name = "updated_at")
private LocalDateTime updatedAt;

@PrePersist
protected void onCreate()  { this.createdAt = this.updatedAt = LocalDateTime.now(); }

@PreUpdate
protected void onUpdate()  { this.updatedAt = LocalDateTime.now(); }
}