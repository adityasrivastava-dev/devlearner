package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_solves",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "challenge_date"}),
    indexes = {
        @Index(name = "idx_ds_date",    columnList = "challenge_date"),
        @Index(name = "idx_ds_user",    columnList = "user_id"),
        @Index(name = "idx_ds_time",    columnList = "time_to_solve_ms")
    })
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DailySolve {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "challenge_date", nullable = false)
    private LocalDate challengeDate;

    /** Milliseconds from when the user first opened the challenge to first ACCEPTED submission */
    @Column(name = "time_to_solve_ms")
    private Long timeToSolveMs;

    /** How many submissions it took */
    @Column(name = "submission_count", nullable = false)
    private Integer submissionCount;

    @Column(name = "solved_at")
    private LocalDateTime solvedAt;

    @PrePersist
    protected void onCreate() {
        if (solvedAt == null) solvedAt = LocalDateTime.now();
    }
}
