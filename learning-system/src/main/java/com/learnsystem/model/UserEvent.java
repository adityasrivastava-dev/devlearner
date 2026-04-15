package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_events", indexes = {
    @Index(name = "idx_ue_user", columnList = "user_id"),
    @Index(name = "idx_ue_type", columnList = "event_type"),
    @Index(name = "idx_ue_ts",   columnList = "occurred_at"),
    @Index(name = "idx_ue_page", columnList = "page_path")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "page_path", length = 300)
    private String pagePath;

    @Column(name = "event_data", columnDefinition = "TEXT")
    private String eventData;

    @Column(name = "occurred_at")
    private LocalDateTime occurredAt;

    @PrePersist
    protected void onCreate() {
        if (this.occurredAt == null) this.occurredAt = LocalDateTime.now();
    }
}
