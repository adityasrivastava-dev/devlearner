# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DevLearner is a full-stack learning platform for Java/DSA/algorithms (a LeetCode-style system with live code execution, spaced repetition, and gamification).

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

**API layer** — all HTTP calls go through `src/api/index.js`, which exports grouped API functions (`authApi`, `topicsApi`, `problemsApi`, `codeApi`, `quizApi`, `adminApi`, etc.). An Axios interceptor auto-attaches the JWT and redirects to `/login` on 401.

**Auth** — `src/context/AuthContext.jsx` holds the JWT and user profile. Token stored in `localStorage` as `devlearn_token`; user as `devlearn_user` (JSON). On app load, calls `authApi.refresh()` to validate. Admin detection: `user?.role === 'ADMIN'` or `user?.roles?.includes('ADMIN')`.

**Routing** — `App.jsx` uses React Router v6 with three guard types: `ProtectedRoute`, `GuestRoute` (public-only), and `AdminRoute`. Pages are in `src/pages/`.

**Dev proxy** — Vite proxies `/api`, `/oauth2`, and `/login/oauth2` to `http://localhost:8080`. In production, Nginx does the same using the `BACKEND_URL` env var (injected via `envsubst` at container start).

### Backend Structure

Layered architecture: `controller/` → `service/` → `repository/`, with `model/` (JPA entities) and `dto/` (request/response objects).

**Key packages:**
- `config/` — `SecurityConfig`, `DataInitializer`, `CurriculumSeeder` (seed data runs on startup)
- `security/` — `JwtService`, `JwtAuthFilter` (request filter), `OAuth2SuccessHandler` (issues JWT after Google login)
- `service/` — notable services: `CodeExecutionService`, `SpacedRepetitionService`, `ComplexityAnalysisService`, `TraceService`

**Security rules (from `SecurityConfig`):**
- Public: `/api/auth/**`, GET `/api/topics/**`, GET `/api/problems/**`, GET `/api/quiz/sets/**`
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

POST /api/admin/**                → Admin-only; content + user management
```

### Frontend–Backend Contract

The API base URL is the `VITE_API_URL` environment variable (baked in at build time). If unset, relative URLs are used and Nginx/Vite proxy handles routing. All responses are JSON; errors are handled by `GlobalExceptionHandler` on the backend.

### User Roles

`STUDENT` (default), `TEACHER`, `ADMIN`. Stored as `@ElementCollection` on the `User` entity. Multi-role is supported.

### Gamification

Users accumulate XP and level up (Beginner → Architect). Streaks are tracked daily; "pause days" earned from streaks can protect the streak. Progress is surfaced on the `/profile` page.
