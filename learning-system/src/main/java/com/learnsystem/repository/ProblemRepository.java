package com.learnsystem.repository;

import com.learnsystem.model.Problem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long>,
		JpaSpecificationExecutor<Problem> {

/** Returns up to N problems sharing the same pattern, excluding the given id. */
@Query("""
    SELECT p FROM Problem p JOIN FETCH p.topic
    WHERE p.pattern = :pattern AND p.id != :excludeId
    ORDER BY p.difficulty, p.displayOrder
    """)
List<Problem> findSimilarByPattern(
    @Param("pattern") String pattern,
    @Param("excludeId") Long excludeId,
    Pageable pageable);

@Query("SELECT p FROM Problem p WHERE p.topic.id = :topicId ORDER BY p.displayOrder")
List<Problem> findByTopicIdOrderByDisplayOrder(@Param("topicId") Long topicId);

@Query("SELECT p FROM Problem p WHERE p.topic.id = :topicId AND p.difficulty = :difficulty")
List<Problem> findByTopicIdAndDifficulty(@Param("topicId") Long topicId, @Param("difficulty") Problem.Difficulty difficulty);

/**
 * BUG 1 FIX: JOIN FETCH loads topic in same SQL query.
 * Used internally for submission checking / admin operations.
 */
@Query("SELECT p FROM Problem p JOIN FETCH p.topic")
List<Problem> findAllWithTopicFetched();

/** Fetch a single problem with its topic eagerly loaded — avoids LazyInitializationException. */
@Query("SELECT p FROM Problem p JOIN FETCH p.topic WHERE p.id = :id")
Optional<Problem> findByIdWithTopic(@Param("id") Long id);

/** Distinct pattern values — populates the Pattern filter dropdown on /problems page. */
@Query("SELECT DISTINCT p.pattern FROM Problem p WHERE p.pattern IS NOT NULL ORDER BY p.pattern")
List<String> findDistinctPatterns();

/** Pattern name + problem count, sorted by count desc — for tag pills with counts. */
@Query("SELECT p.pattern, COUNT(p) FROM Problem p WHERE p.pattern IS NOT NULL GROUP BY p.pattern ORDER BY COUNT(p) DESC")
List<Object[]> findPatternCounts();

/** Category name + problem count, sorted by count desc — for topic pills with counts. */
@Query("SELECT CAST(t.category AS string), COUNT(p) FROM Problem p JOIN p.topic t GROUP BY t.category ORDER BY COUNT(p) DESC")
List<Object[]> findCategoryCounts();

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

@Modifying
@Query("DELETE FROM Problem")
void deleteAllProblems();

@Query(value = """
    SELECT p.id, p.title, p.difficulty, p.pattern, t.id, t.title
    FROM problems p JOIN topics t ON p.topic_id = t.id
    WHERE MATCH(p.title, p.description, p.pattern) AGAINST(:q IN BOOLEAN MODE)
    LIMIT 10
    """, nativeQuery = true)
List<Object[]> fullTextSearch(@Param("q") String q);
}