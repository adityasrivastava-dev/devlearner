package com.learnsystem.repository;

import com.learnsystem.model.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

/** All questions for a set, in order */
List<QuizQuestion> findBySetIdOrderByOrderIndex(Long setId);

/** Count questions in a set */
int countBySetId(Long setId);

/** Delete all questions for a set (used when re-seeding) */
void deleteBySetId(Long setId);

/** Random sample of N questions from a set (for large sets) */
@Query(value = "SELECT * FROM quiz_questions WHERE set_id = :setId ORDER BY RAND() LIMIT :limit",
		nativeQuery = true)
List<QuizQuestion> findRandomBySetId(@Param("setId") Long setId, @Param("limit") int limit);
}