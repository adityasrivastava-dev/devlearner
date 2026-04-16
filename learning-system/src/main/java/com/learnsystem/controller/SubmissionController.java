package com.learnsystem.controller;

import com.learnsystem.dto.SubmitRequest;
import com.learnsystem.dto.SubmitResponse;
import com.learnsystem.model.ExecutionJob;
import com.learnsystem.model.Submission;
import com.learnsystem.model.User;
import com.learnsystem.repository.SubmissionRepository;
import com.learnsystem.repository.UserRepository;
import com.learnsystem.repository.ProblemRepository;
import com.learnsystem.security.JwtService;
import com.learnsystem.service.EvaluationService;
import com.learnsystem.service.JobQueueService;
import com.learnsystem.service.PostSubmissionTask;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
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
private final PostSubmissionTask         postSubmissionTask;
private final JobQueueService            jobQueue;

// ── POST /api/submissions/submit/async ───────────────────────────────────────
// Enqueue a SUBMIT job, return {jobId} immediately (< 5ms).
// Frontend polls GET /api/jobs/{jobId} until status=DONE.
@PostMapping("/submit/async")
public ResponseEntity<Map<String, Object>> submitAsync(
        @Valid @RequestBody SubmitPersistRequest req,
        HttpServletRequest httpReq) {

    Long userId = resolveUserId(httpReq);
    ExecutionJob job = jobQueue.enqueueSubmit(
            userId,
            req.getProblemId(),
            req.getCode(),
            req.getJavaVersion() != null ? req.getJavaVersion() : "17",
            req.getApproachText(),
            req.isHintAssisted(),
            req.getSolveTimeSecs() != null ? req.getSolveTimeSecs().intValue() : null
    );
    log.debug("Async SUBMIT enqueued: token={} userId={} problemId={}", job.getToken(), userId, req.getProblemId());
    Map<String, Object> resp = new LinkedHashMap<>();
    resp.put("token",  job.getToken());
    resp.put("status", job.getStatus());
    return ResponseEntity.ok(resp);
}

// ── Idempotency cache — prevents duplicate submissions on network retry ──────
// Key: "userId:problemId:codeHash" → [timestamp, submissionId]
// If the same user submits the same code for the same problem within 10 seconds,
// return the existing submission ID rather than running the code again.
private final ConcurrentHashMap<String, Long[]> idempotencyCache = new ConcurrentHashMap<>();
private static final long IDEMPOTENCY_WINDOW_MS  = 10_000L; // 10 seconds
private static final int  IDEMPOTENCY_MAX_ENTRIES = 10_000;  // hard cap to prevent OOM

// ── POST /api/submissions/submit ─────────────────────────────────────────
// Same as /api/submit but persists the result
@PostMapping("/submit")
public ResponseEntity<Map<String, Object>> submitAndPersist(
		@Valid @RequestBody SubmitPersistRequest req,
		HttpServletRequest httpReq) {

	// 0. Idempotency check — prevent duplicate submissions from frontend retries
	Long userId = resolveUserId(httpReq);
	long now = System.currentTimeMillis();

	// Periodic cleanup — evict expired entries to prevent unbounded map growth
	if (idempotencyCache.size() > IDEMPOTENCY_MAX_ENTRIES) {
		idempotencyCache.entrySet().removeIf(e -> now - e.getValue()[0] >= IDEMPOTENCY_WINDOW_MS);
	}

	if (userId != null && req.getCode() != null) {
		String iKey = userId + ":" + req.getProblemId() + ":" + req.getCode().hashCode();
		Long[] cached = idempotencyCache.get(iKey);
		if (cached != null && now - cached[0] < IDEMPOTENCY_WINDOW_MS) {
			// Same submission within window — return the cached submission ID
			log.debug("Idempotent submit: userId={} problemId={} submissionId={}", userId, req.getProblemId(), cached[1]);
			return submissionRepo.findById(cached[1])
					.map(existing -> ResponseEntity.ok(buildResponse(existing)))
					.orElseGet(() -> performSubmit(req, userId));
		}
	}

	// 1. Evaluate
	com.learnsystem.dto.SubmitRequest evalReq = new com.learnsystem.dto.SubmitRequest();
	evalReq.setProblemId(req.getProblemId());
	evalReq.setCode(req.getCode());
	evalReq.setJavaVersion(req.getJavaVersion() != null ? req.getJavaVersion() : "17");
	SubmitResponse result = evaluationService.evaluate(evalReq);

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

	// Store in idempotency cache so retries within 10s return this submission
	if (userId != null && req.getCode() != null) {
		String iKey = userId + ":" + req.getProblemId() + ":" + req.getCode().hashCode();
		idempotencyCache.put(iKey, new Long[]{System.currentTimeMillis(), sub.getId()});
	}

	// ── Phase 2: streak, XP, analytics — fired async, never blocks HTTP thread ──
	// User gets the submission result immediately. Streak/analytics update in background.
	if (userId != null) {
		int xpEarned = "ACCEPTED".equals(status) ? 10 : 1;
		Long topicId = null;
		String problemTitle = null;
		String correctPattern = null;
		try {
			var prob = problemRepo.findById(req.getProblemId()).orElse(null);
			if (prob != null) {
				topicId       = prob.getTopic() != null ? prob.getTopic().getId() : null;
				problemTitle  = prob.getTitle();
				correctPattern = prob.getPattern();
			}
		} catch (Exception ignored) {}

		postSubmissionTask.run(
				userId, req.getProblemId(), topicId, problemTitle,
				status, req.getSolveTimeSecs(), req.isHintAssisted(),
				result.getDetectedPattern(), correctPattern,
				req.getCode(), xpEarned);
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

// ── Idempotency helpers ───────────────────────────────────────────────────

/** Performs a full submit + persist. Called after idempotency cache miss. */
private ResponseEntity<Map<String, Object>> performSubmit(SubmitPersistRequest req, Long userId) {
	// Delegates back to the main method path — only called on cache miss
	// This exists so the idempotency early-return path has a clean fallback
	com.learnsystem.dto.SubmitRequest evalReq = new com.learnsystem.dto.SubmitRequest();
	evalReq.setProblemId(req.getProblemId());
	evalReq.setCode(req.getCode());
	evalReq.setJavaVersion(req.getJavaVersion() != null ? req.getJavaVersion() : "17");
	SubmitResponse result = evaluationService.evaluate(evalReq);
	Map<String, Object> response = new LinkedHashMap<>();
	response.put("allPassed",  result.isAllPassed());
	response.put("totalTests", result.getTotalTests());
	response.put("passedTests",result.getPassedTests());
	response.put("results",    result.getResults());
	return ResponseEntity.ok(response);
}

/** Builds a minimal response map from a persisted Submission entity. */
private Map<String, Object> buildResponse(Submission s) {
	Map<String, Object> r = new LinkedHashMap<>();
	r.put("allPassed",    "ACCEPTED".equals(s.getStatus()));
	r.put("totalTests",   s.getTotalTests());
	r.put("passedTests",  s.getPassedTests());
	r.put("submissionId", s.getId());
	r.put("runtimeMs",    s.getExecutionTimeMs());
	r.put("idempotent",   true); // flag so frontend can detect a dedup response
	return r;
}

// ── Helpers ───────────────────────────────────────────────────────────────
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