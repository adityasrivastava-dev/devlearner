# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevLearner is a full-stack **Interview Preparation OS for Backend Engineers** — not a LeetCode clone. Target users are developers with production experience who need structured recall, pattern drilling, and coding confidence for MAANG interviews.

- **Backend:** Spring Boot 3.2 (Java 17), MySQL, JWT + Google OAuth2 — runs on port **8080**
- **Frontend:** React 19 + Vite, React Router, TanStack Query, Zustand, Monaco Editor — runs on port **3000**
- **Deployment:** Docker + Nginx reverse proxy

## Commands

### Frontend (`frontend/`)
```bash
npm install        # Install dependencies
npm run dev        # Start dev server (port 3000, proxies /api → localhost:8080)
npm run build      # Build production bundle
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### Backend (`learning-system/`)
```bash
mvn spring-boot:run        # Run dev server (port 8080)
mvn clean package          # Build JAR
mvn test                   # Run all tests
mvn test -Dtest=ClassName  # Run a single test class
```

### Full Stack (Docker)
```bash
cd frontend
docker-compose up          # Build and run both services
```

---

## Architecture

### Frontend Structure

**API layer** — all HTTP calls go through `src/api/index.js`, which exports grouped API functions (`authApi`, `topicsApi`, `problemsApi`, `codeApi`, `quizApi`, `adminApi`, `gateApi`, etc.). An Axios interceptor auto-attaches the JWT and redirects to `/login` on 401.

**Auth** — `src/context/AuthContext.jsx` holds the JWT and user profile. Token stored in `localStorage` as `devlearn_token`; user as `devlearn_user` (JSON). On app load, calls `authApi.refresh()` to validate. Admin detection: `user?.role === 'ADMIN'` or `user?.roles?.includes('ADMIN')`.

**Routing** — `App.jsx` uses React Router v6 with three guard types: `ProtectedRoute`, `GuestRoute` (public-only), and `AdminRoute`. Pages are in `src/pages/`.

**Dev proxy** — Vite proxies `/api`, `/oauth2`, and `/login/oauth2` to `http://localhost:8080`. In production, Nginx does the same using the `BACKEND_URL` env var (injected via `envsubst` at container start).

### Backend Structure

Layered architecture: `controller/` → `service/` → `repository/`, with `model/` (JPA entities) and `dto/` (request/response objects).

**Key packages:**
- `config/` — `SecurityConfig`, `DataInitializer`, `CurriculumSeeder` (seed data runs on startup)
- `security/` — `JwtService`, `JwtAuthFilter` (request filter), `OAuth2SuccessHandler` (issues JWT after Google login)
- `service/` — notable services: `CodeExecutionService`, `SpacedRepetitionService`, `ComplexityAnalysisService`, `TraceService`, `LearningGateService`

**Security rules (from `SecurityConfig`):**
- Public: `/api/auth/**`, GET `/api/topics/**`, GET `/api/problems/**`, GET `/api/quiz/sets/**`
- **Authenticated override:** `/api/topics/*/gate` and `/api/topics/*/gate/**` require auth (declared before the public GET rule so it takes precedence)
- Admin-only: `/api/admin/**` (requires `ROLE_ADMIN`)
- Everything else: authenticated users only
- Stateless sessions, CSRF disabled, CORS enabled for frontend domain

### Database

MySQL 8.0. Schema is managed by Hibernate with `ddl-auto=update` (no Flyway/Liquibase). Initial data is seeded via `DataInitializer` and `CurriculumSeeder` on startup.

Connection is configured in `application.properties` via env vars (DB URL, username, password). The database is created automatically if it does not exist (`createDatabaseIfNotExist=true`).

### Key API Patterns

```
POST /api/auth/login              → Returns JWT + user profile
POST /api/auth/register           → Register with email/password
POST /api/auth/refresh            → Validate existing token on load

POST /api/execute                 → Run code (no DB save, returns stdout/stderr)
POST /api/submissions/submit      → Submit solution (saves, runs against test cases)

GET  /api/problems/:id/editorial  → Only accessible after an ACCEPTED submission

GET  /api/algorithms              → Algorithm list
GET  /api/algorithms/:id          → Algorithm detail (content managed by admin)

GET  /api/topics/:id/gate         → Current learning gate status for a topic (auth required)
POST /api/topics/:id/gate/theory  → Complete theory step; body: { note: string (20+ chars) }

POST /api/admin/**                → Admin-only; content + user management
```

### Frontend–Backend Contract

The API base URL is the `VITE_API_URL` environment variable (baked in at build time). If unset, relative URLs are used and Nginx/Vite proxy handles routing. All responses are JSON; errors are handled by `GlobalExceptionHandler` on the backend.

### User Roles

`STUDENT` (default), `TEACHER`, `ADMIN`. Stored as `@ElementCollection` on the `User` entity. Multi-role is supported.

### Gamification

Users accumulate XP and level up (Beginner → Architect). Streaks are tracked daily; "pause days" earned from streaks can protect the streak. Progress is surfaced on the `/profile` page.

### Topic Category Enum

Categories in `Topic.Category`:
- `JAVA`, `ADVANCED_JAVA` — Java core + concurrency
- `SPRING_BOOT` — used for ALL Spring topics (Core, Boot, Security, JPA, REST, Microservices); `subCategory` field distinguishes them
- `DSA` — data structures and algorithms
- `MYSQL` — MySQL/SQL topics
- `AWS` — cloud services
- `SYSTEM_DESIGN` — architecture patterns (added 2026-04-11)
- `TESTING` — unit/integration testing (added 2026-04-11)

Frontend `CATEGORIES` array and `CATEGORY_META` in `src/utils/helpers.js` must match the backend enum.

---

## What Is Built (Current State — 2026-04-11)

### Auth & Users
JWT login, Google OAuth2, email/password, multi-role (admin/user), 3-step onboarding, user profile with XP/streak/level badge.

### Learning Gate System
Progressive content unlocking — game-style.

**Stages (per topic):** `THEORY → EASY → MEDIUM → HARD → MASTERED`

**Gate conditions:**
- `THEORY → EASY`: User writes a 20+ char note ("I Understood This" button)
- `EASY → MEDIUM`: 3 Easy problems solved
- `MEDIUM → HARD`: 2 Medium problems solved
- `HARD → MASTERED`: 1 Hard problem solved

**Backend:** `UserTopicProgress`, `LearningGateService`, `LearningGateController`
**Frontend:** `TopicView.jsx` — stage badge, locked Practice tab, theory gate form, stage progress bar, gated problems, locked difficulty teasers

### Theory Tab UI (redesigned 2026-04-11)
Each section in the Theory tab now has distinct visual treatment:
- **Memory Anchor** — green chips (each fact = one scannable pill with `key: value` bolding)
- **The Story** — amber left-border, italic narrative text
- **Visual Analogy** — purple accent, `X = Y` sentences rendered as concept ≡ meaning rows
- **First Principles** — sky-blue accent, numbered sentence list
Components: `MemoryAnchorCard`, `StoryCard`, `AnalogyCard`, `PrinciplesCard` in `TopicView.jsx`

### Sidebar Navigation
Accordion sections (Learn, Practice, Interview, Account) — only active section auto-opens, giving maximum space to the topics list. Topic rows have border separator + dot indicator. Category tabs with horizontal scroll.

### Practice System
- Problems per topic, Easy/Medium/Hard
- 3-tier hint system (direction → approach → pseudocode)
- Code submission with test case evaluation
- Smart feedback card: detected algorithm pattern, methodology, optimization suggestion
- Recall drill modal after first accepted submission

### Habit Engine
Daily streak + pause days, XP + level system, GitHub-style heatmap, spaced repetition queue.

### MCQ Quiz System (`/quiz`)
Quiz sets by category, per-question timer, results with grade + review accordion.

### Algorithms Page (`/algorithms`)
10 algorithms with 5-tab detail view (story, steps, code, complexity, real-world).

### Pattern Name Drill (`/drill`)
Flashcard drill: see problem description, type the pattern name. Alias matching.

### ProblemsPage (`/problems`)
LeetCode-style table with difficulty pills, inline search, bookmark toggle, pagination.

### Admin Panel (`/admin`)
Topic/example/problem management, seed file loader, user management.

### Notes & Bookmarks
**Backend:** 100% complete (models, repos, controllers all exist)
**Frontend:** Notes panel in TopicView Theory tab, bookmark toggle in topic header + ProblemsPage

---

## Seed Files (Content)

All seeds live in `learning-system/src/main/resources/seeds/`. Load via Admin → Import JSON.
Format: `{ batchName, skipExisting: true, topics: [...] }`. Each topic has: `title`, `category`, `subCategory`, `displayOrder`, `description`, `story`, `analogy`, `memoryAnchor`, `firstPrinciples`, `bruteForce`, `optimizedApproach`, `whenToUse`, `examples[]`, `problems[]`.

### ✅ Java Core (B01–B32)
| File | Topic |
|------|-------|
| B01–B22 | OOP, Collections, Streams, Lambdas, Threads, Generics, etc. (original 22) |
| B23 | Wrapper Classes & Autoboxing |
| B24 | Date & Time API (java.time) |
| B25 | Garbage Collection & Memory |
| B26 | Collections Internals (HashMap, Comparator) |
| B27 | Reflection & Custom Annotations |
| B28 | Java Serialization & Externalization |
| B29 | CompletableFuture (async pipeline) |
| B30 | Locks & Concurrency (ReentrantLock, ReadWriteLock, Semaphore) |
| B31 | JDBC & Connection Pooling (HikariCP) |
| B32 | Optional & Parallel Streams |

### ✅ Spring Boot (S01–S06)
| File | Topic |
|------|-------|
| S01 | Spring Core — IoC, DI, Bean lifecycle, scopes |
| S02 | Spring Boot — Auto-config, Profiles, @ConfigurationProperties |
| S03 | Spring Security — JWT filter, BCrypt, OAuth2 |
| S04 | JPA & Hibernate — Entity lifecycle, N+1, @Version, Pagination |
| S05 | REST API Design — HTTP methods, status codes, GlobalExceptionHandler |
| S06 | Microservices — Feign, Circuit Breaker, API Gateway, Saga pattern |

### ✅ DSA Patterns (D10–D14)
| File | Topic |
|------|-------|
| D10 | Complexity Analysis — Big-O hierarchy, recurrences |
| D11 | Array Patterns — Sliding Window, Two Pointers, Prefix Sum, Kadane's |
| D12 | String Algorithms — Anagrams, Palindrome, Min Window Substring |
| D13 | Bit Manipulation — XOR tricks, Bitmask, Kernighan's |
| D14 | Greedy Algorithms — Intervals, Jump Game, Activity Selection |

### ✅ MySQL (M01–M06)
| File | Topic |
|------|-------|
| M01 | SQL Basics |
| M02 | Joins & Subqueries |
| M03 | Advanced SQL (window functions) |
| M04 | Indexing — Clustered, Composite, Covering, EXPLAIN |
| M05 | Query Optimization — EXPLAIN plans, slow query tuning |
| M06 | MySQL Internals — InnoDB, MVCC, Deadlocks |

### ✅ AWS (A01–A04)
| File | Topic |
|------|-------|
| A01 | AWS Core Services |
| A02 | Serverless & Messaging |
| A03 | Networking & CDN |
| A04 | DevOps & Containers |

### ✅ System Design (SD01–SD04)
| File | Topic |
|------|-------|
| SD01 | System Design Fundamentals — Caching, LB, Rate Limiter, Consistent Hashing |
| SD02 | Auth Systems — JWT rotation, OAuth2 flow, Token Bucket |
| SD03 | Distributed Systems — CAP theorem, Sharding, Replication |
| SD04 | Performance Patterns — Circuit Breaker, Retry, Bulkhead, Idempotency |

### ✅ Testing (T01)
| File | Topic |
|------|-------|
| T01 | Unit Testing — JUnit 5 assertions, @ParameterizedTest, Mockito mocks/verify/captor |

### ❌ Missing DSA (Core Data Structures — HIGH PRIORITY)
These 9 files cover fundamental interview topics and must be created:
- `D01-linked-list.json` — singly/doubly/circular, runner technique, sentinel nodes
- `D02-stack-queue.json` — monotonic stack, deque, circular queue
- `D03-trees.json` — BST, DFS/BFS, LCA, height/diameter
- `D04-heaps.json` — top-K, two-heap, merge K sorted
- `D05-graphs.json` — adjacency list, DFS/BFS, topological sort, union-find, Dijkstra
- `D06-sorting.json` — merge/quick/counting/radix, stability, comparison
- `D07-dynamic-programming.json` — memoization, tabulation, knapsack, LCS, 1D/2D DP
- `D08-recursion-backtracking.json` — pruning, permutations, N-queens, constraint propagation
- `D09-trie.json` — Trie insert/search/prefix, segment tree basics

---

## Pending Features (Priority Order)

### High Priority
1. **DSA D01–D09 seed files** — Core data structures missing; most interview questions fall here
2. **InterviewPrepPage** (`/interview-prep`) — Browse + study 50+ Q&A from `interviewData.js`; two-column layout (list left, detail right)
3. **RevisionPage** (`/revision`) — 30-min timed Q&A session, score card, review
4. **SQL Practice Engine** — H2 embedded DB, query editor, EXPLAIN plan output in-browser

### Medium Priority
5. **Interview Mode** — Timed 45-min session, no hints, approach-first, scored
6. **Daily Challenge** — Same problem for all users each day (Wordle-style)
7. **Editorial unlock improvement** — Unlock after 2 attempts OR 10+ min, not only after AC
8. **Cheat Sheet PDF generator** — Per-topic 1-page printable reference
9. **Recall Drill page** (`/recall`) — Flashcard mode: see topic name, recall memory anchor

### Lower Priority / Phase 3+
10. **Groups + friend challenges** — Biggest retention driver; needs Group, GroupMember tables
11. **Pattern page** (`/patterns`) — Pattern as first-class entity with problems list
12. **Resume upload + JD gap analyzer** — PdfImportService foundation exists
13. **System design visual builder** — Drag-drop canvas
14. **Weekly report card** — Backend analytics exist, frontend not built
15. **Subscription tiers** — Free / Pro ₹199/mo / Career Pro ₹399/mo

---

## Key File Locations

| Purpose | Path |
|---------|------|
| Topic view + theory tab | `frontend/src/components/editor/TopicView.jsx` |
| Topic view styles | `frontend/src/components/editor/TopicView.module.css` |
| Sidebar navigation | `frontend/src/components/sidebar/Sidebar.jsx` |
| Sidebar styles | `frontend/src/components/sidebar/Sidebar.module.css` |
| Category metadata | `frontend/src/utils/helpers.js` |
| API layer | `frontend/src/api/index.js` |
| Topic entity | `learning-system/src/main/java/com/learnsystem/model/Topic.java` |
| Seed batch service | `learning-system/src/main/java/com/learnsystem/service/SeedBatchService.java` |
| Seed files | `learning-system/src/main/resources/seeds/` |
| Security config | `learning-system/src/main/java/com/learnsystem/config/SecurityConfig.java` |
