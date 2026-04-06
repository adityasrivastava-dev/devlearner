package com.learnsystem.runner;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.dto.SeedBatchRequest;
import com.learnsystem.dto.SeedBatchResponse;
import com.learnsystem.model.SeedLog;
import com.learnsystem.repository.SeedLogRepository;
import com.learnsystem.service.SeedBatchService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;

/**
 * Runs once at startup. Scans classpath:seeds/*.json (alphabetical order),
 * applies any batch not yet recorded in seed_log, then inserts a seed_log row.
 *
 * Fully idempotent — safe to restart the server at any time.
 * To re-run a batch, delete its row from seed_log and restart.
 *
 * Seed files must live in:  src/main/resources/seeds/
 * Naming convention:        seed-01-core-java-1.json, seed-02-core-java-2.json, ...
 * Alphabetical order determines execution sequence.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SeedDataRunner implements ApplicationRunner {

    private final ResourcePatternResolver resourcePatternResolver;
    private final ObjectMapper            objectMapper;
    private final SeedBatchService        seedBatchService;
    private final SeedLogRepository       seedLogRepository;

    @Override
    public void run(ApplicationArguments args) {
        Resource[] resources;
        try {
            resources = resourcePatternResolver.getResources("classpath:seeds/*.json");
        } catch (IOException e) {
            log.info("SeedDataRunner: no seeds/ directory found — skipping auto-seed.");
            return;
        }

        if (resources.length == 0) {
            log.info("SeedDataRunner: no *.json files in classpath:seeds/ — nothing to seed.");
            return;
        }

        // Alphabetical sort guarantees seed-01 runs before seed-02, etc.
        Arrays.sort(resources, Comparator.comparing(r -> r.getFilename() != null ? r.getFilename() : ""));

        int totalApplied = 0;
        for (Resource resource : resources) {
            String filename = resource.getFilename();
            try {
                SeedBatchRequest request = objectMapper.readValue(
                        resource.getInputStream(), SeedBatchRequest.class);

                String batchName = (request.getBatchName() != null)
                        ? request.getBatchName()
                        : filename;

                if (seedLogRepository.existsById(batchName)) {
                    log.debug("SeedDataRunner: '{}' already applied — skipping.", batchName);
                    continue;
                }

                log.info("SeedDataRunner: applying '{}'  ({})", batchName, filename);
                SeedBatchResponse result = seedBatchService.seed(request);

                seedLogRepository.save(new SeedLog(
                        batchName,
                        LocalDateTime.now(),
                        result.getTopicsSeeded(),
                        result.getExamplesSeeded(),
                        result.getProblemsSeeded()
                ));

                if (!result.getErrors().isEmpty()) {
                    result.getErrors().forEach(err ->
                            log.warn("SeedDataRunner [{}] error: {}", batchName, err));
                }

                log.info("SeedDataRunner: '{}' done — {} topics, {} examples, {} problems",
                        batchName,
                        result.getTopicsSeeded(),
                        result.getExamplesSeeded(),
                        result.getProblemsSeeded());
                totalApplied++;

            } catch (Exception e) {
                log.error("SeedDataRunner: failed to apply '{}': {}", filename, e.getMessage(), e);
            }
        }

        if (totalApplied > 0) {
            log.info("SeedDataRunner: applied {} new batch(es) this startup.", totalApplied);
        }
    }
}
