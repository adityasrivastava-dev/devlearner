package com.learnsystem.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.model.Topic;
import com.learnsystem.model.User;
import com.learnsystem.model.UserTopicProgress;
import com.learnsystem.repository.TopicRepository;
import com.learnsystem.repository.UserTopicProgressRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Skill Assessment — diagnostic quiz that advances gate stages on passing categories.
 *
 *   GET  /api/assessment/questions   — 10 diagnostic questions (correct answers stripped)
 *   POST /api/assessment/submit      — score answers; mark theory done for passing categories
 *
 * Scoring per category (2 questions each):
 *   ≥ 1 correct → mark theory completed for all topics in that category (THEORY → EASY)
 */
@Slf4j
@RestController
@RequestMapping("/api/assessment")
@RequiredArgsConstructor
public class AssessmentController {

    private final TopicRepository             topicRepo;
    private final UserTopicProgressRepository progressRepo;
    private final ObjectMapper                objectMapper;

    // ── GET questions — strip correct answers ──────────────────────────────────

    @GetMapping("/questions")
    public ResponseEntity<List<Map<String, Object>>> getQuestions() {
        try {
            List<Map<String, Object>> raw = loadQuestions();
            List<Map<String, Object>> safe = raw.stream().map(q -> {
                Map<String, Object> m = new LinkedHashMap<>(q);
                m.remove("correctOption");
                m.remove("explanation");
                return m;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(safe);
        } catch (Exception e) {
            log.error("Failed to load assessment questions", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    // ── POST submit — score + advance gates ───────────────────────────────────

    @PostMapping("/submit")
    @Transactional
    public ResponseEntity<Map<String, Object>> submit(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {

        if (user == null) return ResponseEntity.status(401).build();

        @SuppressWarnings("unchecked")
        Map<String, String> answers = (Map<String, String>) body.getOrDefault("answers", Map.of());

        List<Map<String, Object>> questions;
        try {
            questions = loadQuestions();
        } catch (Exception e) {
            log.error("Failed to load questions for scoring", e);
            return ResponseEntity.internalServerError().build();
        }

        // Score per category
        Map<String, int[]> catScore = new LinkedHashMap<>(); // [correct, total]
        Map<String, String> correctAnswers = new HashMap<>();

        for (Map<String, Object> q : questions) {
            String id       = (String) q.get("id");
            String category = (String) q.get("category");
            String correct  = (String) q.get("correctOption");
            correctAnswers.put(id, correct);
            catScore.computeIfAbsent(category, k -> new int[]{0, 0})[1]++;
            if (correct.equalsIgnoreCase(answers.getOrDefault(id, ""))) {
                catScore.get(category)[0]++;
            }
        }

        // Map assessment categories → Topic.Category enum
        Map<String, Topic.Category> catMap = Map.of(
                "JAVA",         Topic.Category.JAVA,
                "DSA",          Topic.Category.DSA,
                "SPRING_BOOT",  Topic.Category.SPRING_BOOT,
                "MYSQL",        Topic.Category.MYSQL,
                "AWS",          Topic.Category.AWS
        );

        // Advance theory for passing categories (≥1 correct out of 2)
        Map<String, Object> categoryResults = new LinkedHashMap<>();
        int topicsAdvanced = 0;

        for (Map.Entry<String, int[]> entry : catScore.entrySet()) {
            String cat     = entry.getKey();
            int    correct = entry.getValue()[0];
            int    total   = entry.getValue()[1];
            boolean passed = correct >= 1;

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("correct", correct);
            result.put("total",   total);
            result.put("passed",  passed);

            if (passed && catMap.containsKey(cat)) {
                int advanced = markTheoryForCategory(user.getId(), catMap.get(cat));
                result.put("topicsAdvanced", advanced);
                topicsAdvanced += advanced;
            } else {
                result.put("topicsAdvanced", 0);
            }

            categoryResults.put(cat, result);
        }

        // Return correct answers + explanations so frontend can show review
        List<Map<String, Object>> review = questions.stream().map(q -> {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("id",          q.get("id"));
            r.put("category",    q.get("category"));
            r.put("questionText",q.get("questionText"));
            r.put("correctOption", q.get("correctOption"));
            r.put("explanation", q.get("explanation"));
            r.put("userAnswer",  answers.getOrDefault((String) q.get("id"), null));
            r.put("correct",     q.get("correctOption").equals(answers.getOrDefault((String) q.get("id"), "")));
            return r;
        }).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("categoryResults", categoryResults);
        response.put("topicsAdvanced",  topicsAdvanced);
        response.put("review",          review);

        log.info("Assessment submitted: userId={} topicsAdvanced={}", user.getId(), topicsAdvanced);
        return ResponseEntity.ok(response);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private int markTheoryForCategory(Long userId, Topic.Category category) {
        List<Topic> topics = topicRepo.findByCategory(category);
        int count = 0;
        for (Topic topic : topics) {
            UserTopicProgress progress = progressRepo
                    .findByUserIdAndTopicId(userId, topic.getId())
                    .orElseGet(() -> UserTopicProgress.builder()
                            .userId(userId)
                            .topicId(topic.getId())
                            .build());

            if (!progress.isTheoryCompleted()) {
                progress.setTheoryCompleted(true);
                progress.setTheoryNote("Skill assessment passed");
                progress.setTheoryCompletedAt(LocalDateTime.now());
                progressRepo.save(progress);
                count++;
            }
        }
        return count;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> loadQuestions() throws Exception {
        ClassPathResource res = new ClassPathResource("assessment/diagnostic.json");
        return objectMapper.readValue(res.getInputStream(), new TypeReference<>() {});
    }
}
