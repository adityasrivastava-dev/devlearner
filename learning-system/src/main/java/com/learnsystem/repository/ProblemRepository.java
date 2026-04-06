package com.learnsystem.repository;

import com.learnsystem.model.Problem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long>,
        JpaSpecificationExecutor<Problem> {

List<Problem> findByTopicIdOrderByDisplayOrder(Long topicId);

List<Problem> findByTopicIdAndDifficulty(Long topicId, Problem.Difficulty difficulty);

/**
 * BUG 1 FIX: JOIN FETCH loads topic in same SQL query.
 * Used internally for submission checking / admin operations.
 */
@Query("SELECT p FROM Problem p JOIN FETCH p.topic")
List<Problem> findAllWithTopicFetched();

/** Distinct pattern values — populates the Pattern filter dropdown on /problems page. */
@Query("SELECT DISTINCT p.pattern FROM Problem p WHERE p.pattern IS NOT NULL ORDER BY p.pattern")
List<String> findDistinctPatterns();

/**
 * Paginated, filtered list for GET /api/problems.
 * Every filter is optional — pass NULL to skip that filter.
 * countQuery is separate so Hibernate does not try to COUNT a JOIN.
 */
@Query(value = """
        SELECT p FROM Problem p JOIN p.topic t
        WHERE (:category   IS NULL OR CAST(t.category   AS string) = :category)
          AND (:topicId    IS NULL OR t.id               = :topicId)
          AND (:difficulty IS NULL OR CAST(p.difficulty AS string) = :difficulty)
          AND (:pattern    IS NULL OR p.pattern           = :pattern)
          AND (:search     IS NULL
               OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY t.category, t.id, p.displayOrder
        """,
       countQuery = """
        SELECT COUNT(p) FROM Problem p JOIN p.topic t
        WHERE (:category   IS NULL OR CAST(t.category   AS string) = :category)
          AND (:topicId    IS NULL OR t.id               = :topicId)
          AND (:difficulty IS NULL OR CAST(p.difficulty AS string) = :difficulty)
          AND (:pattern    IS NULL OR p.pattern           = :pattern)
          AND (:search     IS NULL
               OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')))
        """)
Page<Problem> findPageFiltered(
        @Param("category")   String category,
        @Param("topicId")    Long   topicId,
        @Param("difficulty") String difficulty,
        @Param("pattern")    String pattern,
        @Param("search")     String search,
        Pageable             pageable);
}
