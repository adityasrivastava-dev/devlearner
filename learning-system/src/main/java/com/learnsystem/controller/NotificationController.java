package com.learnsystem.controller;

import com.learnsystem.model.User;
import com.learnsystem.repository.DailySolveRepository;
import com.learnsystem.service.SpacedRepetitionService;
import com.learnsystem.service.StreakService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * GET /api/notifications/summary
 * Returns a lightweight summary used by the notification bell:
 *   - streak.atRisk  — user hasn't solved anything today
 *   - srsDue         — number of SRS items due for review
 *   - dailyPending   — today's daily challenge hasn't been solved
 *   - total          — sum of active notification flags (badge count)
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final StreakService             streakService;
    private final SpacedRepetitionService   srsService;
    private final DailySolveRepository      solveRepo;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();

        Map<String, Object> streakStatus = streakService.getStatus(user.getId());
        boolean activeToday = Boolean.TRUE.equals(streakStatus.get("activeToday"));
        int     streakDays  = streakStatus.get("streakDays") instanceof Number n ? n.intValue() : 0;
        boolean atRisk      = !activeToday && streakDays > 0;

        Map<String, Object> srsQueue = srsService.getQueueSummary(user.getId());
        int srsDue = srsQueue.get("dueCount") instanceof Number n ? n.intValue() : 0;

        boolean dailyPending = !solveRepo.existsByUserIdAndChallengeDate(user.getId(), LocalDate.now());

        int total = (atRisk ? 1 : 0) + (srsDue > 0 ? 1 : 0) + (dailyPending ? 1 : 0);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("streak",       Map.of("days", streakDays, "atRisk", atRisk, "activeToday", activeToday));
        result.put("srsDue",       srsDue);
        result.put("dailyPending", dailyPending);
        result.put("total",        total);
        return ResponseEntity.ok(result);
    }
}
