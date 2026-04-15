# DevLearner — Product & Architecture Plan

Feature roadmap, execution architecture, and data quality specs.
Architecture and file locations are in [CLAUDE.md](./CLAUDE.md).
Security hardening history is in [SECURITY.md](./SECURITY.md).

---

## ⚠️ PRIORITY 0 — Execution Architecture (Before Any New Feature)

> This section must be read before touching ExecutionService, SubmissionController, or any code-run endpoint.
> At 10M+ concurrent submit/run events the current architecture collapses at Phase 1.
> Build each phase before the next one is needed, not after.

---

### Where We Are Now (Phase 0 — Implemented)

```
Browser  →  POST /api/execute or /api/submissions/submit
              │
              ├─ CodeSafetyScanner        (blocks System.exit, ProcessBuilder, network)
              ├─ ExecutionRateLimiter     (10 runs/min per user, in-memory)
              ├─ Semaphore(25)            (max 25 JVM child processes alive at once)
              │
              ├─ ProcessBuilder(java -Xmx128m -XX:MaxMetaspaceSize=64m ...)
              │    └─ TIMEOUT_SECONDS=10  (destroyForcibly after 10s)
              │
              ├─ submissionRepo.save()    (synchronous — user waits)
              └─ PostSubmissionTask       (async: streak, analytics, XP)
```

**Hard ceiling:** ~25 concurrent executions on a 4 GB server.
**Safe load:** up to ~5K daily active users if submissions are spread across the day.
**Will crash at:** ~200 simultaneous Run/Submit clicks.

---

### Phase 1 — Docker Isolation (Target: 50K DAU / ~500 concurrent)

**The single most important change. Do this before any other scaling work.**

Replace bare `ProcessBuilder("java", ...)` with a Docker container per execution.
The semaphore stays — it now caps Docker containers, not JVM processes.

**Why Docker over bare JVM:**

| Risk | Bare JVM (now) | Docker |
|------|---------------|--------|
| `System.exit(0)` | Kills Spring Boot server | Kills only container |
| Memory over limit | JVM crash → OOM killer → server down | Container OOM-killed, server unaffected |
| Fork bomb via threads | Thread table exhaustion | `--pids-limit 50` enforced by OS cgroups |
| File system read | User reads /etc/passwd | `--read-only` mount, tmpfs only |
| Network calls | Outbound connection succeeds | `--network none` — kernel-level block |
| CPU runaway | Steals all cores | `--cpus 0.5` hard limit via cgroups |

**Implementation — replace `run()` in `ExecutionService.java`:**

```java
// BEFORE (current):
new ProcessBuilder("java", "-cp", tempDir.toString(), "-Xmx128m", className)

// AFTER (Phase 1):
new ProcessBuilder(
    "docker", "run", "--rm",
    "--network",      "none",          // no internet, no LAN
    "--memory",       "256m",          // hard RAM cap (OOM-kills container, not host)
    "--memory-swap",  "256m",          // no swap — memory bombs die instantly
    "--cpus",         "0.5",           // 50% of 1 core max
    "--pids-limit",   "50",            // prevents fork bombs
    "--read-only",                     // container filesystem is read-only
    "--tmpfs",        "/code:size=32m", // only /code is writable (source file + .class)
    "--ulimit",       "nofile=64:64",  // 64 file descriptors max
    "--ulimit",       "nproc=50:50",   // 50 processes max (OS-level)
    "--user",         "nobody",        // run as unprivileged user
    "-i",                              // stdin from pipe
    "devlearn-judge:17",               // custom image: openjdk:17-slim + nothing else
    "java", "-cp", "/code",
             "-Xmx200m",
             "-XX:MaxMetaspaceSize=64m",
             "-XX:+UseSerialGC",
             "-XX:TieredStopAtLevel=1",
             "-Djava.awt.headless=true",
             className
)
```

**Dockerfile for the judge image (`docker/judge/Dockerfile`):**
```dockerfile
FROM openjdk:17-slim
# No curl, no wget, no shell tools — minimal attack surface
RUN apt-get purge -y wget curl && apt-get autoremove -y
WORKDIR /code
USER nobody
```

**Semaphore sizing with Docker:**
```properties
# Each container: 256m RAM + 0.5 CPU
# On 4 GB server with 4 cores: max 12 containers (3 GB RAM, 2 cores reserved for Spring Boot)
execution.max-concurrent=12
```

**Pre-pull the image on server start** so first execution isn't slow:
```java
// In ExecutionService @PostConstruct:
Runtime.getRuntime().exec("docker pull devlearn-judge:17");
```

---

### Phase 1.5 — MySQL Async Job Queue ✅ IMPLEMENTED (2026-04-16)

**What was built:** MySQL-as-queue async execution using the existing Railway DB. Zero new infrastructure.

**How it works (confirmed by reverse-engineering LeetCode's own API — see section below):**
```
POST /api/execute/async        → enqueues job, returns { jobId } in < 5ms
POST /api/submissions/submit/async → same pattern
GET  /api/jobs/{jobId}         → poll: PENDING → RUNNING → DONE

@Scheduled worker polls execution_jobs table every 400ms
FOR UPDATE SKIP LOCKED  →  atomic claim, safe for multiple workers
WORKER_ENABLED=false    →  disable worker on Render, move to home server with zero code changes
```

**Key files:** `ExecutionJob.java`, `ExecutionJobRepository.java`, `JobQueueService.java`, `ExecutionWorkerScheduler.java`

---

### LeetCode API — Reverse Engineering (2026-04-16)

> Observed by running code with `System.exit(0)` on LeetCode and capturing the network calls.
> This is exactly the architecture we should build toward.

**What LeetCode does on "Run":**

**Step 1 — POST /problems/{slug}/interpret_solution/**
```json
Request:  { "lang": "java", "question_id": "1", "typed_code": "...", "data_input": "[2,7,11,15]\n9\n..." }
Response: { "interpret_id": "runcode_1776280418.9630487_O8QL3fZD06", "test_case": "..." }
```
- Returns in milliseconds — just enqueues, never executes synchronously
- `interpret_id` = `runcode_{timestamp}_{random}` — not a sequential int like ours, harder to guess
- `data_input` is sent in the request (not stored only server-side) — enables custom test cases

**Step 2 — GET /submissions/detail/{interpret_id}/check/** (polled every ~1.5s)
```
Attempt 1: { "state": "PENDING" }
Attempt 2: { "state": "PENDING" }
Attempt 3: { "state": "STARTED" }
Attempt 4: { "state": "SUCCESS", "status_msg": "Accepted", ... }
```
Status progression: **PENDING → STARTED → SUCCESS** (3 states, not 2)

**Full final response shape (our target):**
```json
{
  "status_code": 10,
  "lang": "java",
  "run_success": true,
  "status_runtime": "82 ms",
  "memory": 42584000,
  "code_answer": [],
  "code_output": [],
  "std_output_list": [""],
  "elapsed_time": 86,
  "expected_code_answer": ["[0,1]", "[1,2]", "[0,1]", ""],
  "expected_std_output_list": ["", "", "", ""],
  "correct_answer": false,
  "compare_result": "000",
  "total_correct": 0,
  "total_testcases": 3,
  "status_msg": "Accepted",
  "state": "SUCCESS"
}
```

**Key insights from LeetCode's response:**

| What LeetCode returns | What we return now | Gap / Action |
|---|---|---|
| `state: PENDING/STARTED/SUCCESS` | `status: PENDING/RUNNING/DONE` | Minor naming difference — acceptable |
| `run_success: true` even when `correct_answer: false` | Same (we return execution success separately) | ✅ Already correct |
| `code_answer[]` — user's actual output per test case | ✅ `results[].output` | ✅ Already correct |
| `expected_code_answer[]` — expected output per test case | ✅ `results[].expectedOutput` | ✅ Already correct |
| `compare_result: "000"` — pass/fail per test case as bit string | ❌ Not returned | **Add to response** |
| `std_output_list[]` — stdout per test case | ✅ `results[].stdout` | ✅ Already correct |
| `memory` in bytes | ❌ Not measured | Future improvement |
| `status_runtime: "82 ms"` | ✅ `executionTimeMs` | ✅ Already correct |
| `interpret_id` uses timestamp+random (not sequential int) | ❌ We use sequential `IDENTITY` id | **Security: add random suffix to job ID in URL** |

**Critical finding — `System.exit(0)` ran successfully on LeetCode:**
- LeetCode returned `run_success: true` with `status_msg: "Accepted"` despite `System.exit(0)` in the code
- This confirms they run each submission in a **Docker container** — `System.exit` kills only the container, not their server
- Our `CodeSafetyScanner` blocks `System.exit` statically — correct for now (Phase 0, no Docker isolation)
- Once we add Docker (Phase 1), we can remove the `System.exit` block since it becomes harmless

**What to implement next based on LeetCode findings:**

1. **`compare_result` bit string** — `"010"` means test 1 failed, test 2 passed, test 3 failed. Add to `ExecutionWorkerScheduler.buildSubmitResponseMap()`:
   ```java
   String compareResult = result.getResults().stream()
       .map(r -> r.isPassed() ? "1" : "0")
       .collect(Collectors.joining());
   map.put("compareResult", compareResult);
   ```

2. **Job ID obfuscation** — replace sequential `Long id` in the polling URL with `jobId + "_" + UUID.randomUUID().toString().substring(0,8)`. Store both in the job row. Prevents users from polling other users' jobs by guessing IDs.

3. **`STARTED` status** — add a third status value between RUNNING and DONE so frontend can show "Running your code…" vs "Waiting in queue…". Update `ExecutionJob.Status` to `{ PENDING, RUNNING, STARTED, DONE, ERROR }` and set it when the worker begins compilation.

4. **`data_input` in Run requests** — LeetCode sends test case data in the request payload. We store test cases in the DB and look them up. Both are valid — ours is safer (can't inject custom test cases for Submit). Keep as-is for Submit; for Run we already accept `stdin` in the request.

---

### Phase 2 — Async Submission with Job Polling (Target: 200K DAU / ~2K concurrent)

**Problem Phase 1 doesn't solve:** HTTP thread still blocks for 5-10s waiting for Docker.
With 400 Tomcat threads and 8s average execution, you saturate at 50 concurrent.

**Solution:** Replace MySQL queue with Redis for lower latency. Same polling interface.

**New flow:**
```
POST /api/submissions/submit
  → validate + save Submission(status=PENDING)
  → push job to Redis List (LPUSH jobs:queue jobJson)
  → return { jobId: 12345, status: "PENDING" }   ← responds in < 10ms

GET /api/submissions/{jobId}/status  (poll every 2s)
  → check Redis for result
  → if ready: return full result + update Submission row
  → if timeout (>30s): return { status: "QUEUE_TIMEOUT" }
```

**Infrastructure needed:** Redis (single instance, not cluster yet).

**Backend changes:**
```java
// New: JobQueueService
@Service
public class JobQueueService {
    private final StringRedisTemplate redis;
    private static final String QUEUE_KEY  = "exec:queue";
    private static final String RESULT_KEY = "exec:result:";

    public void enqueue(ExecutionJob job) {
        redis.opsForList().leftPush(QUEUE_KEY, serialize(job));
    }

    public Optional<ExecutionResult> pollResult(Long jobId) {
        String raw = redis.opsForValue().get(RESULT_KEY + jobId);
        if (raw == null) return Optional.empty();
        return Optional.of(deserialize(raw));
    }

    public void storeResult(Long jobId, ExecutionResult result) {
        // TTL = 5 minutes — browser should have polled by then
        redis.opsForValue().set(RESULT_KEY + jobId, serialize(result), Duration.ofMinutes(5));
    }
}

// New: GET /api/submissions/{jobId}/status endpoint
@GetMapping("/{jobId}/status")
public ResponseEntity<?> getStatus(@PathVariable Long jobId) {
    return jobQueueService.pollResult(jobId)
        .map(result -> ResponseEntity.ok(result))
        .orElse(ResponseEntity.accepted().body(Map.of("status", "PENDING")));
}
```

**Frontend change in `ProblemSolveView.jsx`:**
```javascript
// BEFORE: await codeApi.submit(...)  ← blocks for 10s
// AFTER:
const { jobId } = await codeApi.submitAsync(problemId, code, ...);
setSubmitResult({ loading: true, jobId });

// Poll every 2s, timeout after 30s
const result = await pollJobResult(jobId, { intervalMs: 2000, timeoutMs: 30000 });
setSubmitResult(result);
```

**Redis dependencies to add to `pom.xml`:**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

**`application.properties` additions:**
```properties
spring.data.redis.host=${REDIS_HOST:localhost}
spring.data.redis.port=${REDIS_PORT:6379}
spring.data.redis.timeout=2000ms
```

---

### Phase 3 — Worker Farm (Target: 1M DAU / ~10K concurrent)

**Problem Phase 2 doesn't solve:** Spring Boot itself is still picking jobs from Redis
and running containers. One server, one queue consumer, still bounded.

**Solution:** Separate execution worker processes that can scale independently.

```
┌─────────────────────────────────────────────────────┐
│                   Spring Boot API                    │
│  POST /submit → Redis queue → return jobId          │
│  GET /status  → Redis result lookup                 │
└───────────────────┬─────────────────────────────────┘
                    │ pushes to
                    ▼
          ┌─────────────────┐
          │   Redis Stream   │   (or RabbitMQ / SQS)
          │  exec:jobs       │
          └────────┬────────┘
                   │ consumed by
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   Worker-1    Worker-2    Worker-3   (separate JVM processes or containers)
   runs        runs        runs
   Docker      Docker      Docker
   containers  containers  containers
        │          │          │
        └──────────┴──────────┘
                   │ writes result to
                   ▼
             Redis (exec:result:{jobId})
                   │
                   ▼ API polls on status request
              Spring Boot API → browser
```

**Worker is a separate Spring Boot app** (`execution-worker/`):
```java
@Component
public class ExecutionWorker {
    @Scheduled(fixedDelay = 100)  // poll every 100ms
    public void processNext() {
        ExecutionJob job = queue.dequeue();
        if (job == null) return;
        ExecutionResult result = dockerExecutor.run(job);
        resultStore.store(job.getJobId(), result);
    }
}
```

**Auto-scaling rule (AWS ECS / Kubernetes HPA):**
- Scale up when queue depth > 50 jobs
- Scale down when queue depth < 5 jobs for 2 minutes
- Min workers: 2, Max workers: 50

**Infrastructure at this phase:**
- Redis Cluster (3 shards for queue + results)
- Worker fleet: EC2 `c5.xlarge` (4 vCPU, 8GB) — each runs 8 Docker containers concurrently
- ALB in front of Spring Boot API
- RDS MySQL with 1 read replica (analytics reads hit replica)

---

### Phase 4 — Production Grade (Target: 10M DAU / ~100K concurrent peak)

**What LeetCode actually runs.** Only needed if DevLearner reaches serious scale.

```
Browser
   │
   ▼
Cloudflare (DDoS, bot detection, WAF, rate limit by IP)
   │
   ▼
AWS ALB
   │
   ├──► API Fleet (Spring Boot, 10–50 instances, Auto Scaling)
   │         │
   │         ├──► MySQL Primary (writes: submissions, users)
   │         ├──► MySQL Replica × 2 (reads: analytics, leaderboard)
   │         ├──► Redis Cluster (sessions, rate limiting, job results)
   │         └──► Kafka Topic: "code-submissions"
   │
   └──► Worker Fleet (Java-specific, Python-specific, etc.)
             │
             ├──► Kafka Consumer Group "java-workers"
             │       └──► Docker containers (--network none, cgroups)
             ├──► Kafka Consumer Group "python-workers"
             └──► Kafka Consumer Group "cpp-workers"

Result flow: Worker → Kafka "job-results" → API reads → WebSocket push to browser
```

**Language-specific worker pools:**

| Language | Worker image | Concurrency per node | Instance type |
|----------|-------------|---------------------|---------------|
| Java 17  | `openjdk:17-slim` | 8 | c5.xlarge |
| Python 3 | `python:3.11-slim` | 16 | c5.large |
| C++      | `gcc:12-slim` | 16 | c5.large |

**WebSocket for real-time result push (replaces polling):**
```java
// Browser subscribes on submit:
stompClient.subscribe(`/user/queue/result/${jobId}`, onResult);

// Worker publishes when done:
messagingTemplate.convertAndSendToUser(userId, "/queue/result/" + jobId, result);
```

**Database sharding strategy for submissions table:**
- Shard by `user_id % 16` → 16 MySQL shards
- Each shard: separate RDS instance with read replica
- Submissions table grows ~10M rows/day at 10M DAU

---

### Syntax Check Architecture (All Phases)

**Current problem:** `POST /api/syntax-check` spawns temp dir + runs Java Compiler API (in-process)
for every keypress debounce. At 10K users typing simultaneously = 10K compilations/sec.

**Phase 0 (done):** Rate limit syntax-check endpoint. 600ms debounce on client.

**Phase 1 fix — Cache by code hash:**
```java
// Add to ExecutionService.syntaxCheck():
String codeHash = DigestUtils.md5Hex(code + javaVersion);
String cached   = redis.opsForValue().get("syntax:" + codeHash);
if (cached != null) return deserialize(cached, SyntaxCheckResponse.class);

SyntaxCheckResponse result = doCompile(code, javaVersion);
redis.opsForValue().set("syntax:" + codeHash, serialize(result), Duration.ofMinutes(10));
return result;
```

**Phase 2 fix — Move syntax check entirely to Monaco's built-in language server:**

Monaco Editor already has a Java grammar for syntax highlighting. For real compile errors,
add the [Java Language Server Protocol (LSP)](https://github.com/eclipse/eclipse.jdt.ls) as a
Web Worker in the browser. Zero server calls for syntax checking.

```javascript
// frontend/src/components/editor/JavaLspWorker.js
// Runs eclipse.jdt.ls in a Web Worker via monaco-languageclient
// All syntax errors resolved client-side — server never sees keystrokes
```

Until LSP is set up, keep the current debounced `/api/syntax-check` with rate limiting.
The Java Compiler API runs in-process (no subprocess) so it's fast and safe.

**What NOT to do:** Never call `/api/syntax-check` on every keystroke without debouncing.
Minimum debounce: 600ms (current). Recommended: 1000ms.

---

### Safety Checklist — Every Phase

These must be in place before going live at any scale:

| Layer | Control | Status |
|-------|---------|--------|
| Scanner | Block `System.exit`, `ProcessBuilder`, network, native libs | ✅ Done |
| Scanner | 50KB code size limit | ✅ Done |
| Process | Semaphore cap (25 concurrent JVM processes) | ✅ Done |
| JVM flags | `-Xmx128m -XX:MaxMetaspaceSize=64m -XX:TieredStopAtLevel=1` | ✅ Done |
| Timeout | `destroyForcibly()` after 10s | ✅ Done |
| Rate limit | 10 runs/min per user (in-memory) | ✅ Done |
| Rate limit | Syntax-check rate limited | ✅ Done |
| Rate limit | Login brute force: 5 attempts/15min per IP+email | ✅ Done |
| Container | `--network none` (no outbound) | Phase 1 |
| Container | `--memory 256m --memory-swap 256m` | Phase 1 |
| Container | `--pids-limit 50` (no fork bombs) | Phase 1 |
| Container | `--read-only --tmpfs /code` | Phase 1 |
| Container | `--user nobody` (unprivileged) | Phase 1 |
| Queue | Async execution with MySQL job polling | ✅ Done (Phase 1.5) |
| Rate limit | Redis-backed distributed rate limiter (replaces in-memory) | Phase 2 |
| Database | Read replica for analytics queries | Phase 3 |
| Network | WAF + DDoS protection (Cloudflare) | Phase 3 |
| Infra | Separate execution worker fleet | Phase 3 |
| Queue | Kafka for execution pipeline | Phase 4 |
| Infra | Language-specific worker pools | Phase 4 |

---

## Feature Roadmap (ranked by impact ÷ effort)

### Tier 1 — High Impact, Buildable Now (1–9)

**1. Editorial Unlock Improvement**
Editorials currently only unlock after `ACCEPTED`. Also unlock after 2 failed submissions OR 10+ minutes spent.
- Backend: `attemptsBeforeEditorial` check in `SubmissionController`; track `firstOpenedAt` on `UserTopicProgress`
- Frontend: track `startedAt = Date.now()` when Practice tab opens; pass elapsed time to unlock check

**2. Company Tags on Problems**
Add `companies` field (JSON array) to `Problem`. Filter by company on `/problems`.
- Backend: add `companies` TEXT column; add `?company=Google` filter in `ProblemsController`
- Frontend: company chips on problem cards, company filter dropdown
- Data: tag existing problems in seed files going forward

**3. Cheat Sheet View (`/cheat-sheet`)**
One-page printable summary per topic: memory anchor pills, complexity table, 3 key code snippets.
- Frontend: `/cheat-sheet?topic={id}` route, `@media print` CSS, `window.print()` button. No new backend.

**4. Guided Learning Path (`/path`)**
Week-by-week roadmap. Shows % complete per week from gate stages + displayOrder.
- No new backend — derive from existing gate stage data
- Frontend: timeline UI, nodes coloured by gate stage

**5. Weak Topic Auto-Suggest on Dashboard**
"Focus today" card: 3 topics with lowest confidence score from `UserTopicPerformance`.
- Frontend: card on dashboard calling `analyticsApi.getDashboard()`, surfacing bottom-3 `weakAreas`

**6. System Design Interview Q&A Data**
Spring Boot questions live. Still missing: System Design category.
- Create batch JSON: rate limiter, URL shortener, CAP theorem, consistent hashing, leader election
- Import via Admin → Interview Q&A → Batch Upload

**7. Custom Quiz Builder**
Pick topics, difficulty, question count (5/10/20), generate a quiz from MCQ bank.
- Backend: add `topicTag` to `QuizQuestion`; add filter param to quiz sets endpoint
- Frontend: setup modal on `/quiz` before session starts

**8. Topic Concept Links (Related Topics)**
"Related Topics" chips in theory tab (HashMap → Trees → Heaps).
- Backend: add `relatedTopicIds` TEXT column to `Topic`
- Frontend: chips in theory tab header; clicking navigates to `/?topic={id}`
- Admin: multi-select field in topic editor Info tab

**9. Interview History Log (`/my-interviews`)**
Personal log of real interviews: company, date, round, outcome.
- Backend: `InterviewLog { userId, company, date, roundType, notes, outcome }` table + CRUD
- Frontend: `/my-interviews` page — add entry form + timeline

---

### Tier 2 — High Value, Slightly More Build (10–18)

**10. Bookmark Collections**
Named collections: "Google prep", "Week 3 review". Currently flat list.
- Backend: `BookmarkCollection { id, userId, name }` + `collectionId` FK on `Bookmark`
- Frontend: collections sidebar on `/bookmarks`

**11. Code Snippet Library (`/snippets`)**
Personal library of reusable patterns. Save from Monaco or paste manually.
- Backend: `CodeSnippet { id, userId, title, code, tags }` table
- Frontend: `/snippets` page + "Save to Snippets" button in Monaco toolbar

**12. User Topic Difficulty Rating**
Post-mastery prompt: "How hard was this? 1–5 stars."
- Frontend: post-mastery modal in `TopicView.jsx` when gate flips to MASTERED

**13. Progress Export**
Export "Study Report" as printable page or PDF.
- Frontend only: `/report` route with `@media print` CSS; data from analytics + gate endpoints

**14. Friend Challenges / Groups**
Two users challenge each other: "Solve this in 30 min."
- Backend: `Group`, `GroupMember`, `Challenge` tables; WebSocket or polling
- Frontend: `/groups` page, challenge invite flow

**15. Pattern Relationship Map (`/patterns`)**
Visual graph: Sliding Window → Two Pointers → Prefix Sum → Kadane's.
- Backend: `Pattern { name, description, parentPatternId }` table
- Frontend: D3 or CSS tree; click → filtered problems list

**16. Weekly Study Report Email**
Every Sunday: topics studied, problems solved, streak, 3 suggested topics.
- Backend: `@Scheduled` cron + JavaMailSender; analytics data already exists
- Frontend: opt-in toggle in settings

**17. Subscription Tiers**
Free / Pro ₹199/mo / Career Pro ₹399/mo.
- Backend: `Subscription { userId, tier, expiresAt }` + tier middleware checks
- Frontend: `/pricing` page + upgrade prompts

**18. Problem Discussion Thread**
Per-problem comment section. Visible after at least one submission.
- Backend: `Discussion { id, problemId, userId, parentId, content, upvotes }` + CRUD
- Frontend: "Discussion" tab alongside Hints / Editorial

---

### Tier 3 — Engagement & Depth (19–28)

**19. Problem Set Collections (`/problem-sets`)**
Curated lists: "Blind 75", "FAANG Top 50", "Spring Boot Interview Problems".
- Backend: `ProblemSet` + `ProblemSetItem { setId, problemId, displayOrder }` tables
- Frontend: `/problem-sets` listing + set detail page with progress checkmarks
- Seed: Blind 75, Amazon Top 30, DSA Essentials, Spring Boot Coding, SQL 20

**20. Skill Assessment Quiz on Onboarding**
10-question MCQ diagnostic after signup. Score sets starting gate stage.
- Backend: endpoint accepts answers → writes initial `UserTopicPerformance` records
- Frontend: step 2 of onboarding replaces blank form with diagnostic

**21. Code Diff Viewer (Your Solution vs Editorial)**
Side-by-side diff after acceptance.
- Frontend only: `diff` npm package; "Compare with editorial" button on submission history

**22. Notification Centre (In-App)**
Bell icon: streak warnings, SRS due, daily challenge live, group invites.
- Backend: `Notification { id, userId, type, message, isRead }` + mark-read endpoint
- Frontend: bell icon with unread badge + dropdown

**23. Learning Velocity Dashboard Card**
"At your current pace you'll be interview-ready in 6 weeks."
- Backend: derive from `UserTopicProgress.updatedAt` grouped by week — no new table
- Frontend: sparkline card + projected readiness date

**24. Category Completion Badge**
Badge when user masters ALL topics in a category.
- Backend: computed field — no new table; add to profile endpoint
- Frontend: badge row on profile with locked/unlocked state

**25. Topic Search (`/search`)**
Global search across topic titles, memory anchors, problem titles.
- Backend: `GET /api/search?q=...` with MySQL FULLTEXT index
- Frontend: search bar in sidebar header; results grouped by Topics / Problems / Algorithms

**26. Pomodoro Study Timer**
25/5 min timer. Floating widget, persisted in localStorage.
- Frontend only

**27. Problem Difficulty Voting**
Post-solve: "Was this difficulty accurate? 👍/👎"
- Backend: `ProblemDifficultyVote { problemId, userId, agrees }` + vote endpoint
- Frontend: thumbs after submit

**28. Weekly Leaderboard**
Top 10 by XP earned this week. Resets every Monday.
- Backend: `UserActivity` aggregated by week; `GET /api/leaderboard/weekly`
- Frontend: leaderboard card on dashboard

---

### Tier 4 — Power User (29–38)

**29. Personalised Study Plan Generator**
Target company + interview date + hours/week → day-by-day calendar.
- Backend: `StudyPlan` + `StudyPlanItem`; algorithm uses analytics weak areas
- Frontend: `/plan` page with calendar + "Generate Plan" modal

**30. Interview Question Tagger ("I was asked this")**
Log with company + date. Aggregate shown anonymously.
- Backend: `RealInterviewTag { problemId, userId, company, date }` + aggregate endpoint

**31. Concept Dependency Map (`/map`)**
Force-directed graph of all topics with dependency arrows.
- Backend: `relatedTopicIds` on `Topic` (shared with Feature 8)
- Frontend: D3.js force-directed graph

**32. Streak Recovery Challenge**
When streak breaks: "Solve 2 Medium in 24h to restore." One rescue per 30 days.
- Backend: `StreakRecovery { userId, expiresAt, required, completed }` + trigger on break
- Frontend: dashboard banner with countdown + progress

**33. Code Template Library (`/templates`)**
BFS, DFS, Binary Search, Sliding Window, Union-Find, etc. pre-loaded.
- Backend: `CodeTemplate { id, name, pattern, code, isPublic, userId }` + 15 seed templates
- Frontend: `/templates` page + "Insert template" dropdown in Monaco toolbar

**34. Problem Tag Filtering (Multiple Tags)**
Multi-select: pattern + company + difficulty + solved/unsolved + bookmarked.
- Backend: extend `GET /api/problems` to accept `?pattern=HashMap&company=Google&solved=false`
- Frontend: filter panel with multi-select chips + count badges

**35. Hint Usage Analytics**
"You use Hint 3 on 60% of Hard problems." Track hint level per submission.
- Backend: add `hintLevel INT` (0–3) to `Submission`
- Frontend: hint usage breakdown on `/analytics`

**36. Resume Gap Analyzer**
Upload resume PDF → extract tech → compare against mastery map.
- Backend: `PdfImportService` foundation already exists
- Frontend: file upload on profile; gap table output

**37. Spaced Repetition for Problems (extend existing)**
SRS currently only queues topics. Extend to unsolved/weak problems.
- Backend: `SpacedRepetitionEntry` already supports `itemType=PROBLEM`; add scheduling
- Frontend: `ReviewPage` already renders problem cards — ensure they navigate to editor

**38. Mobile PWA**
`manifest.json` + service worker. Offline theory reading. Push notifications for streaks.
- Frontend: `manifest.json`, Workbox service worker, iOS `<meta>` tags
- Backend: Web Push API (`webpush` Java library)

---

## Data Changes Required

All additive — no breaking changes to existing tables.

### New Columns on Existing Tables

| Table | Column | Type | Purpose | Feature |
|-------|--------|------|---------|---------|
| `problems` | `companies` | TEXT (JSON array) | Company tags | 2, 34 |
| `topics` | `related_topic_ids` | TEXT (JSON array) | Linked topics | 8, 31 |
| `topics` | `estimated_hours` | DECIMAL(3,1) | Study time for plan | 29 |
| `quiz_questions` | `topic_tag` | VARCHAR(50) | Maps question to topic | 7 |
| `submissions` | `hint_level` | INT (0–3) | Hint level used | 35 |
| `submissions` | `first_opened_at` | DATETIME | When Practice tab opened | 1 |

### New Tables

| Table | Key Columns | Purpose | Feature |
|-------|-------------|---------|---------|
| `problem_sets` | `id, title, description, is_public` | Curated lists | 19 |
| `problem_set_items` | `id, set_id, problem_id, display_order` | Items in set | 19 |
| `discussions` | `id, problem_id, user_id, parent_id, content, upvotes` | Problem threads | 18 |
| `notifications` | `id, user_id, type, message, is_read` | In-app bell | 22 |
| `problem_difficulty_votes` | `id, problem_id, user_id, agrees` | Difficulty feedback | 27 |
| `study_plans` | `id, user_id, target_date, hours_per_week` | Plan header | 29 |
| `study_plan_items` | `id, plan_id, scheduled_date, topic_id, task_type` | Day-by-day tasks | 29 |
| `real_interview_tags` | `id, problem_id, user_id, company, interview_date` | "Asked in interview" | 30 |
| `code_templates` | `id, name, pattern, code, is_public, user_id` | Template library | 33 |
| `streak_recoveries` | `id, user_id, expires_at, required, completed` | Rescue challenge | 32 |
| `weekly_activity` | `id, user_id, week_start, xp_earned, problems_solved` | Leaderboard source | 28 |
| `interview_logs` | `id, user_id, company, interview_date, round_type, outcome` | Interview tracker | 9 |

---

## New Seed Files Required

### Topic Seeds (B33–B36, S07–S09, SD05–SD06, T02–T04, M07–M08)

| File | Category | Topic | Priority |
|------|----------|-------|----------|
| B33 | JAVA | Virtual Threads (Project Loom) | High |
| B34 | JAVA | Records, Sealed Classes, Pattern Matching (Java 17+) | High |
| B35 | ADVANCED_JAVA | Reactive Programming (Project Reactor, WebFlux basics) | Medium |
| B36 | ADVANCED_JAVA | Java Memory Model — happens-before, volatile, atomic | High |
| S07 | SPRING_BOOT | Spring Boot Testing — @SpringBootTest, TestContainers | High |
| S08 | SPRING_BOOT | Spring Batch — jobs, steps, chunk processing | Medium |
| S09 | SPRING_BOOT | Spring WebFlux — reactive endpoints, backpressure | Medium |
| SD05 | SYSTEM_DESIGN | Real Cases — Twitter feed, WhatsApp, Uber surge | High |
| SD06 | SYSTEM_DESIGN | Database Patterns — CQRS, Event Sourcing, Outbox | High |
| T02 | TESTING | Integration Testing with TestContainers | High |
| T03 | TESTING | Spring Boot Test Slices — @DataJpaTest, @WebMvcTest | High |
| T04 | TESTING | Contract Testing — Pact, Spring Cloud Contract | Medium |
| M07 | MYSQL | Transactions & Locking — ACID, isolation levels, deadlocks | High |
| M08 | MYSQL | Replication & High Availability — master-replica, GTID | Medium |

### Algorithm Seeds (A19–A25)

| File | Contents |
|------|----------|
| A19 | MST — Prim's, Kruskal's |
| A20 | Advanced String — Z-algorithm, Suffix Array, Rabin-Karp |
| A21 | Monotonic Queue — Sliding Window Maximum |
| A22 | Number Theory — GCD/LCM, Sieve, Modular Exponentiation |
| A23 | Interval Scheduling — Merge Intervals, Meeting Rooms |
| A24 | Matrix Traversal — Spiral, Rotate, Diagonal, 2D Search |
| A25 | Game Theory — Nim, Sprague-Grundy, Reservoir Sampling |

### Interview Q&A Additions

| Category | Questions to add |
|----------|-----------------|
| Spring Boot | DI vs IoC, @Transactional propagation, N+1 fix, bean scopes, Security filter chain, JWT flow |
| System Design | Rate limiter, URL shortener, notification service, CAP theorem, consistent hashing, leader election |
| Advanced Java | Virtual threads, Java Memory Model, CompletableFuture chaining, ForkJoinPool |
| Testing | Unit vs integration, Mockito spy vs mock, TestContainers, @DataJpaTest isolation |
| Behavioural | Debugging prod incident, disagreeing with tech decision, onboarding large codebase |

---

## Content Gap — Current Inventory

| Category | Topics | Problems (est.) | Status |
|----------|--------|-----------------|--------|
| Java Core (B01–B32) | 32 | ~130 (sparse) | Theory good, problems weak |
| Spring Boot (S01–S06) | 6 | ~20 (very sparse) | Theory good, problems missing |
| DSA Core (D01–D09) | 9 | ~80 (moderate) | Best quality |
| DSA Patterns (D10–D14) | 5 | ~30 (sparse) | Theory decent |
| MySQL (M01–M06) | 6 | ~20 (sparse) | Theory good |
| AWS (A01–A04) | 4 | 0 | Theory only |
| System Design (SD01–SD04) | 4 | 0 | Theory only |
| Testing (T01) | 1 | 0 | Skeleton |

**Gap:** ~67 topics × 8 problems minimum = ~536 problems needed. Currently ~280 exist.

### Data Priority Roadmap

**Phase 1 — Fill DSA (highest interview ROI)**
- 3 Easy + 3 Medium + 2 Hard per DSA topic D01–D14 → ~112 problems
- 2 working code examples per DSA topic → ~28 examples

**Phase 2 — Make Java Core practisable**
- Problems for B11–B22 (OOP, Collections, Streams, Threads) → ~88 problems
- Design-pattern problems (Strategy, Factory, Observer, Decorator)

**Phase 3 — Complete remaining categories**
- Spring Boot, MySQL, Testing problems
- Add A19–A25 algorithm seeds
- Add T02–T04 testing seeds

---

## Topic Theory — Completeness Checklist

| Field | Requirement |
|-------|-------------|
| `story` | 3–4 sentences, one character, one aha moment — not a textbook definition |
| `memoryAnchor` | 4–6 `key: value` pills |
| `analogy` | One sentence: real-world X = code Y |
| `firstPrinciples` | 3–5 numbered sentences explaining WHY it works |
| `examples[]` | Minimum 2, maximum 4 |
| `problems[]` | 3 Easy + 3 Medium + 2 Hard |

---

## Problem Schema (Complete Problem)

```json
{
  "title": "Two Sum",
  "difficulty": "EASY",
  "displayOrder": 1,
  "description": "Given an array nums and target, return indices of two numbers that add up to target.",
  "inputFormat": "Line 1: space-separated integers. Line 2: integer target.",
  "outputFormat": "Two space-separated indices (0-indexed), smaller first.",
  "sampleInput": "2 7 11 15\n9",
  "sampleOutput": "0 1",
  "constraints": "2 <= nums.length <= 10^4\nExactly one valid answer.",
  "hint1": "For each element, compute target - nums[i]. Have you seen that value before?",
  "hint2": "Use a HashMap mapping value → index. Check before inserting.",
  "hint3": "Map<Integer,Integer> seen. For each i: if seen.containsKey(target-nums[i]) → return answer. Else seen.put(nums[i], i).",
  "starterCode": "import java.util.*;\npublic class Solution {\n    public static int[] twoSum(int[] nums, int target) {\n        return new int[]{};\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int[] nums = Arrays.stream(sc.nextLine().trim().split(\" \")).mapToInt(Integer::parseInt).toArray();\n        int target = sc.nextInt();\n        int[] res = twoSum(nums, target);\n        System.out.println(res[0] + \" \" + res[1]);\n    }\n}",
  "testCases": "[{\"input\":\"2 7 11 15\\n9\",\"expectedOutput\":\"0 1\"},{\"input\":\"3 2 4\\n6\",\"expectedOutput\":\"1 2\"},{\"input\":\"3 3\\n6\",\"expectedOutput\":\"0 1\"}]",
  "pattern": "HashMap",
  "editorial": "Brute force O(n²): check every pair. Better: O(n) HashMap.\n\nKey insight: for each nums[i], ask whether (target - nums[i]) has been seen before.\n\nFor each nums[i], check map for complement. If found → return. Else add nums[i]→i to map.",
  "companies": "[\"Amazon\",\"Google\",\"Microsoft\"]"
}
```

Rules:
- `starterCode` MUST have `main()` reading from stdin
- `testCases` = 3–5 cases: happy path + edge cases
- Hints strictly progressive: direction → approach name → near-pseudocode
- `editorial` must explain brute-force AND optimal, and name the key insight

---

## Deliberately NOT Doing

- **SQL Practice Engine** — H2 embedded DB + query editor is over-engineering
- **Voice notes** — mobile-first, not worth building before core content complete
- **AI-generated hints on the fly** — latency + cost; 3-tier static hints are faster
- **Kubernetes before Phase 3** — premature; Docker Compose + single VM scales to 100K DAU

---

## Completed

| Feature | Route | Done |
|---------|-------|------|
| Daily Challenge | `/daily` | 2026-04-14 |
| Videos per topic | `/videos` | 2026-04-12 |
| System Design page | `/system-design` | 2026-04-12 |
| Timetable | `/timetable` | 2026-04-12 |
| Problem attempt timer | `ProblemSolveView.jsx` | 2026-04-12 |
| Performance Analytics | `/analytics` | 2026-04-12 |
| Interview Mode | `/interview-mode` | 2026-04-12 |
| Spaced Repetition Review | `/review` | 2026-04-12 |
| Admin Example CRUD | `/admin` | 2026-04-12 |
| Admin Bulk Problems | `/admin` | 2026-04-12 |
| Security hardening (VAPT pass) | all | 2026-04-15 |
| Execution safety scanner | `ExecutionService` | 2026-04-15 |
| Async post-submission pipeline | `PostSubmissionTask` | 2026-04-15 |
| DB indexes + HikariCP tuning | `Submission`, `application.properties` | 2026-04-15 |
