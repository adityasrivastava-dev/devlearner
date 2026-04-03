package com.learnsystem.controller;

import com.learnsystem.model.Problem;
import com.learnsystem.model.Topic;
import com.learnsystem.repository.ProblemRepository;
import com.learnsystem.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * GET /api/problems
 *   ?difficulty=EASY|MEDIUM|HARD   (optional)
 *   ?category=DSA|JAVA|...          (optional)
 *   ?pattern=TWO_POINTER            (optional)
 *   ?search=two+sum                 (optional, title search)
 *
 * Returns flat list of ALL problems across all topics,
 * with topicId and topicTitle embedded for the problems page.
 */
@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {

private final ProblemRepository problemRepo;
private final TopicRepository   topicRepo;

@GetMapping
public ResponseEntity<List<Map<String, Object>>> getAllProblems(
		@RequestParam(required = false) String difficulty,
		@RequestParam(required = false) String category,
		@RequestParam(required = false) String pattern,
		@RequestParam(required = false) String search) {

	// ── BUG 1 FIX: Use JOIN FETCH to eagerly load topic in one query ──────
	// OLD: problemRepo.findAll() — Problem.topic is LAZY, calling p.getTopic()
	//      outside a transaction caused LazyInitializationException.
	//      Even wrapped in try/catch, it silently returned null for all topicIds,
	//      so every problem showed topicId=null in the response.
	// NEW: findAllWithTopicFetched() uses JPQL JOIN FETCH — topic is loaded
	//      in the same SQL query, no separate lazy load needed.
	List<Problem> problems = problemRepo.findAllWithTopicFetched();

	// Load all topics once and build id→topic map for filtering by category
	Map<Long, Topic> topicMap = topicRepo.findAll()
			.stream().collect(Collectors.toMap(Topic::getId, t -> t));

	// Apply filters
	if (difficulty != null && !difficulty.isBlank()) {
		try {
			Problem.Difficulty d = Problem.Difficulty.valueOf(difficulty.toUpperCase());
			problems = problems.stream()
					.filter(p -> d.equals(p.getDifficulty()))
					.collect(Collectors.toList());
		} catch (IllegalArgumentException ignored) {}
	}

	if (category != null && !category.isBlank()) {
		try {
			Topic.Category cat = Topic.Category.valueOf(category.toUpperCase().replace("-", "_"));
			problems = problems.stream()
					.filter(p -> {
						// ── BUG 6 FIX: Remove redundant null check ─────────────────────
						// OLD: topicMap.get(p.getTopic() != null ? getTopicId(p) : null)
						//      The outer null check was redundant — getTopicId() already
						//      returns null safely if topic is null.
						// NEW: getTopicId(p) handles null internally — one clean call.
						Topic t = topicMap.get(getTopicId(p));
						return t != null && cat.equals(t.getCategory());
					})
					.collect(Collectors.toList());
		} catch (IllegalArgumentException ignored) {}
	}

	if (pattern != null && !pattern.isBlank()) {
		String pat = pattern.toUpperCase();
		problems = problems.stream()
				.filter(p -> pat.equals(p.getPattern()))
				.collect(Collectors.toList());
	}

	if (search != null && !search.isBlank()) {
		String q = search.toLowerCase();
		problems = problems.stream()
				.filter(p -> p.getTitle() != null
						&& p.getTitle().toLowerCase().contains(q))
				.collect(Collectors.toList());
	}

	// Build response with embedded topic info
	List<Map<String, Object>> result = problems.stream()
			.sorted(Comparator
					.comparing((Problem p) -> diffOrder(p.getDifficulty()))
					.thenComparing(p -> p.getDisplayOrder() != null ? p.getDisplayOrder() : 999))
			.map(p -> {
				Map<String, Object> m = new LinkedHashMap<>();
				m.put("id",          p.getId());
				m.put("title",       p.getTitle());
				m.put("difficulty",  p.getDifficulty());
				m.put("pattern",     p.getPattern());
				m.put("displayOrder",p.getDisplayOrder());
				// Embed topic info — now reliably populated because JOIN FETCH loaded topic
				Long tid   = getTopicId(p);
				Topic topic = tid != null ? topicMap.get(tid) : null;
				m.put("topicId",       tid);
				m.put("topicTitle",    topic != null ? topic.getTitle()    : null);
				m.put("topicCategory", topic != null ? topic.getCategory() : null);
				return m;
			})
			.collect(Collectors.toList());

	return ResponseEntity.ok(result);
}

// Helper: safely get topic id — topic is guaranteed loaded by JOIN FETCH
private Long getTopicId(Problem p) {
	try {
		return p.getTopic() != null ? p.getTopic().getId() : null;
	} catch (Exception e) {
		return null;
	}
}

private int diffOrder(Problem.Difficulty d) {
	if (d == null) return 1;
	return switch (d) {
		case EASY   -> 0;
		case MEDIUM -> 1;
		case HARD   -> 2;
	};
}
}