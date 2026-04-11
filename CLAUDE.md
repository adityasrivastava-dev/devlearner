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

---

## Key Features Built

### Learning Gate System
Progressive content unlocking — game-style, designed for new/junior users.

**Stages (per topic):** `THEORY → EASY → MEDIUM → HARD → MASTERED`

**Gate conditions:**
- `THEORY → EASY`: User writes a 20+ char note proving understanding ("I Understood This" button)
- `EASY → MEDIUM`: 3 Easy problems solved (ACCEPTED submissions)
- `MEDIUM → HARD`: 2 Medium problems solved
- `HARD → MASTERED`: 1 Hard problem solved

**Backend:**
- `model/UserTopicProgress.java` — tracks `theoryCompleted`, `theoryNote`, `theoryCompletedAt` per user per topic
- `service/LearningGateService.java` — derives stage, handles theory completion
- `controller/LearningGateController.java` — `GET/POST /api/topics/{topicId}/gate`
- `repository/SubmissionRepository.java` — added `countSolvedByDifficultyForTopic` and `countProblemsByDifficultyForTopic` native queries

**Frontend:**
- `api/index.js` — `gateApi.getStatus(topicId)`, `gateApi.completeTheory(topicId, note)`, `QUERY_KEYS.gateStatus`
- `TopicView.jsx` — stage badge in header, locked Practice tab until theory done, theory gate form, stage progress bar, problems gated by difficulty, locked difficulty teasers

### Pattern Name Drill (`/drill`)
Flashcard-style drill that shows problem title+description, user types the pattern name. Alias matching handles variations (two-pointer / two pointers / etc.). Pool: all problems with a `pattern` field set.

### ProblemsPage (`/problems`)
Clean LeetCode-style table. Difficulty filter as pill buttons (not dropdown). Inline search with clear button. Bookmark toggle per row. Pagination.

### ProblemSolveView
Split-panel editor (left: problem description, right: Monaco). Removed approach banner above editor. Clean topbar: back button + problem title + difficulty badge + solved badge + run/submit buttons.

### Interview Data (`src/pages/interview/interviewData.js`)
50+ curated Q&A across Java, Advanced Java, DSA, SQL, AWS. Each entry has `quickAnswer`, `keyPoints[]`, optional `codeExample`. UI pages (`/interview-prep`, `/revision`) not yet built.

---

## Pending Features (priority order)

1. **InterviewPrepPage** (`/interview-prep`) — two-column browse + study view using `interviewData.js`
2. **RevisionPage** (`/revision`) — 30-min timed Q&A session
3. **Smart Approach System** — replace free-text approach with pattern dropdown + complexity selector
4. **Editorial unlock improvement** — unlock after 2 attempts OR 10+ min, not only after AC
5. **Pattern page** (`/patterns`) — pattern as first-class entity with explanation, when-to-use, common mistakes, problems list
6. **Interview Mode** — timed 45-min session, no hints, approach-first flow
