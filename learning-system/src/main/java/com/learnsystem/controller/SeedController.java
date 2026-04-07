package com.learnsystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.dto.SeedBatchRequest;
import com.learnsystem.dto.SeedBatchResponse;
import com.learnsystem.model.SeedLog;
import com.learnsystem.repository.SeedLogRepository;
import com.learnsystem.service.SeedBatchService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class SeedController {

    private final SeedBatchService          seedBatchService;
    private final SeedLogRepository         seedLogRepository;
    private final ResourcePatternResolver   resourcePatternResolver;
    private final ObjectMapper              objectMapper;

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

            // Upsert seed_log so the file shows as IMPORTED in the UI
            seedLogRepository.save(new SeedLog(
                    batchName, LocalDateTime.now(),
                    res.getTopicsSeeded(), res.getExamplesSeeded(), res.getProblemsSeeded()));

            return ResponseEntity.ok(res);
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