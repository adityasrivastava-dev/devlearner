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
}