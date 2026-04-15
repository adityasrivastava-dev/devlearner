# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevLearner is a full-stack **Interview Preparation OS for Backend Engineers** — not a LeetCode clone. Target users are developers with production experience who need structured recall, pattern drilling, and coding confidence for MAANG interviews.

- **Backend:** Spring Boot 3.2 (Java 17), MySQL, JWT + Google OAuth2 — runs on port **8080**
- **Frontend:** React 19 + Vite, React Router, TanStack Query, Zustand, Monaco Editor — runs on port **3000**
- **Deployment:** Docker + Nginx reverse proxy

> Feature roadmap (Features 1–40), data schema changes, seed file specs, and content plans are in [PLAN.md](./PLAN.md). and [SUGGESTIONS.md](./SUGGESTIONS.md)

---

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

**API layer** — all HTTP calls go through `src/api/index.js`, which exports grouped API functions (`authApi`, `topicsApi`, `problemsApi`, `codeApi`, `quizApi`, `adminApi`, `gateApi`, `interviewApi`, etc.) and a `QUERY_KEYS` map for TanStack Query cache keys. An Axios interceptor auto-attaches the JWT and redirects to `/login` on 401.

**Auth** — `src/context/AuthContext.jsx` holds the JWT and user profile. Token stored in `localStorage` as `devlearn_token`; user as `devlearn_user` (JSON). On app load, calls `authApi.refresh()` to validate. Admin detection: `user?.role === 'ADMIN'` or `user?.roles?.includes('ADMIN')`.

**Routing** — `App.jsx` uses React Router v6 with three guard types: `ProtectedRoute`, `GuestRoute` (public-only), and `AdminRoute`. Pages are in `src/pages/`.

**Dev proxy** — Vite proxies `/api`, `/oauth2`, and `/login/oauth2` to `http://localhost:8080`. In production, Nginx does the same using the `BACKEND_URL` env var (injected via `envsubst` at container start).

**Visualizer subsystem** — `src/components/visualizer/` contains a data-structure step-player: `VisualizerEngine.jsx` drives playback state; `VisualizerTab.jsx` is the tab wrapper; `PlaybackControls.jsx` handles timeline; renderers in `renderers/` cover Array, Grid, Tree, LinkedList, Stack, and Graph. Used inside the Algorithms page to animate algorithm traces.

**Theme** — persisted in `localStorage` as `devlearn_theme` (`dark`/`light`); applied to `document.documentElement` as `data-theme` on app load in `App.jsx`.

### Backend Structure

Layered architecture: `controller/` → `service/` → `repository/`, with `model/` (JPA entities) and `dto/` (request/response objects).

**Key packages:**
- `config/` — `DataInitializer`, `CurriculumSeeder` (seed data runs on startup), `GlobalExceptionHandler`
- `security/` — `SecurityConfig`, `JwtService`, `JwtAuthFilter` (request filter), `OAuth2SuccessHandler` (issues JWT after Google login)
- `runner/` — `SeedDataRunner` and `DatabaseMigrationRunner` run on startup (after `CurriculumSeeder`)
- `service/` — notable services: `ExecutionService`, `SpacedRepetitionService`, `ComplexityAnalyzer`, `TraceService`, `LearningGateService`, `PerformanceAnalyticsService`, `StreakService`, `HintService`, `DebugService`, `RoadmapService`, `VisualizationService`

**Security rules (from `SecurityConfig`):**
- Public: `/api/auth/**`, GET `/api/topics/**`, GET `/api/problems/**`, GET `/api/quiz/sets/**`
- **Authenticated override:** `/api/topics/*/gate` and `/api/topics/*/gate/**` require auth (declared before the public GET rule so it takes precedence)
- Admin-only: `/api/admin/**` (requires `ROLE_ADMIN`)
- Everything else: authenticated users only
- Stateless sessions, CSRF disabled, CORS enabled for frontend domain

### Database

MySQL 8.0. Schema is managed by Hibernate with `ddl-auto=update` (no Flyway/Liquibase). Initial data is seeded via `DataInitializer` and `CurriculumSeeder` on startup, followed by `SeedDataRunner` and `DatabaseMigrationRunner`.

Connection is configured in `application.properties` via env vars (`DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`). **Important:** the default fallback in `application.properties` currently points to a staging Railway DB, not a local MySQL instance. Override with local DB env vars for isolated dev. The database is created automatically if it does not exist (`createDatabaseIfNotExist=true`).

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

GET  /api/interview-questions     → Public; optional ?category=JAVA&difficulty=HIGH&size=300 (max 500)

POST /api/admin/interview-questions         → Create one question
PUT  /api/admin/interview-questions/{id}    → Update a question
DELETE /api/admin/interview-questions/{id} → Delete one question
POST /api/admin/interview-questions/bulk   → Bulk import; skips duplicates (same category+question)
DELETE /api/admin/interview-questions      → Delete all questions

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

## What Is Built (Current State — 2026-04-12)

| Feature | Route | Status |
|---------|-------|--------|
| JWT + Google OAuth2, onboarding, profile | `/login`, `/profile` | Done |
| Learning Gate System (THEORY → MASTERED) | `/?topic={id}` | Done |
| Theory Tab UI (Memory Anchor, Story, Analogy, First Principles) | `TopicView.jsx` | Done |
| Sidebar (accordion, category tabs, dot indicator) | `Sidebar.jsx` | Done |
| Practice System (3-tier hints, code submit, recall drill) | `TopicView.jsx` | Done |
| Habit Engine (streak, pause days, XP, heatmap, SRS queue) | `/profile` | Done |
| MCQ Quiz System | `/quiz` | Done |
| Algorithms Page (70+ algos, VisualizationPlan) | `/algorithms` | Done |
| Interview Prep (live DB + static fallback) | `/interview-prep` | Done |
| Revision Session (timed, reveal-rate) | `/revision` | Done |
| Topic Mastery Map | `/mastery` | Done |
| Complexity Analyzer (static analysis, Monaco) | `/complexity` | Done |
| Spaced Repetition Review (SM-2) | `/review` | Done |
| Interview Mode (timed, approach-first, auto-submit) | `/interview-mode` | Done |
| Performance Analytics (confidence, error breakdown, mistakes) | `/analytics` | Done |
| Pattern Name Drill | `/drill` | Done |
| Problems Page (difficulty pills, search, bookmark, pagination) | `/problems` | Done |
| Admin Panel (Topics, Users, Quick Import, Seed, Quiz, Algorithms, Interview Q&A, Stats) | `/admin` | Done |
| Notes & Bookmarks | Theory tab + header | Done |
| Roadmap (custom learning paths) | `/roadmap` | Done |
| Playground (free-form code editor) | `/playground` | Done |
| Quick Win (confidence-builder sessions) | `/quick-win` | Done |
| Videos (per-topic videos, admin + personal, grouped by topic) | `/videos` | Done |

### Learning Gate Stages
`THEORY → EASY → MEDIUM → HARD → MASTERED`

| Transition | Condition |
|------------|-----------|
| THEORY → EASY | Write 20+ char note |
| EASY → MEDIUM | Solve 3 Easy problems |
| MEDIUM → HARD | Solve 2 Medium problems |
| HARD → MASTERED | Solve 1 Hard problem |

---

## Seed File Inventory

### Topic Seeds (`learning-system/src/main/resources/seeds/`)
Format: `{ batchName, skipExisting: true, topics: [...] }`

| Range | Category | Count |
|-------|----------|-------|
| B01–B32 | JAVA | 32 topics |
| S01–S06 | SPRING_BOOT | 6 topics |
| D01–D09 | DSA (Core) | 9 topics |
| D10–D14 | DSA (Patterns) | 5 topics |
| M01–M06 | MYSQL | 6 topics |
| A01–A04 | AWS | 4 topics |
| SD01–SD04 | SYSTEM_DESIGN | 4 topics |
| T01 | TESTING | 1 topic |

### Algorithm Seeds (`learning-system/src/main/resources/algorithm-seeds/`)
Format: `{ batchName, skipExisting, algorithms: [...] }`

**CRITICAL:** `difficulty` must be `BEGINNER`/`INTERMEDIATE`/`ADVANCED`. `useCases` and `variants` must be object arrays (`[{"title":"...","desc":"..."}]`), not string arrays.

| Range | Contents |
|-------|----------|
| A01–A18 | 70+ algorithms — Searching, Sorting, Two Pointer, Graph, DP, Trees, Heaps, Backtracking, Greedy, Linked List, Stack, String, Advanced DS |

### Bundled Interview Batches (`frontend/public/interview-batches/`)
`iq-batch-01` through `iq-batch-06` — Java Core, Advanced Java, DSA, SQL, AWS, Spring Boot + Hibernate.

---

## Seed / Content Quality Rules

Apply to all new seeds:

1. **No orphan problems** — every problem needs at least 3 test cases in `testCases` JSON
2. **No empty editorials** — `editorial` blank = incomplete; do not import
3. **Starter code must compile** — every `starterCode` needs a `main()` reading stdin
4. **Canonical companies**: `Amazon`, `Google`, `Microsoft`, `Meta`, `Apple`, `Netflix`, `Flipkart`, `Uber`, `LinkedIn`, `Twitter`
5. **Canonical patterns**: `HashMap`, `Two Pointers`, `Sliding Window`, `BFS`, `DFS`, `Dynamic Programming`, `Binary Search`, `Greedy`, `Backtracking`, `Stack`, `Heap`, `Union-Find`, `Trie`, `Math`, `Sorting`, `Divide and Conquer`, `Monotonic Stack`, `Matrix`
6. **Memory anchor pills** — always `key: value` format; renderer splits on `: ` to bold the key
7. **Story must have a character** — "Imagine you are a librarian…" not "HashMap is a data structure…"
8. **Hints must be progressive** — hint1 = direction only, hint2 = approach name, hint3 = near-pseudocode (not the answer)

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
| Example entity | `learning-system/src/main/java/com/learnsystem/model/Example.java` |
| Seed batch service | `learning-system/src/main/java/com/learnsystem/service/SeedBatchService.java` |
| Admin content controller | `learning-system/src/main/java/com/learnsystem/controller/AdminContentController.java` |
| Phase 2 controller (SRS, analytics, notes, bookmarks) | `learning-system/src/main/java/com/learnsystem/controller/Phase2Controller.java` |
| Topic seed files | `learning-system/src/main/resources/seeds/` |
| Algorithm seed files | `learning-system/src/main/resources/algorithm-seeds/` |
| Security config | `learning-system/src/main/java/com/learnsystem/security/SecurityConfig.java` |
| Interview Q&A bank (static fallback) | `frontend/src/pages/interview/interviewData.js` |
| Interview Prep page | `frontend/src/pages/interview/InterviewPrepPage.jsx` |
| Revision page | `frontend/src/pages/interview/RevisionPage.jsx` |
| Algorithm page | `frontend/src/pages/algorithms/AlgorithmsPage.jsx` |
| Visualization blueprint | `frontend/src/pages/algorithms/VisualizationPlan.jsx` |
| Spaced Repetition Review | `frontend/src/pages/review/ReviewPage.jsx` |
| Interview Mode | `frontend/src/pages/interview-mode/InterviewModePage.jsx` |
| Performance Analytics | `frontend/src/pages/analytics/AnalyticsPage.jsx` |
| Admin panel | `frontend/src/pages/admin/AdminPage.jsx` |
| Algorithm admin section | `frontend/src/pages/admin/AlgorithmAdminSection.jsx` |
| Quiz admin section | `frontend/src/pages/admin/QuizAdminSection.jsx` |
| Interview Q&A admin section | `frontend/src/pages/admin/InterviewAdminSection.jsx` |
| Interview question controller | `learning-system/src/main/java/com/learnsystem/controller/InterviewQuestionController.java` |
| Bundled interview batch files | `frontend/public/interview-batches/` |
| Visualizer engine + tab | `frontend/src/components/visualizer/VisualizerEngine.jsx`, `VisualizerTab.jsx` |
| Visualizer renderers | `frontend/src/components/visualizer/renderers/` |
| Roadmap page | `frontend/src/pages/roadmap/RoadmapPage.jsx` |
| Videos page | `frontend/src/pages/videos/VideosPage.jsx` |
| Playground page | `frontend/src/pages/playground/PlaygroundPage.jsx` |
| Startup runners | `learning-system/src/main/java/com/learnsystem/runner/` |
