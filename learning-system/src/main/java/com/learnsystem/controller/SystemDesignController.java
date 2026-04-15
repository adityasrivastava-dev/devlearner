package com.learnsystem.controller;

import com.learnsystem.model.SystemDesignCanvas;
import com.learnsystem.model.User;
import com.learnsystem.repository.SystemDesignCanvasRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * System Design Canvas — save / load user designs.
 *
 *   GET    /api/system-design           → list user's designs (id, name, updatedAt)
 *   POST   /api/system-design           → create  { name, canvasData }
 *   PUT    /api/system-design/{id}      → update  { name?, canvasData }
 *   DELETE /api/system-design/{id}      → delete
 *   GET    /api/system-design/{id}      → full canvas data
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class SystemDesignController {

    private final SystemDesignCanvasRepository canvasRepo;

    @GetMapping("/api/system-design")
    public ResponseEntity<List<Map<String, Object>>> list(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(
                canvasRepo.findByUserIdOrderByUpdatedAtDesc(user.getId()).stream()
                        .map(c -> {
                            Map<String, Object> m = new LinkedHashMap<>();
                            m.put("id",        c.getId());
                            m.put("name",      c.getName());
                            m.put("updatedAt", c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : null);
                            m.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : null);
                            return m;
                        })
                        .collect(Collectors.toList())
        );
    }

    @GetMapping("/api/system-design/{id}")
    public ResponseEntity<Map<String, Object>> get(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return canvasRepo.findByIdAndUserId(id, user.getId())
                .map(c -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",         c.getId());
                    m.put("name",       c.getName());
                    m.put("canvasData", c.getCanvasData());
                    m.put("updatedAt",  c.getUpdatedAt() != null ? c.getUpdatedAt().toString() : null);
                    return ResponseEntity.ok(m);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/system-design")
    public ResponseEntity<Map<String, Object>> create(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        String name       = body.getOrDefault("name", "Untitled Design");
        String canvasData = body.getOrDefault("canvasData", "{}");
        try {
            SystemDesignCanvas saved = canvasRepo.save(
                    SystemDesignCanvas.builder()
                            .userId(user.getId())
                            .name(name.length() > 200 ? name.substring(0, 200) : name)
                            .canvasData(canvasData)
                            .build()
            );
            return ResponseEntity.ok(Map.of("id", saved.getId(), "name", saved.getName()));
        } catch (Exception e) {
            log.error("Create canvas error", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/api/system-design/{id}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return canvasRepo.findByIdAndUserId(id, user.getId())
                .map(c -> {
                    if (body.containsKey("name"))       c.setName(body.get("name"));
                    if (body.containsKey("canvasData")) c.setCanvasData(body.get("canvasData"));
                    canvasRepo.save(c);
                    return ResponseEntity.ok(Map.<String, Object>of("id", c.getId(), "name", c.getName()));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/system-design/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        canvasRepo.findByIdAndUserId(id, user.getId()).ifPresent(canvasRepo::delete);
        return ResponseEntity.noContent().build();
    }
}
