package com.learnsystem.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "examples",
    indexes = {
        @Index(name = "idx_example_topic_id",     columnList = "topic_id"),
        @Index(name = "idx_example_display_order", columnList = "topic_id, display_order")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Example {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@JsonIgnore
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "topic_id", nullable = false)
private Topic topic;

@Column(name = "display_order")
private Integer displayOrder;

private String title;

@Column(columnDefinition = "TEXT")
private String description;

@Column(columnDefinition = "TEXT")
private String code;

@Column(columnDefinition = "TEXT")
private String explanation;

@Column(name = "real_world_use", columnDefinition = "TEXT")
private String realWorldUse;

// ── Phase 1 Fields ────────────────────────────────────────────────────────

@Column(columnDefinition = "TEXT")
private String pseudocode;

@Column(name = "flowchart_mermaid", columnDefinition = "TEXT")
private String flowchartMermaid;

// ── Phase 2 Tracer Fields ─────────────────────────────────────────────────
// JSON array: [{line, lineCode, variables:{k:v}, phase, annotation}]
// phase values: DECLARE | ASSIGN | LOOP_START | LOOP_ITER |
//               CONDITION_TRUE | CONDITION_FALSE | CALL | RETURN | THROW
@Column(name = "tracer_steps", columnDefinition = "TEXT")
private String tracerSteps;

// ── SQL Visualizer ────────────────────────────────────────────────────────
// JSON object with type ("join","select","groupby","normalize","subquery")
// rendered by SqlTableVisualizer in the frontend
@Column(name = "table_data", columnDefinition = "TEXT")
private String tableData;

// ── Audit ─────────────────────────────────────────────────────────────────

@Column(name = "created_at", updatable = false)
private LocalDateTime createdAt;

@Column(name = "updated_at")
private LocalDateTime updatedAt;

@PrePersist
protected void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

@PreUpdate
protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}