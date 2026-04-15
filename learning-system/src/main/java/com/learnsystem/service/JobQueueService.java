package com.learnsystem.service;

import com.learnsystem.model.ExecutionJob;
import com.learnsystem.repository.ExecutionJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * JobQueueService — thin wrapper around ExecutionJobRepository.
 *
 * Responsibilities:
 *  - enqueue()   : create a PENDING job row, return the id
 *  - claimNext() : atomically flip PENDING → RUNNING, return the job
 *  - markDone()  : write result JSON, flip to DONE
 *  - markError() : write error message, flip to ERROR
 *  - getJobView(): return status + result for polling endpoint
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobQueueService {

    private final ExecutionJobRepository repo;

    // ── Enqueue ───────────────────────────────────────────────────────────────

    public ExecutionJob enqueueRun(Long userId, String code, String stdin, String javaVersion) {
        ExecutionJob job = ExecutionJob.builder()
                .userId(userId)
                .code(code)
                .stdin(stdin)
                .javaVersion(javaVersion)
                .jobType(ExecutionJob.Type.RUN)
                .status(ExecutionJob.Status.PENDING)
                .build();
        return repo.save(job);
    }

    public ExecutionJob enqueueSubmit(Long userId, Long problemId,
                                     String code, String javaVersion,
                                     String approachText, Boolean hintAssisted,
                                     Integer solveTimeSecs) {
        ExecutionJob job = ExecutionJob.builder()
                .userId(userId)
                .problemId(problemId)
                .code(code)
                .javaVersion(javaVersion)
                .jobType(ExecutionJob.Type.SUBMIT)
                .status(ExecutionJob.Status.PENDING)
                .approachText(approachText)
                .hintAssisted(hintAssisted)
                .solveTimeSecs(solveTimeSecs)
                .build();
        return repo.save(job);
    }

    // ── Worker operations ─────────────────────────────────────────────────────

    /**
     * Atomically claim the next PENDING job.
     * Uses FOR UPDATE SKIP LOCKED so multiple worker instances never double-process.
     */
    @Transactional
    public Optional<ExecutionJob> claimNext() {
        int claimed = repo.claimNextPending();
        if (claimed == 0) return Optional.empty();

        // Return the row we just flipped to RUNNING
        List<ExecutionJob> running = repo.findAllRunning();
        return running.isEmpty() ? Optional.empty() : Optional.of(running.get(0));
    }

    @Transactional
    public void markDone(Long jobId, String resultJson) {
        repo.findById(jobId).ifPresent(job -> {
            job.setStatus(ExecutionJob.Status.DONE);
            job.setResult(resultJson);
            job.setCompletedAt(LocalDateTime.now());
            repo.save(job);
        });
    }

    @Transactional
    public void markError(Long jobId, String message) {
        repo.findById(jobId).ifPresent(job -> {
            job.setStatus(ExecutionJob.Status.ERROR);
            job.setErrorMessage(message != null && message.length() > 500
                    ? message.substring(0, 500) : message);
            job.setCompletedAt(LocalDateTime.now());
            repo.save(job);
        });
    }

    // ── Polling ───────────────────────────────────────────────────────────────

    public Optional<ExecutionJob> getJob(Long jobId) {
        return repo.findById(jobId);
    }

    // ── Housekeeping ──────────────────────────────────────────────────────────

    /** Called on startup: reset any jobs stuck RUNNING from a previous crashed instance. */
    @Transactional
    public int recoverStuckJobs() {
        // Jobs running for more than 2 minutes are considered stuck
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(2);
        int recovered = repo.resetStuckJobs(cutoff);
        if (recovered > 0) log.warn("Recovered {} stuck RUNNING jobs → PENDING", recovered);
        return recovered;
    }

    /** Called periodically: delete DONE/ERROR jobs older than retention window. */
    @Transactional
    public int purgeOldJobs(int retentionMinutes) {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(retentionMinutes);
        return repo.deleteOldFinishedJobs(cutoff);
    }
}
