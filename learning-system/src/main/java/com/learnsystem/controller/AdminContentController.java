package com.learnsystem.controller;

import com.learnsystem.model.Example;
import com.learnsystem.model.Problem;
import com.learnsystem.model.Topic;
import com.learnsystem.service.TopicService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Admin CRUD for Topics and Problems.
 *
 * All endpoints require ROLE_ADMIN (enforced by SecurityConfig /api/admin/**).
 *
 * Topics:
 *   POST   /api/admin/topics              — create a new topic
 *   PUT    /api/admin/topics/{id}         — update an existing topic
 *   DELETE /api/admin/topics/{id}         — delete topic + cascade examples/problems
 *
 * Problems:
 *   POST   /api/admin/topics/{topicId}/problems — add a problem to a topic
 *   PUT    /api/admin/problems/{id}             — update a problem
 *   DELETE /api/admin/problems/{id}             — delete a problem
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminContentController {

    private final TopicService topicService;

    // ── Topic CRUD ────────────────────────────────────────────────────────────

    @PostMapping("/api/admin/topics")
    public ResponseEntity<?> createTopic(@Valid @RequestBody Topic topic) {
        try {
            Topic saved = topicService.createTopic(topic);
            log.info("[Admin] Created topic id={} title={}", saved.getId(), saved.getTitle());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("[Admin] Create topic failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/api/admin/topics/{id}")
    public ResponseEntity<?> updateTopic(@PathVariable Long id, @Valid @RequestBody Topic topic) {
        try {
            Topic updated = topicService.updateTopic(id, topic);
            log.info("[Admin] Updated topic id={}", id);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

@DeleteMapping("/api/admin/topics/{id}")
public ResponseEntity<Map<String, Object>> deleteTopic(@PathVariable Long id) {
    return topicService.getTopicById(id)
            .map(topic -> {
                topicService.deleteTopic(id);
                log.warn("[Admin] Deleted topic id={} title={}", id, topic.getTitle());

                Map<String, Object> response = new HashMap<>();
                response.put("deleted", true);
                response.put("id", id);
                response.put("title", topic.getTitle());

                return ResponseEntity.ok(response);
            })
            .orElse(ResponseEntity.notFound().build());
}

    // ── Example CRUD ─────────────────────────────────────────────────────────

    @PostMapping("/api/admin/topics/{topicId}/examples")
    public ResponseEntity<?> createExample(
            @PathVariable Long topicId,
            @Valid @RequestBody Example example) {
        try {
            Example saved = topicService.createExample(topicId, example);
            log.info("[Admin] Created example id={} title={} topic={}", saved.getId(), saved.getTitle(), topicId);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/api/admin/examples/{id}")
    public ResponseEntity<?> updateExample(@PathVariable Long id, @Valid @RequestBody Example example) {
        try {
            Example updated = topicService.updateExample(id, example);
            log.info("[Admin] Updated example id={}", id);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/api/admin/examples/{id}")
    public ResponseEntity<?> deleteExample(@PathVariable Long id) {
        try {
            topicService.deleteExample(id);
            log.warn("[Admin] Deleted example id={}", id);
            return ResponseEntity.ok(Map.of("deleted", true, "id", id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Problem CRUD ──────────────────────────────────────────────────────────

    @PostMapping("/api/admin/topics/{topicId}/problems")
    public ResponseEntity<?> createProblem(
            @PathVariable Long topicId,
            @Valid @RequestBody Problem problem) {
        try {
            Problem saved = topicService.createProblem(topicId, problem);
            log.info("[Admin] Created problem id={} title={} topic={}", saved.getId(), saved.getTitle(), topicId);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/api/admin/problems/{id}")
    public ResponseEntity<?> updateProblem(@PathVariable Long id, @Valid @RequestBody Problem problem) {
        try {
            Problem updated = topicService.updateProblem(id, problem);
            log.info("[Admin] Updated problem id={}", id);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * PATCH /api/admin/problems/{id}/harness
     * Sets (or clears) the codeHarness and optionally updates testCases.
     * Body: { "codeHarness": "class __Runner__ { ... }", "testCases": "[...]" }
     * Send null or empty string for codeHarness to clear it.
     * testCases is optional — omit to leave existing test cases unchanged.
     */
    @PatchMapping("/api/admin/problems/{id}/harness")
    public ResponseEntity<?> updateHarness(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String harness   = body.get("codeHarness");
            String testCases = body.get("testCases");   // optional
            topicService.updateProblemHarness(id, harness, testCases);
            log.info("[Admin] Updated harness for problem id={} ({})", id,
                    harness == null || harness.isBlank() ? "cleared" : harness.length() + " chars");
            return ResponseEntity.ok(Map.of("id", id, "updated", true));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/api/admin/problems/{id}")
    public ResponseEntity<?> deleteProblem(@PathVariable Long id) {
        try {
            topicService.deleteProblem(id);
            log.warn("[Admin] Deleted problem id={}", id);
            return ResponseEntity.ok(Map.of("deleted", true, "id", id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
