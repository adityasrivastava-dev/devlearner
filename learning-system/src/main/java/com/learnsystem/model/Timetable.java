package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "timetables")
@Getter @Setter @NoArgsConstructor
public class Timetable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String name;

    /** NULL if not linked to a saved roadmap */
    private Long roadmapId;

    @Column(nullable = false)
    private int hoursPerDay;

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;

    private int totalDays;

    private int totalTopics;

    /** JSON array of day objects  */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String scheduleJson;

    /** JSON array of "dayNumber-taskIndex" strings marking completed tasks */
    @Column(columnDefinition = "TEXT")
    private String completedTasksJson = "[]";

    /** JSON object: { "1": "note text", "3": "another note" } — keyed by dayNumber */
    @Column(columnDefinition = "TEXT")
    private String dayNotesJson = "{}";

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";   // ACTIVE | COMPLETED | PAUSED

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() { createdAt = updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = LocalDateTime.now(); }
}
