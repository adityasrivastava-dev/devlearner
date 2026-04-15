---
name: LeetCode API Reverse Engineering — Execution Architecture Findings
description: What we learned by observing LeetCode's network calls during code execution — architecture gaps and action items
type: project
---

## How We Got This Data

Opened LeetCode, wrote a problem solution containing `System.exit(0)`, hit Run, and captured
every network call in DevTools. The calls revealed their entire async execution pipeline.

---

## The Full API Cycle

### Step 1 — POST /problems/{slug}/interpret_solution/

Browser sends this immediately when Run is clicked:

```json
Request payload:
{
    "lang": "java",
    "question_id": "1",
    "typed_code": "class Solution { public int[] twoSum(...) { System.exit(0); ... } }",
    "data_input": "[2,7,11,15]\n9\n[3,2,4]\n6\n[3,3]\n6"
}

Response (< 50ms):
{
    "interpret_id": "runcode_1776280418.9630487_O8QL3fZD06",
    "test_case": "[2,7,11,15]\n9\n..."
}
```

Key observations:
- HTTP returns in milliseconds — no code runs during this request
- `data_input` is sent IN the request — enables custom test cases without a DB lookup
- `interpret_id` = `runcode_{unix_timestamp_with_ms}_{random_10_chars}` — not a DB sequence

---

### Step 2 — GET /submissions/detail/{interpret_id}/check/ (polled every ~1.5s)

```
Poll 1:  { "state": "PENDING" }   — job in queue, no worker has it yet
Poll 2:  { "state": "PENDING" }   — still queued
Poll 3:  { "state": "STARTED" }   — a worker picked it up, compiling/running
Poll 4:  { "state": "SUCCESS", ... full result ... }
```

3 distinct states: **PENDING → STARTED → SUCCESS**

---

### Final Response Shape (when state = SUCCESS)

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

---

## What We Understood — Deep Analysis

### 1. HTTP is completely decoupled from execution

The HTTP request never waits for code to run. It writes a job entry and returns a token.
Execution happens independently. The browser is responsible for polling.

This is why LeetCode never shows "Server busy" — the API endpoint always responds fast.
Load spikes hit the job queue depth, not the HTTP layer.

**We implemented this** (Phase 1.5) using MySQL as the queue. Same pattern, same decoupling.

---

### 2. The `interpret_id` format reveals their infrastructure

`runcode_1776280418.9630487_O8QL3fZD06`

- `1776280418.963` = Unix timestamp in seconds + milliseconds at enqueue time
- `O8QL3fZD06` = 10-char random suffix

This ID is **generated at the application layer**, not from a DB sequence.
Implications:
- No database round-trip needed to generate the ID
- The random suffix makes it non-guessable — you cannot poll `runcode_..._AAAAAAAAAA` and get
  someone else's result by incrementing
- Works across multiple API servers with zero coordination

**Our gap:** We use MySQL auto-increment integer IDs (`1`, `2`, `3`...). Any authenticated user
can call `GET /api/jobs/1` and read another user's code. This is a security hole.

**Fix:** Add a `token` column (UUID or 10-char random) to `execution_jobs`. Expose the token
in the polling URL, not the raw id. Store both; use token for lookup.

---

### 3. Three status states, not two

LeetCode uses: `PENDING → STARTED → SUCCESS`

We use: `PENDING → RUNNING → DONE`

The critical difference is `STARTED`. It means a worker has actually claimed the job and
begun compilation/execution. `PENDING` means still sitting in the queue.

Without `STARTED`, the frontend cannot tell the user:
- "Waiting for a free execution slot…" (PENDING)
- "Running your code now…" (STARTED)

These feel very different to a user. PENDING could mean the server is under load.
STARTED means their code is actively executing.

**Fix:** Add `STARTED` to `ExecutionJob.Status` enum. Set it in `ExecutionWorkerScheduler`
between claiming the job and calling `executionService.execute()`.

---

### 4. `compare_result: "000"` is the key to per-test-case UI

`"000"` = 3 test cases, all failed. `"101"` = test 1 passed, test 2 failed, test 3 passed.

This single bit string drives the red/green indicators next to each test case.
Without it you can only show overall pass/fail count. With it you show exactly which
test cases failed — which is what makes the judge feel informative and useful.

**Fix:** 3 lines in `ExecutionWorkerScheduler.buildSubmitResponseMap()`:
```java
String compareResult = result.getResults().stream()
    .map(r -> r.isPassed() ? "1" : "0")
    .collect(Collectors.joining());
map.put("compareResult", compareResult);
```
Frontend reads `compareResult[i]` to colour each test case row.

---

### 5. `System.exit(0)` ran successfully — confirms Docker isolation

We submitted code containing `System.exit(0)`. LeetCode returned:
```json
{ "run_success": true, "status_msg": "Accepted", "state": "SUCCESS" }
```

The code ran. `System.exit(0)` did not crash their server.

This is only possible with Docker container isolation. `System.exit` kills the container
process, not the host JVM. Their server never sees the exit — the container just terminates.

**Our situation:** We block `System.exit` in `CodeSafetyScanner.java` because we have no
container isolation. This is the correct workaround for Phase 0.

**When Phase 1 Docker arrives:** Remove the `System.exit` block from `CodeSafetyScanner`.
It becomes harmless — the container dies, Spring Boot is unaffected.

---

### 6. `data_input` sent in the request

LeetCode sends the test case data in every Run request:
```json
"data_input": "[2,7,11,15]\n9\n[3,2,4]\n6\n[3,3]\n6"
```

This enables:
- Custom test case input (user types their own test in the editor)
- No server-side DB lookup for test data during Run

For **Submit**, they presumably look up the hidden test cases server-side (not sent by browser).
This is the right split: Run = user-supplied input, Submit = server-controlled test cases.

**Our situation:** Our Run already accepts `stdin` in the request payload — same pattern.
Our Submit looks up test cases from the DB — same pattern. We're already doing this correctly.

---

### 7. Memory measurement

LeetCode returns `"memory": 42584000` (bytes = ~42.6 MB) and `"memory_percentile"`.

This is measured from the Docker container's cgroup memory stats after execution.
Not possible with bare `ProcessBuilder` — cgroups require container-level tracking.

**Our situation:** We don't measure memory. Not worth implementing until Phase 1 Docker.
After Docker: read `/sys/fs/cgroup/memory/memory.max_usage_in_bytes` from the container.

---

## Gap Analysis Table

| LeetCode | Our Current State | Gap | Priority |
|---|---|---|---|
| `PENDING → STARTED → SUCCESS` | `PENDING → RUNNING → DONE` | Missing STARTED state | Medium |
| `interpret_id` = timestamp + random | Sequential auto-increment int | Security: guessable job IDs | High |
| `compare_result: "010"` bit string | Not returned | UX: per-test-case indicators | High |
| `data_input` in Run request | ✅ `stdin` in request | ✅ Already correct | — |
| `expected_code_answer[]` per test case | ✅ `results[].expectedOutput` | ✅ Already correct | — |
| `std_output_list[]` per test case | ✅ `results[].stdout` | ✅ Already correct | — |
| `run_success` separate from `correct_answer` | ✅ Same logic | ✅ Already correct | — |
| `memory` in bytes | ❌ Not measured | Needs Docker cgroup | Phase 1 |
| `status_runtime` | ✅ `executionTimeMs` | ✅ Already correct | — |
| Docker isolation (`System.exit` safe) | ❌ Scanner blocks it (Phase 0 workaround) | Phase 1 work | Phase 1 |

---

## Action Items (in order of effort)

### 1. `compare_result` bit string — 3 lines of code
**File:** `ExecutionWorkerScheduler.java` → `buildSubmitResponseMap()`
```java
String compareResult = result.getResults().stream()
    .map(r -> r.isPassed() ? "1" : "0")
    .collect(Collectors.joining());
map.put("compareResult", compareResult);
```
Frontend: read `res.compareResult[i]` to colour each test case row green/red.

### 2. Job ID security — token column
**File:** `ExecutionJob.java`
```java
@Column(length = 16, unique = true, nullable = false)
private String token;  // random alphanumeric, generated at @PrePersist

@PrePersist
void prePersist() {
    if (token == null) token = RandomStringUtils.randomAlphanumeric(12);
    ...
}
```
Change `GET /api/jobs/{jobId}` to `GET /api/jobs/{token}`.
`JobQueueService.getJob()` looks up by token, not by id.

### 3. STARTED status — 1 enum value + 1 line
**File:** `ExecutionJob.java` — add `STARTED` to `Status` enum
**File:** `ExecutionWorkerScheduler.java` — set `STARTED` after claiming, before executing:
```java
private void processJob(ExecutionJob job) {
    jobQueue.markStarted(job.getId());   // ← new: RUNNING → STARTED
    // ... rest of processJob
}
```
Frontend: show "Running your code…" on STARTED vs "Waiting in queue…" on PENDING.

### 4. Memory measurement — Phase 1 only
After Docker is in place, read cgroup memory stats post-execution.
Not worth implementing until container isolation exists.
