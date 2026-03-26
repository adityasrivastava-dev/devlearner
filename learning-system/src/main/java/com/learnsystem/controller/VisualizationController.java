package com.learnsystem.controller;

import com.learnsystem.dto.VisualizationRequest;
import com.learnsystem.model.VisualizationStep;
import com.learnsystem.service.VisualizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visualize")
@RequiredArgsConstructor
public class VisualizationController {

    private final VisualizationService visualizationService;

    // POST /api/visualize
    // Body: { "algorithm": "BINARY_SEARCH", "array": [1,3,5,7,9], "target": 7 }
    @PostMapping
    public ResponseEntity<List<VisualizationStep>> visualize(
            @Valid @RequestBody VisualizationRequest request) {
        List<VisualizationStep> steps = visualizationService.generateSteps(request);
        return ResponseEntity.ok(steps);
    }
}
