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
        List<String> errors = new ArrayList<>();

        for (SeedBatchRequest.TopicSeedDto dto : req.getTopics()) {
            try {
                // Skip if title already exists and skipExisting=true
                if (req.isSkipExisting() && topicRepo.findByTitle(dto.getTitle()).isPresent()) {
                    log.info("Skipping existing topic: {}", dto.getTitle());
                    skippedTopics++;
                    continue;
                }

                // Map category
                Topic.Category cat;
                try {
                    cat = Topic.Category.valueOf(dto.getCategory().toUpperCase().replace(" ", "_"));
                } catch (IllegalArgumentException e) {
                    errors.add("Unknown category '" + dto.getCategory() + "' for topic: " + dto.getTitle());
                    continue;
                }

                // Create topic
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
                topic = topicRepo.save(topic);
                seededTopics++;

                // Create examples
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
                        exampleRepo.save(ex);
                        seededExamples++;
                    }
                }

                // Create problems
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
                                    ? pdto.getTestCases().asText()         // was a JSON string → unwrap it
                                    : pdto.getTestCases().toString());
                        p.setHint(pdto.getHint());
                        p.setStarterCode(pdto.getStarterCode());
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
                .message(String.format("Seeded %d topics, skipped %d, %d examples, %d problems",
                        seededTopics, skippedTopics, seededExamples, seededProblems))
                .errors(errors)
                .build();
    }

    /** Delete all topics (and cascade examples/problems) then re-seed */
    @Transactional
    public void clearAll() {
        problemRepo.deleteAll();
        exampleRepo.deleteAll();
        topicRepo.deleteAll();
        log.info("Cleared all topics, examples and problems.");
    }
}