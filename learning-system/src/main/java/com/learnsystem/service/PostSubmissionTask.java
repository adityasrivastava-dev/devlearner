package com.learnsystem.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Fires post-submission side-effects asynchronously so the HTTP thread
 * can return the submission result immediately without waiting for:
 *   - streak / XP update
 *   - problems_solved recount
 *   - performance analytics write
 *   - spaced-repetition enqueue
 *
 * Called from SubmissionController after saving the Submission row.
 * Runs in the "submissionAsync" thread pool (see AsyncConfig).
 *
 * Failures are logged as warnings — they never affect the HTTP response.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PostSubmissionTask {

    private final StreakService              streakService;
    private final UserProgressService        userProgressService;
    private final PerformanceAnalyticsService analyticsService;

    @Async("submissionAsync")
    public void run(
            Long   userId,
            Long   problemId,
            Long   topicId,
            String problemTitle,
            String status,
            Long   solveTimeSecs,
            boolean hintAssisted,
            String detectedPattern,
            String correctPattern,
            String code,
            int    xpEarned) {

        if (userId == null) return;

        try {
            streakService.onDailyActivity(userId, xpEarned);
        } catch (Exception e) {
            log.warn("Streak update failed for userId={}: {}", userId, e.getMessage());
        }

        try {
            userProgressService.onAccepted(userId);
        } catch (Exception e) {
            log.warn("UserProgress update failed for userId={}: {}", userId, e.getMessage());
        }

        try {
            analyticsService.onSubmission(
                    userId, problemId, topicId, problemTitle,
                    status, solveTimeSecs, hintAssisted,
                    detectedPattern, correctPattern, code);
        } catch (Exception e) {
            log.warn("Analytics update failed for userId={} problemId={}: {}", userId, problemId, e.getMessage());
        }
    }
}
