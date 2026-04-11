package com.learnsystem.service;

import com.learnsystem.dto.SeedBatchRequest;
import com.learnsystem.dto.SeedBatchResponse;
import com.learnsystem.model.*;
import com.learnsystem.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeedBatchService {

private final TopicRepository   topicRepo;
private final ExampleRepository exampleRepo;
private final ProblemRepository problemRepo;

@PersistenceContext
private EntityManager em;

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
            // 1. Patch any null/blank fields on existing problems
            // 2. If examples are missing, create them
            // 3. If problems are missing, create them
            if (req.isSkipExisting() && existing.isPresent()) {
                Topic topic = existing.get();

                // ── Patch subCategory + displayOrder if not yet set ───────────
                boolean topicDirty = false;
                if (dto.getSubCategory() != null && (topic.getSubCategory() == null || topic.getSubCategory().isBlank())) {
                    topic.setSubCategory(dto.getSubCategory());
                    topicDirty = true;
                }
                if (dto.getDisplayOrder() != null && (topic.getDisplayOrder() == null || topic.getDisplayOrder() == 999)) {
                    topic.setDisplayOrder(dto.getDisplayOrder());
                    topicDirty = true;
                }
                if (topicDirty) topicRepo.save(topic);

                // ── Seed missing examples ─────────────────────────────────────
                long existingExampleCount = exampleRepo.countByTopicId(topic.getId());
                if (existingExampleCount == 0 && dto.getExamples() != null && !dto.getExamples().isEmpty()) {
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
                    log.info("Seeded {} missing examples for existing topic: {}", seededExamples, dto.getTitle());
                }

                // ── Seed missing problems ─────────────────────────────────────
                List<Problem> existingProblems =
                        problemRepo.findByTopicIdOrderByDisplayOrder(topic.getId());

                if (existingProblems.isEmpty() && dto.getProblems() != null && !dto.getProblems().isEmpty()) {
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
                        resolveHintsFromList(pdto);
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
                    log.info("Seeded {} missing problems for existing topic: {}", seededProblems, dto.getTitle());
                } else if (!existingProblems.isEmpty() && dto.getProblems() != null) {
                    // ── Patch fields on existing problems ─────────────────────
                    Map<Integer, Problem> byOrder = new HashMap<>();
                    for (Problem p : existingProblems) byOrder.put(p.getDisplayOrder(), p);

                    for (SeedBatchRequest.ProblemSeedDto pdto : dto.getProblems()) {
                        Problem p = byOrder.get(pdto.getDisplayOrder());
                        if (p == null) continue;
                        resolveHintsFromList(pdto);
                        boolean dirty = false;
                        if (isBlank(p.getEditorial())        && notBlank(pdto.getEditorial()))        { p.setEditorial(pdto.getEditorial());               dirty = true; }
                        if (isBlank(p.getHint1())            && notBlank(pdto.getHint1()))            { p.setHint1(pdto.getHint1());                       dirty = true; }
                        if (isBlank(p.getHint2())            && notBlank(pdto.getHint2()))            { p.setHint2(pdto.getHint2());                       dirty = true; }
                        if (isBlank(p.getHint3())            && notBlank(pdto.getHint3()))            { p.setHint3(pdto.getHint3());                       dirty = true; }
                        if (isBlank(p.getPattern())          && notBlank(pdto.getPattern()))          { p.setPattern(pdto.getPattern());                   dirty = true; }
                        if (isBlank(p.getConstraints())      && notBlank(pdto.getConstraints()))      { p.setConstraints(pdto.getConstraints());           dirty = true; }
                        if (isBlank(p.getBruteForce())       && notBlank(pdto.getBruteForce()))       { p.setBruteForce(pdto.getBruteForce());             dirty = true; }
                        if (isBlank(p.getOptimizedApproach())&& notBlank(pdto.getOptimizedApproach())){ p.setOptimizedApproach(pdto.getOptimizedApproach()); dirty = true; }
                        if (dirty) { problemRepo.save(p); patchedProblems++; }
                    }
                }

                log.info("Patch mode for topic: {} — {}ex seeded, {}p seeded, {}p patched",
                        dto.getTitle(), seededExamples, seededProblems, patchedProblems);
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
            topic.setSubCategory(dto.getSubCategory());
            if (dto.getDisplayOrder() != null) topic.setDisplayOrder(dto.getDisplayOrder());
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
                    resolveHintsFromList(pdto);
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
    // Native SQL bulk deletes — orders respects FK constraints
    // problems → examples → topics → seed_log
    em.createNativeQuery("DELETE FROM problems").executeUpdate();
    em.createNativeQuery("DELETE FROM examples").executeUpdate();
    em.createNativeQuery("DELETE FROM topics").executeUpdate();
    em.createNativeQuery("DELETE FROM seed_log").executeUpdate();
    em.flush();
    log.info("Cleared all topics, examples, problems and seed_log.");
}

// ── helpers ───────────────────────────────────────────────────────────────
private boolean isBlank(String s) { return s == null || s.isBlank(); }
private boolean notBlank(String s) { return s != null && !s.isBlank(); }

/**
 * Promotes a seed DTO's "hints" list (used in newer seed files) into the
 * individual hint1/hint2/hint3 fields so the rest of the mapping code is
 * unchanged.  Only fills slots that are not already populated.
 */
private void resolveHintsFromList(SeedBatchRequest.ProblemSeedDto pdto) {
    List<String> list = pdto.getHints();
    if (list == null || list.isEmpty()) return;
    if (pdto.getHint1() == null && list.size() > 0) pdto.setHint1(list.get(0));
    if (pdto.getHint2() == null && list.size() > 1) pdto.setHint2(list.get(1));
    if (pdto.getHint3() == null && list.size() > 2) pdto.setHint3(list.get(2));
}
}