package com.learnsystem.controller;

import com.learnsystem.dto.CreateRoadmapRequest;
import com.learnsystem.dto.RoadmapDto;
import com.learnsystem.service.RoadmapService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roadmaps")
@RequiredArgsConstructor
public class RoadmapController {

private final RoadmapService roadmapService;

@GetMapping
public ResponseEntity<List<RoadmapDto>> getAll() {
	return ResponseEntity.ok(roadmapService.getAllRoadmaps());
}

@GetMapping("/{id}")
public ResponseEntity<RoadmapDto> getOne(@PathVariable Long id) {
	return ResponseEntity.ok(roadmapService.getRoadmap(id));
}

@PostMapping
public ResponseEntity<RoadmapDto> create(@Valid @RequestBody CreateRoadmapRequest req) {
	return ResponseEntity.status(HttpStatus.CREATED)
			.body(roadmapService.createRoadmap(req));
}

@PutMapping("/{id}")
public ResponseEntity<RoadmapDto> update(@PathVariable Long id,
                                         @RequestBody CreateRoadmapRequest req) {
	return ResponseEntity.ok(roadmapService.updateRoadmap(id, req));
}

@DeleteMapping("/{id}")
public ResponseEntity<Void> delete(@PathVariable Long id) {
	roadmapService.deleteRoadmap(id);
	return ResponseEntity.noContent().build();
}

@PostMapping("/{id}/topics/{topicId}")
public ResponseEntity<RoadmapDto> addTopic(
		@PathVariable Long id,
		@PathVariable Long topicId,
		@RequestBody(required = false) Map<String, Object> body) {
	int order = body != null && body.containsKey("orderIndex")
			? (int) body.get("orderIndex") : 999;
	String note = body != null ? (String) body.get("note") : null;
	return ResponseEntity.ok(roadmapService.addTopicToRoadmap(id, topicId, order, note));
}

@DeleteMapping("/{id}/topics/{topicId}")
public ResponseEntity<RoadmapDto> removeTopic(
		@PathVariable Long id, @PathVariable Long topicId) {
	return ResponseEntity.ok(roadmapService.removeTopicFromRoadmap(id, topicId));
}

@PutMapping("/{id}/reorder")
public ResponseEntity<RoadmapDto> reorder(
		@PathVariable Long id, @RequestBody List<Long> orderedTopicIds) {
	return ResponseEntity.ok(roadmapService.reorderTopics(id, orderedTopicIds));
}
}