package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * A curated interview question shown in /interview-prep and /revision.
 *
 * keyPoints is stored as a JSON array string: ["point1","point2",...]
 * Managed via the Admin Panel → Interview Q&A section.
 */
@Entity
@Table(name = "interview_questions",
        indexes = {
                @Index(name = "idx_iq_category",   columnList = "category"),
                @Index(name = "idx_iq_difficulty",  columnList = "difficulty"),
                @Index(name = "idx_iq_order",       columnList = "display_order"),
        })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** JAVA | ADVANCED_JAVA | DSA | SQL | AWS */
    @Column(nullable = false, length = 30)
    private String category;

    /**
     * Optional: the exact topic title this question belongs to.
     * NULL = applies to all topics in the category (category-level).
     * Non-null = shown only for that specific topic; falls back to category if empty.
     */
    @Column(name = "topic_title", length = 255)
    private String topicTitle;

    /** HIGH | MEDIUM */
    @Column(nullable = false, length = 10)
    private String difficulty;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(name = "quick_answer", nullable = false, columnDefinition = "TEXT")
    private String quickAnswer;

    /** JSON array of strings: ["key point 1", "key point 2", ...] */
    @Column(name = "key_points", columnDefinition = "TEXT")
    private String keyPoints;

    @Column(name = "code_example", columnDefinition = "TEXT")
    private String codeExample;

    @Column(name = "display_order")
    @Builder.Default
    private int displayOrder = 0;

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
