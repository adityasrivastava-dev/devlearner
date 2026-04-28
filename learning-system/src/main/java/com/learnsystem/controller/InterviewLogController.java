package com.learnsystem.controller;

import com.learnsystem.model.InterviewLog;
import com.learnsystem.model.User;
import com.learnsystem.repository.InterviewLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Personal interview history log.
 *
 * GET    /api/interview-logs      — list all entries for the current user
 * POST   /api/interview-logs      — create a new log entry
 * PUT    /api/interview-logs/{id} — update an existing entry
 * DELETE /api/interview-logs/{id} — delete an entry
 */
@RestController
@RequestMapping("/api/interview-logs")
@RequiredArgsConstructor
public class InterviewLogController {

    private final InterviewLogRepository repo;

    @GetMapping
    public ResponseEntity<List<InterviewLog>> getAll(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(repo.findByUserIdOrderByInterviewDateDesc(user.getId()));
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal User user,
                                     @RequestBody InterviewLog body) {
        if (user == null) return ResponseEntity.status(401).build();
        body.setId(null);
        body.setUserId(user.getId());
        return ResponseEntity.ok(repo.save(body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@AuthenticationPrincipal User user,
                                     @PathVariable Long id,
                                     @RequestBody InterviewLog body) {
        if (user == null) return ResponseEntity.status(401).build();
        return repo.findById(id)
                .filter(log -> log.getUserId().equals(user.getId()))
                .map(log -> {
                    body.setId(id);
                    body.setUserId(user.getId());
                    return ResponseEntity.ok(repo.save(body));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@AuthenticationPrincipal User user,
                                     @PathVariable Long id) {
        if (user == null) return ResponseEntity.status(401).build();
        return repo.findById(id)
                .filter(log -> log.getUserId().equals(user.getId()))
                .map(log -> { repo.delete(log); return ResponseEntity.ok(Map.of("deleted", true)); })
                .orElse(ResponseEntity.notFound().build());
    }
}
