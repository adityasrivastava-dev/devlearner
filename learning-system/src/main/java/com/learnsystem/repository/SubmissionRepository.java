package com.learnsystem.repository;

import com.learnsystem.model.Submission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

/** All submissions for a user on a specific problem, newest first */
List<Submission> findByUserIdAndProblemIdOrderByCreatedAtDesc(Long userId, Long problemId);

/** All submissions for a user, newest first */
List<Submission> findByUserIdOrderByCreatedAtDesc(Long userId);

/** Accepted submissions for a problem — used for percentile */
@Query("SELECT s FROM Submission s WHERE s.problemId = :pid AND s.status = 'ACCEPTED'")
List<Submission> findAcceptedByProblemId(@Param("pid") Long problemId);

/** Count accepted submissions for a problem faster than above */
@Query("SELECT COUNT(s) FROM Submission s WHERE s.problemId = :pid AND s.status = 'ACCEPTED'")
long countAcceptedByProblemId(@Param("pid") Long problemId);

/** Count accepted submissions faster than a given time for percentile calc */
@Query("SELECT COUNT(s) FROM Submission s WHERE s.problemId = :pid AND s.status = 'ACCEPTED' AND s.executionTimeMs > :ms")
long countAcceptedSlowerThan(@Param("pid") Long problemId, @Param("ms") Long ms);

/**
 * Count DISTINCT problems a user has ever solved (ACCEPTED).
 * Used to keep users.problems_solved accurate.
 */
@Query("SELECT COUNT(DISTINCT s.problemId) FROM Submission s WHERE s.userId = :uid AND s.status = 'ACCEPTED'")
long countDistinctAcceptedProblemsByUserId(@Param("uid") Long userId);

/**
 * Return the set of DISTINCT problem IDs a user has ever solved.
 * Used by GET /api/submissions/solved so the problems page can mark
 * checkmarks server-side instead of relying on localStorage.
 */
@Query("SELECT DISTINCT s.problemId FROM Submission s WHERE s.userId = :uid AND s.status = 'ACCEPTED'")
List<Long> findSolvedProblemIdsByUserId(@Param("uid") Long userId);

/**
 * Returns submission counts grouped by date for the past 365 days.
 * Used by the calendar heatmap on the sidebar.
 * Returns Object[] rows: [date_string (yyyy-MM-dd), count]
 */
@Query(value = """
    SELECT DATE_FORMAT(s.created_at, '%Y-%m-%d') AS day, COUNT(*) AS cnt
    FROM submissions s
    WHERE s.user_id = :uid
      AND s.created_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)
    GROUP BY day
    ORDER BY day ASC
    """, nativeQuery = true)
List<Object[]> findDailyActivityForUser(@Param("uid") Long userId);
}