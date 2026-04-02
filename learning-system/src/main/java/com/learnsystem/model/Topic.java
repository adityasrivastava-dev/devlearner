package com.learnsystem.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Entity
@Table(name = "topics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Topic {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(nullable = false)
private String title;

@Enumerated(EnumType.STRING)
@Column(nullable = false)
private Category category;

@Column(columnDefinition = "TEXT")
private String description;

@Column(columnDefinition = "TEXT")
private String content;

@Column(name = "time_complexity")
private String timeComplexity;

@Column(name = "space_complexity")
private String spaceComplexity;

@Column(name = "brute_force", columnDefinition = "TEXT")
private String bruteForce;

@Column(name = "optimized_approach", columnDefinition = "TEXT")
private String optimizedApproach;

@Column(name = "when_to_use", columnDefinition = "TEXT")
private String whenToUse;

@Column(name = "starter_code", columnDefinition = "TEXT")
private String starterCode;

// ── Phase 1 Story-Based Learning Fields ──────────────────────────────────

@Column(columnDefinition = "TEXT")
private String story;

@Column(columnDefinition = "TEXT")
private String analogy;

@Column(name = "memory_anchor", length = 500)
private String memoryAnchor;

@Column(name = "first_principles", columnDefinition = "TEXT")
private String firstPrinciples;

// ── Relationships ─────────────────────────────────────────────────────────

@JsonIgnore
@OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
private List<Example> examples;

@JsonIgnore
@OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
private List<Problem> problems;

public enum Category {
    // Core & Advanced Java
    JAVA,
    ADVANCED_JAVA,
    // Spring Ecosystem
    SPRING,
    SPRING_BOOT,
    SPRING_MVC,
    SPRING_SECURITY,
    HIBERNATE,
    SPRING_DATA,
    MICROSERVICES,
    // Data Structures & Algorithms
    DSA,
    // Databases
    MYSQL,
    // Cloud
    AWS,
    // Web
    JAVASCRIPT
}
}