package com.learnsystem.service;

import com.learnsystem.model.Example;
import com.learnsystem.model.Problem;
import com.learnsystem.model.Topic;
import com.learnsystem.repository.ExampleRepository;
import com.learnsystem.repository.ProblemRepository;
import com.learnsystem.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TopicService {

private final TopicRepository topicRepository;
private final ExampleRepository exampleRepository;
private final ProblemRepository problemRepository;

// ── Read ──────────────────────────────────────────────────────────────────

public List<TopicRepository.TopicSummary> getAllTopics() {
    return topicRepository.findAllSummaries();
}

public List<TopicRepository.TopicSummary> getTopicsByCategory(String category) {
    Topic.Category cat = Topic.Category.valueOf(category.toUpperCase());
    return topicRepository.findSummariesByCategory(cat);
}

public Optional<Topic> getTopicById(Long id) {
    return topicRepository.findById(id);
}

public List<Example> getExamplesByTopicId(Long topicId) {
    return exampleRepository.findByTopicIdOrderByDisplayOrder(topicId);
}

public List<Problem> getProblemsByTopicId(Long topicId) {
    return problemRepository.findByTopicIdOrderByDisplayOrder(topicId);
}

public Optional<Problem> getProblemById(Long problemId) {
    return problemRepository.findById(problemId);
}

// ── Topic CRUD ────────────────────────────────────────────────────────────

@Transactional
public Topic createTopic(Topic topic) {
    topic.setId(null); // safety: never trust client-provided ID on create
    return topicRepository.save(topic);
}

@Transactional
public Topic updateTopic(Long id, Topic incoming) {
    Topic existing = topicRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Topic not found: " + id));
    existing.setTitle(incoming.getTitle());
    existing.setCategory(incoming.getCategory());
    existing.setDescription(incoming.getDescription());
    existing.setContent(incoming.getContent());
    existing.setTimeComplexity(incoming.getTimeComplexity());
    existing.setSpaceComplexity(incoming.getSpaceComplexity());
    existing.setBruteForce(incoming.getBruteForce());
    existing.setOptimizedApproach(incoming.getOptimizedApproach());
    existing.setWhenToUse(incoming.getWhenToUse());
    existing.setStarterCode(incoming.getStarterCode());
    // Phase 1 story fields
    existing.setStory(incoming.getStory());
    existing.setAnalogy(incoming.getAnalogy());
    existing.setMemoryAnchor(incoming.getMemoryAnchor());
    existing.setFirstPrinciples(incoming.getFirstPrinciples());
    existing.setYoutubeUrls(incoming.getYoutubeUrls());
    // Ordering / grouping
    existing.setSubCategory(incoming.getSubCategory());
    if (incoming.getDisplayOrder() != null) existing.setDisplayOrder(incoming.getDisplayOrder());
    existing.setPrerequisites(incoming.getPrerequisites());
    return topicRepository.save(existing);
}

@Transactional
public void deleteTopic(Long id) {
    topicRepository.deleteById(id);
}

// ── Example CRUD ──────────────────────────────────────────────────────────

@Transactional
public Example createExample(Long topicId, Example example) {
    Topic topic = topicRepository.findById(topicId)
            .orElseThrow(() -> new RuntimeException("Topic not found: " + topicId));
    example.setId(null);
    example.setTopic(topic);
    return exampleRepository.save(example);
}

@Transactional
public Example updateExample(Long exampleId, Example incoming) {
    Example existing = exampleRepository.findById(exampleId)
            .orElseThrow(() -> new RuntimeException("Example not found: " + exampleId));
    existing.setTitle(incoming.getTitle());
    existing.setDescription(incoming.getDescription());
    existing.setCode(incoming.getCode());
    existing.setExplanation(incoming.getExplanation());
    existing.setRealWorldUse(incoming.getRealWorldUse());
    existing.setDisplayOrder(incoming.getDisplayOrder());
    // Phase 1 fields
    existing.setPseudocode(incoming.getPseudocode());
    existing.setFlowchartMermaid(incoming.getFlowchartMermaid());
    return exampleRepository.save(existing);
}

@Transactional
public void deleteExample(Long exampleId) {
    exampleRepository.deleteById(exampleId);
}

// ── Problem CRUD ──────────────────────────────────────────────────────────

@Transactional
public Problem createProblem(Long topicId, Problem problem) {
    Topic topic = topicRepository.findById(topicId)
            .orElseThrow(() -> new RuntimeException("Topic not found: " + topicId));
    problem.setId(null);
    problem.setTopic(topic);
    return problemRepository.save(problem);
}

@Transactional
public Problem updateProblem(Long problemId, Problem incoming) {
    Problem existing = problemRepository.findById(problemId)
            .orElseThrow(() -> new RuntimeException("Problem not found: " + problemId));
    existing.setTitle(incoming.getTitle());
    existing.setDescription(incoming.getDescription());
    existing.setInputFormat(incoming.getInputFormat());
    existing.setOutputFormat(incoming.getOutputFormat());
    existing.setSampleInput(incoming.getSampleInput());
    existing.setSampleOutput(incoming.getSampleOutput());
    existing.setTestCases(incoming.getTestCases());
    existing.setDifficulty(incoming.getDifficulty());
    existing.setHint(incoming.getHint());
    existing.setStarterCode(incoming.getStarterCode());
    existing.setSolutionCode(incoming.getSolutionCode());
    existing.setDisplayOrder(incoming.getDisplayOrder());
    // Phase 1 fields
    existing.setHint1(incoming.getHint1());
    existing.setHint2(incoming.getHint2());
    existing.setHint3(incoming.getHint3());
    existing.setPattern(incoming.getPattern());
    existing.setCodeHarness(incoming.getCodeHarness());
    return problemRepository.save(existing);
}

@Transactional
public void updateProblemHarness(Long problemId, String harness, String testCases) {
    Problem p = problemRepository.findById(problemId)
            .orElseThrow(() -> new RuntimeException("Problem not found: " + problemId));
    p.setCodeHarness(harness == null || harness.isBlank() ? null : harness);
    if (testCases != null && !testCases.isBlank()) p.setTestCases(testCases);
    problemRepository.save(p);
}

@Transactional
public void deleteProblem(Long problemId) {
    problemRepository.deleteById(problemId);
}
}