package com.learnsystem.controller;

import com.learnsystem.dto.ProblemSummaryDto;
import com.learnsystem.model.Topic;
import com.learnsystem.repository.ProblemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Global problems listing — the LeetCode-style /problems page.
 *
 * GET /api/problems
 *   ?category=DSA          (optional — Topic.Category enum name)
 *   &topicId=3             (optional — filter by exact topic)
 *   &difficulty=EASY       (optional — EASY | MEDIUM | HARD)
 *   &pattern=HashMap       (optional — exact match)
 *   &search=binary         (optional — case-insensitive title search)
 *   &page=0                (default 0)
 *   &size=20               (default 20, max 100)
 *
 * GET /api/problems/filters
 *   Returns { categories, difficulties, patterns } for building the UI dropdowns.
 */
@Slf4j
@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemsController {

    private final ProblemRepository problemRepo;

    // ── Main listing ──────────────────────────────────────────────────────────

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getProblems(
            @RequestParam(required = false) String  category,
            @RequestParam(required = false) Long    topicId,
            @RequestParam(required = false) String  difficulty,
            @RequestParam(required = false) String  pattern,
            @RequestParam(required = false) String  search,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        // Cap page size to prevent abuse
        size = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, size);

        // Normalise — pass null (not blank string) so IS NULL check in JPQL works
        String cat   = blank(category)   ? null : category.toUpperCase();
        String diff  = blank(difficulty) ? null : difficulty.toUpperCase();
        String pat   = blank(pattern)    ? null : pattern;
        String srch  = blank(search)     ? null : search.trim();

        // Validate category & difficulty enum values; ignore unknown values
        if (cat != null) {
            try { Topic.Category.valueOf(cat); }
            catch (IllegalArgumentException e) { cat = null; }
        }

        log.debug("Problems list: category={} difficulty={} pattern={} search={} page={}", cat, diff, pat, srch, page);

        Page<com.learnsystem.model.Problem> pageResult =
                problemRepo.findPageFiltered(cat, topicId, diff, pat, srch, pageable);

        List<ProblemSummaryDto> content = pageResult.getContent()
                .stream()
                .map(ProblemSummaryDto::from)
                .collect(Collectors.toList());

        log.debug("Problems returned: total={} page={}/{}", pageResult.getTotalElements(), pageResult.getNumber(), pageResult.getTotalPages());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content",       content);
        response.put("totalElements", pageResult.getTotalElements());
        response.put("totalPages",    pageResult.getTotalPages());
        response.put("page",          pageResult.getNumber());
        response.put("size",          pageResult.getSize());
        return ResponseEntity.ok(response);
    }

    // ── Filter metadata ───────────────────────────────────────────────────────

    @GetMapping("/filters")
    public ResponseEntity<Map<String, Object>> getFilters() {
        List<String> categories = Arrays.stream(Topic.Category.values())
                .map(Enum::name)
                .collect(Collectors.toList());

        List<String> difficulties = List.of("EASY", "MEDIUM", "HARD");

        List<String> patterns = problemRepo.findDistinctPatterns();

        Map<String, Object> filters = new LinkedHashMap<>();
        filters.put("categories",   categories);
        filters.put("difficulties", difficulties);
        filters.put("patterns",     patterns);
        return ResponseEntity.ok(filters);
    }

    // ── Similar problems ─────────────────────────────────────────────────────

    /**
     * GET /api/problems/{id}/similar
     * Returns up to 5 problems sharing the same pattern, excluding the current one.
     * Used to show "Try next" after an accepted submission.
     */
    @GetMapping("/{id}/similar")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getSimilar(@PathVariable Long id) {
        var problem = problemRepo.findById(id).orElse(null);
        if (problem == null || blank(problem.getPattern())) {
            return ResponseEntity.ok(List.of());
        }
        var similar = problemRepo.findSimilarByPattern(
                problem.getPattern(), id, PageRequest.of(0, 5));
        return ResponseEntity.ok(similar.stream().map(p -> Map.of(
                "id",         p.getId(),
                "title",      p.getTitle(),
                "difficulty", p.getDifficulty().name(),
                "pattern",    p.getPattern() != null ? p.getPattern() : "",
                "topicTitle", p.getTopic().getTitle()
        )).toList());
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }
}
