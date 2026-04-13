package com.learnsystem.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.model.InterviewQuestion;
import com.learnsystem.repository.InterviewQuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@Slf4j
@RequiredArgsConstructor
public class InterviewQuestionController {

    private final InterviewQuestionRepository repo;
    private final ObjectMapper objectMapper;
    private final ResourcePatternResolver resourcePatternResolver;

    // ── Public: read endpoints (used by /revision and /interview-prep) ─────────

    /**
     * GET /api/interview-questions
     * Optional filters: ?category=JAVA&difficulty=HIGH&size=300
     * Default cap: 300. Caller can request up to 500.
     */
    /**
     * GET /api/interview-questions
     * Optional filters: ?category=JAVA&topicTitle=HashMap&difficulty=HIGH&size=300
     *
     * When topicTitle is provided:
     *   1. Return topic-specific questions (category + topicTitle match).
     *   2. If none found, fall back to category-level questions (topicTitle IS NULL).
     * This gives per-topic accuracy while gracefully degrading to category questions.
     */
    @GetMapping("/api/interview-questions")
    public ResponseEntity<List<InterviewQuestion>> getAll(
            @RequestParam(required = false)       String category,
            @RequestParam(required = false)       String topicTitle,
            @RequestParam(required = false)       String difficulty,
            @RequestParam(defaultValue = "300") int    size) {

        try {
            size = Math.min(size, 500);
            var pageable = PageRequest.of(0, size);

            List<InterviewQuestion> result;

            if (category != null && topicTitle != null) {
                // Try topic-specific first
                result = repo.findByCategoryAndTopicTitlePaged(category, topicTitle, pageable);
                // Fall back to category-level if no topic-specific questions exist
                if (result.isEmpty()) {
                    result = repo.findCategoryLevelPaged(category, pageable);
                }
            } else if (category != null && difficulty != null) {
                result = repo.findByCategoryAndDifficultyPaged(category, difficulty, pageable);
            } else if (category != null) {
                result = repo.findByCategoryPaged(category, pageable);
            } else if (difficulty != null) {
                result = repo.findByDifficultyPaged(difficulty, pageable);
            } else {
                result = repo.findAllPaged(pageable);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to load interview questions. category={}, topicTitle={}, difficulty={}, size={}", category, topicTitle, difficulty, size, e);
            return ResponseEntity.ok(List.of());
        }
    }

    // ── Admin: CRUD endpoints ──────────────────────────────────────────────────

    /** POST /api/admin/interview-questions — create one question */
    @PostMapping("/api/admin/interview-questions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InterviewQuestion> create(@RequestBody InterviewQuestion q) {
        q.setId(null);
        return ResponseEntity.ok(repo.save(q));
    }

    /** PUT /api/admin/interview-questions/{id} — update */
    @PutMapping("/api/admin/interview-questions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<InterviewQuestion> update(
            @PathVariable Long id,
            @RequestBody InterviewQuestion q) {

        return repo.findById(id).map(existing -> {
            existing.setCategory(q.getCategory());
            existing.setTopicTitle(q.getTopicTitle());
            existing.setDifficulty(q.getDifficulty());
            existing.setQuestion(q.getQuestion());
            existing.setQuickAnswer(q.getQuickAnswer());
            existing.setKeyPoints(q.getKeyPoints());
            existing.setCodeExample(q.getCodeExample());
            existing.setFollowUpQuestions(q.getFollowUpQuestions());
            existing.setSpokenAnswer(q.getSpokenAnswer());
            existing.setCommonMistakes(q.getCommonMistakes());
            existing.setCompaniesAskThis(q.getCompaniesAskThis());
            existing.setSeniorExpectation(q.getSeniorExpectation());
            existing.setTimeToAnswer(q.getTimeToAnswer());
            existing.setRelatedTopics(q.getRelatedTopics());
            existing.setTags(q.getTags());
            existing.setDisplayOrder(q.getDisplayOrder());
            return ResponseEntity.ok(repo.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** DELETE /api/admin/interview-questions/{id} */
    @DeleteMapping("/api/admin/interview-questions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/admin/interview-questions/bulk
     * Bulk-import a list of questions (used by "Import Defaults" in admin UI).
     */
    @PostMapping("/api/admin/interview-questions/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> bulkImport(@RequestBody List<InterviewQuestion> questions) {
        questions.forEach(q -> q.setId(null));
        List<InterviewQuestion> saved = repo.saveAll(questions);
        return ResponseEntity.ok(Map.of("imported", saved.size()));
    }

    /** DELETE /api/admin/interview-questions — delete all */
    @DeleteMapping("/api/admin/interview-questions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deleteAll() {
        long count = repo.count();
        repo.deleteAll();
        return ResponseEntity.ok(Map.of("deleted", count));
    }

    // ── File-based import (classpath:interviewquestions/) ─────────────────────

    /**
     * GET /api/admin/interview-questions/files
     * Lists all *.json files in classpath:interviewquestions/
     */
    @GetMapping("/api/admin/interview-questions/files")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> listFiles() {
        try {
            Resource[] resources = resourcePatternResolver.getResources("classpath:interviewquestions/*.json");
            List<Map<String, Object>> files = Arrays.stream(resources)
                .map(r -> {
                    Map<String, Object> info = new LinkedHashMap<>();
                    info.put("filename", r.getFilename());
                    try {
                        List<InterviewQuestion> qs = objectMapper.readValue(
                            r.getInputStream(),
                            new TypeReference<List<InterviewQuestion>>() {}
                        );
                        info.put("count", qs.size());
                        // collect unique topicTitles for display
                        List<String> topics = qs.stream()
                            .map(InterviewQuestion::getTopicTitle)
                            .filter(Objects::nonNull)
                            .distinct()
                            .sorted()
                            .collect(Collectors.toList());
                        info.put("topics", topics);
                    } catch (Exception e) {
                        info.put("count", 0);
                        info.put("topics", List.of());
                    }
                    return info;
                })
                .collect(Collectors.toList());
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            log.error("Failed to list IQ files", e);
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * POST /api/admin/interview-questions/files/{filename}
     * Imports a specific *.json from classpath:interviewquestions/.
     * Skips duplicates (same category + question text).
     */
    @PostMapping("/api/admin/interview-questions/files/{filename}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> importFile(@PathVariable String filename) {
        try {
            Resource resource = resourcePatternResolver.getResource(
                "classpath:interviewquestions/" + filename);
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }
            List<InterviewQuestion> incoming = objectMapper.readValue(
                resource.getInputStream(),
                new TypeReference<List<InterviewQuestion>>() {}
            );

            // Deduplicate: skip if same category + question already exists
            Set<String> existing = repo.findAll().stream()
                .map(q -> q.getCategory() + "||" + q.getQuestion())
                .collect(Collectors.toSet());

            List<InterviewQuestion> toSave = incoming.stream()
                .filter(q -> q.getCategory() != null && q.getQuestion() != null)
                .filter(q -> !existing.contains(q.getCategory() + "||" + q.getQuestion()))
                .peek(q -> q.setId(null))
                .collect(Collectors.toList());

            List<InterviewQuestion> saved = repo.saveAll(toSave);
            int skipped = incoming.size() - saved.size();
            return ResponseEntity.ok(Map.of(
                "imported", saved.size(),
                "skipped",  skipped,
                "total",    incoming.size()
            ));
        } catch (Exception e) {
            log.error("Failed to import IQ file: {}", filename, e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", e.getMessage()));
        }
    }
}
