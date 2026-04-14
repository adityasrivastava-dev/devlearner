package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_topic_videos", indexes = {
        @Index(name = "idx_utv_user_topic", columnList = "user_id,topic_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTopicVideo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "topic_id", nullable = false)
    private Long topicId;

    @Column(nullable = false, length = 1000)
    private String url;

    @Column(length = 300)
    private String title;

    @Column(name = "added_at")
    private LocalDateTime addedAt;

    @PrePersist
    protected void onCreate() { this.addedAt = LocalDateTime.now(); }
}
