package com.learnsystem.repository;

import com.learnsystem.model.UserTopicPerformance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserTopicPerformanceRepository extends JpaRepository<UserTopicPerformance, Long> {

Optional<UserTopicPerformance> findByUserIdAndTopicId(Long userId, Long topicId);

List<UserTopicPerformance> findByUserIdOrderByConfidenceScoreAsc(Long userId);

/** Weak areas: topics with confidence < 50 */
@Query("SELECT p FROM UserTopicPerformance p WHERE p.userId = :uid AND p.confidenceScore < 50 ORDER BY p.confidenceScore ASC")
List<UserTopicPerformance> findWeakAreas(@Param("uid") Long userId);

/** Strong areas: topics with confidence >= 70 */
@Query("SELECT p FROM UserTopicPerformance p WHERE p.userId = :uid AND p.confidenceScore >= 70 ORDER BY p.confidenceScore DESC")
List<UserTopicPerformance> findStrongAreas(@Param("uid") Long userId);
}