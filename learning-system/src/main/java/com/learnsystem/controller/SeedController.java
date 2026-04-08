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

        for (Resource resource : resources) {
            String filename = resource.getFilename();
            SeedFileInfo info = new SeedFileInfo();
            info.setFilename(filename);
            try {
                // ── Lightweight parse: read ONLY batchName + topics array length ──
                // Do NOT deserialize SeedBatchRequest — it pulls in all examples,
                // problems, tracer steps etc. causing massive heap allocation × 22 files.
                com.fasterxml.jackson.databind.JsonNode root =
                        objectMapper.readTree(resource.getInputStream());

                String batchName = root.path("batchName").asText(filename);
                info.setBatchName(batchName);

                com.fasterxml.jackson.databind.JsonNode topics = root.path("topics");
                info.setTopicCount(topics.isArray() ? topics.size() : 0);

                seedLogRepository.findById(batchName).ifPresentOrElse(seedLog -> {
                    info.setStatus("IMPORTED");
                    info.setAppliedAt(seedLog.getAppliedAt());
                    info.setTopicsSeeded(seedLog.getTopicsSeeded());
                    info.setExamplesSeeded(seedLog.getExamplesSeeded());
                    info.setProblemsSeeded(seedLog.getProblemsSeeded());
                }, () -> info.setStatus("PENDING"));

            } catch (Exception e) {
                log.warn("Could not parse seed file {}: {}", filename, e.getMessage());
                info.setBatchName(filename);
                info.setStatus("ERROR");
                info.setErrorMessage(e.getMessage());
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
    if (!filename.endsWith(".json") || filename.contains("/") || filename.contains("..")) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid filename"));
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
    if (!filename.endsWith(".json") || filename.contains("/") || filename.contains("..")) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid filename"));
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
 *
 * Returns topic metadata from a seed file without full deserialization.
 * Used by the Topic Editor "Load from seed" feature to auto-fill the form.
 */
@GetMapping("/seed-files/{filename}/topics")
public ResponseEntity<?> getTopicsFromFile(@PathVariable String filename) {
    if (!filename.endsWith(".json") || filename.contains("/") || filename.contains("..")) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid filename"));
    }
    try {
        Resource[] resources = resourcePatternResolver.getResources("classpath:seeds/" + filename);
        if (resources.length == 0) return ResponseEntity.notFound().build();

        // Use JsonNode to avoid full deserialization of examples/problems
        com.fasterxml.jackson.databind.JsonNode root =
                objectMapper.readTree(resources[0].getInputStream());

        com.fasterxml.jackson.databind.JsonNode topics = root.path("topics");
        if (!topics.isArray()) return ResponseEntity.ok(List.of());

        List<Map<String, Object>> result = new ArrayList<>();
        for (com.fasterxml.jackson.databind.JsonNode t : topics) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("title",             t.path("title").asText(""));
            m.put("category",          t.path("category").asText(""));
            m.put("description",       t.path("description").asText(""));
            m.put("timeComplexity",    t.path("timeComplexity").asText(""));
            m.put("spaceComplexity",   t.path("spaceComplexity").asText(""));
            m.put("bruteForce",        t.path("bruteForce").asText(""));
            m.put("optimizedApproach", t.path("optimizedApproach").asText(""));
            m.put("whenToUse",         t.path("whenToUse").asText(""));
            m.put("story",             t.path("story").asText(""));
            m.put("analogy",           t.path("analogy").asText(""));
            m.put("memoryAnchor",      t.path("memoryAnchor").asText(""));
            m.put("firstPrinciples",   t.path("firstPrinciples").asText(""));
            m.put("starterCode",       t.path("starterCode").asText(""));
            m.put("exampleCount",      t.path("examples").isArray()  ? t.path("examples").size()  : 0);
            m.put("problemCount",      t.path("problems").isArray()  ? t.path("problems").size()  : 0);
            result.add(m);
        }

        return ResponseEntity.ok(result);
    } catch (Exception e) {
        log.error("Failed to read topics from {}: {}", filename, e.getMessage());
        return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
    }
}

/** Response shape for GET /api/admin/seed-files */
@Data
public static class SeedFileInfo {
    private String        filename;
    private String        batchName;
    private int           topicCount;
    private String        status;        // IMPORTED | PENDING | ERROR
    private LocalDateTime appliedAt;
    private int           topicsSeeded;
    private int           examplesSeeded;
    private int           problemsSeeded;
    private String        errorMessage;
}
}