package com.learnsystem.controller;

import com.learnsystem.dto.SeedBatchRequest;
import com.learnsystem.dto.SeedBatchResponse;
import com.learnsystem.service.SeedBatchService;
import com.learnsystem.service.TopicGeneratorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class TopicGeneratorController {

private final TopicGeneratorService generatorService;
private final SeedBatchService      seedBatchService;

/**
 * POST /api/admin/generate-topic
 * Body: { "title": "Binary Trees", "category": "DSA" }
 * Returns: preview of generated topic (not saved yet)
 */
@PostMapping("/generate-topic")
public ResponseEntity<SeedBatchRequest> preview(@RequestBody Map<String,String> body) {
	String title    = body.getOrDefault("title", "").trim();
	String category = body.getOrDefault("category", "DSA").trim();
	if (title.isEmpty()) {
		return ResponseEntity.badRequest().build();
	}
	SeedBatchRequest generated = generatorService.generate(title, category);
	return ResponseEntity.ok(generated);
}

/**
 * POST /api/admin/generate-and-save
 * Generates + immediately imports into the database
 */
@PostMapping("/generate-and-save")
public ResponseEntity<SeedBatchResponse> generateAndSave(@RequestBody Map<String,String> body) {
	String title    = body.getOrDefault("title", "").trim();
	String category = body.getOrDefault("category", "DSA").trim();
	if (title.isEmpty()) {
		return ResponseEntity.badRequest().build();
	}
	SeedBatchRequest batch = generatorService.generate(title, category);
	SeedBatchResponse result = seedBatchService.seed(batch);
	return ResponseEntity.ok(result);
}
}