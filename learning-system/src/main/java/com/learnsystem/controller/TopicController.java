package com.learnsystem.controller;

import com.learnsystem.model.Example;
import com.learnsystem.model.Problem;
import com.learnsystem.model.Topic;
import com.learnsystem.service.TopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    // GET /api/topics  OR  GET /api/topics?category=DSA
    @GetMapping
    public ResponseEntity<List<Topic>> getTopics(
            @RequestParam(required = false) String category) {

        List<Topic> topics = category != null
                ? topicService.getTopicsByCategory(category)
                : topicService.getAllTopics();
        return ResponseEntity.ok(topics);
    }

    // GET /api/topics/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Topic> getTopic(@PathVariable Long id) {
        return topicService.getTopicById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET /api/topics/{id}/examples
    @GetMapping("/{id}/examples")
    public ResponseEntity<List<Example>> getExamples(@PathVariable Long id) {
        return ResponseEntity.ok(topicService.getExamplesByTopicId(id));
    }

    // GET /api/topics/{id}/problems
    @GetMapping("/{id}/problems")
    public ResponseEntity<List<Problem>> getProblems(@PathVariable Long id) {
        return ResponseEntity.ok(topicService.getProblemsByTopicId(id));
    }

    // GET /api/topics/problems/{problemId}
    @GetMapping("/problems/{problemId}")
    public ResponseEntity<Problem> getProblem(@PathVariable Long problemId) {
        return topicService.getProblemById(problemId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
