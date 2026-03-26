package com.learnsystem.controller;

import com.learnsystem.model.Example;
import com.learnsystem.model.Problem;
import com.learnsystem.model.Topic;
import com.learnsystem.service.TopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final TopicService topicService;

    // ── Topics ────────────────────────────────────────────────────────────────

    @PostMapping("/topics")
    public ResponseEntity<Topic> createTopic(@RequestBody Topic topic) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(topicService.createTopic(topic));
    }

    @PutMapping("/topics/{id}")
    public ResponseEntity<Topic> updateTopic(@PathVariable Long id, @RequestBody Topic topic) {
        return ResponseEntity.ok(topicService.updateTopic(id, topic));
    }

    @DeleteMapping("/topics/{id}")
    public ResponseEntity<Void> deleteTopic(@PathVariable Long id) {
        topicService.deleteTopic(id);
        return ResponseEntity.noContent().build();
    }

    // ── Examples ──────────────────────────────────────────────────────────────

    @PostMapping("/topics/{topicId}/examples")
    public ResponseEntity<Example> createExample(@PathVariable Long topicId,
                                                  @RequestBody Example example) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(topicService.createExample(topicId, example));
    }

    @PutMapping("/examples/{id}")
    public ResponseEntity<Example> updateExample(@PathVariable Long id,
                                                  @RequestBody Example example) {
        return ResponseEntity.ok(topicService.updateExample(id, example));
    }

    @DeleteMapping("/examples/{id}")
    public ResponseEntity<Void> deleteExample(@PathVariable Long id) {
        topicService.deleteExample(id);
        return ResponseEntity.noContent().build();
    }

    // ── Problems ──────────────────────────────────────────────────────────────

    @PostMapping("/topics/{topicId}/problems")
    public ResponseEntity<Problem> createProblem(@PathVariable Long topicId,
                                                  @RequestBody Problem problem) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(topicService.createProblem(topicId, problem));
    }

    @PutMapping("/problems/{id}")
    public ResponseEntity<Problem> updateProblem(@PathVariable Long id,
                                                  @RequestBody Problem problem) {
        return ResponseEntity.ok(topicService.updateProblem(id, problem));
    }

    @DeleteMapping("/problems/{id}")
    public ResponseEntity<Void> deleteProblem(@PathVariable Long id) {
        topicService.deleteProblem(id);
        return ResponseEntity.noContent().build();
    }
}
