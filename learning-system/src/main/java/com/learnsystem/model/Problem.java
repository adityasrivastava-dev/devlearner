package com.learnsystem.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "problems")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Problem {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@JsonIgnore
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "topic_id", nullable = false)
private Topic topic;

@Column(nullable = false)
private String title;

@Column(columnDefinition = "TEXT")
private String description;

@Column(name = "input_format", columnDefinition = "TEXT")
private String inputFormat;

@Column(name = "output_format", columnDefinition = "TEXT")
private String outputFormat;

@Column(name = "sample_input", columnDefinition = "TEXT")
private String sampleInput;

@Column(name = "sample_output", columnDefinition = "TEXT")
private String sampleOutput;

@Column(name = "test_cases", columnDefinition = "TEXT")
private String testCases; // JSON array: [{input, expectedOutput}]

@Enumerated(EnumType.STRING)
private Difficulty difficulty;

@Column(columnDefinition = "TEXT")
private String hint;

@Column(name = "starter_code", columnDefinition = "TEXT")
private String starterCode;

@Column(name = "solution_code", columnDefinition = "TEXT")
private String solutionCode;

@Column(name = "display_order")
private Integer displayOrder;

// ── Phase 1 Fields ────────────────────────────────────────────────────────

@Column(name = "hint_1", columnDefinition = "TEXT")
private String hint1;

@Column(name = "hint_2", columnDefinition = "TEXT")
private String hint2;

@Column(name = "hint_3", columnDefinition = "TEXT")
private String hint3;

@Column(length = 100)
private String pattern;

public enum Difficulty {
    EASY, MEDIUM, HARD
}
}