---
name: Async Execution Queue — MySQL Job Queue (2026-04-16)
description: Full implementation of free async execution queue using existing Railway MySQL — replaces blocking HTTP with job polling pattern
type: project
originSessionId: d8fadb0b-b8f5-4952-824a-ffbbcd3faff7
---
## What Was Built

MySQL-as-queue async execution architecture fully implemented. No Redis, no extra services — uses the existing Railway MySQL database.

**Why:** Render free tier can't run Docker. The sync `/api/execute` held a Tomcat thread for the full execution duration (up to 10s). Under load this caused thread starvation. This pattern decouples HTTP from execution.

**How to apply:** ProblemSolveView.jsx now uses async endpoints. Old sync endpoints still exist and are still used by PlaygroundPage and InterviewModePage.

---

## New Files

### `ExecutionJob.java` — JPA entity
Table: `execution_jobs` (Hibernate auto-creates via `ddl-auto=update`)
- Enums: `Type { RUN, SUBMIT }`, `Status { PENDING, RUNNING, DONE, ERROR }`
- Key fields: id, userId, problemId, code, stdin, javaVersion, jobType, status, result (TEXT), errorMessage, approachText, hintAssisted, solveTimeSecs, createdAt, startedAt, completedAt
- Indexes: `(status, created_at)`, `(user_id)`

### `ExecutionJobRepository.java` — Spring Data repo
- `claimNextPending()`: native SQL UPDATE with `FOR UPDATE SKIP LOCKED` subquery — atomic, no deadlock, safe for multiple workers
- `findAllRunning()`: fetch the row just claimed
- `resetStuckJobs(cutoff)`: on startup, reset RUNNING jobs > 2 min old → PENDING
- `deleteOldFinishedJobs(cutoff)`: housekeeping

### `JobQueueService.java` — queue operations
- `enqueueRun()` / `enqueueSubmit()` — create PENDING job rows
- `claimNext()` — atomic claim (claimNextPending + findAllRunning)
- `markDone()` / `markError()` — write result/error, set completedAt
- `getJob(jobId)` — for polling endpoint
- `recoverStuckJobs()` — called on startup
- `purgeOldJobs(retentionMinutes)` — deletes DONE/ERROR jobs older than window

### `ExecutionWorkerScheduler.java` — @Scheduled worker
- `@Value("${worker.enabled:true}") boolean workerEnabled` — set `WORKER_ENABLED=false` on Render to disable, enable on home server/AWS with zero code changes
- `@PostConstruct recoverOnStartup()` — resets stuck jobs
- `@Scheduled(fixedDelayString="${worker.poll-interval-ms:400}") pollAndProcess()` — main 400ms poll loop
- `@Scheduled(fixedDelay=600_000) purgeOldJobs()` — cleanup every 10 min
- `processRun()` → calls `executionService.execute()`, serializes ExecuteResponse
- `processSubmit()` → evaluates, resolves status, saves Submission, fires postSubmissionTask — identical behavior to old sync submit

---

## Modified Files

### `ExecutionController.java`
Added:
- `POST /api/execute/async` — enqueues RUN job, returns `{jobId, status}` in < 5ms (rate-limited same as sync)
- `GET /api/jobs/{jobId}` — polls job status; returns `{jobId, status, jobType, result}` where result is parsed JSON

### `SubmissionController.java`
Added:
- `POST /api/submissions/submit/async` — enqueues SUBMIT job, returns `{jobId, status}` in < 5ms

### `frontend/src/api/index.js`
Added to `codeApi`:
- `executeAsync(code, stdin, javaVersion)` → calls `/api/execute/async`
- `submitAsync(problemId, code, ...)` → calls `/api/submissions/submit/async`
- `pollJob(jobId)` → calls `GET /api/jobs/{jobId}`

### `frontend/src/components/editor/ProblemSolveView.jsx`
- `handleRun()`: now calls `executeAsync` → `pollUntilDone(jobId)`
- `handleSubmit()`: now calls `submitAsync` → `pollUntilDone(jobId)`
- `pollUntilDone()`: polls every 1.5s, 90s ceiling, updates loading copy ("Running… (3s)" / "Judging… (3s)")

---

## Flow

```
User clicks Run/Submit
        ↓
POST /api/execute/async  (< 5ms, returns jobId)
        ↓
@Scheduled worker polls execution_jobs every 400ms
        ↓
Runs code → writes result JSON to job row (status=DONE)
        ↓
Frontend polls GET /api/jobs/{jobId} every 1.5s
        ↓
DONE → render result
```

---

## Deployment Flexibility

Set `WORKER_ENABLED=false` on Render → API enqueues only, never executes.
Set `WORKER_ENABLED=true` on home server/VPS, point same Railway MySQL DATABASE_URL → worker runs there.
Zero code changes required.

---

## What Was NOT Changed
- Sync `/api/execute` and `/api/submissions/submit` endpoints still exist and work
- `PlaygroundPage.jsx` and `InterviewModePage.jsx` still use the sync endpoints

---

## Open Items
- `InterviewModePage.jsx` still uses sync `codeApi.execute` and `codeApi.submit` — migrate when needed
- Job result is accessible to any authenticated user who knows the jobId — no ownership check yet (low risk: IDs are sequential but not guessable at scale)
