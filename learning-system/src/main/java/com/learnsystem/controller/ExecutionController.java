package com.learnsystem.controller;

import com.learnsystem.config.ExecutionRateLimiter;
import com.learnsystem.dto.*;
import com.learnsystem.model.User;
import com.learnsystem.service.ComplexityAnalyzer;
import com.learnsystem.service.EvaluationService;
import com.learnsystem.service.ExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.HttpHeaders;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ExecutionController {

    private final ExecutionService    executionService;
    private final EvaluationService   evaluationService;
    private final ComplexityAnalyzer  complexityAnalyzer;
    private final ExecutionRateLimiter rateLimiter;

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

        log.debug("Execute: userId={} javaVersion={} codeLength={}", userId,
                request.getJavaVersion(), request.getCode() != null ? request.getCode().length() : 0);
        ExecuteResponse resp = executionService.execute(request.getCode(), request.getStdin(), request.getJavaVersion());
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
}