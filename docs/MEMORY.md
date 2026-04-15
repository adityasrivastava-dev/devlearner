# Memory Index

- [Project Overview](project_overview.md) — Full-stack devlearner platform: Spring Boot 3.2 backend + React 19 frontend, decoupled SPA architecture + complete feature inventory as of 2026-04-09
- [Project Vision](project_vision.md) — Core goal: make capable programmers via visual learning, code tools, and intelligent analysis — not just concept teaching
- [Feature Roadmap](project_roadmap.md) — Prioritized Phase 1/2/3 feature gaps, content roadmap (B23–B36 seed files needed), next immediate task: Notes+Bookmarks UI
- [User Profile](user_profile.md) — 4yr production engineer (SSO, migrations, query tuning); 2 blockers: terminology gap + interview code anxiety/shaky hands
- [Execution Architecture](execution_architecture.md) — Full plan: current Phase 0 (semaphore+scanner), execution microservice split, 5-phase scale roadmap to 1M+ DAU, why Docker-in-Docker is not viable on Render
- [Security Hardening 2026-04-15](security_hardening_2026_04_15.md) — 15 fixes: OOM prevention, System.exit blocking, async post-submission, user enumeration, input validation, HikariCP, frontend retry logic
- [Architecture Decision Feedback](feedback_architecture_decisions.md) — Semaphore sizing formula, microservice boundary rationale, over-engineering signals, user's reliability-first priority
- [Syntax Check Architecture](syntax_check_architecture.md) — Moved from debounced API (600ms) to instant client-side heuristic checks; server errors shown only on Run/Submit
- [Async Execution Queue 2026-04-16](async_execution_queue_2026_04_16.md) — MySQL job queue: ExecutionJob entity, JobQueueService, ExecutionWorkerScheduler, async endpoints, frontend polling pattern
