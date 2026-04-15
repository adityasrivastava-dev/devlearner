package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "page_views", indexes = {
    @Index(name = "idx_pv_user",    columnList = "user_id"),
    @Index(name = "idx_pv_path",    columnList = "page_path"),
    @Index(name = "idx_pv_ts",      columnList = "viewed_at"),
    @Index(name = "idx_pv_session", columnList = "session_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "page_path", nullable = false, length = 300)
    private String pagePath;

    @Column(name = "page_title", length = 200)
    private String pageTitle;

    @Column(name = "session_id", length = 64)
    private String sessionId;

    @Column(name = "viewed_at")
    private LocalDateTime viewedAt;

    @PrePersist
    protected void onCreate() {
        if (this.viewedAt == null) this.viewedAt = LocalDateTime.now();
    }
}
