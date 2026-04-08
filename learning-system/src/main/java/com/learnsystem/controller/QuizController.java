package com.learnsystem.controller;

import com.learnsystem.model.User;
import com.learnsystem.service.QuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Quiz endpoints — completely standalone, no coupling to topics/problems.
 *
 * Public (no auth):
 *   GET  /api/quiz/sets              — list all active quiz sets
 *   GET  /api/quiz/sets/:id          — get a set + questions for play
 *
 * Authenticated:
 *   POST /api/quiz/submit            — submit a completed attempt
 *   GET  /api/quiz/history           — user's past attempts
 *
 * Admin only (via /api/admin/quiz/**):
 *   POST /api/admin/quiz/seed        — seed a quiz set from JSON
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class QuizController {

private final QuizService quizService;

// ── Public — list quiz sets ───────────────────────────────────────────────
@GetMapping("/api/quiz/sets")
public ResponseEntity<List<Map<String, Object>>> getSets(
		@RequestParam(required = false) String category) {
	return ResponseEntity.ok(quizService.getSets(category));
}

// ── Public — get one set for play ─────────────────────────────────────────
@GetMapping("/api/quiz/sets/{id}")
public ResponseEntity<Map<String, Object>> getSetForPlay(@PathVariable Long id) {
	return ResponseEntity.ok(quizService.getSetForPlay(id));
}

// ── Authenticated — submit attempt ────────────────────────────────────────
@PostMapping("/api/quiz/submit")
public ResponseEntity<?> submitAttempt(
		@RequestBody Map<String, Object> body,
		@AuthenticationPrincipal User user) {

	Long setId = body.get("setId") instanceof Number n ? n.longValue() : null;
	Long timeTakenSecs = body.get("timeTakenSecs") instanceof Number n ? n.longValue() : null;

	@SuppressWarnings("unchecked")
	List<Map<String, Object>> answers =
			(List<Map<String, Object>>) body.getOrDefault("answers", List.of());

	if (setId == null) {
		return ResponseEntity.badRequest().body(Map.of("error", "setId is required"));
	}

	Long userId = user != null ? user.getId() : null;
	return ResponseEntity.ok(quizService.submitAttempt(userId, setId, answers, timeTakenSecs));
}

// ── Authenticated — quiz history ──────────────────────────────────────────
@GetMapping("/api/quiz/history")
public ResponseEntity<?> getHistory(@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.ok(List.of());
	return ResponseEntity.ok(quizService.getHistory(user.getId()));
}

// ── Admin — seed a quiz set ───────────────────────────────────────────────
@PostMapping("/api/admin/quiz/seed")
public ResponseEntity<Map<String, Object>> seedQuizSet(
		@RequestBody Map<String, Object> payload) {
	return ResponseEntity.ok(quizService.seedSet(payload));
}
}