package com.learnsystem.controller;

import com.learnsystem.repository.AlgorithmRepository;
import com.learnsystem.repository.ProblemRepository;
import com.learnsystem.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * GET /api/search?q=...
 * Returns results grouped by topics, problems, algorithms.
 * Uses MySQL FULLTEXT indexes for fast relevance-ranked results.
 */
@Slf4j
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final TopicRepository     topicRepo;
    private final ProblemRepository   problemRepo;
    private final AlgorithmRepository algoRepo;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> search(@RequestParam String q) {
        String query = q == null ? "" : q.trim();
        if (query.length() < 2) {
            return ResponseEntity.ok(Map.of("topics", List.of(), "problems", List.of(), "algorithms", List.of(), "total", 0));
        }

        // Build boolean mode query: "spring boot" → "+spring* +boot*"
        String booleanQuery = Arrays.stream(query.split("\\s+"))
                .filter(w -> w.length() > 1)
                .map(w -> "+" + w + "*")
                .reduce((a, b) -> a + " " + b)
                .orElse(query + "*");

        log.debug("Search: q='{}' booleanQuery='{}'", query, booleanQuery);

        List<Map<String, Object>> topics     = mapTopics(topicRepo.fullTextSearch(booleanQuery));
        List<Map<String, Object>> problems   = mapProblems(problemRepo.fullTextSearch(booleanQuery));
        List<Map<String, Object>> algorithms = mapAlgorithms(algoRepo.fullTextSearch(booleanQuery));

        int total = topics.size() + problems.size() + algorithms.size();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("query",      query);
        result.put("total",      total);
        result.put("topics",     topics);
        result.put("problems",   problems);
        result.put("algorithms", algorithms);
        return ResponseEntity.ok(result);
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private List<Map<String, Object>> mapTopics(List<Object[]> rows) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",          r[0]);
            m.put("title",       r[1]);
            m.put("category",    r[2]);
            m.put("subCategory", r[3]);
            m.put("description", truncate((String) r[4], 120));
            m.put("type",        "TOPIC");
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> mapProblems(List<Object[]> rows) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",         r[0]);
            m.put("title",      r[1]);
            m.put("difficulty", r[2]);
            m.put("pattern",    r[3]);
            m.put("topicId",    r[4]);
            m.put("topicTitle", r[5]);
            m.put("type",       "PROBLEM");
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> mapAlgorithms(List<Object[]> rows) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",          r[0]);
            m.put("name",        r[1]);
            m.put("category",    r[2]);
            m.put("difficulty",  r[3]);
            m.put("description", truncate((String) r[4], 120));
            m.put("slug",        r[5]);
            m.put("type",        "ALGORITHM");
            out.add(m);
        }
        return out;
    }

    private String truncate(String s, int max) {
        if (s == null) return "";
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
