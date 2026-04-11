package com.learnsystem.service;

import com.learnsystem.dto.GateStatusDto;
import com.learnsystem.model.UserTopicProgress;
import com.learnsystem.repository.SubmissionRepository;
import com.learnsystem.repository.UserTopicProgressRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningGateService {

    // ── Gate thresholds ────────────────────────────────────────────────────────
    private static final int EASY_REQUIRED   = 3;
    private static final int MEDIUM_REQUIRED = 2;
    private static final int HARD_REQUIRED   = 1;

    private final UserTopicProgressRepository progressRepo;
    private final SubmissionRepository submissionRepo;

    // ── Get current gate status ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public GateStatusDto getGateStatus(Long userId, Long topicId) {
        UserTopicProgress progress = progressRepo
                .findByUserIdAndTopicId(userId, topicId)
                .orElse(UserTopicProgress.builder()
                        .userId(userId)
                        .topicId(topicId)
                        .theoryCompleted(false)
                        .build());

        // Solved per difficulty
        Map<String, Integer> solved = buildSolvedMap(
                submissionRepo.countSolvedByDifficultyForTopic(userId, topicId));

        // Total per difficulty
        Map<String, Integer> totals = buildSolvedMap(
                submissionRepo.countProblemsByDifficultyForTopic(topicId));

        int easySolved   = solved.getOrDefault("EASY",   0);
        int mediumSolved = solved.getOrDefault("MEDIUM", 0);
        int hardSolved   = solved.getOrDefault("HARD",   0);

        int easyTotal   = totals.getOrDefault("EASY",   0);
        int mediumTotal = totals.getOrDefault("MEDIUM", 0);
        int hardTotal   = totals.getOrDefault("HARD",   0);

        String stage = deriveStage(progress.isTheoryCompleted(), easySolved, mediumSolved, hardSolved);

        return GateStatusDto.builder()
                .stage(stage)
                .theoryCompleted(progress.isTheoryCompleted())
                .theoryNote(progress.getTheoryNote())
                .easySolved(easySolved)
                .easyTotal(easyTotal)
                .mediumSolved(mediumSolved)
                .mediumTotal(mediumTotal)
                .hardSolved(hardSolved)
                .hardTotal(hardTotal)
                .easyRequiredToUnlockMedium(EASY_REQUIRED)
                .mediumRequiredToUnlockHard(MEDIUM_REQUIRED)
                .hardRequiredToMaster(HARD_REQUIRED)
                .build();
    }

    // ── Complete theory step ───────────────────────────────────────────────────

    @Transactional
    public GateStatusDto completeTheory(Long userId, Long topicId, String note) {
        UserTopicProgress progress = progressRepo
                .findByUserIdAndTopicId(userId, topicId)
                .orElseGet(() -> UserTopicProgress.builder()
                        .userId(userId)
                        .topicId(topicId)
                        .build());

        progress.setTheoryCompleted(true);
        progress.setTheoryNote(note != null ? note.trim() : "");
        progress.setTheoryCompletedAt(LocalDateTime.now());
        progressRepo.save(progress);

        return getGateStatus(userId, topicId);
    }

    // ── Bulk: all stages for a user ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<Long, String> getAllGateStages(Long userId) {
        // Theory completion per topic
        Map<Long, Boolean> theoryDone = progressRepo.findAllByUserId(userId).stream()
                .collect(Collectors.toMap(
                        UserTopicProgress::getTopicId,
                        UserTopicProgress::isTheoryCompleted));

        // Solved counts per topic per difficulty — single query
        Map<Long, Map<String, Integer>> solved = new HashMap<>();
        for (Object[] row : submissionRepo.countSolvedByDifficultyForAllTopics(userId)) {
            Long   topicId = ((Number) row[0]).longValue();
            String diff    = (String) row[1];
            int    count   = ((Number) row[2]).intValue();
            solved.computeIfAbsent(topicId, k -> new HashMap<>()).put(diff, count);
        }

        // Merge: every topic that has theory progress or solved submissions
        Map<Long, String> result = new HashMap<>();
        for (Long topicId : theoryDone.keySet()) {
            Map<String, Integer> s = solved.getOrDefault(topicId, Map.of());
            result.put(topicId, deriveStage(
                    theoryDone.get(topicId),
                    s.getOrDefault("EASY", 0),
                    s.getOrDefault("MEDIUM", 0),
                    s.getOrDefault("HARD", 0)));
        }
        for (Long topicId : solved.keySet()) {
            if (!result.containsKey(topicId)) {
                Map<String, Integer> s = solved.get(topicId);
                result.put(topicId, deriveStage(false,
                        s.getOrDefault("EASY", 0),
                        s.getOrDefault("MEDIUM", 0),
                        s.getOrDefault("HARD", 0)));
            }
        }
        return result;
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private String deriveStage(boolean theoryCompleted, int easySolved, int mediumSolved, int hardSolved) {
        if (!theoryCompleted)               return "THEORY";
        if (easySolved   < EASY_REQUIRED)   return "EASY";
        if (mediumSolved < MEDIUM_REQUIRED) return "MEDIUM";
        if (hardSolved   < HARD_REQUIRED)   return "HARD";
        return "MASTERED";
    }

    private Map<String, Integer> buildSolvedMap(List<Object[]> rows) {
        Map<String, Integer> map = new HashMap<>();
        for (Object[] row : rows) {
            String diff  = (String) row[0];
            Number count = (Number) row[1];
            map.put(diff, count.intValue());
        }
        return map;
    }
}
