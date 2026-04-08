package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * A quiz set — a named collection of MCQ questions on a theme.
 * Fully standalone — no FK to topics or problems.
 *
 * Examples:
 *   "Java Collections — Core Concepts"
 *   "Top 30 DSA Interview Questions"
 *   "Spring Boot Fundamentals Quiz"
 */
@Entity
@Table(name = "quiz_sets",
		indexes = {
				@Index(name = "idx_qset_category", columnList = "category"),
				@Index(name = "idx_qset_active",   columnList = "active")
		})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizSet {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(nullable = false)
private String title;               // "Java Collections — Core Concepts"

@Column(columnDefinition = "TEXT")
private String description;         // shown on the quiz card

@Column(nullable = false, length = 60)
private String category;            // "JAVA" | "DSA" | "SPRING" | "SYSTEM_DESIGN" | "SQL"

@Column(nullable = false, length = 60)
private String difficulty;          // "BEGINNER" | "INTERMEDIATE" | "ADVANCED"

@Column(length = 10)
private String icon;                // emoji: "☕" "🎯" "⚡"

@Column(name = "question_count")
@Builder.Default
private int questionCount = 0;      // denormalized for display — updated on seed

@Column(name = "time_limit_secs")
@Builder.Default
private int timeLimitSecs = 0;      // 0 = no limit

@Column(nullable = false)
@Builder.Default
private boolean active = true;      // false = hidden from students

@Column(name = "display_order")
@Builder.Default
private int displayOrder = 0;

@Column(name = "created_at")
private LocalDateTime createdAt;

@PrePersist
protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}