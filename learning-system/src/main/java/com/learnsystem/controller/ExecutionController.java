package com.learnsystem.controller;

import com.learnsystem.dto.*;
import com.learnsystem.service.EvaluationService;
import com.learnsystem.service.ExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ExecutionController {

    private final ExecutionService  executionService;
    private final EvaluationService evaluationService;

    // POST /api/execute — run code freely
    @PostMapping("/execute")
    public ResponseEntity<ExecuteResponse> execute(@Valid @RequestBody ExecuteRequest request) {
        return ResponseEntity.ok(executionService.execute(request.getCode(), request.getStdin()));
    }

    // POST /api/submit — run against all test cases
    @PostMapping("/submit")
    public ResponseEntity<SubmitResponse> submit(@Valid @RequestBody SubmitRequest request) {
        return ResponseEntity.ok(evaluationService.evaluate(request));
    }

    // POST /api/syntax-check — compile only, return structured errors for Monaco markers
    @PostMapping("/syntax-check")
    public ResponseEntity<SyntaxCheckResponse> syntaxCheck(@RequestBody ExecuteRequest request) {
        return ResponseEntity.ok(executionService.syntaxCheck(request.getCode()));
    }
}
