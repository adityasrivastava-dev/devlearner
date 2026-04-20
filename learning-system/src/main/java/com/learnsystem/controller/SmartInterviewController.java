package com.learnsystem.controller;

import com.learnsystem.model.User;
import com.learnsystem.service.SmartInterviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Smart AI Interview Engine
 *
 * POST /api/smart-interview/start              — upload resume PDF, get session + first question
 * POST /api/smart-interview/{id}/respond       — submit answer, get adaptive next question + evaluation
 * GET  /api/smart-interview/{id}/summary       — get comprehensive performance report
 */
@Slf4j
@RestController
@RequestMapping("/api/smart-interview")
@RequiredArgsConstructor
public class SmartInterviewController {

    private final SmartInterviewService interviewService;

    @PostMapping(value = "/start", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> start(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();

        if (file == null || file.isEmpty())
            return ResponseEntity.badRequest().body(Map.of("error", "No file uploaded"));

        String fname = file.getOriginalFilename();
        if (fname == null || !fname.toLowerCase().endsWith(".pdf"))
            return ResponseEntity.badRequest().body(Map.of("error", "Only PDF files are supported"));

        if (file.getSize() > 5 * 1024 * 1024)
            return ResponseEntity.badRequest().body(Map.of("error", "File too large — maximum 5 MB"));

        try {
            Map<String, Object> result = interviewService.startSession(file.getBytes(), user.getId());
            log.info("Smart interview started: userId={}", user.getId());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Failed to start smart interview: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to analyze resume. Please try again."));
        }
    }

    @PostMapping("/{sessionId}/respond")
    public ResponseEntity<?> respond(
            @PathVariable String sessionId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();

        String answer = body == null ? null : body.get("answer");
        if (answer == null || answer.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "Answer cannot be empty"));

        try {
            Map<String, Object> result = interviewService.respond(sessionId, answer.trim());
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Smart interview respond error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to process answer. Please try again."));
        }
    }

    @GetMapping("/{sessionId}/summary")
    public ResponseEntity<?> summary(
            @PathVariable String sessionId,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();

        try {
            Map<String, Object> result = interviewService.getSummary(sessionId);
            return ResponseEntity.ok(result);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Smart interview summary error: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to generate summary. Please try again."));
        }
    }
}
