package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * ExecutionJob — the job queue row.
 *
 * A job is created when the user clicks Run or Submit.
 * The API responds with the jobId immediately (< 5ms).
 * An internal @Scheduled worker picks it up, runs the code, and writes the result.
 * The frontend polls GET /api/jobs/{id} every 2s until status = DONE.
 *
 * This table lives in the existing Railway MySQL — zero new infrastructure needed.
 * When you later want to move execution to a home server or AWS:
 *   1. Set WORKER_ENABLED=false on Render  → API enqueues only, never executes
 *   2. Set WORKER_ENABLED=true on the new machine, point it at same MySQL
 *   Zero code changes.
 */
@Entity
@Table(name = "execution_jobs", indexes = {
    @Index(name = "idx_ej_status_created", columnList = "status,created_at"),
    @Index(name = "idx_ej_user",           columnList = "user_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionJob {

    public enum Type   { RUN, SUBMIT }
    public enum Status { PENDING, RUNNING, DONE, ERROR }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private Long problemId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String stdin;               // used for RUN jobs

    @Column(length = 5)
    @Builder.Default
    private String javaVersion = "17";

    @Enumerated(EnumType.STRING)
    @Column(length = 10, nullable = false)
    @Builder.Default
    private Type jobType = Type.RUN;

    @Enumerated(EnumType.STRING)
    @Column(length = 10, nullable = false)
    @Builder.Default
    private Status status = Status.PENDING;

    /** Serialised JSON of ExecuteResponse (RUN) or SubmitResponse (SUBMIT). */
    @Column(columnDefinition = "TEXT")
    private String result;

    /** Short error message when status = ERROR */
    @Column(length = 512)
    private String errorMessage;

    // ── Submit-specific fields ──────────────────────────────────────────────
    private String  approachText;
    private Boolean hintAssisted;
    private Integer solveTimeSecs;

    // ── Timestamps ─────────────────────────────────────────────────────────
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status    == null) status    = Status.PENDING;
        if (javaVersion == null) javaVersion = "17";
        if (jobType   == null) jobType   = Type.RUN;
    }
}
