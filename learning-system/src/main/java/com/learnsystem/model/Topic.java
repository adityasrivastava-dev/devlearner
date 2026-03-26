package com.learnsystem.model;

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

    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Example> examples;

    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Problem> problems;

    public enum Category {
        DSA, JAVA, ADVANCED_JAVA, MYSQL, AWS
    }
}