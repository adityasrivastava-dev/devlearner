package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Records one completed quiz attempt by a user.
 * One row per user per quiz completion.
 */
@Entity
@Table(name = "quiz_attempts",
		indexes = {
				@Index(name = "idx_qa_user",    columnList = "user_id"),
				@Index(name = "idx_qa_set",     columnList = "set_id"),
				@Index(name = "idx_qa_user_set",columnList = "user_id,set_id")
		})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAttempt {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "user_id")
private Long userId;                // null = anonymous

@Column(name = "set_id", nullable = false)
private Long setId;

@Column(nullable = false)
@Builder.Default
private int score = 0;              // correct answers count

@Column(name = "total_questions", nullable = false)
private int totalQuestions;

@Column(name = "time_taken_secs")
private Long timeTakenSecs;         // total quiz time

@Column(name = "completed_at")
private LocalDateTime completedAt;

@PrePersist
protected void onCreate() { this.completedAt = LocalDateTime.now(); }
}