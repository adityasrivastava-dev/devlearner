package com.learnsystem.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.model.Problem;
import com.learnsystem.model.Topic;
import com.learnsystem.repository.ProblemRepository;
import com.learnsystem.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * POST /api/admin/problems/import-json
 *
 * Uploads a JSON array of problems and inserts them into the problems table.
 * Each entry must have a "topicTitle" field to link to an existing topic.
 *
 * Example entry:
 * {
 *   "topicTitle": "Two Pointer",
 *   "title": "Two Sum II",
 *   "difficulty": "EASY",
 *   "pattern": "TWO_POINTER",
 *   "description": "...",
 *   "sampleInput": "...",
 *   "sampleOutput": "...",
 *   "inputFormat": "...",
 *   "outputFormat": "...",
 *   "hint1": "...",
 *   "hint2": "...",
 *   "hint3": "...",
 *   "starterCode": "...",
 *   "solutionCode": "...",
 *   "displayOrder": 1,
 *   "testCases": [{"input":"...","expectedOutput":"..."}]
 * }
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/problems")
@RequiredArgsConstructor
public class ProblemImportController {

private final ProblemRepository problemRepo;
private final TopicRepository   topicRepo;
private final ObjectMapper      mapper;

@PostMapping("/import-json")
public ResponseEntity<Map<String, Object>> importProblems(
		@RequestBody List<Map<String, Object>> problems,
		@RequestParam(defaultValue = "false") boolean clearFirst) {

	if (clearFirst) {
		problemRepo.deleteAll();
		log.info("Cleared all problems before import");
	}

	// Cache topics by title (case-insensitive) to avoid N+1 queries
	Map<String, Topic> topicCache = new HashMap<>();
	topicRepo.findAll().forEach(t ->
			topicCache.put(t.getTitle().toLowerCase().trim(), t));

	int imported = 0, skipped = 0;
	List<String> errors = new ArrayList<>();

	for (Map<String, Object> raw : problems) {
		try {
			String topicTitle = str(raw, "topicTitle");
			if (topicTitle == null || topicTitle.isBlank()) {
				errors.add("Missing topicTitle in: " + str(raw, "title"));
				skipped++;
				continue;
			}

			Topic topic = topicCache.get(topicTitle.toLowerCase().trim());
			if (topic == null) {
				errors.add("Topic not found: '" + topicTitle + "' for problem: " + str(raw, "title"));
				skipped++;
				continue;
			}

			// Skip if already exists (same title + topic)
			String title = str(raw, "title");
			boolean exists = problemRepo
					.findByTopicIdOrderByDisplayOrder(topic.getId())
					.stream()
					.anyMatch(p -> p.getTitle().equalsIgnoreCase(title));
			if (exists) {
				skipped++;
				continue;
			}

			Problem p = new Problem();
			p.setTopic(topic);
			p.setTitle(title);
			p.setDescription(str(raw, "description"));
			p.setInputFormat(str(raw, "inputFormat"));
			p.setOutputFormat(str(raw, "outputFormat"));
			p.setSampleInput(str(raw, "sampleInput"));
			p.setSampleOutput(str(raw, "sampleOutput"));
			p.setHint(str(raw, "hint"));
			p.setHint1(str(raw, "hint1"));
			p.setHint2(str(raw, "hint2"));
			p.setHint3(str(raw, "hint3"));
			p.setPattern(str(raw, "pattern"));
			p.setStarterCode(str(raw, "starterCode"));
			p.setSolutionCode(str(raw, "solutionCode"));
			p.setDisplayOrder(raw.containsKey("displayOrder")
					? ((Number) raw.get("displayOrder")).intValue() : null);

			// Difficulty
			try {
				String diff = str(raw, "difficulty");
				p.setDifficulty(diff != null
						? Problem.Difficulty.valueOf(diff.toUpperCase())
						: Problem.Difficulty.MEDIUM);
			} catch (Exception e) {
				p.setDifficulty(Problem.Difficulty.MEDIUM);
			}

			// testCases — store as JSON string
			Object tc = raw.get("testCases");
			if (tc != null) {
				p.setTestCases(mapper.writeValueAsString(tc));
			}

			problemRepo.save(p);
			imported++;

		} catch (Exception e) {
			errors.add("Error on '" + str(raw, "title") + "': " + e.getMessage());
			skipped++;
		}
	}

	Map<String, Object> result = new LinkedHashMap<>();
	result.put("imported", imported);
	result.put("skipped",  skipped);
	result.put("total",    problems.size());
	result.put("errors",   errors);
	result.put("message",  String.format("Imported %d problems, skipped %d", imported, skipped));

	log.info("Problem import: {} imported, {} skipped from {} total", imported, skipped, problems.size());
	return ResponseEntity.ok(result);
}

private String str(Map<String, Object> m, String key) {
	Object v = m.get(key);
	return v == null ? null : v.toString();
}
}