package com.learnsystem.controller;

import com.learnsystem.dto.*;
import com.learnsystem.service.ComplexityAnalyzer;
import com.learnsystem.service.EvaluationService;
import com.learnsystem.service.ExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ExecutionController {

    private final ExecutionService  executionService;
    private final EvaluationService evaluationService;
    private final ComplexityAnalyzer complexityAnalyzer;

    // POST /api/execute — run code freely
    @PostMapping("/execute")
    public ResponseEntity<ExecuteResponse> execute(@Valid @RequestBody ExecuteRequest request) {
        log.debug("Execute: javaVersion={} codeLength={}", request.getJavaVersion(), request.getCode() != null ? request.getCode().length() : 0);
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
    @PostMapping("/syntax-check")
    public ResponseEntity<SyntaxCheckResponse> syntaxCheck(@RequestBody ExecuteRequest request) {
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