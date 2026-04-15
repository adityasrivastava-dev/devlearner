package com.learnsystem.controller;

import com.learnsystem.model.PageView;
import com.learnsystem.model.User;
import com.learnsystem.model.UserEvent;
import com.learnsystem.repository.PageViewRepository;
import com.learnsystem.repository.UserEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Tracking Controller — page visit and user event recording.
 *
 * Public tracking endpoints (require auth, fire-and-forget from the frontend):
 *   POST /api/tracking/pageview   — log a page visit
 *   POST /api/tracking/event      — log a user interaction event
 *
 * Admin reporting endpoints:
 *   GET /api/admin/tracking/page-stats   — page visit counts (all-time + last 7d)
 *   GET /api/admin/tracking/event-stats  — event type counts
 *   GET /api/admin/tracking/daily        — daily visit totals for last 30 days
 *   GET /api/admin/tracking/recent       — last 50 raw page views
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class TrackingController {

    private final PageViewRepository  pageViewRepo;
    private final UserEventRepository userEventRepo;

    // ── DTOs ─────────────────────────────────────────────────────────────────────

    record PageViewRequest(String pagePath, String pageTitle, String sessionId) {}
    record EventRequest(String eventType, String pagePath, String eventData) {}

    // ── Tracking endpoints (authenticated users) ──────────────────────────────

    @PostMapping("/api/tracking/pageview")
    public ResponseEntity<Void> trackPageView(
            @RequestBody PageViewRequest req,
            @AuthenticationPrincipal User user) {
        if (user == null || req == null || req.pagePath() == null) {
            return ResponseEntity.ok().build();
        }
        try {
            pageViewRepo.save(PageView.builder()
                    .userId(user.getId())
                    .pagePath(req.pagePath())
                    .pageTitle(req.pageTitle())
                    .sessionId(req.sessionId())
                    .build());
        } catch (Exception e) {
            log.warn("Failed to save page view: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/tracking/event")
    public ResponseEntity<Void> trackEvent(
            @RequestBody EventRequest req,
            @AuthenticationPrincipal User user) {
        if (user == null || req == null || req.eventType() == null) {
            return ResponseEntity.ok().build();
        }
        try {
            userEventRepo.save(UserEvent.builder()
                    .userId(user.getId())
                    .eventType(req.eventType())
                    .pagePath(req.pagePath())
                    .eventData(req.eventData())
                    .build());
        } catch (Exception e) {
            log.warn("Failed to save user event: {}", e.getMessage());
        }
        return ResponseEntity.ok().build();
    }

    // ── Admin reporting endpoints ─────────────────────────────────────────────

    @GetMapping("/api/admin/tracking/page-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getPageStats(
            @RequestParam(defaultValue = "7") int days) {
        try {
            LocalDateTime since = LocalDateTime.now().minusDays(days);

            List<Map<String, Object>> allTime = pageViewRepo.countByPagePath()
                    .stream()
                    .map(row -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("path",   row[0]);
                        m.put("visits", row[1]);
                        return m;
                    })
                    .collect(Collectors.toList());

            List<Map<String, Object>> recent = pageViewRepo.countByPagePathSince(since)
                    .stream()
                    .map(row -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("path",   row[0]);
                        m.put("visits", row[1]);
                        return m;
                    })
                    .collect(Collectors.toList());

            List<Map<String, Object>> uniqueUsers = pageViewRepo.uniqueUsersByPageSince(since)
                    .stream()
                    .map(row -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("path",        row[0]);
                        m.put("uniqueUsers", row[1]);
                        return m;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "allTime",     allTime,
                    "last" + days + "Days", recent,
                    "uniqueUsers", uniqueUsers,
                    "totalVisits", pageViewRepo.count()
            ));
        } catch (Exception e) {
            log.error("Error fetching page stats", e);
            return ResponseEntity.ok(Map.of("allTime", List.of(), "totalVisits", 0));
        }
    }

    @GetMapping("/api/admin/tracking/event-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getEventStats(
            @RequestParam(defaultValue = "7") int days) {
        try {
            LocalDateTime since = LocalDateTime.now().minusDays(days);

            List<Map<String, Object>> allTime = userEventRepo.countByEventType()
                    .stream()
                    .map(row -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("eventType", row[0]);
                        m.put("count",     row[1]);
                        return m;
                    })
                    .collect(Collectors.toList());

            List<Map<String, Object>> recent = userEventRepo.countByEventTypeSince(since)
                    .stream()
                    .map(row -> {
                        Map<String, Object> m = new LinkedHashMap<>();
                        m.put("eventType", row[0]);
                        m.put("count",     row[1]);
                        return m;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "allTime",  allTime,
                    "recent",   recent,
                    "totalEvents", userEventRepo.count()
            ));
        } catch (Exception e) {
            log.error("Error fetching event stats", e);
            return ResponseEntity.ok(Map.of("allTime", List.of(), "totalEvents", 0));
        }
    }

    @GetMapping("/api/admin/tracking/daily")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getDailyVisits(
            @RequestParam(defaultValue = "30") int days) {
        try {
            LocalDateTime since = LocalDateTime.now().minusDays(days);
            return ResponseEntity.ok(
                    pageViewRepo.dailyVisitsSince(since)
                            .stream()
                            .map(row -> {
                                Map<String, Object> m = new LinkedHashMap<>();
                                m.put("date",   String.valueOf(row[0]));
                                m.put("visits", row[1]);
                                return m;
                            })
                            .collect(Collectors.toList())
            );
        } catch (Exception e) {
            log.error("Error fetching daily visits", e);
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/api/admin/tracking/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getRecentViews() {
        try {
            return ResponseEntity.ok(
                    pageViewRepo.findTop50ByOrderByViewedAtDesc()
                            .stream()
                            .map(pv -> {
                                Map<String, Object> m = new LinkedHashMap<>();
                                m.put("userId",    pv.getUserId());
                                m.put("path",      pv.getPagePath());
                                m.put("title",     pv.getPageTitle());
                                m.put("viewedAt",  pv.getViewedAt() != null ? pv.getViewedAt().toString() : null);
                                m.put("sessionId", pv.getSessionId());
                                return m;
                            })
                            .collect(Collectors.toList())
            );
        } catch (Exception e) {
            log.error("Error fetching recent views", e);
            return ResponseEntity.ok(List.of());
        }
    }
}
