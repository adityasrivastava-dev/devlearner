---
name: Architecture Decision Feedback — What to Avoid
description: Non-obvious architecture choices validated or corrected by the user — semaphore sizing, over-engineering signals, microservice split rationale
type: feedback
originSessionId: a665dfa3-5cff-44f4-8bef-53b11f4e6f0b
---
## Do not set execution.max-concurrent=25 on a 4GB server

**Rule:** Always calculate semaphore slots from the formula, never use a round number.
Formula: `(Total RAM - Spring Boot ~900MB - OS ~500MB) ÷ 270MB per JVM`
**Why:** 25 slots × 270MB = 6.75GB → OOM killer fires on 4GB server → entire platform crashes.
**How to apply:** When changing server RAM (Render upgrade, EC2 resize), recalculate and update `execution.max-concurrent` in `application.properties` before deploying.

---

## Microservice split creates the boundary — what runs inside is a separate decision

**Rule:** The value of the execution microservice split is the BOUNDARY, not the runner technology.
**Why:** User's concern: "the microservice also runs on JVM — we might find another option."
The split lets you swap the execution technology (JVM → Docker → Firecracker → WASM) without touching the main API. The main API just calls an HTTP endpoint. What's behind that endpoint is an internal concern of the execution service.
**How to apply:** When suggesting execution improvements, frame them as "what runs inside the execution service" — not as reasons to delay the split.

---

## Don't over-engineer before you have the problem

**Rule:** Add infrastructure when you see the monitoring signal, not when you anticipate it.
**Signals for upgrading execution:**
- 429s on > 5% of run/submit requests
- Execution service OOM crashes in Render logs
- P95 submit latency > 8 seconds
- User complaints about "judge unavailable"

**Why:** User asked directly "are we doing over-engineering?" — honest answer was yes for some things (Kafka, language pools, worker farms). The right infrastructure for < 5K DAU is semaphore + scanner. Everything else is premature.
**How to apply:** When suggesting new infrastructure, always state the monitoring signal that justifies it.

---

## Base architecture matters more than features at early stage

**User's framing:** "If base will be good then I will compete with everyone because system crash will impact on user and user will disappear."
**Rule:** Prioritize crash isolation and reliability over new features when the user frames it this way.
**How to apply:** Execution microservice split > new content pages > new gamification features at this stage. The user has explicitly prioritized platform reliability over feature velocity.
