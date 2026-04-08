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
        Arrays.sort(resources, Comparator.comparing(r -> r.getFilename() != null ? r.getFilename() : ""));

        for (Resource resource : resources) {
            String filename = resource.getFilename();
            SeedFileInfo info = new SeedFileInfo();
            info.setFilename(filename);
            try {
                SeedBatchRequest req = objectMapper.readValue(resource.getInputStream(), SeedBatchRequest.class);
                String batchName = req.getBatchName() != null ? req.getBatchName() : filename;
                info.setBatchName(batchName);
                info.setTopicCount(req.getTopics() != null ? req.getTopics().size() : 0);

                seedLogRepository.findById(batchName).ifPresentOrElse(log -> {
                    info.setStatus("IMPORTED");
                    info.setAppliedAt(log.getAppliedAt());
                    info.setTopicsSeeded(log.getTopicsSeeded());
                    info.setExamplesSeeded(log.getExamplesSeeded());
                    info.setProblemsSeeded(log.getProblemsSeeded());
                }, () -> info.setStatus("PENDING"));

            } catch (Exception e) {
                info.setBatchName(filename);
                info.setStatus("ERROR");
                info.setErrorMessage(e.getMessage());
            }
            result.add(info);
        }
    } catch (Exception ignored) {}
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
 * Returns all topics from a seed file — title, category, and all content fields.
 * Used by the Topic Editor "Load from seed" feature to auto-fill the form.
 * Does NOT import anything — purely a read operation.
 */
@GetMapping("/seed-files/{filename}/topics")
public ResponseEntity<?> getTopicsFromFile(@PathVariable String filename) {
    if (!filename.endsWith(".json") || filename.contains("/") || filename.contains("..")) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid filename"));
    }
    try {
        Resource[] resources = resourcePatternResolver.getResources("classpath:seeds/" + filename);
        if (resources.length == 0) return ResponseEntity.notFound().build();

        SeedBatchRequest req = objectMapper.readValue(
                resources[0].getInputStream(), SeedBatchRequest.class);

        if (req.getTopics() == null) return ResponseEntity.ok(List.of());

        // Return lightweight topic list — title + category + all text fields
        // (no examples/problems — those are too big and not needed for the editor)
        List<Map<String, Object>> result = req.getTopics().stream().map(t -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("title",             t.getTitle());
            m.put("category",          t.getCategory());
            m.put("description",       t.getDescription());
            m.put("timeComplexity",    t.getTimeComplexity());
            m.put("spaceComplexity",   t.getSpaceComplexity());
            m.put("bruteForce",        t.getBruteForce());
            m.put("optimizedApproach", t.getOptimizedApproach());
            m.put("whenToUse",         t.getWhenToUse());
            m.put("story",             t.getStory());
            m.put("analogy",           t.getAnalogy());
            m.put("memoryAnchor",      t.getMemoryAnchor());
            m.put("firstPrinciples",   t.getFirstPrinciples());
            m.put("starterCode",       t.getStarterCode());
            m.put("exampleCount",      t.getExamples()  != null ? t.getExamples().size()  : 0);
            m.put("problemCount",      t.getProblems()  != null ? t.getProblems().size()  : 0);
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    } catch (Exception e) {
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