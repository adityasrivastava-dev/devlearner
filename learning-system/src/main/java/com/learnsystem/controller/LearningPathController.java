package com.learnsystem.controller;

import com.learnsystem.model.Topic;
import com.learnsystem.model.User;
import com.learnsystem.repository.SubmissionRepository;
import com.learnsystem.repository.TopicRepository;
import com.learnsystem.service.LearningGateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

/**
 * GET /api/path
 * Returns the user's personalised learning path:
 *   - summary counts per stage
 *   - focusNow: in-progress topics (EASY/MEDIUM/HARD) with exact action required
 *   - upNext: not-started topics ordered by category/displayOrder (first 20)
 *   - mastered: completed topics
 *   - weekPlan: week-by-week schedule (current week + 3 future weeks)
 */
@RestController
@RequestMapping("/api/path")
@RequiredArgsConstructor
public class LearningPathController {

    private static final int EASY_REQUIRED   = 3;
    private static final int MEDIUM_REQUIRED = 2;
    private static final int HARD_REQUIRED   = 1;
    private static final int TOPICS_PER_WEEK = 4;

    private final TopicRepository      topicRepo;
    private final LearningGateService  gateService;
    private final SubmissionRepository submissionRepo;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getPath(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();

        List<Topic> allTopics = topicRepo.findAllByOrderByDisplayOrderAscTitleAsc();
        Map<Long, String> stages = gateService.getAllGateStages(user.getId());

        // Build solved counts per topic per difficulty — single query
        Map<Long, Map<String, Integer>> solved = new HashMap<>();
        for (Object[] row : submissionRepo.countSolvedByDifficultyForAllTopics(user.getId())) {
            Long   topicId = ((Number) row[0]).longValue();
            String diff    = (String) row[1];
            int    count   = ((Number) row[2]).intValue();
            solved.computeIfAbsent(topicId, k -> new HashMap<>()).put(diff, count);
        }

        // Classify topics
        List<Map<String, Object>> focusNow = new ArrayList<>();
        List<Map<String, Object>> upNext   = new ArrayList<>();
        List<Map<String, Object>> mastered = new ArrayList<>();

        int notStartedCount = 0;

        for (Topic t : allTopics) {
            String stage = stages.getOrDefault(t.getId(), "THEORY");
            Map<String, Integer> s = solved.getOrDefault(t.getId(), Map.of());

            Map<String, Object> item = topicItem(t, stage, s);

            switch (stage) {
                case "MASTERED" -> mastered.add(item);
                case "EASY", "MEDIUM", "HARD" -> focusNow.add(item);
                default -> {
                    notStartedCount++;
                    upNext.add(item);
                }
            }
        }

        // Sort focusNow: HARD first (closest to mastery), then MEDIUM, then EASY
        focusNow.sort(Comparator.comparingInt(m -> stageOrder((String) m.get("stage"))));

        // Cap upNext to 20 for display
        List<Map<String, Object>> upNextCapped = upNext.stream().limit(20).collect(Collectors.toList());

        // Summary
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("mastered",    mastered.size());
        summary.put("inProgress",  focusNow.size());
        summary.put("notStarted",  notStartedCount);
        summary.put("total",       allTopics.size());

        // Week plan: week 1 = focusNow, subsequent weeks = batches from upNext
        List<Map<String, Object>> weekPlan = buildWeekPlan(focusNow, upNext);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("summary",   summary);
        result.put("focusNow",  focusNow);
        result.put("upNext",    upNextCapped);
        result.put("mastered",  mastered);
        result.put("weekPlan",  weekPlan);
        return ResponseEntity.ok(result);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> topicItem(Topic t, String stage, Map<String, Integer> solved) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("topicId",   t.getId());
        m.put("title",     t.getTitle());
        m.put("category",  t.getCategory().name());
        m.put("subCategory", t.getSubCategory());
        m.put("stage",     stage);
        m.put("action",    actionFor(stage, solved));
        m.put("progressText", progressText(stage, solved));
        return m;
    }

    private String actionFor(String stage, Map<String, Integer> solved) {
        return switch (stage) {
            case "THEORY"   -> "Read the theory and write a note";
            case "EASY"     -> {
                int done = solved.getOrDefault("EASY", 0);
                yield "Solve " + Math.max(0, EASY_REQUIRED - done) + " more Easy problem" + (EASY_REQUIRED - done == 1 ? "" : "s");
            }
            case "MEDIUM"   -> {
                int done = solved.getOrDefault("MEDIUM", 0);
                yield "Solve " + Math.max(0, MEDIUM_REQUIRED - done) + " more Medium problem" + (MEDIUM_REQUIRED - done == 1 ? "" : "s");
            }
            case "HARD"     -> "Solve 1 Hard problem to master this topic";
            case "MASTERED" -> "Mastered ✓";
            default         -> "Start learning";
        };
    }

    private String progressText(String stage, Map<String, Integer> solved) {
        return switch (stage) {
            case "EASY"   -> solved.getOrDefault("EASY", 0) + "/" + EASY_REQUIRED + " Easy";
            case "MEDIUM" -> solved.getOrDefault("MEDIUM", 0) + "/" + MEDIUM_REQUIRED + " Medium";
            case "HARD"   -> solved.getOrDefault("HARD", 0) + "/" + HARD_REQUIRED + " Hard";
            default       -> "";
        };
    }

    private int stageOrder(String stage) {
        return switch (stage) {
            case "HARD"   -> 0;
            case "MEDIUM" -> 1;
            case "EASY"   -> 2;
            default       -> 3;
        };
    }

    private List<Map<String, Object>> buildWeekPlan(
            List<Map<String, Object>> focusNow,
            List<Map<String, Object>> upNext) {

        List<Map<String, Object>> weeks = new ArrayList<>();

        if (!focusNow.isEmpty()) {
            weeks.add(week(1, "This Week — Finish In Progress", focusNow));
        }

        int weekNum = weeks.isEmpty() ? 1 : 2;
        int i = 0;
        while (i < upNext.size() && weeks.size() < 4) {
            List<Map<String, Object>> batch = upNext.subList(i, Math.min(i + TOPICS_PER_WEEK, upNext.size()));
            String label = weekNum == (focusNow.isEmpty() ? 1 : 2) ? "This Week — Start Here" : "Week " + weekNum;
            weeks.add(week(weekNum, label, batch));
            i += TOPICS_PER_WEEK;
            weekNum++;
        }

        return weeks;
    }

    private Map<String, Object> week(int num, String label, List<Map<String, Object>> items) {
        Map<String, Object> w = new LinkedHashMap<>();
        w.put("week",  num);
        w.put("label", label);
        w.put("items", items.stream().limit(TOPICS_PER_WEEK).collect(Collectors.toList()));
        return w;
    }
}
