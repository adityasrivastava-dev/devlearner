package com.learnsystem.controller;

import com.learnsystem.model.*;
import com.learnsystem.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Daily Challenge + Leaderboard
 *
 * Public:
 *   GET  /api/daily                → today's challenge (problem + solve count)
 *   GET  /api/daily/leaderboard    → top 50 solvers for today
 *   GET  /api/daily/history        → last 7 challenges
 *
 * Authenticated:
 *   GET  /api/daily/my-status      → did I solve today?
 *   POST /api/daily/solve          → record a solve
 *   POST /api/daily/start          → record when user opened the challenge (returns startTime)
 *
 * Admin:
 *   POST /api/admin/daily/set      → { problemId, date? }
 *   GET  /api/admin/daily/list     → all challenges
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class DailyChallengeController {

    private final DailyChallengeRepository challengeRepo;
    private final DailySolveRepository     solveRepo;
    private final ProblemRepository        problemRepo;
    private final UserRepository           userRepo;

    // ─────────────────────────────────────────────────────────────────────────────
    // PUBLIC / AUTHENTICATED
    // ─────────────────────────────────────────────────────────────────────────────

    @GetMapping("/api/daily")
    public ResponseEntity<Map<String, Object>> getToday() {
        return buildChallengeResponse(LocalDate.now());
    }

    @GetMapping("/api/daily/leaderboard")
    public ResponseEntity<List<Map<String, Object>>> getLeaderboard(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate target = (date != null) ? date : LocalDate.now();
        try {
            List<DailySolve> solves = solveRepo.findLeaderboardForDate(target, PageRequest.of(0, 50));
            Set<Long> userIds = solves.stream().map(DailySolve::getUserId).collect(Collectors.toSet());
            Map<Long, String> names = userRepo.findAllById(userIds).stream()
                    .collect(Collectors.toMap(User::getId, u -> u.getName() != null ? u.getName() : u.getEmail().split("@")[0]));

            List<Map<String, Object>> board = new ArrayList<>();
            for (int i = 0; i < solves.size(); i++) {
                DailySolve s = solves.get(i);
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("rank",        i + 1);
                row.put("userId",      s.getUserId());
                row.put("username",    names.getOrDefault(s.getUserId(), "Anonymous"));
                row.put("timeMs",      s.getTimeToSolveMs());
                row.put("attempts",    s.getSubmissionCount());
                row.put("solvedAt",    s.getSolvedAt() != null ? s.getSolvedAt().toString() : null);
                board.add(row);
            }
            return ResponseEntity.ok(board);
        } catch (Exception e) {
            log.error("Leaderboard error", e);
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/api/daily/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory() {
        try {
            List<DailyChallenge> recent = challengeRepo.findRecentWithProblems(PageRequest.of(0, 7));
            return ResponseEntity.ok(recent.stream().map(dc -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("date",       dc.getChallengeDate().toString());
                m.put("problemId",  dc.getProblem().getId());
                m.put("title",      dc.getProblem().getTitle());
                m.put("difficulty", dc.getProblem().getDifficulty());
                m.put("pattern",    dc.getProblem().getPattern());
                m.put("solves",     solveRepo.countByChallengeDate(dc.getChallengeDate()));
                return m;
            }).collect(Collectors.toList()));
        } catch (Exception e) {
            log.error("History error", e);
            return ResponseEntity.ok(List.of());
        }
    }

    @GetMapping("/api/daily/my-status")
    public ResponseEntity<Map<String, Object>> getMyStatus(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        LocalDate today = LocalDate.now();
        Optional<DailySolve> solve = solveRepo.findByUserIdAndChallengeDate(user.getId(), today);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("solved", solve.isPresent());
        solve.ifPresent(s -> {
            m.put("timeMs",   s.getTimeToSolveMs());
            m.put("attempts", s.getSubmissionCount());
            m.put("solvedAt", s.getSolvedAt() != null ? s.getSolvedAt().toString() : null);
        });
        m.put("totalParticipations", solveRepo.countByUserId(user.getId()));
        return ResponseEntity.ok(m);
    }

    @PostMapping("/api/daily/solve")
    public ResponseEntity<Map<String, Object>> recordSolve(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        LocalDate today = LocalDate.now();
        if (!challengeRepo.existsByChallengeDate(today)) {
            return ResponseEntity.badRequest().body(Map.of("error", "No challenge today"));
        }
        if (solveRepo.existsByUserIdAndChallengeDate(user.getId(), today)) {
            // Already solved — return existing solve
            DailySolve existing = solveRepo.findByUserIdAndChallengeDate(user.getId(), today).get();
            return ResponseEntity.ok(Map.of("message", "Already solved", "timeMs", existing.getTimeToSolveMs()));
        }
        long timeMs = body.get("timeMs") instanceof Number n ? n.longValue() : 0L;
        int  attempts = body.get("attempts") instanceof Number n ? n.intValue() : 1;

        DailySolve solve = DailySolve.builder()
                .userId(user.getId())
                .challengeDate(today)
                .timeToSolveMs(timeMs)
                .submissionCount(attempts)
                .build();
        solveRepo.save(solve);
        return ResponseEntity.ok(Map.of("message", "Solve recorded", "timeMs", timeMs));
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // ADMIN
    // ─────────────────────────────────────────────────────────────────────────────

    @PostMapping("/api/admin/daily/set")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> setChallenge(@RequestBody Map<String, Object> body) {
        try {
            Long problemId = body.get("problemId") instanceof Number n ? n.longValue() : null;
            if (problemId == null) return ResponseEntity.badRequest().body(Map.of("error", "problemId required"));

            String dateStr = (String) body.get("date");
            LocalDate date = (dateStr != null) ? LocalDate.parse(dateStr) : LocalDate.now();

            Problem problem = problemRepo.findById(problemId)
                    .orElseThrow(() -> new RuntimeException("Problem not found: " + problemId));

            // Upsert
            DailyChallenge dc = challengeRepo.findByChallengeDate(date)
                    .orElse(DailyChallenge.builder().challengeDate(date).build());
            dc.setProblem(problem);
            challengeRepo.save(dc);

            return ResponseEntity.ok(Map.of("message", "Challenge set", "date", date.toString(), "problemTitle", problem.getTitle()));
        } catch (Exception e) {
            log.error("Set challenge error", e);
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/api/admin/daily/list")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> listChallenges() {
        try {
            List<DailyChallenge> all = challengeRepo.findRecentWithProblems(PageRequest.of(0, 30));
            return ResponseEntity.ok(all.stream().map(dc -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",         dc.getId());
                m.put("date",       dc.getChallengeDate().toString());
                m.put("problemId",  dc.getProblem().getId());
                m.put("title",      dc.getProblem().getTitle());
                m.put("difficulty", dc.getProblem().getDifficulty());
                m.put("solves",     solveRepo.countByChallengeDate(dc.getChallengeDate()));
                return m;
            }).collect(Collectors.toList()));
        } catch (Exception e) {
            log.error("List challenges error", e);
            return ResponseEntity.ok(List.of());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────────

    private ResponseEntity<Map<String, Object>> buildChallengeResponse(LocalDate date) {
        try {
            Optional<DailyChallenge> opt = challengeRepo.findWithProblemByChallengeDate(date);
            if (opt.isEmpty()) return ResponseEntity.ok(Map.of("available", false));

            DailyChallenge dc = opt.get();
            Problem p = dc.getProblem();
            long solveCount = solveRepo.countByChallengeDate(date);

            Map<String, Object> m = new LinkedHashMap<>();
            m.put("available",   true);
            m.put("date",        date.toString());
            m.put("solveCount",  solveCount);
            m.put("problemId",   p.getId());
            m.put("title",       p.getTitle());
            m.put("difficulty",  p.getDifficulty() != null ? p.getDifficulty().name() : null);
            m.put("pattern",     p.getPattern());
            m.put("description", p.getDescription());
            m.put("inputFormat", p.getInputFormat());
            m.put("outputFormat",p.getOutputFormat());
            m.put("sampleInput", p.getSampleInput());
            m.put("sampleOutput",p.getSampleOutput());
            m.put("constraints", p.getConstraints());
            m.put("hint1",       p.getHint1());
            m.put("hint2",       p.getHint2());
            m.put("hint3",       p.getHint3());
            m.put("starterCode", p.getStarterCode());
            return ResponseEntity.ok(m);
        } catch (Exception e) {
            log.error("Daily challenge error", e);
            return ResponseEntity.ok(Map.of("available", false));
        }
    }
}
