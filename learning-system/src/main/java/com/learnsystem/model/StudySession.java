package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Represents a scheduled study session in the user's calendar/planner.
 * Can optionally be linked to a topic or problem for focused practice.
 */
@Entity
@Table(name = "study_sessions",
        indexes = {
                @Index(name = "idx_study_user",      columnList = "user_id"),
                @Index(name = "idx_study_user_date", columnList = "user_id,scheduled_date")
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Optional link to a topic or problem
    @Column(name = "topic_id")
    private Long topicId;

    @Column(name = "problem_id")
    private Long problemId;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time")
    private LocalTime scheduledTime;

    @Column(name = "duration_minutes")
    private int durationMinutes; // 0 = not specified

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "completed")
    private boolean completed;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
