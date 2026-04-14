package com.learnsystem.controller;

import com.learnsystem.model.Example;
import com.learnsystem.model.Problem;
import com.learnsystem.model.Topic;
import com.learnsystem.repository.TopicRepository;
import com.learnsystem.service.TopicService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class TopicController {

    private final TopicService topicService;

    // GET /api/topics  OR  GET /api/topics?category=DSA
    // Returns lightweight summary (no heavy TEXT content fields).
    // Full topic content is available via GET /api/topics/{id}.
    @GetMapping
    public ResponseEntity<List<TopicRepository.TopicSummary>> getTopics(
            @RequestParam(required = false) String category) {

        log.debug("Topics list requested: category={}", category != null ? category : "ALL");
        List<TopicRepository.TopicSummary> topics = category != null
                ? topicService.getTopicsByCategory(category)
                : topicService.getAllTopics();
        log.debug("Topics returned: count={}", topics.size());
        return ResponseEntity.ok(topics);
    }

    // GET /api/topics/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Topic> getTopic(@PathVariable Long id) {
        log.debug("Topic detail requested: id={}", id);
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
