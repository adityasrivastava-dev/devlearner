package com.learnsystem.controller;

import com.learnsystem.model.InterviewQuestion;
import com.learnsystem.repository.InterviewQuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@Slf4j
@RequiredArgsConstructor
public class InterviewQuestionController {

    private final InterviewQuestionRepository repo;

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
}
