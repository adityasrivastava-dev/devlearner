package com.learnsystem.repository;

import com.learnsystem.model.MistakeRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MistakeRecordRepository extends JpaRepository<MistakeRecord, Long> {

List<MistakeRecord> findByUserIdOrderByCreatedAtDesc(Long userId);

List<MistakeRecord> findByUserIdAndTopicIdOrderByCreatedAtDesc(Long userId, Long topicId);

/** Most common error types for a user — for the mistake journal summary */
@Query("SELECT m.errorType, COUNT(m) FROM MistakeRecord m WHERE m.userId = :uid GROUP BY m.errorType ORDER BY COUNT(m) DESC")
List<Object[]> countByErrorType(@Param("uid") Long userId);

/** Most confused patterns — wrong detected vs correct */
@Query("SELECT m.detectedPattern, m.correctPattern, COUNT(m) FROM MistakeRecord m WHERE m.userId = :uid AND m.detectedPattern IS NOT NULL GROUP BY m.detectedPattern, m.correctPattern ORDER BY COUNT(m) DESC")
List<Object[]> findPatternConfusions(@Param("uid") Long userId);
}