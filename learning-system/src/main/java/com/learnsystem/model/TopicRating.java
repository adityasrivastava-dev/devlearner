package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Phase 2 — 1-to-5 star rating left by a user on a topic.
 * One rating per user per topic (upsert on POST).
 */
@Entity
@Table(name = "topic_ratings",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_rating_user_topic",
                columnNames = {"user_id", "topic_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopicRating {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "user_id", nullable = false)
private Long userId;

@Column(name = "topic_id", nullable = false)
private Long topicId;

/** 1–5 */
@Column(nullable = false)
private int rating;

@Column(name = "created_at")
private LocalDateTime createdAt;

@Column(name = "updated_at")
private LocalDateTime updatedAt;

@PrePersist
protected void onCreate() { this.createdAt = this.updatedAt = LocalDateTime.now(); }

@PreUpdate
protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
