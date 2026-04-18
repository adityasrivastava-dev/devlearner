package com.learnsystem.controller;

import com.learnsystem.model.BehavioralStory;
import com.learnsystem.model.BehavioralStory.Theme;
import com.learnsystem.model.User;
import com.learnsystem.repository.BehavioralStoryRepository;
import com.learnsystem.service.GeminiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
public class StoryController {

    private final BehavioralStoryRepository repo;
    private final GeminiService             gemini;

    private static final String POLISH_SYSTEM =
        "You are a senior engineering manager helping a candidate strengthen their behavioral interview story. " +
        "The story uses the STAR format (Situation, Task, Action, Result). " +
        "Rewrite each section to be more concrete, quantified, and impactful. " +
        "Return ONLY a JSON object with keys: situation, task, action, result, tip. " +
        "No markdown, no explanation outside the JSON. " +
        "The 'tip' field should be one short sentence of coaching advice.";

    // ── GET /api/stories ──────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        List<Map<String, Object>> result = new ArrayList<>();
        for (BehavioralStory s : repo.findByUserIdOrderByCreatedAtDesc(user.getId())) {
            result.add(toMap(s));
        }
        return ResponseEntity.ok(result);
    }

    // ── POST /api/stories ─────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();

        Theme theme;
        try {
            theme = Theme.valueOf((String) body.getOrDefault("theme", "IMPACT"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid theme"));
        }

        String title = ((String) body.getOrDefault("title", "")).trim();
        if (title.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error", "Title is required"));

        BehavioralStory story = BehavioralStory.builder()
            .userId(user.getId())
            .theme(theme)
            .title(title)
            .situation((String) body.get("situation"))
            .task((String) body.get("task"))
            .action((String) body.get("action"))
            .result((String) body.get("result"))
            .tags(body.get("tags") != null ? body.get("tags").toString() : "[]")
            .build();

        repo.save(story);
        return ResponseEntity.ok(toMap(story));
    }

    // ── PUT /api/stories/{id} ─────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();
        BehavioralStory story = repo.findByIdAndUserId(id, user.getId()).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();

        if (body.containsKey("theme")) {
            try { story.setTheme(Theme.valueOf((String) body.get("theme"))); }
            catch (IllegalArgumentException ignored) {}
        }
        if (body.containsKey("title"))     story.setTitle((String) body.get("title"));
        if (body.containsKey("situation")) story.setSituation((String) body.get("situation"));
        if (body.containsKey("task"))      story.setTask((String) body.get("task"));
        if (body.containsKey("action"))    story.setAction((String) body.get("action"));
        if (body.containsKey("result"))    story.setResult((String) body.get("result"));
        if (body.containsKey("tags"))      story.setTags(body.get("tags").toString());

        repo.save(story);
        return ResponseEntity.ok(toMap(story));
    }

    // ── DELETE /api/stories/{id} ──────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();
        BehavioralStory story = repo.findByIdAndUserId(id, user.getId()).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();
        repo.delete(story);
        return ResponseEntity.ok(Map.of("deleted", true));
    }

    // ── POST /api/stories/{id}/polish — AI-strengthen the story ──────────────

    @PostMapping("/{id}/polish")
    public ResponseEntity<?> polish(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();
        BehavioralStory story = repo.findByIdAndUserId(id, user.getId()).orElse(null);
        if (story == null) return ResponseEntity.notFound().build();

        String prompt = String.format(
            "Theme: %s\nTitle: %s\n\nSituation: %s\nTask: %s\nAction: %s\nResult: %s",
            story.getTheme(), story.getTitle(),
            nvl(story.getSituation()), nvl(story.getTask()),
            nvl(story.getAction()),    nvl(story.getResult())
        );

        String raw = gemini.chat(POLISH_SYSTEM, prompt);
        try {
            String cleaned = raw.replaceAll("(?s)```[a-zA-Z]*", "").replace("```", "").trim();
            com.fasterxml.jackson.databind.JsonNode node =
                new com.fasterxml.jackson.databind.ObjectMapper().readTree(cleaned);

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("situation", node.path("situation").asText(story.getSituation()));
            resp.put("task",      node.path("task")     .asText(story.getTask()));
            resp.put("action",    node.path("action")   .asText(story.getAction()));
            resp.put("result",    node.path("result")   .asText(story.getResult()));
            resp.put("tip",       node.path("tip")      .asText(""));
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.warn("Story polish JSON parse failed: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("tip", raw.length() > 300 ? raw.substring(0, 300) : raw));
        }
    }

    // ── GET /api/stories/themes — returns coverage summary ───────────────────

    @GetMapping("/themes")
    public ResponseEntity<?> themes(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        List<BehavioralStory> all = repo.findByUserIdOrderByCreatedAtDesc(user.getId());
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (Theme t : Theme.values()) counts.put(t.name(), 0);
        for (BehavioralStory s : all) counts.merge(s.getTheme().name(), 1, Integer::sum);
        return ResponseEntity.ok(Map.of("themes", counts, "total", all.size()));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> toMap(BehavioralStory s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id",        s.getId());
        m.put("theme",     s.getTheme().name());
        m.put("title",     s.getTitle());
        m.put("situation", s.getSituation());
        m.put("task",      s.getTask());
        m.put("action",    s.getAction());
        m.put("result",    s.getResult());
        m.put("tags",      s.getTags() != null ? s.getTags() : "[]");
        m.put("createdAt", s.getCreatedAt() != null ? s.getCreatedAt().toString() : null);
        m.put("updatedAt", s.getUpdatedAt() != null ? s.getUpdatedAt().toString() : null);
        return m;
    }

    private static String nvl(String s) { return s != null ? s : "(not provided)"; }
}
