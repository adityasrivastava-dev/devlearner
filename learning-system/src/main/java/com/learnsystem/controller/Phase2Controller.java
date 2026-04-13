package com.learnsystem.controller;

import com.learnsystem.model.*;
import com.learnsystem.repository.*;
import com.learnsystem.security.JwtService;
import com.learnsystem.service.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Phase 2 REST API — all Phase 2 features in one controller.
 *
 * Spaced Repetition:
 *   GET  /api/srs/queue          — due items + upcoming
 *   POST /api/srs/review         — process a review result
 *   POST /api/srs/enqueue        — manually add item to queue
 *
 * Streak:
 *   GET  /api/streak/status      — streak, pause days, XP, level
 *   POST /api/streak/pause-day   — use a banked pause day
 *   POST /api/streak/recover     — apply 1-day miss recovery
 *
 * Analytics:
 *   GET  /api/analytics/dashboard  — confidence scores, weak areas
 *   GET  /api/analytics/mistakes   — mistake journal
 *   GET  /api/analytics/topic/:id  — single topic performance
 *
 * Notes:
 *   GET    /api/notes?topicId=X   — get notes for a topic
 *   POST   /api/notes             — create note
 *   PUT    /api/notes/:id         — update note
 *   DELETE /api/notes/:id         — delete note
 *
 * Bookmarks:
 *   GET    /api/bookmarks         — all bookmarks
 *   POST   /api/bookmarks/toggle  — add or remove bookmark
 *   GET    /api/bookmarks/check?itemType=X&itemId=Y — is this bookmarked?
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class Phase2Controller {

private final SpacedRepetitionService      srsService;
private final StreakService                streakService;
private final PerformanceAnalyticsService  analyticsService;
private final UserNoteRepository           noteRepo;
private final BookmarkRepository           bookmarkRepo;
private final UserTopicPerformanceRepository perfRepo;
private final UserRepository               userRepo;
private final JwtService                   jwtService;
private final com.learnsystem.repository.TopicRatingRepository ratingRepo;

// ═══════════════════════════════════════════════════════════════════
// SPACED REPETITION
// ═══════════════════════════════════════════════════════════════════

@GetMapping("/api/srs/queue")
public ResponseEntity<?> getSrsQueue(@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	return ResponseEntity.ok(srsService.getQueueSummary(user.getId()));
}

@PostMapping("/api/srs/review")
public ResponseEntity<?> submitReview(
		@RequestBody Map<String, Object> body,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	String itemType = (String) body.get("itemType");
	Long   itemId   = body.get("itemId") instanceof Number n ? n.longValue() : null;
	int    quality  = body.get("quality") instanceof Number n ? n.intValue() : 3;
	if (itemType == null || itemId == null) {
		return ResponseEntity.badRequest().body(Map.of("error", "itemType and itemId required"));
	}
	var entry = srsService.review(user.getId(), itemType, itemId, quality);
	return ResponseEntity.ok(Map.of(
			"nextReviewDate", entry.getNextReviewDate().toString(),
			"intervalDays",  entry.getIntervalDays(),
			"repetitions",   entry.getRepetitions()
	));
}

@PostMapping("/api/srs/enqueue")
public ResponseEntity<?> enqueue(
		@RequestBody Map<String, Object> body,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	String itemType  = (String) body.get("itemType");
	Long   itemId    = body.get("itemId")    instanceof Number n ? n.longValue() : null;
	String itemTitle = (String) body.getOrDefault("itemTitle", "");
	if (itemType == null || itemId == null) {
		return ResponseEntity.badRequest().body(Map.of("error", "itemType and itemId required"));
	}
	srsService.enqueue(user.getId(), itemType, itemId, itemTitle);
	return ResponseEntity.ok(Map.of("queued", true));
}

// ═══════════════════════════════════════════════════════════════════
// STREAK
// ═══════════════════════════════════════════════════════════════════

@GetMapping("/api/streak/status")
public ResponseEntity<?> streakStatus(@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	return ResponseEntity.ok(streakService.getStatus(user.getId()));
}

@PostMapping("/api/streak/pause-day")
public ResponseEntity<?> usePauseDay(@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	return ResponseEntity.ok(streakService.usePauseDay(user.getId()));
}

@PostMapping("/api/streak/recover")
public ResponseEntity<?> recoverStreak(@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	return ResponseEntity.ok(streakService.applyRecovery(user.getId()));
}

// ═══════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════

@GetMapping("/api/analytics/dashboard")
public ResponseEntity<?> analyticsDashboard(@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	return ResponseEntity.ok(analyticsService.getDashboard(user.getId()));
}

@GetMapping("/api/analytics/mistakes")
public ResponseEntity<?> mistakeJournal(@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	return ResponseEntity.ok(analyticsService.getMistakeJournal(user.getId()));
}

@GetMapping("/api/analytics/topic/{topicId}")
public ResponseEntity<?> topicPerformance(
		@PathVariable Long topicId,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	var perf = perfRepo.findByUserIdAndTopicId(user.getId(), topicId);
	return ResponseEntity.ok(perf.map(p -> (Object) Map.of(
			"topicId",         p.getTopicId(),
			"topicTitle",      p.getTopicTitle(),
			"confidenceScore", p.getConfidenceScore(),
			"accuracyRate",    Math.round(p.getAccuracyRate() * 100),
			"attempts",        p.getAttempts(),
			"accepted",        p.getAccepted(),
			"avgSolveTimeSecs",p.getAvgSolveTimeSecs()
	)).orElse(Map.of("confidenceScore", 0, "attempts", 0)));
}

// ═══════════════════════════════════════════════════════════════════
// NOTES
// ═══════════════════════════════════════════════════════════════════

@GetMapping("/api/notes")
public ResponseEntity<?> getNotes(
		@RequestParam(required = false)      Long topicId,
		@RequestParam(defaultValue = "200") int  size,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	size = Math.min(size, 500);
	var pageable = PageRequest.of(0, size);
	var notes = topicId != null
			? noteRepo.findRecentByUserIdAndTopicId(user.getId(), topicId, pageable)
			: noteRepo.findRecentByUserId(user.getId(), pageable);
	return ResponseEntity.ok(notes.stream().map(n -> Map.of(
			"id",        n.getId(),
			"topicId",   n.getTopicId() != null ? n.getTopicId() : 0,
			"content",   n.getContent(),
			"updatedAt", n.getUpdatedAt() != null ? n.getUpdatedAt().toString() : ""
	)).toList());
}

@PostMapping("/api/notes")
public ResponseEntity<?> createNote(
		@RequestBody Map<String, Object> body,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	String content = (String) body.get("content");
	if (content == null || content.isBlank()) {
		return ResponseEntity.badRequest().body(Map.of("error", "content required"));
	}
	Long topicId = body.get("topicId") instanceof Number n ? n.longValue() : null;
	var note = UserNote.builder()
			.userId(user.getId())
			.topicId(topicId)
			.content(content.trim())
			.build();
	noteRepo.save(note);
	return ResponseEntity.ok(Map.of("id", note.getId(), "saved", true));
}

@PutMapping("/api/notes/{id}")
public ResponseEntity<?> updateNote(
		@PathVariable Long id,
		@RequestBody Map<String, Object> body,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	var note = noteRepo.findById(id).orElse(null);
	if (note == null || !note.getUserId().equals(user.getId())) {
		return ResponseEntity.status(403).body(Map.of("error", "Not found or not yours"));
	}
	String content = (String) body.get("content");
	if (content != null && !content.isBlank()) {
		note.setContent(content.trim());
		noteRepo.save(note);
	}
	return ResponseEntity.ok(Map.of("id", note.getId(), "saved", true));
}

@DeleteMapping("/api/notes/{id}")
public ResponseEntity<?> deleteNote(
		@PathVariable Long id,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	var note = noteRepo.findById(id).orElse(null);
	if (note == null || !note.getUserId().equals(user.getId())) {
		return ResponseEntity.status(403).build();
	}
	noteRepo.delete(note);
	return ResponseEntity.noContent().build();
}

// ═══════════════════════════════════════════════════════════════════
// BOOKMARKS
// ═══════════════════════════════════════════════════════════════════

@GetMapping("/api/bookmarks")
public ResponseEntity<?> getBookmarks(@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	// Cap at 500 — bookmarks are small rows but query must be bounded
	var pageable = PageRequest.of(0, 500);
	return ResponseEntity.ok(bookmarkRepo.findRecentByUserId(user.getId(), pageable)
			.stream().map(b -> Map.of(
					"id",        b.getId(),
					"itemType",  b.getItemType(),
					"itemId",    b.getItemId(),
					"itemTitle", b.getItemTitle() != null ? b.getItemTitle() : "",
					"createdAt", b.getCreatedAt() != null ? b.getCreatedAt().toString() : ""
			)).toList());
}

@PostMapping("/api/bookmarks/toggle")
public ResponseEntity<?> toggleBookmark(
		@RequestBody Map<String, Object> body,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	String itemType  = (String) body.get("itemType");
	Long   itemId    = body.get("itemId") instanceof Number n ? n.longValue() : null;
	String itemTitle = (String) body.getOrDefault("itemTitle", "");
	if (itemType == null || itemId == null) {
		return ResponseEntity.badRequest().body(Map.of("error", "itemType and itemId required"));
	}
	boolean exists = bookmarkRepo.existsByUserIdAndItemTypeAndItemId(
			user.getId(), itemType, itemId);
	if (exists) {
		bookmarkRepo.deleteByUserIdAndItemTypeAndItemId(user.getId(), itemType, itemId);
		return ResponseEntity.ok(Map.of("bookmarked", false));
	} else {
		var bm = Bookmark.builder()
				.userId(user.getId())
				.itemType(itemType)
				.itemId(itemId)
				.itemTitle(itemTitle)
				.build();
		bookmarkRepo.save(bm);
		return ResponseEntity.ok(Map.of("bookmarked", true, "id", bm.getId()));
	}
}

@GetMapping("/api/bookmarks/check")
public ResponseEntity<?> checkBookmark(
		@RequestParam String itemType,
		@RequestParam Long itemId,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.ok(Map.of("bookmarked", false));
	boolean exists = bookmarkRepo.existsByUserIdAndItemTypeAndItemId(
			user.getId(), itemType, itemId);
	return ResponseEntity.ok(Map.of("bookmarked", exists));
}

// ═══════════════════════════════════════════════════════════════════
// TOPIC RATINGS
// ═══════════════════════════════════════════════════════════════════

/**
 * POST /api/topics/{topicId}/rate
 * Body: { "rating": 1-5 }
 * Upserts the current user's rating for the topic.
 */
@PostMapping("/api/topics/{topicId}/rate")
public ResponseEntity<?> rateTopic(
		@PathVariable Long topicId,
		@RequestBody Map<String, Object> body,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(401).build();
	int rating = body.get("rating") instanceof Number n ? n.intValue() : 0;
	if (rating < 1 || rating > 5) {
		return ResponseEntity.badRequest().body(Map.of("error", "rating must be 1–5"));
	}
	var existing = ratingRepo.findByUserIdAndTopicId(user.getId(), topicId);
	com.learnsystem.model.TopicRating tr = existing.orElseGet(() ->
			com.learnsystem.model.TopicRating.builder()
					.userId(user.getId())
					.topicId(topicId)
					.build());
	tr.setRating(rating);
	ratingRepo.save(tr);
	Double avg   = ratingRepo.getAverageRating(topicId);
	Long   count = ratingRepo.getRatingCount(topicId);
	return ResponseEntity.ok(Map.of(
			"myRating", rating,
			"average",  avg   != null ? Math.round(avg * 10.0) / 10.0 : rating,
			"count",    count != null ? count : 1L
	));
}

/**
 * GET /api/topics/{topicId}/rating
 * Returns average rating, count, and the current user's rating (0 if none).
 */
@GetMapping("/api/topics/{topicId}/rating")
public ResponseEntity<?> getTopicRating(
		@PathVariable Long topicId,
		@AuthenticationPrincipal User user) {
	Double avg   = ratingRepo.getAverageRating(topicId);
	Long   count = ratingRepo.getRatingCount(topicId);
	int    myRating = 0;
	if (user != null) {
		myRating = ratingRepo.findByUserIdAndTopicId(user.getId(), topicId)
				.map(com.learnsystem.model.TopicRating::getRating)
				.orElse(0);
	}
	return ResponseEntity.ok(Map.of(
			"average",  avg   != null ? Math.round(avg * 10.0) / 10.0 : 0.0,
			"count",    count != null ? count : 0L,
			"myRating", myRating
	));
}
}