package com.learnsystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.model.User;
import com.learnsystem.service.QuizService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

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
 *   GET  /api/admin/quiz/files       — list quiz JSON files from classpath:quiz/
 *   POST /api/admin/quiz/files/:name — import one quiz file
 *   POST /api/admin/quiz/seed        — seed a quiz set from raw JSON body
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class QuizController {

private final QuizService            quizService;
private final ResourcePatternResolver resourcePatternResolver;
private final ObjectMapper           objectMapper;

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

// ── Admin — list quiz seed files from classpath:quiz/ ─────────────────────
@GetMapping("/api/admin/quiz/files")
public ResponseEntity<List<Map<String, Object>>> listQuizFiles() {
	List<Map<String, Object>> result = new ArrayList<>();
	try {
		Resource[] resources = resourcePatternResolver.getResources("classpath:quiz/*.json");
		Arrays.sort(resources, Comparator.comparing(r -> r.getFilename() != null ? r.getFilename() : ""));

		for (Resource resource : resources) {
			String filename = resource.getFilename();
			Map<String, Object> info = new LinkedHashMap<>();
			info.put("filename", filename);
			try {
				@SuppressWarnings("unchecked")
				Map<String, Object> parsed = objectMapper.readValue(
						resource.getInputStream(), Map.class);
				String title = (String) parsed.getOrDefault("title", filename);
				@SuppressWarnings("unchecked")
				List<?> questions = (List<?>) parsed.getOrDefault("questions", List.of());
				info.put("title",         title);
				info.put("category",      parsed.getOrDefault("category", "JAVA"));
				info.put("difficulty",    parsed.getOrDefault("difficulty", "INTERMEDIATE"));
				info.put("questionCount", questions.size());
				// Check if already seeded by looking up title in DB
				boolean alreadySeeded = quizService.setExistsByTitle(title);
				info.put("status", alreadySeeded ? "IMPORTED" : "PENDING");
			} catch (Exception e) {
				info.put("title",  filename);
				info.put("status", "ERROR");
				info.put("error",  e.getMessage());
			}
			result.add(info);
		}
	} catch (Exception ignored) {}
	return ResponseEntity.ok(result);
}

// ── Admin — import one quiz file by filename ──────────────────────────────
@PostMapping("/api/admin/quiz/files/{filename}")
public ResponseEntity<?> importQuizFile(@PathVariable String filename) {
	if (!filename.endsWith(".json") || filename.contains("/") || filename.contains("..")) {
		return ResponseEntity.badRequest().body(Map.of("error", "Invalid filename"));
	}
	try {
		Resource[] resources = resourcePatternResolver.getResources("classpath:quiz/" + filename);
		if (resources.length == 0) return ResponseEntity.notFound().build();

		@SuppressWarnings("unchecked")
		Map<String, Object> payload = objectMapper.readValue(
				resources[0].getInputStream(), Map.class);

		Map<String, Object> result = quizService.seedSet(payload);
		return ResponseEntity.ok(result);
	} catch (Exception e) {
		return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
	}
}

// ── Admin — seed a quiz set from raw JSON body ────────────────────────────
@PostMapping("/api/admin/quiz/seed")
public ResponseEntity<Map<String, Object>> seedQuizSet(
		@RequestBody Map<String, Object> payload) {
	return ResponseEntity.ok(quizService.seedSet(payload));
}

// ── Admin — list all quiz sets for management ─────────────────────────────
@GetMapping("/api/admin/quiz/sets")
public ResponseEntity<List<Map<String, Object>>> adminListSets() {
	return ResponseEntity.ok(quizService.getSets(null));
}

// ── Admin — delete a quiz set and all its questions ───────────────────────
@DeleteMapping("/api/admin/quiz/sets/{id}")
public ResponseEntity<?> deleteSet(@PathVariable Long id) {
	quizService.deleteSet(id);
	return ResponseEntity.ok(Map.of("deleted", true, "id", id));
}

// ── Admin — update quiz set metadata ─────────────────────────────────────
@PutMapping("/api/admin/quiz/sets/{id}")
public ResponseEntity<?> updateSet(
		@PathVariable Long id,
		@RequestBody Map<String, Object> payload) {
	try {
		return ResponseEntity.ok(quizService.updateSet(id, payload));
	} catch (RuntimeException e) {
		return ResponseEntity.notFound().build();
	}
}

// ── Admin — get questions for a set (with correct answers, for editing) ───
@GetMapping("/api/admin/quiz/sets/{id}/questions")
public ResponseEntity<?> getQuestionsAdmin(@PathVariable Long id) {
	return ResponseEntity.ok(quizService.getQuestionsAdmin(id));
}

// ── Admin — add a question to a set ──────────────────────────────────────
@PostMapping("/api/admin/quiz/sets/{id}/questions")
public ResponseEntity<?> addQuestion(
		@PathVariable Long id,
		@RequestBody Map<String, Object> payload) {
	try {
		return ResponseEntity.ok(quizService.addQuestion(id, payload));
	} catch (RuntimeException e) {
		return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
	}
}

// ── Admin — update a question ─────────────────────────────────────────────
@PutMapping("/api/admin/quiz/questions/{id}")
public ResponseEntity<?> updateQuestion(
		@PathVariable Long id,
		@RequestBody Map<String, Object> payload) {
	try {
		return ResponseEntity.ok(quizService.updateQuestion(id, payload));
	} catch (RuntimeException e) {
		return ResponseEntity.notFound().build();
	}
}

// ── Admin — delete a single question ─────────────────────────────────────
@DeleteMapping("/api/admin/quiz/questions/{id}")
public ResponseEntity<?> deleteQuestion(@PathVariable Long id) {
	try {
		quizService.deleteQuestion(id);
		return ResponseEntity.ok(Map.of("deleted", true, "id", id));
	} catch (RuntimeException e) {
		return ResponseEntity.notFound().build();
	}
}
}