package com.learnsystem.controller;

import com.learnsystem.model.User;
import com.learnsystem.service.LearningGateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * GET /api/gate/all — returns { topicId: stage } for all topics the user has touched.
 * Topics with no activity are absent; callers treat them as "THEORY" stage.
 *
 * Used by the Topic Mastery Map page to load all stage data in a single request
 * instead of making N individual /api/topics/{id}/gate calls.
 */
@RestController
@RequestMapping("/api/gate")
@RequiredArgsConstructor
public class GateBulkController {

    private final LearningGateService gateService;

    @GetMapping("/all")
    public ResponseEntity<Map<Long, String>> getAllStages(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(gateService.getAllGateStages(user.getId()));
    }
}
