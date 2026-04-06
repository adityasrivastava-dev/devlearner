package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Tracks which seed batches have already been applied.
 * SeedDataRunner checks this table before running each seeds/*.json file
 * so restarts never double-import data.
 */
@Entity
@Table(name = "seed_log")
@Data
@NoArgsConstructor
public class SeedLog {

    /** batchName from the JSON file (e.g. "batch-01-core-java") */
    @Id
    @Column(name = "batch_name", length = 200)
    private String batchName;

    @Column(name = "applied_at", nullable = false)
    private LocalDateTime appliedAt;

    @Column(name = "topics_seeded")
    private int topicsSeeded;

    @Column(name = "examples_seeded")
    private int examplesSeeded;

    @Column(name = "problems_seeded")
    private int problemsSeeded;

    public SeedLog(String batchName, LocalDateTime appliedAt,
                   int topics, int examples, int problems) {
        this.batchName      = batchName;
        this.appliedAt      = appliedAt;
        this.topicsSeeded   = topics;
        this.examplesSeeded = examples;
        this.problemsSeeded = problems;
    }
}
