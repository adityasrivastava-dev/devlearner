package com.learnsystem.controller;

import com.learnsystem.model.StudySession;
import com.learnsystem.model.User;
import com.learnsystem.service.StudySessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Study planner / calendar API.
 *
 * GET  /api/study-plans?start=YYYY-MM-DD&end=YYYY-MM-DD  — calendar range
 * GET  /api/study-plans/upcoming                          — next sessions
 * GET  /api/study-plans/all                               — full history
 * POST /api/study-plans                                   — create session
 * PUT  /api/study-plans/{id}                              — update session
 * PATCH /api/study-plans/{id}/complete                    — mark done
 * DELETE /api/study-plans/{id}                            — delete
 */
@RestController
@RequestMapping("/api/study-plans")
@RequiredArgsConstructor
public class StudyPlanController {

    private final StudySessionService service;

    @GetMapping
    public ResponseEntity<List<StudySession>> getByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getByDateRange(user.getId(), start, end));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<StudySession>> getUpcoming(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getUpcoming(user.getId()));
    }

    @GetMapping("/all")
    public ResponseEntity<List<StudySession>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.getAll(user.getId()));
    }

    @PostMapping
    public ResponseEntity<StudySession> create(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.create(user.getId(), body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudySession> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.update(id, user.getId(), body));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<StudySession> complete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(service.complete(id, user.getId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        service.delete(id, user.getId());
        return ResponseEntity.ok(Map.of("deleted", true));
    }
}
