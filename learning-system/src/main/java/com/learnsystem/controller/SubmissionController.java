package com.learnsystem.controller;

import com.learnsystem.dto.SubmitRequest;
import com.learnsystem.dto.SubmitResponse;
import com.learnsystem.model.Submission;
import com.learnsystem.model.User;
import com.learnsystem.repository.SubmissionRepository;
import com.learnsystem.repository.UserRepository;
import com.learnsystem.repository.ProblemRepository;
import com.learnsystem.security.JwtService;
import com.learnsystem.service.EvaluationService;
import com.learnsystem.service.UserProgressService;
import com.learnsystem.service.StreakService;
import com.learnsystem.service.PerformanceAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Wraps the existing /api/submit endpoint with:
 *  - submission persistence (saves every submit to DB)
 *  - GET /api/submissions?problemId=X  — history for current user
 *  - GET /api/submissions/percentile?problemId=X&ms=Y — runtime percentile
 *
 * The original POST /api/submit in ExecutionController still works unchanged.
 * This controller adds a SECOND endpoint POST /api/submissions/submit that
 * persists the result.  Frontend should call /api/submissions/submit going forward.
 */
@Slf4j
@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {

private final EvaluationService          evaluationService;
private final SubmissionRepository       submissionRepo;
private final UserRepository             userRepo;
private final ProblemRepository          problemRepo;
private final JwtService                 jwtService;
private final UserProgressService        userProgressService;
private final StreakService              streakService;
private final PerformanceAnalyticsService analyticsService;

// ── POST /api/submissions/submit ─────────────────────────────────────────
// Same as /api/submit but persists the result
@PostMapping("/submit")
public ResponseEntity<Map<String, Object>> submitAndPersist(
		@Valid @RequestBody SubmitPersistRequest req,
		HttpServletRequest httpReq) {

	// 1. Evaluate
	com.learnsystem.dto.SubmitRequest evalReq = new com.learnsystem.dto.SubmitRequest();
	evalReq.setProblemId(req.getProblemId());
	evalReq.setCode(req.getCode());
	evalReq.setJavaVersion(req.getJavaVersion() != null ? req.getJavaVersion() : "17");
	SubmitResponse result = evaluationService.evaluate(evalReq);

	// 2. Resolve current user (optional — anonymous submits allowed)
	Long userId = resolveUserId(httpReq);

	// 3. Determine max execution time across test cases
	long maxMs = result.getResults() == null ? 0L :
			result.getResults().stream()
					.mapToLong(SubmitResponse.TestCaseResult::getExecutionTimeMs)
					.max().orElse(0L);

	// 4. Map status
	String status = result.isAllPassed() ? "ACCEPTED" : "WRONG_ANSWER";
	if (result.getResults() != null && result.getResults().stream()
			.anyMatch(r -> "COMPILE_ERROR".equals(r.getStatus()))) status = "COMPILE_ERROR";
	if (result.getResults() != null && result.getResults().stream()
			.anyMatch(r -> "RUNTIME_ERROR".equals(r.getStatus()))) status = "RUNTIME_ERROR";
	if (result.getResults() != null && result.getResults().stream()
			.anyMatch(r -> "TIMEOUT".equals(r.getStatus()))) status = "TLE";

	// 5. Save submission
	Submission sub = Submission.builder()
			.userId(userId)
			.problemId(req.getProblemId())
			.status(status)
			.passedTests(result.getPassedTests())
			.totalTests(result.getTotalTests())
			.executionTimeMs(maxMs)
			.solveTimeSecs(req.getSolveTimeSecs())
			.code(req.getCode())
			.hintAssisted(req.isHintAssisted())
			.javaVersion(req.getJavaVersion())
			.approachText(req.getApproachText())
			.build();

	submissionRepo.save(sub);
	log.info("Submission saved: user={} problem={} status={} ms={}",
			userId, req.getProblemId(), status, maxMs);

	// ── Phase 1 + Phase 2: streak engine, XP, problems_solved ───────────────
	// StreakService.onDailyActivity handles streak, XP, lastActiveDate.
	// UserProgressService.onAccepted also updates streak via lastLogin — REMOVED
	// to prevent double-counting. StreakService is the single source of truth.
	try {
		int xpEarned = "ACCEPTED".equals(status) ? 10 : 1;
		streakService.onDailyActivity(userId, xpEarned);

		// Also recount problems_solved from DB (streak service doesn't do this)
		userProgressService.onAccepted(userId);

		// Resolve topicId for analytics
		Long topicId = null;
		String problemTitle = null;
		String correctPattern = null;
		try {
			var prob = problemRepo.findById(req.getProblemId()).orElse(null);
			if (prob != null) {
				topicId      = prob.getTopic() != null ? prob.getTopic().getId() : null;
				problemTitle = prob.getTitle();
				correctPattern = prob.getPattern();
			}
		} catch (Exception ignored) {}

		analyticsService.onSubmission(
				userId, req.getProblemId(), topicId, problemTitle,
				status, req.getSolveTimeSecs(), req.isHintAssisted(),
				result.getDetectedPattern(), correctPattern,
				req.getCode()
		);
	} catch (Exception e) {
		log.warn("Phase 2 analytics error (non-critical): {}", e.getMessage());
	}

	// 6. Compute percentile if accepted
	Map<String, Object> extra = new LinkedHashMap<>();
	if (result.isAllPassed() && maxMs > 0) {
		try {
			long total   = submissionRepo.countAcceptedByProblemId(req.getProblemId());
			long slower  = submissionRepo.countAcceptedSlowerThan(req.getProblemId(), maxMs);
			if (total > 1) {
				double pct = Math.round((double) slower / total * 100.0);
				extra.put("percentile", pct);
				extra.put("fasterThan", (int) pct);
				extra.put("totalAccepted", total);
				extra.put("runtimeMs", maxMs);
			}
		} catch (Exception e) {
			log.warn("Percentile calc failed: {}", e.getMessage());
		}
	}

	// 7. Return combined response
	Map<String, Object> response = new LinkedHashMap<>();
	response.put("allPassed",              result.isAllPassed());
	response.put("totalTests",             result.getTotalTests());
	response.put("passedTests",            result.getPassedTests());
	response.put("hint",                   result.getHint());
	response.put("results",                result.getResults());
	response.put("submissionId",           sub.getId());
	response.put("runtimeMs",              maxMs);
	// Smart feedback — algorithm detection
	response.put("detectedPattern",        result.getDetectedPattern());
	response.put("methodologyExplanation", result.getMethodologyExplanation());
	response.put("optimizationNote",       result.getOptimizationNote());
	response.putAll(extra);

	return ResponseEntity.ok(response);
}

// ── GET /api/submissions?problemId=X&size=N ───────────────────────────────
// Default cap: 50 rows. Caller can request up to 200.
@GetMapping
public ResponseEntity<List<Map<String, Object>>> getHistory(
		@RequestParam(required = false) Long   problemId,
		@RequestParam(defaultValue = "50") int size,
		HttpServletRequest httpReq) {

	Long userId = resolveUserId(httpReq);
	if (userId == null) return ResponseEntity.ok(List.of());

	size = Math.min(size, 200);
	var pageable = PageRequest.of(0, size);

	List<Submission> subs = problemId != null
			? submissionRepo.findRecentByUserIdAndProblemId(userId, problemId, pageable)
			: submissionRepo.findRecentByUserId(userId, pageable);

	List<Map<String, Object>> out = subs.stream().map(s -> {
		Map<String, Object> m = new LinkedHashMap<>();
		m.put("id",              s.getId());
		m.put("problemId",       s.getProblemId());
		m.put("status",          s.getStatus());
		m.put("passedTests",     s.getPassedTests());
		m.put("totalTests",      s.getTotalTests());
		m.put("executionTimeMs", s.getExecutionTimeMs());
		m.put("solveTimeSecs",   s.getSolveTimeSecs());
		m.put("hintAssisted",    s.getHintAssisted());
		m.put("createdAt",       s.getCreatedAt() != null ? s.getCreatedAt().toString() : null);
		return m;
	}).collect(Collectors.toList());

	return ResponseEntity.ok(out);
}

// ── GET /api/submissions/solved ───────────────────────────────────────────
@GetMapping("/solved")
public ResponseEntity<List<Long>> getSolvedIds(HttpServletRequest httpReq) {
	Long userId = resolveUserId(httpReq);
	if (userId == null) return ResponseEntity.ok(List.of());
	return ResponseEntity.ok(submissionRepo.findSolvedProblemIdsByUserId(userId));
}

// ── GET /api/submissions/heatmap ──────────────────────────────────────────
@GetMapping("/heatmap")
public ResponseEntity<Map<String, Long>> getHeatmap(HttpServletRequest httpReq) {
	Long userId = resolveUserId(httpReq);
	if (userId == null) return ResponseEntity.ok(Map.of());
	List<Object[]> rows = submissionRepo.findDailyActivityForUser(userId);
	Map<String, Long> result = new LinkedHashMap<>();
	for (Object[] row : rows) {
		result.put((String) row[0], ((Number) row[1]).longValue());
	}
	return ResponseEntity.ok(result);
}

// ── GET /api/submissions/percentile?problemId=X&ms=Y ─────────────────────
@GetMapping("/percentile")
public ResponseEntity<Map<String, Object>> getPercentile(
		@RequestParam Long problemId,
		@RequestParam Long ms) {

	long total  = submissionRepo.countAcceptedByProblemId(problemId);
	long slower = submissionRepo.countAcceptedSlowerThan(problemId, ms);

	Map<String, Object> resp = new LinkedHashMap<>();
	resp.put("problemId",    problemId);
	resp.put("runtimeMs",    ms);
	resp.put("totalAccepted",total);

	if (total == 0) {
		resp.put("percentile", 100);
		resp.put("fasterThan", 100);
		resp.put("message", "First accepted submission!");
	} else {
		double pct = Math.round((double) slower / total * 100.0);
		resp.put("percentile", pct);
		resp.put("fasterThan", (int) pct);
		resp.put("message", String.format("Faster than %.0f%% of accepted Java submissions", pct));
	}

	return ResponseEntity.ok(resp);
}

// ── Helpers ──────────────────────────────────────────────────────────────
private Long resolveUserId(HttpServletRequest req) {
	try {
		String authHeader = req.getHeader("Authorization");
		if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
		String token = authHeader.substring(7);
		String email = jwtService.getEmailFromToken(token);
		return userRepo.findByEmail(email).map(User::getId).orElse(null);
	} catch (Exception e) {
		return null;
	}
}

// ── Inner DTO ─────────────────────────────────────────────────────────────
@lombok.Data
public static class SubmitPersistRequest {
	@jakarta.validation.constraints.NotNull
	private Long    problemId;
	@jakarta.validation.constraints.NotBlank
	private String  code;
	private Long    solveTimeSecs;
	private boolean hintAssisted;
	private String  javaVersion = "17";
	private String  approachText;
}
}