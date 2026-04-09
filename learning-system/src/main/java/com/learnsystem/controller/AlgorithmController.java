package com.learnsystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.dto.AlgorithmSeedRequest;
import com.learnsystem.model.Algorithm;
import com.learnsystem.repository.AlgorithmRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Algorithm API
 *
 * Public endpoints:
 *   GET  /api/algorithms              — all algorithms (ordered by displayOrder, name)
 *   GET  /api/algorithms?category=X  — filter by category
 *   GET  /api/algorithms/{slug}       — single algorithm by slug
 *   GET  /api/algorithms/categories   — distinct category list
 *
 * Admin endpoints (ROLE_ADMIN):
 *   POST   /api/algorithms/admin/seed-batch     — bulk import from JSON body
 *   POST   /api/algorithms/admin/seed-file/{f}  — import from classpath:algorithm-seeds/
 *   GET    /api/algorithms/admin/seed-files     — list available seed files
 *   POST   /api/algorithms/admin               — create single algorithm
 *   PUT    /api/algorithms/admin/{id}           — update single algorithm
 *   DELETE /api/algorithms/admin/{id}           — delete single algorithm
 *   DELETE /api/algorithms/admin/all            — wipe all algorithms
 */
@RestController
@RequestMapping("/api/algorithms")
@RequiredArgsConstructor
@Slf4j
public class AlgorithmController {

private final AlgorithmRepository       algorithmRepo;
private final ObjectMapper              objectMapper;
private final ResourcePatternResolver   resourcePatternResolver;

// ─────────────────────────────────────────────────────────────────────────
// PUBLIC — read-only
// ─────────────────────────────────────────────────────────────────────────

@GetMapping
public ResponseEntity<List<Algorithm>> getAll(
		@RequestParam(required = false) String category) {

	List<Algorithm> result = category != null && !category.isBlank()
			? algorithmRepo.findByCategoryOrderByDisplayOrderAscNameAsc(category)
			: algorithmRepo.findAllByOrderByDisplayOrderAscNameAsc();
	return ResponseEntity.ok(result);
}

@GetMapping("/categories")
public ResponseEntity<List<String>> getCategories() {
	List<Algorithm> all = algorithmRepo.findAllByOrderByDisplayOrderAscNameAsc();
	List<String> cats = all.stream()
			.map(Algorithm::getCategory)
			.distinct()
			.sorted()
			.toList();
	return ResponseEntity.ok(cats);
}

@GetMapping("/{slug}")
public ResponseEntity<Algorithm> getBySlug(@PathVariable String slug) {
	return algorithmRepo.findBySlug(slug)
			.map(ResponseEntity::ok)
			.orElse(ResponseEntity.notFound().build());
}

// ─────────────────────────────────────────────────────────────────────────
// ADMIN — seed batch (JSON body)
// ─────────────────────────────────────────────────────────────────────────

@PostMapping("/admin/seed-batch")
@PreAuthorize("hasRole('ADMIN')")
@Transactional
public ResponseEntity<Map<String, Object>> seedBatch(
		@RequestBody AlgorithmSeedRequest req) {

	int created = 0, skipped = 0, updated = 0;
	List<String> errors = new ArrayList<>();

	for (AlgorithmSeedRequest.AlgorithmDto dto : req.getAlgorithms()) {
		try {
			Optional<Algorithm> existing = algorithmRepo.findBySlug(dto.getSlug());

			if (req.isSkipExisting() && existing.isPresent()) {
				skipped++;
				continue;
			}

			Algorithm algo = existing.orElse(new Algorithm());
			mapDto(dto, algo);
			algorithmRepo.save(algo);

			if (existing.isPresent()) updated++;
			else created++;

		} catch (Exception e) {
			log.error("Failed to seed algorithm '{}': {}", dto.getSlug(), e.getMessage());
			errors.add(dto.getSlug() + ": " + e.getMessage());
		}
	}

	log.info("[AlgorithmSeed] batch='{}' created={} updated={} skipped={} errors={}",
			req.getBatchName(), created, updated, skipped, errors.size());

	Map<String, Object> resp = new LinkedHashMap<>();
	resp.put("batchName", req.getBatchName());
	resp.put("created",  created);
	resp.put("updated",  updated);
	resp.put("skipped",  skipped);
	resp.put("errors",   errors);
	return ResponseEntity.ok(resp);
}

// ─────────────────────────────────────────────────────────────────────────
// ADMIN — list seed files from classpath
// ─────────────────────────────────────────────────────────────────────────

@GetMapping("/admin/seed-files")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<List<SeedFileInfo>> listSeedFiles() {
	List<SeedFileInfo> result = new ArrayList<>();
	try {
		Resource[] resources = resourcePatternResolver
				.getResources("classpath:algorithm-seeds/*.json");
		Arrays.sort(resources,
				Comparator.comparing(r -> r.getFilename() != null ? r.getFilename() : ""));

		Set<String> slugs = new HashSet<>();
		algorithmRepo.findAll().forEach(a -> slugs.add(a.getSlug()));

		for (Resource r : resources) {
			SeedFileInfo info = new SeedFileInfo();
			info.setFilename(r.getFilename());
			result.add(info);
		}
	} catch (Exception e) {
		log.error("Failed to list algorithm seed files: {}", e.getMessage());
	}
	return ResponseEntity.ok(result);
}

/** Import a specific seed file from classpath:algorithm-seeds/ */
@PostMapping("/admin/seed-file/{filename}")
@PreAuthorize("hasRole('ADMIN')")
@Transactional
public ResponseEntity<Map<String, Object>> importSeedFile(
		@PathVariable String filename) {
	try {
		Resource resource = resourcePatternResolver
				.getResource("classpath:algorithm-seeds/" + filename);
		if (!resource.exists()) {
			return ResponseEntity.notFound().build();
		}
		AlgorithmSeedRequest req = objectMapper.readValue(
				resource.getInputStream(), AlgorithmSeedRequest.class);
		return seedBatch(req);
	} catch (Exception e) {
		log.error("Failed to import algorithm seed file '{}': {}", filename, e.getMessage());
		return ResponseEntity.internalServerError()
				.body(Map.of("error", e.getMessage()));
	}
}

// ─────────────────────────────────────────────────────────────────────────
// ADMIN — single CRUD
// ─────────────────────────────────────────────────────────────────────────

@PostMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@Transactional
public ResponseEntity<Algorithm> create(@RequestBody AlgorithmSeedRequest.AlgorithmDto dto) {
	if (algorithmRepo.existsBySlug(dto.getSlug())) {
		return ResponseEntity.badRequest().build();
	}
	Algorithm algo = new Algorithm();
	mapDto(dto, algo);
	return ResponseEntity.ok(algorithmRepo.save(algo));
}

@PutMapping("/admin/{id}")
@PreAuthorize("hasRole('ADMIN')")
@Transactional
public ResponseEntity<Algorithm> update(
		@PathVariable Long id,
		@RequestBody AlgorithmSeedRequest.AlgorithmDto dto) {
	return algorithmRepo.findById(id).map(algo -> {
		mapDto(dto, algo);
		return ResponseEntity.ok(algorithmRepo.save(algo));
	}).orElse(ResponseEntity.notFound().build());
}

@DeleteMapping("/admin/{id}")
@PreAuthorize("hasRole('ADMIN')")
@Transactional
public ResponseEntity<Void> delete(@PathVariable Long id) {
	if (!algorithmRepo.existsById(id)) return ResponseEntity.notFound().build();
	algorithmRepo.deleteById(id);
	return ResponseEntity.noContent().build();
}

@DeleteMapping("/admin/all")
@PreAuthorize("hasRole('ADMIN')")
@Transactional
public ResponseEntity<Map<String, Object>> deleteAll() {
	long count = algorithmRepo.count();
	algorithmRepo.deleteAllAlgorithms();
	log.info("[Admin] Deleted all {} algorithms", count);
	return ResponseEntity.ok(Map.of("deleted", count));
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

private void mapDto(AlgorithmSeedRequest.AlgorithmDto dto, Algorithm algo) {
	algo.setSlug(dto.getSlug());
	algo.setName(dto.getName());
	algo.setCategory(dto.getCategory());
	algo.setEmoji(dto.getEmoji());
	algo.setStability(dto.getStability() != null ? dto.getStability() : "N/A");
	algo.setTags(dto.getTags());
	algo.setTimeComplexityBest(dto.getTimeComplexityBest());
	algo.setTimeComplexityAverage(dto.getTimeComplexityAverage());
	algo.setTimeComplexityWorst(dto.getTimeComplexityWorst());
	algo.setSpaceComplexity(dto.getSpaceComplexity());
	algo.setAnalogy(dto.getAnalogy());
	algo.setStory(dto.getStory());
	algo.setWhenToUse(dto.getWhenToUse());
	algo.setHowItWorks(dto.getHowItWorks());
	algo.setJavaCode(dto.getJavaCode());
	algo.setInterviewTips(dto.getInterviewTips());
	algo.setUseCases(dto.getUseCases());
	algo.setPitfalls(dto.getPitfalls());
	algo.setVariants(dto.getVariants());
	algo.setDisplayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 999);

	try {
		algo.setDifficulty(Algorithm.Difficulty.valueOf(
				dto.getDifficulty().toUpperCase()));
	} catch (Exception e) {
		algo.setDifficulty(Algorithm.Difficulty.INTERMEDIATE);
	}
}

@Data
public static class SeedFileInfo {
	private String filename;
}
}