package com.learnsystem.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "examples")
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

@Column(name = "real_world_use")
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
}