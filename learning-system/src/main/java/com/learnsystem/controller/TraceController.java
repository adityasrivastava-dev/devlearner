package com.learnsystem.controller;

import com.learnsystem.dto.TraceRequest;
import com.learnsystem.model.TraceStep;
import com.learnsystem.service.TraceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trace")
@RequiredArgsConstructor
public class TraceController {

    private final TraceService traceService;

    // POST /api/trace
    // Body: { "algorithm": "BINARY_SEARCH", "array": [1,3,5,7,9,11,13], "target": 7 }
    @PostMapping
    public ResponseEntity<List<TraceStep>> trace(@Valid @RequestBody TraceRequest request) {
        return ResponseEntity.ok(traceService.generateTrace(request));
    }

    // GET /api/trace/algorithms — list supported algorithms for the UI dropdown
    @GetMapping("/algorithms")
    public ResponseEntity<List<String>> algorithms() {
        return ResponseEntity.ok(List.of("BINARY_SEARCH", "SLIDING_WINDOW", "TWO_POINTER"));
    }
}
