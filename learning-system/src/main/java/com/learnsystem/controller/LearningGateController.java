package com.learnsystem.controller;

import com.learnsystem.dto.GateStatusDto;
import com.learnsystem.model.User;
import com.learnsystem.service.LearningGateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/topics/{topicId}/gate")
@RequiredArgsConstructor
public class LearningGateController {

    private final LearningGateService gateService;

    /** GET /api/topics/{topicId}/gate — returns current stage + solved counts */
    @GetMapping
    public ResponseEntity<?> getGateStatus(
            @PathVariable Long topicId,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();
        log.debug("Gate status requested: topicId={} userId={}", topicId, user.getId());
        GateStatusDto status = gateService.getGateStatus(user.getId(), topicId);
        return ResponseEntity.ok(status);
    }

    /**
     * POST /api/topics/{topicId}/gate/theory
     * Body: { "note": "..." }
     * Marks theory as completed and returns updated gate status.
     */
    @PostMapping("/theory")
    public ResponseEntity<?> completeTheory(
            @PathVariable Long topicId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();

        String note = body.getOrDefault("note", "").trim();
        if (note.length() < 20) {
            log.warn("Theory rejected (note too short): topicId={} userId={} length={}", topicId, user.getId(), note.length());
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Note must be at least 20 characters to prove understanding."));
        }

        GateStatusDto status = gateService.completeTheory(user.getId(), topicId, note);
        log.info("Theory completed: topicId={} userId={} -> stage={}", topicId, user.getId(), status.getStage());
        return ResponseEntity.ok(status);
    }
}
