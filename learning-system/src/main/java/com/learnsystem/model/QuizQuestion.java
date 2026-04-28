package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * A single MCQ question belonging to a QuizSet.
 * No FK to Topic or Problem — fully standalone.
 */
@Entity
@Table(name = "quiz_questions",
		indexes = {
				@Index(name = "idx_qq_set",   columnList = "set_id"),
				@Index(name = "idx_qq_order", columnList = "set_id,order_index")
		})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestion {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "set_id", nullable = false)
private Long setId;                 // FK-free — just the ID

@Column(name = "order_index")
@Builder.Default
private int orderIndex = 0;

@Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
private String questionText;        // The question

@Column(name = "option_a", nullable = false, columnDefinition = "TEXT")
private String optionA;

@Column(name = "option_b", nullable = false, columnDefinition = "TEXT")
private String optionB;

@Column(name = "option_c", columnDefinition = "TEXT")
private String optionC;             // Optional — some questions only need 2 options

@Column(name = "option_d", columnDefinition = "TEXT")
private String optionD;             // Optional

@Column(name = "correct_option", nullable = false, length = 1)
private String correctOption;       // "A" | "B" | "C" | "D"

@Column(columnDefinition = "TEXT")
private String explanation;         // shown after answering — why this answer is correct

@Column(name = "code_snippet", columnDefinition = "TEXT")
private String codeSnippet;         // optional Java code shown with the question

@Column(length = 60)
@Builder.Default
private String difficulty = "MEDIUM"; // "EASY" | "MEDIUM" | "HARD"

@Column(length = 100)
private String tags;                // comma-separated: "collections,hashmap,performance"

/** Topic category tag for custom quiz builder — matches Topic.Category enum name */
@Column(name = "topic_tag", length = 60)
private String topicTag;
}