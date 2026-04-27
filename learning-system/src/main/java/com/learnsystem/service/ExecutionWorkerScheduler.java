package com.learnsystem.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnsystem.dto.ExecuteResponse;
import com.learnsystem.dto.SubmitRequest;
import com.learnsystem.dto.SubmitResponse;
import com.learnsystem.model.ExecutionJob;
import com.learnsystem.model.Problem;
import com.learnsystem.model.Submission;
import com.learnsystem.repository.ProblemRepository;
import com.learnsystem.repository.SubmissionRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * ExecutionWorkerScheduler — the async execution engine.
 *
 * Polls the execution_jobs table every 400ms, claims one PENDING job,
 * runs the code (Run or Submit), writes the result back.
 *
 * ── Deployment flexibility ──────────────────────────────────────────────────
 * Set  WORKER_ENABLED=false  to disable the scheduler on Render free tier
 * when you want to run the worker on a home server or cheap VPS instead:
 *
 *   Render (API only):       WORKER_ENABLED=false   → no code execution here
 *   Home server / VPS:       WORKER_ENABLED=true    → only runs the scheduler
 *                            Point it at the same Railway MySQL via DATABASE_URL
 *
 * Zero code changes required when you migrate.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ExecutionWorkerScheduler {

    private final JobQueueService      jobQueue;
    private final ExecutionService     executionService;
    private final EvaluationService    evaluationService;
    private final ExecutionClient      executionClient;
    private final SubmissionRepository submissionRepo;
    private final ProblemRepository    problemRepo;
    private final PostSubmissionTask   postSubmissionTask;
    private final ObjectMapper         objectMapper;

    @Value("${worker.enabled:true}")
    private boolean workerEnabled;

    // ── Startup recovery ──────────────────────────────────────────────────────

    @PostConstruct
    public void recoverOnStartup() {
        if (!workerEnabled) return;
        int recovered = jobQueue.recoverStuckJobs();
        log.info("Worker started. Recovered {} stuck jobs.", recovered);
    }

    // ── Main poll loop ────────────────────────────────────────────────────────

    @Scheduled(fixedDelayString = "${worker.poll-interval-ms:400}")
    public void pollAndProcess() {
        if (!workerEnabled) return;
        jobQueue.claimNext().ifPresent(this::processJob);
    }

    // ── Housekeeping: purge old finished jobs every 10 minutes ───────────────

    @Scheduled(fixedDelay = 600_000)
    public void purgeOldJobs() {
        if (!workerEnabled) return;
        int deleted = jobQueue.purgeOldJobs(30); // keep for 30 minutes
        if (deleted > 0) log.debug("Purged {} old execution jobs", deleted);
    }

    // ── Job dispatch ──────────────────────────────────────────────────────────

    private void processJob(ExecutionJob job) {
        long start = System.currentTimeMillis();
        log.debug("Processing job {} type={}", job.getId(), job.getJobType());
        try {
            String resultJson = switch (job.getJobType()) {
                case RUN      -> processRun(job);
                case SUBMIT   -> processSubmit(job);
                case TEST_RUN -> processTestRun(job);
            };
            jobQueue.markDone(job.getId(), resultJson);
            log.debug("Job {} done in {}ms", job.getId(), System.currentTimeMillis() - start);
        } catch (Exception e) {
            log.error("Job {} failed: {}", job.getId(), e.getMessage());
            jobQueue.markError(job.getId(), e.getMessage());
        }
    }

    // ── RUN ───────────────────────────────────────────────────────────────────

    private String processRun(ExecutionJob job) throws Exception {
        String harness = null;
        if (job.getProblemId() != null) {
            harness = problemRepo.findById(job.getProblemId())
                    .map(Problem::getCodeHarness).orElse(null);
        }
        String javaVersion = job.getJavaVersion() != null ? job.getJavaVersion() : "17";
        String stdin       = job.getStdin() != null ? job.getStdin() : "";

        ExecuteResponse res = executionClient.isEnabled()
                ? executionClient.execute(job.getCode(), stdin, javaVersion, harness)
                : executionService.execute(job.getCode(), stdin, javaVersion, harness);

        return objectMapper.writeValueAsString(res);
    }

    // ── SUBMIT ────────────────────────────────────────────────────────────────

    private String processSubmit(ExecutionJob job) throws Exception {
        String javaVersion = job.getJavaVersion() != null ? job.getJavaVersion() : "17";
        SubmitResponse result;

        if (executionClient.isEnabled()) {
            // Fetch test cases here and send them to the stateless execution service
            result = remoteEvaluate(job, javaVersion);
        } else {
            SubmitRequest req = new SubmitRequest();
            req.setProblemId(job.getProblemId());
            req.setCode(job.getCode());
            req.setJavaVersion(javaVersion);
            result = evaluationService.evaluate(req);
        }

        String status = resolveStatus(result);
        long maxMs = result.getResults() == null ? 0L :
                result.getResults().stream()
                        .mapToLong(SubmitResponse.TestCaseResult::getExecutionTimeMs)
                        .max().orElse(0L);

        Submission sub = Submission.builder()
                .userId(job.getUserId())
                .problemId(job.getProblemId())
                .status(status)
                .passedTests(result.getPassedTests())
                .totalTests(result.getTotalTests())
                .executionTimeMs(maxMs)
                .solveTimeSecs(job.getSolveTimeSecs() != null ? job.getSolveTimeSecs().longValue() : null)
                .code(job.getCode())
                .hintAssisted(Boolean.TRUE.equals(job.getHintAssisted()))
                .javaVersion(javaVersion)
                .approachText(job.getApproachText())
                .createdAt(LocalDateTime.now())
                .build();
        submissionRepo.save(sub);
        log.info("Submission saved: user={} problem={} status={} ms={}",
                job.getUserId(), job.getProblemId(), status, maxMs);

        if (job.getUserId() != null) {
            int xpEarned = "ACCEPTED".equals(status) ? 10 : 1;
            Long   topicId        = null;
            String problemTitle   = null;
            String correctPattern = null;
            try {
                var prob = problemRepo.findByIdWithTopic(job.getProblemId()).orElse(null);
                if (prob != null) {
                    topicId        = prob.getTopic() != null ? prob.getTopic().getId() : null;
                    problemTitle   = prob.getTitle();
                    correctPattern = prob.getPattern();
                }
            } catch (Exception ignored) {}

            postSubmissionTask.run(
                    job.getUserId(), job.getProblemId(), topicId, problemTitle,
                    status, job.getSolveTimeSecs() != null ? job.getSolveTimeSecs().longValue() : null,
                    Boolean.TRUE.equals(job.getHintAssisted()),
                    result.getDetectedPattern(), correctPattern,
                    job.getCode(), xpEarned);
        }

        return objectMapper.writeValueAsString(buildSubmitResponseMap(result, sub.getId(), maxMs, job.getProblemId()));
    }

    /**
     * Evaluate via the remote execution service.
     * Fetches test cases from DB here (main API has DB access), then sends them
     * to the stateless execution service along with the code.
     */
    private SubmitResponse remoteEvaluate(ExecutionJob job, String javaVersion) throws Exception {
        var problem = problemRepo.findById(job.getProblemId())
                .orElseThrow(() -> new RuntimeException("Problem not found: " + job.getProblemId()));

        String harness = problem.getCodeHarness();

        List<Map<String, String>> rawTestCases;
        try {
            rawTestCases = objectMapper.readValue(problem.getTestCases(),
                    new com.fasterxml.jackson.core.type.TypeReference<>() {});
        } catch (Exception e) {
            rawTestCases = List.of();
        }

        List<ExecutionClient.TestCaseInput> testCases = rawTestCases.stream()
                .map(tc -> {
                    String input    = tc.getOrDefault("input", "");
                    String expected = tc.containsKey("expectedOutput")
                            ? tc.getOrDefault("expectedOutput", "")
                            : tc.getOrDefault("output", "");
                    return new ExecutionClient.TestCaseInput(input, expected);
                })
                .collect(Collectors.toList());

        return executionClient.submit(job.getCode(), javaVersion, harness, testCases);
    }

    // ── TEST_RUN ──────────────────────────────────────────────────────────────

    /**
     * TEST_RUN: evaluate against the problem's test cases but do NOT persist a submission.
     * Used when the user clicks Run on a method-based problem (no main() in their code).
     */
    private String processTestRun(ExecutionJob job) throws Exception {
        String javaVersion = job.getJavaVersion() != null ? job.getJavaVersion() : "17";
        SubmitResponse result;

        if (executionClient.isEnabled()) {
            result = remoteEvaluate(job, javaVersion);
        } else {
            SubmitRequest req = new SubmitRequest();
            req.setProblemId(job.getProblemId());
            req.setCode(job.getCode());
            req.setJavaVersion(javaVersion);
            result = evaluationService.evaluate(req);
        }

        return objectMapper.writeValueAsString(result);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String resolveStatus(SubmitResponse result) {
        if (result.getResults() == null) return result.isAllPassed() ? "ACCEPTED" : "WRONG_ANSWER";
        if (result.getResults().stream().anyMatch(r -> "COMPILE_ERROR".equals(r.getStatus())))
            return "COMPILE_ERROR";
        if (result.getResults().stream().anyMatch(r -> "RUNTIME_ERROR".equals(r.getStatus())))
            return "RUNTIME_ERROR";
        if (result.getResults().stream().anyMatch(r -> "TIMEOUT".equals(r.getStatus())))
            return "TLE";
        return result.isAllPassed() ? "ACCEPTED" : "WRONG_ANSWER";
    }

    /**
     * Build the same Map shape that SubmissionController's sync endpoint returns,
     * so the frontend polling code doesn't need a different response handler.
     */
    private java.util.Map<String, Object> buildSubmitResponseMap(
            SubmitResponse result, Long submissionId, long maxMs, Long problemId) {
        var map = new java.util.LinkedHashMap<String, Object>();
        String compareResult = result.getResults() == null ? "" :
                result.getResults().stream()
                        .map(r -> r.isPassed() ? "1" : "0")
                        .collect(Collectors.joining());
        map.put("allPassed",              result.isAllPassed());
        map.put("totalTests",             result.getTotalTests());
        map.put("passedTests",            result.getPassedTests());
        map.put("compareResult",          compareResult);
        map.put("hint",                   result.getHint());
        map.put("results",                result.getResults());
        map.put("detectedPattern",        result.getDetectedPattern());
        map.put("methodologyExplanation", result.getMethodologyExplanation());
        map.put("optimizationNote",       result.getOptimizationNote());
        map.put("submissionId",           submissionId);
        map.put("executionTimeMs",        maxMs);
        map.put("runtimeMs",              maxMs);

        // Percentile — same logic as sync SubmissionController
        if (result.isAllPassed() && maxMs > 0 && problemId != null) {
            try {
                long total  = submissionRepo.countAcceptedByProblemId(problemId);
                long slower = submissionRepo.countAcceptedSlowerThan(problemId, maxMs);
                if (total > 1) {
                    double pct = Math.round((double) slower / total * 100.0);
                    map.put("percentile",     pct);
                    map.put("fasterThan",     (int) pct);
                    map.put("totalAccepted",  total);
                }
            } catch (Exception e) {
                log.warn("Percentile calc failed for problemId={}: {}", problemId, e.getMessage());
            }
        }
        return map;
    }
}
