package com.learnsystem.controller;

import com.learnsystem.model.User;
import com.learnsystem.repository.RecallDrillRepository;
import com.learnsystem.model.RecallDrill;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Phase 1 — Recall Drill persistence.
 *
 * POST /api/recall
 * Body: { "topicId": 5, "topicTitle": "Sliding Window", "text": "Subtract what leaves, add what arrives..." }
 *
 * Saves the user's free-text recall response. No scoring — pure retrieval practice.
 * The frontend fires this silently on "Save & Close" in the recall modal.
 */
@Slf4j
@RestController
@RequestMapping("/api/recall")
@RequiredArgsConstructor
public class RecallDrillController {

private final RecallDrillRepository recallRepo;

@PostMapping
public ResponseEntity<Map<String, Object>> save(
		@RequestBody Map<String, Object> body,
		@AuthenticationPrincipal User user) {

	Long topicId = body.get("topicId") instanceof Number n ? n.longValue() : null;
	String topicTitle = (String) body.getOrDefault("topicTitle", "");
	String text       = (String) body.getOrDefault("text", "");

	if (text == null || text.isBlank()) {
		return ResponseEntity.badRequest()
				.body(Map.of("error", "Recall text cannot be empty"));
	}

	RecallDrill drill = RecallDrill.builder()
			.userId(user != null ? user.getId() : null)
			.topicId(topicId)
			.topicTitle(topicTitle)
			.recallText(text)
			.build();

	recallRepo.save(drill);
	log.debug("Recall saved: userId={} topicId={} chars={}",
			drill.getUserId(), topicId, text.length());

	return ResponseEntity.ok(Map.of("saved", true, "id", drill.getId()));
}

/** GET /api/recall?topicId=X — last 5 recall entries for this topic */
@GetMapping
public ResponseEntity<?> history(
		@RequestParam(required = false) Long topicId,
		@AuthenticationPrincipal User user) {

	if (user == null) return ResponseEntity.ok(java.util.List.of());
	var results = topicId != null
			? recallRepo.findTop5ByUserIdAndTopicIdOrderByCreatedAtDesc(user.getId(), topicId)
			: recallRepo.findTop10ByUserIdOrderByCreatedAtDesc(user.getId());
	return ResponseEntity.ok(results);
}
}