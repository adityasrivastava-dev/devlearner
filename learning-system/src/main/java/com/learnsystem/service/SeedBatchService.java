package com.learnsystem.service;

import com.learnsystem.dto.SeedBatchRequest;
import com.learnsystem.dto.SeedBatchResponse;
import com.learnsystem.model.*;
import com.learnsystem.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeedBatchService {

private final TopicRepository   topicRepo;
private final ExampleRepository exampleRepo;
private final ProblemRepository problemRepo;

@Transactional
public SeedBatchResponse seed(SeedBatchRequest req) {
    int seededTopics = 0, skippedTopics = 0, seededExamples = 0, seededProblems = 0;
    int patchedProblems = 0;
    List<String> errors = new ArrayList<>();

    for (SeedBatchRequest.TopicSeedDto dto : req.getTopics()) {
        try {
            Optional<Topic> existing = topicRepo.findByTitle(dto.getTitle());

            // ── PATCH MODE ────────────────────────────────────────────────────
            // When skipExisting=true and the topic already exists:
            // Instead of skipping entirely, patch any null/blank fields on
            // existing problems (e.g. editorial added to a previously seeded batch).
            // No new rows are created — only fills gaps on existing records.
            if (req.isSkipExisting() && existing.isPresent()) {
                Topic topic = existing.get();
                if (dto.getProblems() != null) {
                    List<Problem> existingProblems =
                            problemRepo.findByTopicIdOrderByDisplayOrder(topic.getId());
                    Map<Integer, Problem> byOrder = new HashMap<>();
                    for (Problem p : existingProblems) byOrder.put(p.getDisplayOrder(), p);

                    for (SeedBatchRequest.ProblemSeedDto pdto : dto.getProblems()) {
                        Problem p = byOrder.get(pdto.getDisplayOrder());
                        if (p == null) continue;

                        boolean dirty = false;
                        // Only fill fields that are currently null/blank in DB
                        if (isBlank(p.getEditorial()) && notBlank(pdto.getEditorial())) {
                            p.setEditorial(pdto.getEditorial()); dirty = true;
                        }
                        if (isBlank(p.getHint1()) && notBlank(pdto.getHint1())) {
                            p.setHint1(pdto.getHint1()); dirty = true;
                        }
                        if (isBlank(p.getHint2()) && notBlank(pdto.getHint2())) {
                            p.setHint2(pdto.getHint2()); dirty = true;
                        }
                        if (isBlank(p.getHint3()) && notBlank(pdto.getHint3())) {
                            p.setHint3(pdto.getHint3()); dirty = true;
                        }
                        if (isBlank(p.getPattern()) && notBlank(pdto.getPattern())) {
                            p.setPattern(pdto.getPattern()); dirty = true;
                        }
                        if (isBlank(p.getConstraints()) && notBlank(pdto.getConstraints())) {
                            p.setConstraints(pdto.getConstraints()); dirty = true;
                        }
                        if (isBlank(p.getBruteForce()) && notBlank(pdto.getBruteForce())) {
                            p.setBruteForce(pdto.getBruteForce()); dirty = true;
                        }
                        if (isBlank(p.getOptimizedApproach()) && notBlank(pdto.getOptimizedApproach())) {
                            p.setOptimizedApproach(pdto.getOptimizedApproach()); dirty = true;
                        }
                        if (dirty) {
                            problemRepo.save(p);
                            patchedProblems++;
                        }
                    }
                }
                log.info("Patched existing topic: {} ({} problems updated)", dto.getTitle(), patchedProblems);
                skippedTopics++;
                continue;
            }
            // ─────────────────────────────────────────────────────────────────

            Topic.Category cat;
            try {
                cat = Topic.Category.valueOf(dto.getCategory().toUpperCase().replace(" ", "_"));
            } catch (IllegalArgumentException e) {
                errors.add("Unknown category '" + dto.getCategory() + "' for topic: " + dto.getTitle());
                continue;
            }

            Topic topic = new Topic();
            topic.setTitle(dto.getTitle());
            topic.setCategory(cat);
            topic.setDescription(dto.getDescription());
            topic.setTimeComplexity(dto.getTimeComplexity());
            topic.setSpaceComplexity(dto.getSpaceComplexity());
            topic.setBruteForce(dto.getBruteForce());
            topic.setOptimizedApproach(dto.getOptimizedApproach());
            topic.setWhenToUse(dto.getWhenToUse());
            topic.setStarterCode(dto.getStarterCode());
            topic.setStory(dto.getStory());
            topic.setAnalogy(dto.getAnalogy());
            topic.setMemoryAnchor(dto.getMemoryAnchor());
            topic.setFirstPrinciples(dto.getFirstPrinciples());
            topic = topicRepo.save(topic);
            seededTopics++;

            if (dto.getExamples() != null) {
                for (SeedBatchRequest.ExampleSeedDto edto : dto.getExamples()) {
                    Example ex = new Example();
                    ex.setTopic(topic);
                    ex.setDisplayOrder(edto.getDisplayOrder());
                    ex.setTitle(edto.getTitle());
                    ex.setDescription(edto.getDescription());
                    ex.setCode(edto.getCode());
                    ex.setExplanation(edto.getExplanation());
                    ex.setRealWorldUse(edto.getRealWorldUse());
                    ex.setPseudocode(edto.getPseudocode());
                    ex.setFlowchartMermaid(edto.getFlowchartMermaid());
                    ex.setTracerSteps(edto.getTracerSteps());
                    exampleRepo.save(ex);
                    seededExamples++;
                }
            }

            if (dto.getProblems() != null) {
                for (SeedBatchRequest.ProblemSeedDto pdto : dto.getProblems()) {
                    Problem p = new Problem();
                    p.setTopic(topic);
                    p.setDisplayOrder(pdto.getDisplayOrder());
                    p.setTitle(pdto.getTitle());
                    p.setDescription(pdto.getDescription());
                    p.setInputFormat(pdto.getInputFormat());
                    p.setOutputFormat(pdto.getOutputFormat());
                    p.setSampleInput(pdto.getSampleInput());
                    p.setSampleOutput(pdto.getSampleOutput());
                    if (pdto.getTestCases() != null)
                        p.setTestCases(pdto.getTestCases().isTextual()
                                ? pdto.getTestCases().asText()
                                : pdto.getTestCases().toString());
                    p.setHint(pdto.getHint());
                    p.setStarterCode(pdto.getStarterCode());
                    p.setSolutionCode(pdto.getSolutionCode());
                    p.setHint1(pdto.getHint1());
                    p.setHint2(pdto.getHint2());
                    p.setHint3(pdto.getHint3());
                    p.setPattern(pdto.getPattern());
                    p.setConstraints(pdto.getConstraints());
                    p.setBruteForce(pdto.getBruteForce());
                    p.setOptimizedApproach(pdto.getOptimizedApproach());
                    p.setEditorial(pdto.getEditorial());
                    try {
                        p.setDifficulty(Problem.Difficulty.valueOf(pdto.getDifficulty().toUpperCase()));
                    } catch (Exception e) {
                        p.setDifficulty(Problem.Difficulty.MEDIUM);
                    }
                    problemRepo.save(p);
                    seededProblems++;
                }
            }

            log.info("Seeded topic: {} ({} examples, {} problems)",
                    topic.getTitle(),
                    dto.getExamples() != null ? dto.getExamples().size() : 0,
                    dto.getProblems() != null ? dto.getProblems().size() : 0);

        } catch (Exception e) {
            errors.add("Error seeding '" + dto.getTitle() + "': " + e.getMessage());
            log.error("Error seeding topic {}", dto.getTitle(), e);
        }
    }

    return SeedBatchResponse.builder()
            .batchName(req.getBatchName())
            .topicsSeeded(seededTopics)
            .topicsSkipped(skippedTopics)
            .examplesSeeded(seededExamples)
            .problemsSeeded(seededProblems)
            .success(errors.isEmpty())
            .message(String.format(
                    "Seeded %d topics, patched %d existing (%d problems updated), %d examples, %d problems",
                    seededTopics, skippedTopics, patchedProblems, seededExamples, seededProblems))
            .errors(errors)
            .build();
}

@Transactional
public void clearAll() {
    problemRepo.deleteAllProblems();   // child
    exampleRepo.deleteAllExamples();   // middle
    topicRepo.deleteAllTopics();       // parent

    log.info("Cleared all topics, examples and problems.");
}

// ── helpers ───────────────────────────────────────────────────────────────
private boolean isBlank(String s) { return s == null || s.isBlank(); }
private boolean notBlank(String s) { return s != null && !s.isBlank(); }
}