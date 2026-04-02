package com.learnsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Phase 2 — Bookmarks for topics or problems.
 * One row per user per item.
 */
@Entity
@Table(name = "bookmarks",
		uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "item_type", "item_id"}),
		indexes = {
				@Index(name = "idx_bm_user", columnList = "user_id")
		})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bookmark {

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "user_id", nullable = false)
private Long userId;

/** "TOPIC" or "PROBLEM" */
@Column(name = "item_type", length = 20, nullable = false)
private String itemType;

@Column(name = "item_id", nullable = false)
private Long itemId;

@Column(name = "item_title", length = 200)
private String itemTitle;

@Column(name = "created_at")
private LocalDateTime createdAt;

@PrePersist
protected void onCreate() { this.createdAt = LocalDateTime.now(); }
}