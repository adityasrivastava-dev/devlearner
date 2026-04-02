package com.learnsystem.controller;

import com.learnsystem.model.Topic;
import com.learnsystem.repository.ExampleRepository;
import com.learnsystem.repository.ProblemRepository;
import com.learnsystem.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Admin-only data management API.
 *
 * All endpoints under /api/admin/** are secured by SecurityConfig
 * to require ROLE_ADMIN (JWT). These endpoints handle bulk data
 * deletion — never expose to non-admin users.
 *
 * Endpoints:
 *   DELETE /api/admin/data/all              — delete everything
 *   DELETE /api/admin/data/topics           — delete all topics (cascades examples + problems)
 *   DELETE /api/admin/data/examples         — delete all examples only
 *   DELETE /api/admin/data/problems         — delete all problems only
 *   DELETE /api/admin/data/category/{cat}   — delete all topics in one category
 *   DELETE /api/admin/data/topic/{id}       — delete one specific topic
 *   GET    /api/admin/data/stats            — count of rows in each table
 */
@RestController
@RequestMapping("/api/admin/data")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminPortalController {

private final TopicRepository   topicRepo;
private final ExampleRepository exampleRepo;
private final ProblemRepository problemRepo;

// ─────────────────────────────────────────────────────────────────────────
// GET /api/admin/data/stats
// Returns current row counts so admin can confirm before / after deletes.
// ─────────────────────────────────────────────────────────────────────────
@GetMapping("/stats")
public ResponseEntity<Map<String, Object>> stats() {
	long topics   = topicRepo.count();
	long examples = exampleRepo.count();
	long problems = problemRepo.count();

	// Count per category
	Map<String, Long> byCategory = new LinkedHashMap<>();
	for (Topic.Category cat : Topic.Category.values()) {
		byCategory.put(cat.name(), (long) topicRepo.findByCategory(cat).size());
	}

	Map<String, Object> body = new LinkedHashMap<>();
	body.put("topics",     topics);
	body.put("examples",   examples);
	body.put("problems",   problems);
	body.put("total",      topics + examples + problems);
	body.put("byCategory", byCategory);

	log.info("[Admin] Stats requested — topics:{} examples:{} problems:{}", topics, examples, problems);
	return ResponseEntity.ok(body);
}

// ─────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/data/all
// Nuclear option: wipe everything (topics, examples, problems).
// ─────────────────────────────────────────────────────────────────────────
@DeleteMapping("/all")
public ResponseEntity<Map<String, Object>> deleteAll() {
	long pCount = problemRepo.count();
	long eCount = exampleRepo.count();
	long tCount = topicRepo.count();

	problemRepo.deleteAll();
	exampleRepo.deleteAll();
	topicRepo.deleteAll();

	log.warn("[Admin] DELETE ALL — removed {} topics, {} examples, {} problems",
			tCount, eCount, pCount);

	return ResponseEntity.ok(Map.of(
			"deleted",  Map.of("topics", tCount, "examples", eCount, "problems", pCount),
			"message",  "All data deleted successfully.",
			"remaining", Map.of("topics", 0L, "examples", 0L, "problems", 0L)
	));
}

// ─────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/data/topics
// Delete all topics — CASCADE deletes their examples and problems too.
// ─────────────────────────────────────────────────────────────────────────
@DeleteMapping("/topics")
public ResponseEntity<Map<String, Object>> deleteAllTopics() {
	long tCount = topicRepo.count();
	long eCount = exampleRepo.count();
	long pCount = problemRepo.count();

	// Must delete children first (no cascade-delete in DB if FK constraints)
	problemRepo.deleteAll();
	exampleRepo.deleteAll();
	topicRepo.deleteAll();

	log.warn("[Admin] DELETE ALL TOPICS — {} topics, {} examples, {} problems removed",
			tCount, eCount, pCount);

	return ResponseEntity.ok(Map.of(
			"deleted", Map.of("topics", tCount, "examples", eCount, "problems", pCount),
			"message", "All topics (and their examples/problems) deleted."
	));
}

// ─────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/data/examples
// Delete ONLY examples — keeps topics and problems intact.
// ─────────────────────────────────────────────────────────────────────────
@DeleteMapping("/examples")
public ResponseEntity<Map<String, Object>> deleteAllExamples() {
	long count = exampleRepo.count();
	exampleRepo.deleteAll();

	log.warn("[Admin] DELETE ALL EXAMPLES — {} rows removed", count);

	return ResponseEntity.ok(Map.of(
			"deleted", count,
			"message", count + " examples deleted. Topics and problems untouched."
	));
}

// ─────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/data/problems
// Delete ONLY problems — keeps topics and examples intact.
// ─────────────────────────────────────────────────────────────────────────
@DeleteMapping("/problems")
public ResponseEntity<Map<String, Object>> deleteAllProblems() {
	long count = problemRepo.count();
	problemRepo.deleteAll();

	log.warn("[Admin] DELETE ALL PROBLEMS — {} rows removed", count);

	return ResponseEntity.ok(Map.of(
			"deleted", count,
			"message", count + " problems deleted. Topics and examples untouched."
	));
}

// ─────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/data/category/{category}
// Delete all topics (+ their examples + problems) for one category.
// category values: DSA, JAVA, ADVANCED_JAVA, MYSQL, AWS
// ─────────────────────────────────────────────────────────────────────────
@DeleteMapping("/category/{category}")
public ResponseEntity<Map<String, Object>> deleteByCategory(@PathVariable String category) {
	Topic.Category cat;
	try {
		cat = Topic.Category.valueOf(category.toUpperCase().replace("-", "_"));
	} catch (IllegalArgumentException e) {
		// Build valid list dynamically from the enum — never goes stale
		List<String> validCats = java.util.Arrays.stream(Topic.Category.values())
				.map(Enum::name)
				.collect(Collectors.toList());
		return ResponseEntity.badRequest().body(Map.of(
				"error",   "Unknown category: " + category,
				"valid",   validCats
		));
	}

	List<Topic> topics = topicRepo.findByCategory(cat);
	if (topics.isEmpty()) {
		return ResponseEntity.ok(Map.of(
				"deleted", 0,
				"message", "No topics found for category: " + category
		));
	}

	long eCount = 0, pCount = 0;
	for (Topic t : topics) {
		pCount += problemRepo.findByTopicIdOrderByDisplayOrder(t.getId()).size();
		eCount += exampleRepo.findByTopicIdOrderByDisplayOrder(t.getId()).size();
		// Delete children first
		problemRepo.deleteAll(problemRepo.findByTopicIdOrderByDisplayOrder(t.getId()));
		exampleRepo.deleteAll(exampleRepo.findByTopicIdOrderByDisplayOrder(t.getId()));
	}
	topicRepo.deleteAll(topics);

	log.warn("[Admin] DELETE CATEGORY:{} — {} topics, {} examples, {} problems removed",
			cat, topics.size(), eCount, pCount);

	return ResponseEntity.ok(Map.of(
			"category", cat.name(),
			"deleted",  Map.of("topics", topics.size(), "examples", eCount, "problems", pCount),
			"message",  "Category " + cat.name() + " deleted successfully."
	));
}

// ─────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/data/topic/{id}
// Delete one specific topic by ID (+ its examples + problems).
// ─────────────────────────────────────────────────────────────────────────
@DeleteMapping("/topic/{id}")
public ResponseEntity<Map<String, Object>> deleteTopic(@PathVariable Long id) {
	return topicRepo.findById(id)
			.map(topic -> {
				long eCount = exampleRepo.findByTopicIdOrderByDisplayOrder(id).size();
				long pCount = problemRepo.findByTopicIdOrderByDisplayOrder(id).size();

				problemRepo.deleteAll(problemRepo.findByTopicIdOrderByDisplayOrder(id));
				exampleRepo.deleteAll(exampleRepo.findByTopicIdOrderByDisplayOrder(id));
				topicRepo.delete(topic);

				log.warn("[Admin] DELETE TOPIC id:{} title:{} — {} examples, {} problems removed",
						id, topic.getTitle(), eCount, pCount);

				return ResponseEntity.ok(Map.of(
						"deletedTopic", Map.of("id", id, "title", topic.getTitle()),
						"deleted", Map.of("examples", eCount, "problems", pCount),
						"message", "Topic '" + topic.getTitle() + "' deleted."
				));
			})
			.orElse(ResponseEntity.notFound().<Map<String, Object>>build());
}
}