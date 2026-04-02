package com.learnsystem.repository;

import com.learnsystem.model.RecallDrill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecallDrillRepository extends JpaRepository<RecallDrill, Long> {

List<RecallDrill> findTop5ByUserIdAndTopicIdOrderByCreatedAtDesc(Long userId, Long topicId);

List<RecallDrill> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);
}