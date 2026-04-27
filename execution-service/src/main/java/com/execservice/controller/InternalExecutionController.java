package com.execservice.controller;

import com.execservice.dto.*;
import com.execservice.service.EvaluationService;
import com.execservice.service.ExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * Internal execution endpoints — called only by the main API's ExecutionClient.
 * No authentication: these endpoints must NOT be exposed to the public internet.
 * Deploy behind a private network (Render private networking, VPC, etc.).
 */
@Slf4j
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalExecutionController {

    private final ExecutionService  executionService;
    private final EvaluationService evaluationService;

    /**
     * Run code with optional stdin — same as the main API's /api/execute.
     * No test cases evaluated, no submission saved.
     */
    @PostMapping("/execute")
    public ExecuteResponse execute(@Valid @RequestBody InternalExecuteRequest req) {
        log.debug("execute request: javaVersion={} stdinLen={}",
                req.getJavaVersion(), req.getStdin() != null ? req.getStdin().length() : 0);
        return executionService.execute(
                req.getCode(), req.getStdin(), req.getJavaVersion(), req.getHarness());
    }

    /**
     * Evaluate code against provided test cases.
     * Test cases are sent in the request — this service has no DB access.
     * The main API fetches hidden test cases and includes them here.
     */
    @PostMapping("/submit")
    public SubmitResponse submit(@Valid @RequestBody InternalSubmitRequest req) {
        log.debug("submit request: javaVersion={} testCases={}",
                req.getJavaVersion(), req.getTestCases() != null ? req.getTestCases().size() : 0);
        return evaluationService.evaluate(req);
    }

    /**
     * Syntax check only — no execution, no test cases.
     * Used by the editor's Monaco squiggles feature.
     */
    @PostMapping("/syntax-check")
    public SyntaxCheckResponse syntaxCheck(@Valid @RequestBody InternalSyntaxCheckRequest req) {
        return executionService.syntaxCheck(req.getCode(), req.getJavaVersion());
    }

    /** Health check for the main API to verify the execution service is reachable. */
    @GetMapping("/health")
    public java.util.Map<String, Object> health() {
        return java.util.Map.of("status", "UP", "service", "execution-service");
    }
}
