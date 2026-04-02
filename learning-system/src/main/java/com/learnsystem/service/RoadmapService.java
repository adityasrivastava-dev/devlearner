package com.learnsystem.service;

import com.learnsystem.dto.CreateRoadmapRequest;
import com.learnsystem.dto.RoadmapDto;
import com.learnsystem.model.Roadmap;
import com.learnsystem.model.RoadmapTopic;
import com.learnsystem.model.Topic;
import com.learnsystem.repository.RoadmapRepository;
import com.learnsystem.repository.RoadmapTopicRepository;
import com.learnsystem.repository.TopicRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoadmapService {

private final RoadmapRepository      roadmapRepo;
private final RoadmapTopicRepository roadmapTopicRepo;
private final TopicRepository        topicRepo;

// ── Read (scoped to userId) ───────────────────────────────────────────────

public List<RoadmapDto> getAllRoadmaps(Long userId) {
    return roadmapRepo.findByUserIdOrderByCreatedAtDesc(userId)
            .stream().map(this::toDto).collect(Collectors.toList());
}

public RoadmapDto getRoadmap(Long id, Long userId) {
    Roadmap r = findOwned(id, userId);
    return toDto(r);
}

// ── Create ────────────────────────────────────────────────────────────────

@Transactional
public RoadmapDto createRoadmap(CreateRoadmapRequest req, Long userId) {
    Roadmap r = new Roadmap();
    r.setUserId(userId);
    r.setName(req.getName());
    r.setDescription(req.getDescription());
    r.setIcon(req.getIcon() != null ? req.getIcon() : "📁");
    r.setColor(req.getColor() != null ? req.getColor() : "#4ade80");
    r.setLevel(req.getLevel());
    r.setEstimatedHours(req.getEstimatedHours());
    roadmapRepo.save(r);

    if (req.getTopicIds() != null) {
        for (int i = 0; i < req.getTopicIds().size(); i++) {
            addTopicToRoadmap(r.getId(), req.getTopicIds().get(i), i + 1, null, userId);
        }
    }
    return toDto(roadmapRepo.findById(r.getId()).orElseThrow());
}

// ── Update ────────────────────────────────────────────────────────────────

@Transactional
public RoadmapDto updateRoadmap(Long id, CreateRoadmapRequest req, Long userId) {
    Roadmap r = findOwned(id, userId);
    r.setName(req.getName());
    r.setDescription(req.getDescription());
    if (req.getIcon()  != null) r.setIcon(req.getIcon());
    if (req.getColor() != null) r.setColor(req.getColor());
    r.setLevel(req.getLevel());
    r.setEstimatedHours(req.getEstimatedHours());
    roadmapRepo.save(r);
    return toDto(r);
}

// ── Delete ────────────────────────────────────────────────────────────────

@Transactional
public void deleteRoadmap(Long id, Long userId) {
    findOwned(id, userId);
    roadmapRepo.deleteById(id);
}

// ── Topic management ──────────────────────────────────────────────────────

@Transactional
public RoadmapDto addTopicToRoadmap(Long roadmapId, Long topicId,
                                    int orderIndex, String note, Long userId) {
    Roadmap r = findOwned(roadmapId, userId);
    Topic t = topicRepo.findById(topicId)
            .orElseThrow(() -> new RuntimeException("Topic not found: " + topicId));

    RoadmapTopic rt = new RoadmapTopic();
    rt.setRoadmap(r);
    rt.setTopic(t);
    rt.setOrderIndex(orderIndex);
    rt.setNote(note);
    roadmapTopicRepo.save(rt);

    return toDto(roadmapRepo.findById(roadmapId).orElseThrow());
}

@Transactional
public RoadmapDto removeTopicFromRoadmap(Long roadmapId, Long topicId, Long userId) {
    findOwned(roadmapId, userId);
    roadmapTopicRepo.deleteByRoadmapIdAndTopicId(roadmapId, topicId);
    return toDto(roadmapRepo.findById(roadmapId).orElseThrow());
}

@Transactional
public RoadmapDto reorderTopics(Long roadmapId, List<Long> orderedTopicIds, Long userId) {
    findOwned(roadmapId, userId);
    List<RoadmapTopic> rts = roadmapTopicRepo.findByRoadmapIdOrderByOrderIndex(roadmapId);
    for (RoadmapTopic rt : rts) {
        int idx = orderedTopicIds.indexOf(rt.getTopic().getId());
        if (idx >= 0) rt.setOrderIndex(idx + 1);
    }
    roadmapTopicRepo.saveAll(rts);
    return toDto(roadmapRepo.findById(roadmapId).orElseThrow());
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Load a roadmap and assert ownership.
 * Throws IllegalArgumentException (400) if not found.
 * Throws AccessDeniedException (403) if owned by someone else.
 * Migrates legacy ownerless roadmaps to the first accessor.
 */
private Roadmap findOwned(Long id, Long userId) {
    Roadmap r = roadmapRepo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Roadmap not found: " + id));
    if (r.getUserId() == null) {
        r.setUserId(userId);
        roadmapRepo.save(r);
        return r;
    }
    if (!r.getUserId().equals(userId)) {
        throw new org.springframework.security.access.AccessDeniedException(
                "You do not own this roadmap");
    }
    return r;
}

// ── Mapper ────────────────────────────────────────────────────────────────

private RoadmapDto toDto(Roadmap r) {
    List<RoadmapTopic> rts = roadmapTopicRepo.findByRoadmapIdOrderByOrderIndex(r.getId());

    List<RoadmapDto.RoadmapTopicDto> topicDtos = rts.stream().map(rt ->
            RoadmapDto.RoadmapTopicDto.builder()
                    .roadmapTopicId(rt.getId())
                    .topicId(rt.getTopic().getId())
                    .topicTitle(rt.getTopic().getTitle())
                    .topicCategory(rt.getTopic().getCategory().name())
                    .topicDescription(rt.getTopic().getDescription())
                    .timeComplexity(rt.getTopic().getTimeComplexity())
                    .orderIndex(rt.getOrderIndex())
                    .note(rt.getNote())
                    .build()
    ).collect(Collectors.toList());

    return RoadmapDto.builder()
            .id(r.getId())
            .name(r.getName())
            .description(r.getDescription())
            .icon(r.getIcon())
            .color(r.getColor())
            .level(r.getLevel())
            .estimatedHours(r.getEstimatedHours())
            .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : null)
            .totalTopics(topicDtos.size())
            .topics(topicDtos)
            .build();
}
}