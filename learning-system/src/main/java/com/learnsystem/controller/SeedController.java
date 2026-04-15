package com.learnsystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.dto.SeedBatchRequest;
import com.learnsystem.dto.SeedBatchResponse;
import com.learnsystem.model.Problem;
import com.learnsystem.model.SeedLog;
import com.learnsystem.model.Topic;
import com.learnsystem.repository.ProblemRepository;
import com.learnsystem.repository.SeedLogRepository;
import com.learnsystem.repository.TopicRepository;
import com.learnsystem.service.SeedBatchService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class SeedController {

private final SeedBatchService          seedBatchService;
private final SeedLogRepository         seedLogRepository;
private final ResourcePatternResolver   resourcePatternResolver;
private final ObjectMapper              objectMapper;
private final TopicRepository           topicRepository;
private final ProblemRepository         problemRepository;

/** POST /api/admin/seed-batch — import raw JSON body */
@PostMapping("/seed-batch")
public ResponseEntity<SeedBatchResponse> seedBatch(@RequestBody SeedBatchRequest req) {
    return ResponseEntity.ok(seedBatchService.seed(req));
}

/** DELETE /api/admin/seed-batch/clear — wipe all topics/examples/problems */
@DeleteMapping("/seed-batch/clear")
public ResponseEntity<Map<String, String>> clearAll() {
    seedBatchService.clearAll();
    return ResponseEntity.ok(Map.of("message", "All topics cleared successfully."));
}

/**
 * GET /api/admin/seed-files
 * Lists every *.json file in classpath:seeds/ with its import status.
 */
@GetMapping("/seed-files")
public ResponseEntity<List<SeedFileInfo>> listSeedFiles() {
    List<SeedFileInfo> result = new ArrayList<>();
    try {
        Resource[] resources = resourcePatternResolver.getResources("classpath:seeds/*.json");
        log.info("Seed files found: {}", resources.length);
        Arrays.sort(resources, Comparator.comparing(r -> r.getFilename() != null ? r.getFilename() : ""));

        // Load all seed_log rows in ONE query — no per-file DB hits, no file parsing
        Map<String, com.learnsystem.model.SeedLog> logsByName = new java.util.HashMap<>();
        seedLogRepository.findAll().forEach(sl -> logsByName.put(sl.getBatchName(), sl));

        for (Resource resource : resources) {
            String filename = resource.getFilename();
            SeedFileInfo info = new SeedFileInfo();
            info.setFilename(filename);

            // Derive batchName from filename (strip .json) — matches how importSeedFile stores it
            String nameKey = (filename != null) ? filename.replace(".json", "") : "";
            info.setBatchName(nameKey);

            // Check seed_log — try both the stripped name and the full filename
            com.learnsystem.model.SeedLog sl = logsByName.get(nameKey);
            if (sl == null) sl = logsByName.get(filename);

            if (sl != null) {
                info.setStatus("IMPORTED");
                info.setAppliedAt(sl.getAppliedAt() != null ? sl.getAppliedAt().toString() : null);
                info.setTopicsSeeded(sl.getTopicsSeeded());
                info.setExamplesSeeded(sl.getExamplesSeeded());
                info.setProblemsSeeded(sl.getProblemsSeeded());
            } else {
                info.setStatus("PENDING");
            }
            result.add(info);
        }
    } catch (Exception e) {
        log.error("Failed to list seed files: {}", e.getMessage(), e);
    }
    return ResponseEntity.ok(result);
}

/**
 * POST /api/admin/seed-files/{filename}
 * Loads a specific *.json from classpath:seeds/ and imports it into the DB.
 * Records the result in seed_log (upsert).
 */
@PostMapping("/seed-files/{filename}")
public ResponseEntity<?> importSeedFile(@PathVariable String filename) {
    if (filename == null || !filename.matches("^[a-zA-Z0-9_-]+\\.json$")) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid filename. Must match pattern: name.json"));
    }
    try {
        Resource[] resources = resourcePatternResolver.getResources("classpath:seeds/" + filename);
        if (resources.length == 0) return ResponseEntity.notFound().build();

        SeedBatchRequest req = objectMapper.readValue(resources[0].getInputStream(), SeedBatchRequest.class);
        String batchName = req.getBatchName() != null ? req.getBatchName() : filename;

        SeedBatchResponse res = seedBatchService.seed(req);

        seedLogRepository.save(new SeedLog(
                batchName, LocalDateTime.now(),
                res.getTopicsSeeded(), res.getExamplesSeeded(), res.getProblemsSeeded()));

        return ResponseEntity.ok(res);
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
}

/**
 * POST /api/admin/seed-files/{filename}/patch-editorial
 *
 * Reads the seed JSON and updates ONLY the 'editorial' field on existing
 * Problem rows — matched by topic title + displayOrder.
 *
 * Safe to call on already-imported batches: never creates duplicates,
 * never touches any other column.
 *
 * Response:
 *   { "updated": 20, "notFound": [], "filename": "B01-jvm-architecture.json" }
 */
@PostMapping("/seed-files/{filename}/patch-editorial")
public ResponseEntity<?> patchEditorial(@PathVariable String filename) {
    if (filename == null || !filename.matches("^[a-zA-Z0-9_-]+\\.json$")) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid filename. Must match pattern: name.json"));
    }
    try {
        Resource[] resources = resourcePatternResolver.getResources("classpath:seeds/" + filename);
        if (resources.length == 0) return ResponseEntity.notFound().build();

        SeedBatchRequest req = objectMapper.readValue(
                resources[0].getInputStream(), SeedBatchRequest.class);

        int updated = 0;
        List<String> notFound = new ArrayList<>();

        for (SeedBatchRequest.TopicSeedDto topicDto : req.getTopics()) {
            // Find the topic by title
            Optional<Topic> topicOpt = topicRepository.findByTitle(topicDto.getTitle());
            if (topicOpt.isEmpty()) {
                notFound.add("Topic not found: " + topicDto.getTitle());
                continue;
            }
            Topic topic = topicOpt.get();

            // Load all problems for this topic once
            List<Problem> problems = problemRepository
                    .findByTopicIdOrderByDisplayOrder(topic.getId());

            // Build lookup: displayOrder → Problem
            Map<Integer, Problem> byOrder = new HashMap<>();
            for (Problem p : problems) byOrder.put(p.getDisplayOrder(), p);

            // Update editorial on each problem in the JSON
            if (topicDto.getProblems() == null) continue;
            for (SeedBatchRequest.ProblemSeedDto dto : topicDto.getProblems()) {
                String editorial = dto.getEditorial();
                if (editorial == null || editorial.isBlank()) continue;

                Problem problem = byOrder.get(dto.getDisplayOrder());
                if (problem == null) {
                    notFound.add(topicDto.getTitle() + " P" + dto.getDisplayOrder()
                            + " '" + dto.getTitle() + "' — problem row not found");
                    continue;
                }

                problem.setEditorial(editorial);
                problemRepository.save(problem);
                updated++;
            }
        }

        log.info("patch-editorial [{}]: {} updated, {} not found", filename, updated, notFound.size());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("filename", filename);
        response.put("updated", updated);
        response.put("notFound", notFound);
        return ResponseEntity.ok(response);

    } catch (Exception e) {
        log.error("patch-editorial failed for {}: {}", filename, e.getMessage(), e);
        return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
}

/**
 * GET /api/admin/seed-files/{filename}/topics
 * Returns topic metadata using a streaming parser — skips examples/problems arrays entirely.
 */
@GetMapping("/seed-files/{filename}/topics")
public ResponseEntity<?> getTopicsFromFile(@PathVariable String filename) {
    if (filename == null || !filename.matches("^[a-zA-Z0-9_-]+\\.json$")) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid filename. Must match pattern: name.json"));
    }
    try {
        Resource[] resources = resourcePatternResolver.getResources("classpath:seeds/" + filename);
        if (resources.length == 0) return ResponseEntity.notFound().build();

        List<Map<String, Object>> result = new ArrayList<>();

        com.fasterxml.jackson.core.JsonParser parser =
                objectMapper.getFactory().createParser(resources[0].getInputStream());

        // Navigate to "topics" array
        while (parser.nextToken() != null) {
            if (parser.currentToken() == com.fasterxml.jackson.core.JsonToken.FIELD_NAME
                    && "topics".equals(parser.currentName())) {
                parser.nextToken(); // START_ARRAY
                if (parser.currentToken() != com.fasterxml.jackson.core.JsonToken.START_ARRAY) break;

                // Iterate each topic object
                while (parser.nextToken() != com.fasterxml.jackson.core.JsonToken.END_ARRAY) {
                    if (parser.currentToken() != com.fasterxml.jackson.core.JsonToken.START_OBJECT) continue;

                    Map<String, Object> topic = new LinkedHashMap<>();
                    int exampleCount = 0, problemCount = 0;

                    // Read fields of this topic object
                    while (parser.nextToken() != com.fasterxml.jackson.core.JsonToken.END_OBJECT) {
                        if (parser.currentToken() != com.fasterxml.jackson.core.JsonToken.FIELD_NAME) continue;
                        String field = parser.currentName();
                        parser.nextToken(); // move to value

                        switch (field) {
                            case "title", "category", "description",
                                    "timeComplexity", "spaceComplexity",
                                    "bruteForce", "optimizedApproach", "whenToUse",
                                    "story", "analogy", "memoryAnchor",
                                    "firstPrinciples", "starterCode" ->
                                    topic.put(field, parser.getText());
                            case "examples" -> {
                                if (parser.currentToken() == com.fasterxml.jackson.core.JsonToken.START_ARRAY) {
                                    while (parser.nextToken() != com.fasterxml.jackson.core.JsonToken.END_ARRAY) {
                                        if (parser.currentToken() == com.fasterxml.jackson.core.JsonToken.START_OBJECT) {
                                            exampleCount++;
                                            parser.skipChildren();
                                        }
                                    }
                                }
                            }
                            case "problems" -> {
                                if (parser.currentToken() == com.fasterxml.jackson.core.JsonToken.START_ARRAY) {
                                    while (parser.nextToken() != com.fasterxml.jackson.core.JsonToken.END_ARRAY) {
                                        if (parser.currentToken() == com.fasterxml.jackson.core.JsonToken.START_OBJECT) {
                                            problemCount++;
                                            parser.skipChildren();
                                        }
                                    }
                                }
                            }
                            default -> parser.skipChildren(); // skip unknown fields
                        }
                    }
                    topic.put("exampleCount", exampleCount);
                    topic.put("problemCount", problemCount);
                    result.add(topic);
                }
                break; // done with topics array
            }
        }
        parser.close();

        return ResponseEntity.ok(result);
    } catch (Exception e) {
        log.error("Failed to read topics from {}: {}", filename, e.getMessage());
        return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
}

/** Response shape for GET /api/admin/seed-files */
@Data
public static class SeedFileInfo {
    private String filename;
    private String batchName;
    private int    topicCount;
    private String status;        // IMPORTED | PENDING | ERROR
    private String appliedAt;     // ISO string — avoids LocalDateTime serialization issues
    private int    topicsSeeded;
    private int    examplesSeeded;
    private int    problemsSeeded;
    private String errorMessage;
}
}