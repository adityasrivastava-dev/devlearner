package com.learnsystem.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.BatchSize;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(
    name = "topics",
    indexes = {
        // Speeds up sidebar category filtering (most common query)
        @Index(name = "idx_topic_category",       columnList = "category"),
        // Speeds up sub-category grouping within a category
        @Index(name = "idx_topic_cat_subcat",      columnList = "category, sub_category"),
        // Speeds up ordered list queries used by the sidebar
        @Index(name = "idx_topic_display_order",   columnList = "display_order")
    }
)
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
@Column(nullable = false, columnDefinition = "VARCHAR(50)")
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

/** Sub-section within the category, e.g. "OOP (VERY IMPORTANT)", "Collections Framework" */
@Column(name = "sub_category", length = 120)
private String subCategory;

/** Controls sort order within the category+subCategory group. Lower = first. */
@Column(name = "display_order")
private Integer displayOrder = 999;

// ── Phase 1 Story-Based Learning Fields ──────────────────────────────────

@Column(columnDefinition = "TEXT")
private String story;

@Column(columnDefinition = "TEXT")
private String analogy;

@Column(name = "memory_anchor", columnDefinition = "TEXT")
private String memoryAnchor;

@Column(name = "first_principles", columnDefinition = "TEXT")
private String firstPrinciples;

/** JSON array of YouTube video URLs, e.g. ["https://youtu.be/abc","https://youtu.be/xyz"] */
@Column(name = "youtube_urls", columnDefinition = "TEXT")
private String youtubeUrls;

/** Comma-separated topic IDs that must be completed before this topic, e.g. "1,5,12" */
@Column(columnDefinition = "TEXT")
private String prerequisites;

// ── Audit ─────────────────────────────────────────────────────────────────

@Column(name = "created_at", updatable = false)
private LocalDateTime createdAt;

@Column(name = "updated_at")
private LocalDateTime updatedAt;

@PrePersist
protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

@PreUpdate
protected void onUpdate() { updatedAt = LocalDateTime.now(); }

// ── Relationships ─────────────────────────────────────────────────────────

@JsonIgnore
@OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
@BatchSize(size = 20)   // batch-loads child collections → avoids N+1 on topic lists
private List<Example> examples;

@JsonIgnore
@OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
@BatchSize(size = 20)
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
    JAVASCRIPT,
    // Architecture
    SYSTEM_DESIGN,
    TESTING
}
}