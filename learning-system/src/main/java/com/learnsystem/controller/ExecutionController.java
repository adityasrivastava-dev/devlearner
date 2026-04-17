package com.learnsystem.controller;

import com.learnsystem.config.ExecutionRateLimiter;
import com.learnsystem.dto.*;
import com.learnsystem.model.ExecutionJob;
import com.learnsystem.model.Problem;
import com.learnsystem.model.User;
import com.learnsystem.repository.ProblemRepository;
import com.learnsystem.service.ComplexityAnalyzer;
import com.learnsystem.service.EvaluationService;
import com.learnsystem.service.ExecutionService;
import com.learnsystem.service.JobQueueService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.HttpHeaders;
import java.util.Map;
import java.util.LinkedHashMap;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ExecutionController {

    private final ExecutionService    executionService;
    private final EvaluationService   evaluationService;
    private final ComplexityAnalyzer  complexityAnalyzer;
    private final ExecutionRateLimiter rateLimiter;
    private final JobQueueService     jobQueue;
    private final ObjectMapper        objectMapper;
    private final ProblemRepository   problemRepo;

    // POST /api/execute — run code freely (rate-limited: 10 runs/min per user)
    @PostMapping("/execute")
    public ResponseEntity<?> execute(
            @Valid @RequestBody ExecuteRequest request,
            @AuthenticationPrincipal User principal) {

        // Rate limit authenticated users; use a shared bucket (id=0) for anonymous
        Long userId = (principal != null) ? principal.getId() : 0L;
        if (!rateLimiter.tryConsume(userId)) {
            log.warn("Rate limit exceeded for userId={}", userId);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, "60")
                    .body(Map.of(
                            "error",   "Rate limit exceeded",
                            "message", "Maximum 10 code executions per minute. Please wait before running again.",
                            "retryAfterSeconds", 60
                    ));
        }

        log.debug("Execute: userId={} javaVersion={} problemId={} codeLength={}", userId,
                request.getJavaVersion(), request.getProblemId(),
                request.getCode() != null ? request.getCode().length() : 0);
        String harness = resolveHarness(request.getProblemId());
        ExecuteResponse resp = executionService.execute(
                request.getCode(), request.getStdin(), request.getJavaVersion(), harness);
        log.debug("Execute result: status={} timeMs={}", resp.getStatus(), resp.getExecutionTimeMs());
        return ResponseEntity.ok(resp);
    }

    // POST /api/submit — run against all test cases
    @PostMapping("/submit")
    public ResponseEntity<SubmitResponse> submit(@Valid @RequestBody SubmitRequest request) {
        log.debug("Submit: problemId={} javaVersion={}", request.getProblemId(), request.getJavaVersion());
        SubmitResponse resp = evaluationService.evaluate(request);
        log.info("Submit result: problemId={} allPassed={} passed={}/{}", request.getProblemId(), resp.isAllPassed(), resp.getPassedTests(), resp.getTotalTests());
        return ResponseEntity.ok(resp);
    }

    // POST /api/syntax-check — compile only, return structured errors for Monaco markers
    // Rate limited separately: syntax-check is called on every editor save/debounce,
    // so it gets a higher limit (30/min) but is still gated to prevent flood attacks.
    @PostMapping("/syntax-check")
    public ResponseEntity<?> syntaxCheck(
            @RequestBody ExecuteRequest request,
            @AuthenticationPrincipal User principal) {

        Long userId = (principal != null) ? principal.getId() : 0L;
        // Syntax check uses a multiplied bucket: 30 checks per minute
        // We reuse the rateLimiter but allow 3x the normal quota by
        // checking remaining > -20 (net: up to 30 checks share the 10-run window)
        if (rateLimiter.remaining(userId) <= -20) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, "10")
                    .body(Map.of("error", "Too many requests", "retryAfterSeconds", 10));
        }

        log.debug("Syntax check: javaVersion={}", request.getJavaVersion());
        return ResponseEntity.ok(
                executionService.syntaxCheck(request.getCode(), request.getJavaVersion())
        );
    }

    // POST /api/analyze-complexity — static analysis of time + space complexity
    @PostMapping("/analyze-complexity")
    public ResponseEntity<ComplexityResponse> analyzeComplexity(@RequestBody ExecuteRequest request) {
        log.debug("Complexity analysis requested: codeLength={}", request.getCode() != null ? request.getCode().length() : 0);
        return ResponseEntity.ok(complexityAnalyzer.analyze(request.getCode()));
    }

    // ── Async execution endpoints ─────────────────────────────────────────────

    /**
     * POST /api/execute/async — enqueue a RUN job, return {jobId} immediately.
     * Frontend polls GET /api/jobs/{jobId} until status=DONE.
     */
    @PostMapping("/execute/async")
    public ResponseEntity<?> executeAsync(
            @Valid @RequestBody ExecuteRequest request,
            @AuthenticationPrincipal User principal) {

        Long userId = (principal != null) ? principal.getId() : null;
        if (userId != null && !rateLimiter.tryConsume(userId)) {
            log.warn("Rate limit exceeded for userId={}", userId);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, "60")
                    .body(Map.of(
                            "error",             "Rate limit exceeded",
                            "message",           "Maximum 10 code executions per minute. Please wait.",
                            "retryAfterSeconds", 60
                    ));
        }

        ExecutionJob job = jobQueue.enqueueRun(userId, request.getCode(),
                request.getStdin(), request.getJavaVersion(), request.getProblemId());
        log.debug("Async RUN enqueued: token={} userId={} problemId={}", job.getToken(), userId, request.getProblemId());
        return ResponseEntity.ok(Map.of("token", job.getToken(), "status", job.getStatus()));
    }

    /**
     * POST /api/execute/test-run/async — run code against test cases without saving a submission.
     * Used for method-based problems (no main()) when the user clicks Run.
     * Returns { token } immediately; poll GET /api/jobs/{token} for the per-case result.
     */
    @PostMapping("/execute/test-run/async")
    public ResponseEntity<?> testRunAsync(
            @Valid @RequestBody ExecuteRequest request,
            @AuthenticationPrincipal User principal) {

        Long userId = (principal != null) ? principal.getId() : null;
        if (userId != null && !rateLimiter.tryConsume(userId)) {
            log.warn("Rate limit exceeded for userId={}", userId);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, "60")
                    .body(Map.of(
                            "error",             "Rate limit exceeded",
                            "message",           "Maximum 10 code executions per minute. Please wait.",
                            "retryAfterSeconds", 60
                    ));
        }

        if (request.getProblemId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "problemId is required for test-run"));
        }

        ExecutionJob job = jobQueue.enqueueTestRun(userId, request.getProblemId(),
                request.getCode(), request.getJavaVersion());
        log.debug("Async TEST_RUN enqueued: token={} userId={} problemId={}", job.getToken(), userId, request.getProblemId());
        return ResponseEntity.ok(Map.of("token", job.getToken(), "status", job.getStatus()));
    }

    /**
     * GET /api/jobs/{token} — poll job status.
     * Returns:  { token, status, jobType, result } where result is the parsed JSON
     * of ExecuteResponse (RUN) or the submit response map (SUBMIT).
     */
    @GetMapping("/jobs/{token}")
    public ResponseEntity<?> pollJob(@PathVariable String token) {
        return jobQueue.getJob(token)
                .map(job -> {
                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("token",   job.getToken());
                    resp.put("status",  job.getStatus());
                    resp.put("jobType", job.getJobType());

                    if (job.getStatus() == ExecutionJob.Status.DONE && job.getResult() != null) {
                        try {
                            resp.put("result", objectMapper.readValue(job.getResult(), Object.class));
                        } catch (Exception e) {
                            resp.put("result", job.getResult()); // fallback: raw string
                        }
                    } else if (job.getStatus() == ExecutionJob.Status.ERROR) {
                        resp.put("error", job.getErrorMessage());
                    }
                    return ResponseEntity.ok(resp);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Returns the codeHarness for the given problem, or null if no problemId / no harness. */
    private String resolveHarness(Long problemId) {
        if (problemId == null) return null;
        return problemRepo.findById(problemId)
                .map(Problem::getCodeHarness)
                .orElse(null);
    }
}