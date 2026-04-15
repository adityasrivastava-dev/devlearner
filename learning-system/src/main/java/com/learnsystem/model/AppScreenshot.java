package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "app_screenshots")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppScreenshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "slide_key", unique = true, nullable = false)
    private String slideKey;

    @Column(name = "image_data", columnDefinition = "TEXT")
    private String imageData;

    @Column(name = "caption")
    private String caption;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        updatedAt = LocalDateTime.now();
    }
}
