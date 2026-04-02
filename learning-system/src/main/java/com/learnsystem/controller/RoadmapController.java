package com.learnsystem.controller;

import com.learnsystem.dto.CreateRoadmapRequest;
import com.learnsystem.dto.RoadmapDto;
import com.learnsystem.model.User;
import com.learnsystem.service.RoadmapService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Roadmap CRUD — all write operations are scoped to the authenticated user.
 * GET endpoints still return 200 for any logged-in user (each user sees only
 * their own roadmaps — scoping is applied in RoadmapService).
 */
@RestController
@RequestMapping("/api/roadmaps")
@RequiredArgsConstructor
public class RoadmapController {

private final RoadmapService roadmapService;

// GET /api/roadmaps — returns only THIS user's roadmaps
@GetMapping
public ResponseEntity<List<RoadmapDto>> getAll(
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.ok(List.of());
	return ResponseEntity.ok(roadmapService.getAllRoadmaps(user.getId()));
}

// GET /api/roadmaps/{id}
@GetMapping("/{id}")
public ResponseEntity<RoadmapDto> getOne(
		@PathVariable Long id,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	return ResponseEntity.ok(roadmapService.getRoadmap(id, user.getId()));
}

// POST /api/roadmaps — create
@PostMapping
public ResponseEntity<RoadmapDto> create(
		@Valid @RequestBody CreateRoadmapRequest req,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	return ResponseEntity.status(HttpStatus.CREATED)
			.body(roadmapService.createRoadmap(req, user.getId()));
}

// PUT /api/roadmaps/{id} — update (owner only)
@PutMapping("/{id}")
public ResponseEntity<RoadmapDto> update(
		@PathVariable Long id,
		@RequestBody CreateRoadmapRequest req,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	return ResponseEntity.ok(roadmapService.updateRoadmap(id, req, user.getId()));
}

// DELETE /api/roadmaps/{id} — delete (owner only)
@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(
		@PathVariable Long id,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	roadmapService.deleteRoadmap(id, user.getId());
	return ResponseEntity.noContent().build();
}

// POST /api/roadmaps/{id}/topics/{topicId} — add topic (owner only)
@PostMapping("/{id}/topics/{topicId}")
public ResponseEntity<RoadmapDto> addTopic(
		@PathVariable Long id,
		@PathVariable Long topicId,
		@RequestBody(required = false) Map<String, Object> body,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	int order = body != null && body.containsKey("orderIndex")
			? (int) body.get("orderIndex") : 999;
	String note = body != null ? (String) body.get("note") : null;
	return ResponseEntity.ok(
			roadmapService.addTopicToRoadmap(id, topicId, order, note, user.getId()));
}

// DELETE /api/roadmaps/{id}/topics/{topicId} — remove topic (owner only)
@DeleteMapping("/{id}/topics/{topicId}")
public ResponseEntity<RoadmapDto> removeTopic(
		@PathVariable Long id,
		@PathVariable Long topicId,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	return ResponseEntity.ok(
			roadmapService.removeTopicFromRoadmap(id, topicId, user.getId()));
}

// PUT /api/roadmaps/{id}/reorder — reorder topics (owner only)
@PutMapping("/{id}/reorder")
public ResponseEntity<RoadmapDto> reorder(
		@PathVariable Long id,
		@RequestBody List<Long> orderedTopicIds,
		@AuthenticationPrincipal User user) {
	if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	return ResponseEntity.ok(
			roadmapService.reorderTopics(id, orderedTopicIds, user.getId()));
}
}