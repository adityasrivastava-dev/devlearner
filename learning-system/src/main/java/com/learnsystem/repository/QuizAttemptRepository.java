package com.learnsystem.repository;

import com.learnsystem.model.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

/** All attempts by a user, newest first */
List<QuizAttempt> findByUserIdOrderByCompletedAtDesc(Long userId);

/** Best attempt for a user on a specific set */
@Query("SELECT a FROM QuizAttempt a WHERE a.userId = :userId AND a.setId = :setId " +
		"ORDER BY a.score DESC, a.completedAt DESC")
List<QuizAttempt> findByUserIdAndSetIdOrderByScoreDesc(
		@Param("userId") Long userId, @Param("setId") Long setId);

/** How many times has a user attempted a set */
int countByUserIdAndSetId(Long userId, Long setId);

/** Latest attempt for a user on a set */
Optional<QuizAttempt> findTopByUserIdAndSetIdOrderByCompletedAtDesc(Long userId, Long setId);
}