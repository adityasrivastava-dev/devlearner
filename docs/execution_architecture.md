---
name: Execution Architecture — Code Runner Design & Scale Plan
description: Everything decided about how DevLearner runs user code safely — current state, microservice plan, scale phases, and why Docker-in-Docker on Render is not viable
type: project
originSessionId: a665dfa3-5cff-44f4-8bef-53b11f4e6f0b
---
## Current State (as of 2026-04-16) — Phase 0 + Async Queue

The code runner lives **inside the main Spring Boot JVM**. Safety is enforced by:

1. **`CodeSafetyScanner.java`** — pre-execution static analysis
   - Strips comments and string literals before scanning
   - Blocks: `System.exit`, `Runtime.getRuntime`, `ProcessBuilder`, `java.net.Socket`, `java.net.URL`, `System.loadLibrary`, `sun.misc.Unsafe`, `setAccessible(true)`, `ClassLoader`, `defineClass`, `addShutdownHook`
   - Returns `ScanResult(safe, reason)` — if unsafe, returns `BLOCKED` status immediately, no process spawned
   - Max code size: 50,000 bytes

2. **`ExecutionService.java`** — semaphore-gated ProcessBuilder
   - Semaphore size: **8 slots** (NOT 25 — would OOM a 4GB server)
   - Formula: `(Total RAM - Spring Boot ~900MB - OS ~500MB) ÷ 270MB per JVM`
     - 4 GB → 8 slots, 8 GB → 20 slots, 16 GB → 45 slots
   - Hardened JVM flags per child process:
     ```
     -Xmx128m -XX:MaxMetaspaceSize=64m -Xss4m
     -XX:+UseSerialGC -XX:TieredStopAtLevel=1
     -Djava.net.preferIPv4Stack=true -Dfile.encoding=UTF-8
     -Djava.awt.headless=true
     ```
   - Safety scan runs BEFORE semaphore acquire

3. **`ExecutionRateLimiter.java`** — per-user token bucket
   - 10 executions/min per authenticated user
   - Anonymous users share bucket id=0
   - Periodic sweep: every 200 calls, removes expired windows (prevents unbounded map growth)

4. **`PostSubmissionTask.java`** — async post-submission work
   - Streak, XP, analytics run in `submissionAsync` thread pool
   - HTTP thread returns immediately after DB save — not blocked by analytics
   - Each analytics call wrapped in try/catch — failure never affects the HTTP response

5. **`application.properties`** key settings:
   - `execution.max-concurrent=8`
   - `server.tomcat.threads.max=200`
   - HikariCP pool: 40 max connections, 10 min-idle

**Why Phase 0 is sufficient at < 5K DAU:**
The semaphore prevents OOM. The scanner prevents `System.exit` from killing the JVM. The async task prevents thread starvation. This is production-viable without Docker.

---

## The Core Problem with Docker on Render

Render runs each service inside a Docker container already. It does **NOT** expose `/var/run/docker.sock` to the app container. No privileged mode is available on standard plans.

→ Docker-in-Docker is NOT feasible on Render without moving infrastructure.

---

## The Agreed Next Step — Execution Microservice

Split code execution into a **separate Spring Boot service**. This is the right architectural move.

### Why a separate service (not just Docker)

> "The microservice also runs on JVM — we might find a better option later."

The key insight: the microservice split is infrastructure-agnostic. Once the boundary exists:
- You can swap the runner (Docker, WASM, Firecracker) without touching the main API
- You can crash the execution service without taking down auth/topics/profile
- You can scale execution independently (more RAM, more instances)
- You can move it to a VPS when Render becomes a constraint

The split creates the right boundary. What runs INSIDE the execution service is a separate decision.

### Architecture

```
Main API (Render Service 1, port 8080)
  - Auth, Topics, Problems, Submissions (DB writes)
  - Profile, Admin, Quiz, SRS, Analytics, Roadmap
  - Calls execution service via HTTP (ExecutionClient.java)
  - Rate limiting stays here (per-user)
  - DB writes stay here

Execution Service (Render Service 2, port 8081)
  - POST /internal/execute
  - POST /internal/submit
  - POST /internal/syntax-check
  - Has: CodeSafetyScanner, Semaphore, ProcessBuilder + JVM flags
  - NO auth, NO DB writes — stateless
  - Returns same DTOs: ExecuteResponse, SubmitResponse, SyntaxCheckResponse
```

**Render private networking:** Services on the same Render account can talk via internal URL (no public exposure, ~1ms latency, free). URL pattern: `http://execution-service:8081`.

### What Moves vs What Stays

| Component | Stays in Main API | Moves to Execution Service |
|-----------|-------------------|---------------------------|
| ExecutionController.java | Route shell (delegates) | Full execution logic |
| ExecutionService.java | Removed | ✅ |
| CodeSafetyScanner.java | Removed | ✅ |
| EvaluationService.java | Removed | ✅ |
| ComplexityAnalyzer.java | Removed | ✅ |
| ExecutionRateLimiter.java | ✅ (per-user auth) | Semaphore moves here |
| SubmissionController.java | ✅ (DB saves) | — |
| PostSubmissionTask.java | ✅ | — |

### ExecutionClient (new file in main API)

```java
@Component
public class ExecutionClient {
    private final RestClient restClient; // calls execution service
    
    public ExecuteResponse execute(ExecuteRequest req) { ... }
    public SubmitResponse submit(SubmitRequest req) { ... }
    public SyntaxCheckResponse syntaxCheck(ExecuteRequest req) { ... }
}
```

---

## Scale Evolution Path

This architecture survives all growth phases without rewriting the main API.

### Phase 0 — Current (< 5K DAU)
Single monolith, semaphore + scanner. Good enough.
- Risk: execution crash takes down full platform
- Cost: $7/mo Render web service

### Phase 1 — Execution Microservice (5K–20K DAU) ← NEXT STEP
Main API → HTTP → Execution Service (separate Render service)
- Crash isolation: execution dies, main API stays up
- Independent resource allocation (execution needs more RAM)
- Same JVM runner, same safety model
- Cost: +$7/mo for second Render service

### Phase 1.5 — MySQL Job Queue ✅ DONE (2026-04-16)
MySQL-as-queue implemented using existing Railway DB (zero new infrastructure).
- `execution_jobs` table, `@Scheduled` 400ms worker, `FOR UPDATE SKIP LOCKED` atomic claim
- Frontend polls `GET /api/jobs/{jobId}` every 1.5s instead of blocking on HTTP
- `WORKER_ENABLED` env var lets you move worker to home server/AWS with zero code changes
- See: `async_execution_queue_2026_04_16.md` for full implementation details

### Phase 2 — Redis Job Queue (20K–50K DAU)
Replace MySQL queue with Redis for lower latency and pub/sub result delivery.
Frontend polls `/api/jobs/{jobId}` (same interface, different backend).
- Queue absorbs traffic spikes even better
- Cost: +Redis instance (~$10/mo)

### Phase 3 — Multiple Execution Instances (50K–100K DAU)
Scale execution service to 3 instances, each with 8-slot semaphore = 24 total
Redis queue distributes jobs across instances
- Cost: +2 more execution service instances

### Phase 4 — Move Execution to VPS (100K+ DAU)
Move execution service to DigitalOcean/EC2 where Docker daemon is available
Each job → `docker run --rm --memory=256m --cpus=0.5 openjdk:17-slim`
Main API unchanged — still calls same HTTP endpoint
- True isolation: each submission gets its own container
- Cost: ~$24/mo for DO droplet

### Phase 5 — Kafka + Language Pools (1M+ DAU)
Kafka topics per language, dedicated worker pools, Firecracker microVMs
This is LeetCode-scale infrastructure

---

## LeetCode's Actual Architecture (reference)

For context on what mature execution infrastructure looks like:

1. User submits → API server validates + writes job to **message queue** (Kafka/SQS)
2. **Worker farm** (isolated from API) consumes job
3. Worker spins up **Docker container** per execution (language-specific images)
4. Container has: memory limit, CPU limit, no network, filesystem restrictions, PID limit
5. Result written to **Redis** with TTL
6. Frontend **polls** `/check/{jobId}` or gets result via WebSocket
7. API server NEVER executes code — pure separation

The API cluster and worker farm scale independently. API is stateless HTTP; workers are compute-heavy.

---

## Monitoring Signal for Upgrading

Move to next phase when you observe:
- 429 responses on > 5% of execute/submit requests
- Execution service OOM crashes (check Render logs)
- P95 submit latency > 8 seconds
- User complaints about "judge unavailable"

Until then, the current phase is sufficient.

---

## Why: User's Core Concern

> "If base will be good then I will compete with everyone because system crash will impact on user and user will disappear."

The microservice split is the correct base. It creates the boundary that lets you swap implementation (JVM → Docker → Firecracker) without ever rewriting the main API. The main API stays stable; the execution service evolves.
