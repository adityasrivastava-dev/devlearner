package com.learnsystem.controller;

import com.learnsystem.dto.DebugRequest;
import com.learnsystem.dto.DebugResponse;
import com.learnsystem.service.DebugService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Live step-by-step debugger.
 *
 * POST /api/debug
 * Body: { "code": "...", "stdin": "", "javaVersion": "17" }
 *
 * Returns a list of DebugStep objects — one per variable change —
 * plus the clean stdout output with debug lines stripped.
 *
 * Each DebugStep contains:
 *   - lineNumber  : which original source line triggered the snapshot
 *   - lineCode    : the source line text
 *   - variables   : map of all tracked variable names → current values
 *   - phase       : DECLARE | ASSIGN | LOOP | CONDITION | STATEMENT
 */
@Slf4j
@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

    private final DebugService debugService;

    @PostMapping
    public ResponseEntity<DebugResponse> debug(@RequestBody DebugRequest request) {
        log.debug("Debug requested: codeLength={}", request.getCode() != null ? request.getCode().length() : 0);
        DebugResponse resp = debugService.debug(request);
        log.debug("Debug result: steps={}", resp.getSteps() != null ? resp.getSteps().size() : 0);
        return ResponseEntity.ok(resp);
    }
}
