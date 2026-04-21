package com.learnsystem.runner;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.model.Topic;
import com.learnsystem.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Reads seeds/prerequisites-map.json and applies prerequisite topic IDs
 * to each topic's prerequisites column.
 *
 * Only updates topics whose prerequisites column is currently blank,
 * so manual admin edits survive server restarts.
 *
 * Runs after SeedDataRunner so all topics exist before we link them.
 */
@Component
@Order(10)
@RequiredArgsConstructor
@Slf4j
public class PrerequisitesPatchRunner implements ApplicationRunner {

    private final TopicRepository topicRepo;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        ClassPathResource resource = new ClassPathResource("seeds/prerequisites-map.json");
        if (!resource.exists()) {
            log.info("PrerequisitesPatchRunner: prerequisites-map.json not found — skipping.");
            return;
        }

        // Build title → topic map (all topics)
        Map<String, Topic> byTitle = new HashMap<>();
        for (Topic t : topicRepo.findAll()) {
            byTitle.put(t.getTitle().trim(), t);
        }

        // Parse JSON with comments enabled
        ObjectMapper mapper = new ObjectMapper()
                .configure(JsonParser.Feature.ALLOW_COMMENTS, true);

        int applied = 0, skipped = 0, notFound = 0;
        try (InputStream is = resource.getInputStream()) {
            JsonNode root = mapper.readTree(is);
            JsonNode entries = root.get("prerequisites");
            if (entries == null || !entries.isArray()) {
                log.warn("PrerequisitesPatchRunner: 'prerequisites' array missing in JSON.");
                return;
            }

            for (JsonNode entry : entries) {
                String topicTitle = entry.get("topic").asText().trim();
                Topic topic = byTitle.get(topicTitle);

                if (topic == null) {
                    log.debug("PrerequisitesPatchRunner: topic not found in DB: '{}'", topicTitle);
                    notFound++;
                    continue;
                }

                // Skip if already set (preserves admin edits)
                if (topic.getPrerequisites() != null && !topic.getPrerequisites().isBlank()) {
                    skipped++;
                    continue;
                }

                JsonNode requiresNode = entry.get("requires");
                if (requiresNode == null || !requiresNode.isArray() || requiresNode.isEmpty()) {
                    // Explicitly no prerequisites — mark as empty string so we skip on next restart
                    topic.setPrerequisites("");
                    topicRepo.save(topic);
                    applied++;
                    continue;
                }

                List<Long> prereqIds = new ArrayList<>();
                for (JsonNode req : requiresNode) {
                    String reqTitle = req.asText().trim();
                    Topic prereq = byTitle.get(reqTitle);
                    if (prereq == null) {
                        log.warn("PrerequisitesPatchRunner: prerequisite topic not found: '{}' (needed by '{}')", reqTitle, topicTitle);
                    } else {
                        prereqIds.add(prereq.getId());
                    }
                }

                String prereqStr = prereqIds.stream()
                        .map(String::valueOf)
                        .collect(Collectors.joining(","));
                topic.setPrerequisites(prereqStr);
                topicRepo.save(topic);
                applied++;
                log.debug("PrerequisitesPatchRunner: set '{}' prerequisites → [{}]", topicTitle, prereqStr);
            }
        } catch (Exception e) {
            log.error("PrerequisitesPatchRunner: failed to apply prerequisites: {}", e.getMessage(), e);
            return;
        }

        log.info("PrerequisitesPatchRunner: done — applied={}, skipped(already set)={}, topicsNotFound={}",
                applied, skipped, notFound);
    }
}
