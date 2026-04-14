package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "roadmap_topics",
        uniqueConstraints = @UniqueConstraint(columnNames = {"roadmap_id", "topic_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoadmapTopic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roadmap_id", nullable = false)
    private Roadmap roadmap;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "topic_id", nullable = false)
    private Topic topic;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    /** Optional note shown on this step in the roadmap, e.g. "Focus on iteration first" */
    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean completed;
}