---
name: Security Hardening — Session 2026-04-15
description: All security fixes and hardening applied in the April 15 session — compilation fixes, OOM prevention, code safety, auth hardening, input validation, async architecture
type: project
originSessionId: a665dfa3-5cff-44f4-8bef-53b11f4e6f0b
---
## What Was Fixed in This Session

### 1. OOM Crash Prevention — CRITICAL
**File:** `application.properties`
**Change:** `execution.max-concurrent=8` (was 25)
**Why:** 25 × 270MB per JVM = 6.75GB on a 4GB server → Linux OOM killer fires → kills Spring Boot → entire platform down
**Formula:** `(Total RAM - Spring Boot ~900MB - OS ~500MB) ÷ 270MB per JVM`
- 4 GB server → 8 slots
- 8 GB server → 20 slots
- 16 GB server → 45 slots

### 2. System.exit() Kills the JVM — CRITICAL
**File:** `CodeSafetyScanner.java` (NEW)
**Why:** User code with `System.exit(0)` terminates the entire Spring Boot process, not just the child process. This is the #1 most dangerous vector.
**Fix:** Pre-execution static scan strips comments/strings, then checks for blocked patterns.
Blocked list: `System.exit`, `Runtime.getRuntime`, `ProcessBuilder`, `java.net.Socket`, `java.net.URL`, `System.loadLibrary`, `sun.misc.Unsafe`, `setAccessible(true)`, `ClassLoader`, `defineClass`, `addShutdownHook`

### 3. JVM Process Hardening
**File:** `ExecutionService.java`
**Added flags to every child JVM:**
```
-Xmx128m -XX:MaxMetaspaceSize=64m -Xss4m
-XX:+UseSerialGC -XX:TieredStopAtLevel=1
-Djava.net.preferIPv4Stack=true -Dfile.encoding=UTF-8
-Djava.awt.headless=true
```
**Also fixed:** `javax.annotation.PreDestroy` → `jakarta.annotation.PreDestroy` (Spring Boot 3.x uses Jakarta EE namespace)

### 4. HTTP Thread Starvation — Async Post-Submission
**Files:** `PostSubmissionTask.java` (NEW), `AsyncConfig.java` (NEW)
**Why:** Streak, XP, analytics were running synchronously on the HTTP thread — adding 100–500ms to every submit response
**Fix:** All post-submission work moves to `submissionAsync` thread pool (core=10, max=30, queue=500, CallerRunsPolicy)
**Rule:** HTTP thread returns immediately after DB save. Downstream tasks are fire-and-forget with try/catch.

### 5. User Enumeration via Error Messages
**File:** `GlobalExceptionHandler.java`
**Fix:** `BadCredentialsException` and `UsernameNotFoundException` both return identical `"Invalid credentials"` message
**Why:** Returning "user not found" vs "wrong password" lets attackers determine which email addresses have accounts

### 6. Filename Traversal in Seed Controller
**File:** `SeedController.java`
**Fix:** All 3 filename checks replaced with: `filename.matches("^[a-zA-Z0-9_-]+\\.json$")`
(Was substring checks for "/" and ".." which could be bypassed)

### 7. Missing @Valid on Admin Endpoints
**File:** `AdminContentController.java`
**Fix:** `@Valid` added to all 6 `@RequestBody` parameters (Topic create/update, Example create/update, Problem create/update)
**Why:** Without @Valid, bean validation annotations on DTOs are ignored — any input accepted

### 8. Admin Route Exposure
**File:** `RouteGuards.jsx`
**Fix:** `AdminRoute` now redirects to `/` instead of showing "Admin only" message
**Why:** Showing a gated message confirms the route exists — redirect gives no information

### 9. Screenshot Controller Input Validation
**File:** `AppScreenshotController.java`
**Added:**
- `ALLOWED_SLIDE_KEY` pattern: `^[a-zA-Z0-9_-]{1,64}$`
- `DATA_URI_PREFIX` pattern: `^data:image/(png|jpeg|webp|gif);base64,`
- `MAX_IMAGE_DATA_LEN = 6 * 1024 * 1024` (6MB cap)
- Caption capped at 500 chars

### 10. Unbounded In-Memory Maps
**Files:** `ExecutionRateLimiter.java`, `SubmissionController.java`
**RateLimiter fix:** `AtomicLong sweepCounter`, every 200 calls removes expired windows
**SubmissionController fix:** `IDEMPOTENCY_MAX_ENTRIES = 10_000`, cleanup fires when map exceeds cap

### 11. Compilation Error Fix
**File:** `SubmissionController.java`
**Error:** Duplicate `Long userId` variable (idempotency cache addition declared it at line 68, then again at line 90)
**Fix:** Removed second declaration

### 12. Performance Fix — Double DB Query in Analytics
**File:** `PerformanceAnalyticsService.java`
**Fix:** Single `topicRepo.findById()` lookup stored in `topicOpt` (was called twice)

### 13. Missing DB Index — Full Table Scan on Percentile Query
**File:** `Submission.java`
**Added:** `@Index(name = "idx_sub_percentile", columnList = "problem_id,status,execution_time_ms")`
**Why:** Percentile COUNT queries were scanning the full submissions table

### 14. Frontend 429 / 503 Recovery
**Files:** `api/index.js`, `ProblemSolveView.jsx`
**api/index.js:** 429 interceptor attaches `err.isRateLimit`, `err.retryAfterSeconds`, `err.userMessage`. 503/network attaches `err.isServerBusy`.
**ProblemSolveView.jsx:** `withRetry()` helper — max 4 attempts, exponential backoff (3s, 6s, 9s, 12s). Shows "Server busy — retrying (1/3) in 3s…" in yellow.
**Execute 429:** `Retry-After: 60` header + `retryAfterSeconds: 60` in body.

### 15. HikariCP Connection Pool
**File:** `application.properties`
**Added:** `maximum-pool-size=40`, `minimum-idle=10`, `connection-timeout=30000`, `max-lifetime=600000`
**Why:** Default pool size was 10 — fills instantly at 200 concurrent requests

---

## What Was NOT Done (open items)

- Docker per-execution isolation (requires moving off Render standard plan)
- Redis job queue for async execution → RESOLVED: MySQL job queue implemented 2026-04-16 (see async_execution_queue_2026_04_16.md)
- Execution microservice split (decided on but not yet implemented — see execution_architecture.md)
- Rate limit for syntax-check endpoint uses a hacky approach (`remaining <= -20`) — should get its own bucket eventually
