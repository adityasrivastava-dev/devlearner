package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Tracks a user's learning gate progress for a topic.
 * Stages: THEORY → EASY → MEDIUM → HARD → MASTERED
 */
@Entity
@Table(name = "user_topic_progress",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "topic_id"}),
        indexes = {
                @Index(name = "idx_utp_user", columnList = "user_id"),
                @Index(name = "idx_utp_user_topic", columnList = "user_id,topic_id")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTopicProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "topic_id", nullable = false)
    private Long topicId;

    /** Set to true when user writes a theory note (20+ chars) and clicks "I Understood This" */
    @Column(name = "theory_completed")
    @Builder.Default
    private boolean theoryCompleted = false;

    /** The note the user wrote to prove they understood the theory */
    @Column(name = "theory_note", columnDefinition = "TEXT")
    private String theoryNote;

    @Column(name = "theory_completed_at")
    private LocalDateTime theoryCompletedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
