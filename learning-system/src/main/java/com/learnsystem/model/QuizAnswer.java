package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Stores the user's answer for each question in an attempt.
 * Enables "review wrong answers" feature after quiz completion.
 */
@Entity
@Table(name = "quiz_answers",
		indexes = {
				@Index(name = "idx_qans_attempt", columnList = "attempt_id"),
				@Index(name = "idx_qans_user_q",  columnList = "user_id,question_id")
		})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswer {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "attempt_id", nullable = false)
private Long attemptId;

@Column(name = "user_id")
private Long userId;

@Column(name = "question_id", nullable = false)
private Long questionId;

@Column(name = "selected_option", length = 1)
private String selectedOption;      // "A" | "B" | "C" | "D" | null (skipped)

@Column(nullable = false)
@Builder.Default
private boolean correct = false;

@Column(name = "time_taken_secs")
private Long timeTakenSecs;         // seconds spent on this question
}