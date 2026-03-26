package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "roadmaps")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Roadmap {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Emoji or short icon string shown on the card */
    private String icon;

    /** Hex colour for the roadmap card border/accent, e.g. #4ade80 */
    private String color;

    /** Target audience / level, e.g. "Beginner", "Intermediate", "Interview Prep" */
    private String level;

    /** Estimated total hours to complete */
    private Integer estimatedHours;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { this.createdAt = LocalDateTime.now(); }

    @OneToMany(mappedBy = "roadmap", cascade = CascadeType.ALL,
            fetch = FetchType.LAZY, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    private List<RoadmapTopic> roadmapTopics = new ArrayList<>();
}