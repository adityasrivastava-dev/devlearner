package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "mock_interview_sessions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MockInterviewSession {

    public enum Stage { ACTIVE, DEBRIEF }

    public enum Category { DSA, JAVA, SPRING_BOOT, SYSTEM_DESIGN, MYSQL }

    public enum Difficulty { EASY, MEDIUM, HARD }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20)")
    private Stage stage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(20)")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "VARCHAR(10)")
    private Difficulty difficulty;

    private Integer durationMinutes;
    private Integer totalQuestions;
    private Integer currentQuestionIndex;  // 0-based

    @Column(columnDefinition = "TEXT")
    private String resumeContext;           // extracted tech from resume (nullable)

    // JSON array of { type, question, code, options, userAnswer, feedback }
    @Column(columnDefinition = "LONGTEXT")
    private String questionsJson;

    private Integer approachScore;
    private Integer communicationScore;
    private Integer codeScore;

    @Column(columnDefinition = "TEXT")
    private String debriefText;

    @Column(columnDefinition = "TEXT")
    private String strengths;

    @Column(columnDefinition = "TEXT")
    private String improvements;

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    @PrePersist
    protected void onCreate() { startedAt = LocalDateTime.now(); }
}
