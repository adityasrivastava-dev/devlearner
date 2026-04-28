package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_logs",
    indexes = { @Index(name = "idx_ilog_user", columnList = "user_id") })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewLog {

    public enum Outcome { OFFER, REJECTED, GHOSTED, PENDING, WITHDREW }
    public enum RoundType { PHONE, ONSITE, VIRTUAL, TAKE_HOME, FINAL, CODING, SYSTEM_DESIGN, BEHAVIORAL }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 120)
    private String company;

    @Column(name = "interview_date")
    private LocalDate interviewDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "round_type", length = 30)
    private RoundType roundType;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Outcome outcome;

    @Column(name = "topics_asked", columnDefinition = "TEXT")
    private String topicsAsked;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "self_score")
    private Integer selfScore;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }
}
