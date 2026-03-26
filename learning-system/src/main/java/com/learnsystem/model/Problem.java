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

// @JsonIgnore prevents Problem → Topic → Problems → ... loop
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
private String testCases; // JSON array of {input, expectedOutput}

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

public enum Difficulty {
    EASY, MEDIUM, HARD
}
}