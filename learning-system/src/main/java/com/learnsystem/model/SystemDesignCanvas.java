package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_design_canvases", indexes = {
    @Index(name = "idx_sdc_user", columnList = "user_id")
})
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SystemDesignCanvas {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String name;

    /** Full canvas state as JSON: { nodes: [...], edges: [...] } */
    @Column(name = "canvas_data", columnDefinition = "TEXT")
    private String canvasData;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
