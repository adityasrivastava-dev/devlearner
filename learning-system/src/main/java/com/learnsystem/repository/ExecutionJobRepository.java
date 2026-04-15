package com.learnsystem.repository;

import com.learnsystem.model.ExecutionJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExecutionJobRepository extends JpaRepository<ExecutionJob, Long> {

    /**
     * Atomically claim the oldest PENDING job.
     *
     * FOR UPDATE SKIP LOCKED:  if two workers race, each gets a different row —
     * no duplicate processing, no deadlock.
     *
     * The double-subquery wrapping is required by MySQL to UPDATE a table while
     * SELECTing from it in the same statement.
     */
    @Modifying
    @Transactional
    @Query(value = """
        UPDATE execution_jobs
           SET status     = 'RUNNING',
               started_at = NOW()
         WHERE id = (
               SELECT id FROM (
                   SELECT id
                     FROM execution_jobs
                    WHERE status = 'PENDING'
                    ORDER BY created_at ASC
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED
               ) AS subq
         )
        """, nativeQuery = true)
    int claimNextPending();

    /** After claimNextPending() returns 1, fetch the row we just claimed. */
    @Query("SELECT j FROM ExecutionJob j WHERE j.status = 'RUNNING' ORDER BY j.startedAt ASC")
    List<ExecutionJob> findAllRunning();

    /**
     * On server restart, jobs left in RUNNING state were abandoned.
     * Reset them to PENDING so they are retried.
     */
    @Modifying
    @Transactional
    @Query("UPDATE ExecutionJob j SET j.status = 'PENDING', j.startedAt = null " +
           "WHERE j.status = 'RUNNING' AND j.startedAt < :cutoff")
    int resetStuckJobs(@Param("cutoff") LocalDateTime cutoff);

    /**
     * Housekeeping: delete completed/errored jobs older than the retention window
     * so the table does not grow unboundedly.
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM ExecutionJob j WHERE j.status IN ('DONE','ERROR') " +
           "AND j.completedAt < :cutoff")
    int deleteOldFinishedJobs(@Param("cutoff") LocalDateTime cutoff);

    Optional<ExecutionJob> findById(Long id);
}
