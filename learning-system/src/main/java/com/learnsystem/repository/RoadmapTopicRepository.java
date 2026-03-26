package com.learnsystem.repository;

import com.learnsystem.model.RoadmapTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoadmapTopicRepository extends JpaRepository<RoadmapTopic, Long> {
    List<RoadmapTopic> findByRoadmapIdOrderByOrderIndex(Long roadmapId);
    void deleteByRoadmapIdAndTopicId(Long roadmapId, Long topicId);
}