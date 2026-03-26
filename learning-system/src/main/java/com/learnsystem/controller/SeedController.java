package com.learnsystem.controller;

import com.learnsystem.dto.SeedBatchRequest;
import com.learnsystem.dto.SeedBatchResponse;
import com.learnsystem.service.SeedBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class SeedController {

    private final SeedBatchService seedBatchService;

    /**
     * POST /api/admin/seed-batch
     * Body: SeedBatchRequest JSON (array of topics with examples + problems)
     *
     * curl -X POST http://localhost:8080/api/admin/seed-batch \
     *      -H "Content-Type: application/json" \
     *      -d @batch1_java.json
     */
    @PostMapping("/seed-batch")
    public ResponseEntity<SeedBatchResponse> seedBatch(@RequestBody SeedBatchRequest req) {
        SeedBatchResponse res = seedBatchService.seed(req);
        return ResponseEntity.ok(res);
    }

    /**
     * DELETE /api/admin/seed-batch/clear
     * Removes ALL topics, examples, and problems from the database.
     * Use before re-seeding from scratch.
     */
    @DeleteMapping("/seed-batch/clear")
    public ResponseEntity<Map<String, String>> clearAll() {
        seedBatchService.clearAll();
        return ResponseEntity.ok(Map.of("message", "All topics cleared successfully."));
    }
}