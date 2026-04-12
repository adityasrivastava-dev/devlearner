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

## What Is Built (Current State — 2026-04-12)

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
70+ algorithms across 18 seed files (A01–A18), 5-tab detail view (story, steps, code, complexity, real-world). **VisualizationPlan** component (`VisualizationPlan.jsx`) adds a blueprint section to every algorithm: color legend, event flow, annotated pseudocode with hook badges, and pattern insight — all derived from existing fields, no new backend fields needed.

### Interview Prep (`/interview-prep`)
**Fully built.** Filter by category + difficulty, inline search, accordion Q&A with key points and code examples. Falls back to static `interviewData.js` when DB is empty. Current static bank covers: Java Core, Advanced Java, DSA, SQL, AWS. **Spring Boot and System Design Q&As not yet added.**

### Revision Session (`/revision`)
**Fully built.** Setup screen (pick categories, difficulty, duration 10/20/30 min) → timed session (reveal-and-rate each question) → scorecard with review accordion.

### Topic Mastery Map (`/mastery`)
Visual grid of every topic colored by gate stage. One request (`GET /api/gate/all`) returns `{ topicId: stage }` for all topics the user has touched — topics absent from the map are treated as THEORY. Topics grouped by category with per-category stats (mastered / in progress / not started). Progress bar across the top showing overall distribution. Clicking any card navigates to `/?topic={id}`. Backend: `GateBulkController` → `LearningGateService.getAllGateStages()` using two queries (all `UserTopicProgress` for the user + one cross-topic solved-count query).

### Complexity Analyzer (`/complexity`)
Paste any Java code → get Big-O time and space complexity from actual static analysis (not hardcoded values). Monaco editor on left, results panel on right. Shows: complexity notation colored by grade (green O(1) → red O(2ⁿ)), confidence level (HIGH/MEDIUM/LOW with bar), detected patterns as chips (loops/recursion/sorting/etc.), time and space explanations, complexity scale with active item highlighted. Keyboard shortcut Ctrl+Shift+A. Backend: `ComplexityAnalyzer` service + `POST /api/analyze-complexity`. Frontend: `codeApi.analyzeComplexity`.

### Spaced Repetition Review (`/review`) — added 2026-04-12
Full SRS session UI. Setup screen explains SM-2 rating scale → flashcard loop (topic or problem card, tap-to-reveal) → results scorecard with rating breakdown and next-review date. Rating quality: Forgot (1) / Hard (2) / Got it (4) / Easy (5). Calls `POST /api/srs/review`. Dashboard "Due for Review" card shows "Start session →" when items are due; shows "+N more" overflow link when queue > 4.

### Interview Mode (`/interview-mode`) — added 2026-04-12
Timed interview simulation. Setup: pick difficulty (Easy 20 min / Medium 35 min / Hard 45 min). Phase 1 — Approach: see problem, write approach text (50+ chars required before coding unlocks). Phase 2 — Coding: Monaco editor, run code against stdin, countdown clock turns amber at 5 min and red at 1 min, auto-submits on timeout. Scorecard: tests passed, time used bar, approach written check, "No hints used" badge. Uses existing `problemsApi.getAll` + `topicsApi.getProblem` + `codeApi.submit`.

### Performance Analytics (`/analytics`) — added 2026-04-12
Confidence scoring dashboard. Two-column layout: Weak Areas / Strong Areas (ConfidenceCard with color-coded bar per topic). Error Breakdown horizontal bar chart (Wrong Answer / Compile Error / Runtime Error / TLE). Pattern Confusions table (detected vs correct pattern). Mistake Journal: searchable + filterable table of last 50 wrong submissions with error type, patterns, and date. Backend: `GET /api/analytics/dashboard` + `GET /api/analytics/mistakes` in `Phase2Controller`.

### Pattern Name Drill (`/drill`)
Flashcard drill: see problem description, type the pattern name. Alias matching.

### ProblemsPage (`/problems`)
LeetCode-style table with difficulty pills, inline search, bookmark toggle, pagination.

### Admin Panel (`/admin`)
Full content management hub. Nav tabs: Topics, Users, Quick Import, Seed Files, Build JSON, Quiz, Algorithms, Interview Q&A, Stats.

**Topics tab** — left/right split: topic list (filterable by category, delete button per row) + topic editor. Editor has tabs:
- **Info** — all core fields (title, category, subCategory, displayOrder, description, complexity, brute force, optimized approach, when to use)
- **Story** — memory anchor, story, analogy, first principles
- **Code** — starter code
- **Examples** *(new 2026-04-12)* — list all examples for the topic with ✏️ Edit and 🗑 Delete per row; form has Basic (title, description, explanation, real-world use) / Code / Pseudocode tabs; "+ New Example" and form-based create
- **Problems** — list problems with ✏️ Edit and 🗑 Delete; "📋 Bulk Add" button opens a JSON-array paste panel to create many problems at once; "+ New Problem" for single-form creation
- Seed file loader in the editor header pre-fills all fields from an existing seed file

**Quick Import tab** *(new 2026-04-12)* — Universal paste/upload box. Auto-detects JSON type from structure (`topics` array → topics batch; `algorithms` array → algorithms batch; `questions` array → quiz set). Accepts file upload too. Shows detected type badge before import.

**Seed Files tab** — predefined seed files in classpath; expand to preview topics; Import / Import All Pending buttons.

**Build JSON tab** — JSON builder wizard.

**Quiz tab** — seed files, manage sets (delete per set), build form, paste JSON, question editor (add/edit/delete questions per set).

**Algorithms tab** — seed files, paste JSON (with template), create form, manage list (✏️ Edit + 🗑 Delete per algo, Delete All button).

**Interview Q&A tab** — manage interview questions.

**Stats tab** — DB counts by category + danger zone (Clear All Data).

**Delete coverage:**
| Entity | How to delete |
|--------|---------------|
| Topic | 🗑 button in topic list |
| Example | 🗑 button in topic editor → Examples tab |
| Problem | 🗑 button in topic editor → Problems tab |
| Algorithm | 🗑 button in Algorithms → Manage tab |
| MCQ set | 🗑 button in Quiz → Manage Sets tab |
| MCQ question | 🗑 button in Quiz → Questions editor |

**Bulk creation paths:**
| Data | Path |
|------|------|
| Topics + examples + problems | Quick Import or Seed Files or Paste JSON in Seed Files tab |
| Problems for one topic | Topic editor → Problems tab → 📋 Bulk Add (JSON array) |
| Algorithms | Quick Import or Algorithms → Seed Files / Paste JSON |
| Quiz sets | Quick Import or Quiz → JSON Files / Paste JSON / Build |

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

### ✅ DSA Core (D01–D09)
| File | Topic |
|------|-------|
| D01 | Linked List — singly/doubly/circular, runner technique, sentinel nodes |
| D02 | Stack & Queue — monotonic stack, deque, circular queue |
| D03 | Trees — BST, DFS/BFS, LCA, height/diameter |
| D04 | Heaps & Priority Queues — top-K, two-heap, merge K sorted |
| D05 | Graphs — adjacency list, DFS/BFS, topological sort, union-find, Dijkstra |
| D06 | Sorting Algorithms — merge/quick/counting/radix, stability, comparison |
| D07 | Dynamic Programming — memoization, tabulation, knapsack, LCS, 1D/2D DP |
| D08 | Recursion & Backtracking — pruning, permutations, N-queens, constraint propagation |
| D09 | Trie & Advanced Trees — Trie insert/search/prefix, segment tree basics |

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

## Algorithm Seeds (Content)

Algorithm seeds live in `learning-system/src/main/resources/algorithm-seeds/`. Load via Admin → Import JSON.
Format: `{ batchName, skipExisting, algorithms: [...] }`. Each algorithm needs: `slug`, `name`, `category`, `emoji`, `difficulty` (`BEGINNER`/`INTERMEDIATE`/`ADVANCED` — exact enum match required), `tags` (JSON string array), complexity fields, `analogy`, `story`, `whenToUse`, `howItWorks`, `javaCode`, `interviewTips`, `useCases` (`[{"title":"...","desc":"..."}]`), `pitfalls` (`["string"]`), `variants` (`[{"name":"...","desc":"..."}]`), `displayOrder`.

**CRITICAL:** `difficulty` must be `BEGINNER`/`INTERMEDIATE`/`ADVANCED`. `useCases` and `variants` must be object arrays, not string arrays — frontend renders `.title`/`.desc` and `.name`/`.desc` respectively.

### ✅ Algorithm Seeds (A01–A18, 70+ algorithms)
| File | Contents |
|------|----------|
| A01 | Searching (Binary Search, Linear Search) |
| A02 | Sorting (Bubble, Selection, Insertion) |
| A03 | Two Pointer & Sliding Window |
| A04 | Graph (BFS, DFS, Dijkstra) |
| A05 | Dynamic Programming (Fibonacci, Knapsack, LCS) |
| A06 | Tree & Linked List basics |
| A07 | Heap, Stack, Queue |
| A08 | Backtracking & Greedy basics |
| A09 | Sorting Extended (Merge Sort, Quick Sort, Counting Sort) |
| A10 | DP Classic (Coin Change, Edit Distance, LIS) |
| A11 | Graph Advanced (Topological Sort, Union-Find, Bellman-Ford, Floyd-Warshall) |
| A12 | Linked List Patterns (Reverse, Floyd's Cycle, Merge Sorted, Find Middle, Remove Nth) |
| A13 | Stack Patterns (Next Greater Element, Valid Parentheses, Min Stack, Largest Rectangle) |
| A14 | Tree Advanced (Height, Diameter, LCA, Level Order, Path Sum) |
| A15 | Backtracking Patterns (Subsets, Permutations, Combination Sum, N-Queens) |
| A16 | Greedy Patterns (Activity Selection, Jump Game, Gas Station, Fractional Knapsack) |
| A17 | String & Hashing (KMP, Group Anagrams, Two Sum Hash, Min Window Substring) |
| A18 | Advanced DS (LRU Cache, Trie, Union-Find, Segment Tree, Binary Indexed Tree) |

---

## Feature Roadmap — Next 20 (ranked by impact ÷ effort, 2026-04-12)

### Tier 1 — High Impact, Buildable Now

**1. Daily Challenge (`/daily`)**
Same problem for all users every day, Wordle-style. Countdown to next challenge. Shared leaderboard (who solved it, in how long, sorted by time). Solving the daily extends the streak.
- Backend: `DailyChallenge { date, problemId }` table + scheduled job to pick problem + leaderboard endpoint
- Frontend: `/daily` page with countdown clock, problem panel, shared leaderboard card
- Tie-in: streak engine already exists; gate it so only the daily counts for streak on that day

**2. Editorial Unlock Improvement**
Editorials currently only unlock after `ACCEPTED`. Should also unlock after: 2 failed submissions OR 10+ minutes spent on the problem.
- Backend: add `attemptsBeforeEditorial` check in `SubmissionController`; track `firstOpenedAt` timestamp on `UserTopicProgress` or in a new `ProblemSession` record
- Frontend: track `startedAt = Date.now()` when Practice tab opens; pass elapsed time to the editorial unlock check
- One condition change, no new tables needed

**3. Company Tags on Problems**
Add `companies` field (JSON string `["Google","Amazon","Microsoft"]`) to the `Problem` entity. Filter by company on `/problems` page. "What does Google ask about Trees?" is the most common pre-interview search.
- Backend: add `companies` column to `Problem`, add `?company=Google` filter in `ProblemsController`
- Frontend: company chips on problem cards, company filter dropdown on `/problems`
- Data: tag existing problems in seed files; add to all new problem seeds going forward

**4. Cheat Sheet View (`/cheat-sheet`)**
One-page printable summary per topic: memory anchor pills, complexity table, 3 key code snippets, when-to-use bullets. No new backend — renders existing topic fields in a print-optimised layout.
- Frontend: `/cheat-sheet?topic={id}` route, `@media print` CSS, `window.print()` button
- Layout: memory anchor pills row → complexity badge → examples code blocks → when-to-use list

**5. Guided Learning Path (`/path`)**
A linear week-by-week roadmap. "Week 1 → Java Core → Week 2 → DSA Basics → Week 3 → Spring Boot". Shows % complete per week derived from gate stages + topic displayOrder. Answers "where do I start?"
- No new backend needed — derive completion from existing gate stage data
- Frontend: timeline UI, each node coloured by gate stage (THEORY=grey, MASTERED=green)

**6. Weak Topic Auto-Suggest on Dashboard**
A "Focus today" card showing 3 topics with lowest confidence score from `UserTopicPerformance`. One analytics API call already exists. Huge psychological impact — tells the user exactly where to go instead of browsing.
- Frontend only: add a card to `DashboardPage` that calls `analyticsApi.getDashboard()` and surfaces the bottom-3 `weakAreas`

**7. Spring Boot + System Design Interview Q&A Data**
The static Q&A bank (`interviewData.js`) is missing the two categories senior backend interviewers ask most. This is a **data task**, not a feature build.
- Spring Boot: DI, AOP, auto-config, Boot vs Framework, transaction management, `@Transactional` pitfalls, N+1 fix, bean scopes
- System Design: design rate limiter, URL shortener, notification service, CAP theorem trade-offs, consistent hashing, leader election

**8. Custom Quiz Builder**
Let the user pick topics (multi-select), difficulty, and number of questions (5/10/20), then generate a quiz from the MCQ bank filtered to those topics. No new backend if MCQ questions have topic tags.
- Backend: add `topicTag` field to `QuizQuestion`; add filter param to quiz sets endpoint
- Frontend: setup modal on `/quiz` page before the session starts

**9. Topic Concept Links (Related Topics)**
In the theory tab show "Related Topics" chips (HashMap → Trees → Heaps). Stored as `relatedTopicIds` (JSON) on `Topic`. Frontend renders them as clickable chips below the memory anchor. Helps users see the knowledge graph.
- Backend: add `relatedTopicIds` TEXT column to `Topic`
- Frontend: chips in theory tab header; clicking navigates to `/?topic={id}`
- Admin: multi-select field in topic editor Info tab

**10. Interview History Log (`/my-interviews`)**
Personal log of real interviews the user has done: company, date, round type (DSA/System Design/Behavioural), questions remembered, outcome (Passed/Failed/Pending). Helps track what real companies actually asked.
- Backend: `InterviewLog { userId, company, date, roundType, notes, outcome }` table + CRUD endpoints
- Frontend: `/my-interviews` page — add entry form + timeline list

---

### Tier 2 — High Value, Slightly More Build

**11. Problem Attempt Timer + Session Stats**
Track time-on-problem: starts when Practice tab opens, stops on submit. Show "Your fastest: 12 min" on problem card. `solveTimeSecs` already stored on `Submission`.
- Frontend: `startedAt` ref in `TopicView` Practice tab; pass elapsed time to submit call (already accepted by API)
- Surface on analytics page as "Avg solve time by difficulty"

**12. Bookmark Collections**
Currently bookmarks are a flat list. Let users create named collections: "Google prep", "Week 3 review".
- Backend: `BookmarkCollection { id, userId, name }` table; add `collectionId` FK to `Bookmark`
- Frontend: collections sidebar on a `/bookmarks` page; drag bookmarks into collections

**13. Code Snippet Library (`/snippets`)**
Personal library of reusable patterns: "Binary Search template", "BFS template". User saves from the code editor ("Save to Snippets" button) or pastes manually.
- Backend: `CodeSnippet { id, userId, title, code, tags }` table
- Frontend: `/snippets` page + "Save to Snippets" button in Monaco toolbar

**14. User Topic Difficulty Rating**
After reaching MASTERED on a topic, show a prompt: "How hard was this? 1–5 stars." Aggregate ratings shown on topic cards. Backend `TopicRating` already exists — just needs the trigger UI.
- Frontend: post-mastery modal in `TopicView.jsx` when gate stage flips to MASTERED

**15. Progress Export**
Export a "Study Report" as a printable page or PDF: topics mastered, problems solved by category, streak history, estimated readiness %.
- Frontend only: `/report` route using `@media print` CSS or `jsPDF`; data from existing analytics + gate endpoints

---

### Tier 3 — Strong Long-Term Value

**16. Friend Challenges / Groups**
Two users challenge each other: "Solve this problem in 30 min." The biggest engagement driver after daily streaks.
- Backend: `Group`, `GroupMember`, `Challenge` tables; websocket or polling for live status
- Frontend: `/groups` page, challenge invite flow

**17. Pattern Relationship Map (`/patterns`)**
Visual graph: Sliding Window → Two Pointers → Prefix Sum → Kadane's. Click a pattern → see all problems tagged with it. Pattern as a first-class entity.
- Backend: `Pattern { name, description, parentPatternId }` table; FK on `Problem.pattern`
- Frontend: D3 or simple CSS tree; click → filtered problems list

**18. Resume Gap Analyzer**
Upload resume PDF → extract tech mentioned → compare against mastery map → "You claim Spring Security but haven't touched it."
- Backend: `PdfImportService` foundation already exists
- Frontend: file upload on profile page; gap table output

**19. Weekly Study Report Email**
Every Sunday: topics studied, problems solved, streak, 3 suggested topics for next week. Cron job + JavaMailSender.
- Backend: `@Scheduled` cron + email template; analytics data already exists
- No frontend needed beyond an opt-in toggle in settings

**20. Subscription Tiers**
Free / Pro ₹199/mo / Career Pro ₹399/mo. Feature gates on interview mode, analytics, resume analyzer.
- Backend: `Subscription { userId, tier, expiresAt }` table + middleware that checks tier before serving gated endpoints
- Frontend: `/pricing` page + upgrade prompts at gate points

---

---

## Features 21–40 + Data Changes

### Tier 4 — Engagement & Depth (Features 21–30)

**21. Problem Set Collections (`/problem-sets`)**
Curated lists: "Top 50 FAANG", "Amazon Favourites", "Blind 75", "Spring Boot Interview Problems". Each set is a named ordered list of problem IDs. User can mark a set as "in progress" and see % done.
- Backend: `ProblemSet { id, title, description, isPublic, createdBy }` + `ProblemSetItem { setId, problemId, displayOrder }` tables
- Frontend: `/problem-sets` listing page + set detail page (problem table with progress checkmarks)
- Admin can create public sets; users can create private sets
- Data change: populate 3–5 seed sets (Blind 75, FAANG Top 50, DSA Essentials, Spring Coding)

**22. Skill Assessment Quiz on Onboarding**
After signup, give a 10-question MCQ diagnostic covering Java, DSA, and System Design. Score determines starting point on the learning path and pre-fills the SRS queue with weak topics.
- Backend: endpoint that accepts diagnostic answers and writes initial `UserTopicPerformance` records
- Frontend: step 2 of the existing 3-step onboarding replaces the blank form with the diagnostic quiz
- Diagnostic questions live in a separate `DiagnosticQuestion` table or a hardcoded JSON file

**23. Problem Discussion Thread**
Per-problem comment section. Users post approaches, ask questions, share alternative solutions. Visible after the user has attempted the problem at least once (prevents spoilers).
- Backend: `Discussion { id, problemId, userId, parentId, content, upvotes, createdAt }` table + CRUD endpoints
- Frontend: "Discussion" tab in the problem view (alongside Hints / Editorial)
- Gated: thread is locked until user has made at least one submission on the problem

**24. Code Diff Viewer (Your Solution vs Editorial)**
After accepting, show a side-by-side diff of the user's last submission vs the editorial solution. Highlights what they did differently (extra null check, different variable names, missing edge case).
- Frontend only: `diff` the two strings using a JS diff library (e.g. `diff` npm package), render inline with green/red highlights
- Add a "Compare with editorial" button on the submission history tab

**25. Notification Centre (In-App)**
Bell icon in the nav. Notifications for: streak about to break (evening reminder), SRS review due, daily challenge live, someone accepted your group challenge, weekly report ready.
- Backend: `Notification { id, userId, type, message, isRead, createdAt }` table + `POST /api/notifications/mark-read`
- Frontend: bell icon with unread badge, dropdown list, mark-all-read button
- Push via polling (every 5 min) or server-sent events — no websocket needed for MVP

**26. Learning Velocity Dashboard Card**
"At your current pace you'll be interview-ready in 6 weeks." Shows topics mastered per week as a sparkline. If pace drops below 2 topics/week, shows a warning card.
- Backend: derive from `UserTopicProgress.updatedAt` grouped by week — no new table
- Frontend: new dashboard card with a 6-week sparkline and a projected readiness date

**27. Category Completion Badge**
When a user masters ALL topics in a category (all MASTERED gate stage), award a badge: "Java Core Complete ✓". Show on the profile page. Motivates finishing a category rather than cherry-picking.
- Backend: a computed field — check if all topics in a category are MASTERED; no new table needed; add to profile endpoint response
- Frontend: badge row on the profile page with locked/unlocked state per category

**28. Topic Search (`/search`)**
Global search across topic titles, descriptions, memory anchors, and problem titles. Results ranked by relevance. A user preparing for an interview and searching "thread safety" should land directly on the right topic.
- Backend: `GET /api/search?q=thread+safety` — MySQL FULLTEXT search across `topics.title`, `topics.description`, `topics.memory_anchor`, `problems.title`
- Frontend: search bar in the sidebar header; results page with grouped sections (Topics / Problems / Algorithms)

**29. Pomodoro Study Timer**
Built-in 25/5 min work-break timer visible during theory reading and problem solving. Auto-pauses on navigation away. Completed pomodoros logged as study time.
- Frontend only: a floating timer widget (bottom-right corner), persisted in `localStorage`
- Optional: log pomodoro count per day to `UserActivity` table for the heatmap

**30. Problem Difficulty Voting**
After solving, prompt: "Was this problem difficulty accurate? 👍 / 👎". Aggregate votes surface as "(73% agree: Hard)" next to the difficulty badge. Helps admins recalibrate mislabelled problems.
- Backend: `ProblemDifficultyVote { problemId, userId, agrees }` table + `GET /api/problems/{id}/difficulty-vote`
- Frontend: thumbs up/down below the difficulty badge, shown post-submission

---

### Tier 5 — Power User Features (Features 31–40)

**31. Personalised Study Plan Generator**
User inputs: target company, interview date, hours per week. System generates a day-by-day study calendar: "Monday: HashMap theory + 2 Easy problems. Tuesday: Review yesterday + 1 Medium." Exports to Google Calendar or PDF.
- Backend: planning algorithm — takes weak areas from analytics, target date, available hours → generates `StudyPlan { day, topicId, problemIds[], taskType }` records
- Frontend: `/plan` page with calendar view; "Generate Plan" button that opens a setup modal

**32. Interview Question Tagger (Mark from Real Interview)**
On any problem or Q&A question, a "I was asked this" button. Creates a personal log entry with company + date (user fills in). Aggregated anonymously to show "47 users were asked this at Amazon in the last 6 months."
- Backend: `RealInterviewTag { problemId, userId, company, date }` + aggregate endpoint
- Frontend: "Mark as asked in interview" button on problem cards and Q&A items

**33. Concept Dependency Map (`/map`)**
Visual graph of all topics with arrows showing dependencies (Arrays → HashMap → Two Pointers → Sliding Window). Zoom in/out. Click a node to go to that topic. Shows mastery colouring on each node.
- Backend: `relatedTopicIds` field on `Topic` (also needed for feature #9)
- Frontend: force-directed graph using D3.js or a lightweight alternative; nodes coloured by gate stage

**34. Streak Recovery Challenge**
When a user misses a day and their streak breaks, instead of just resetting to 0, offer a "Recovery Challenge": solve 2 Medium problems in the next 24 hours to restore the streak. One-time rescue per 30 days.
- Backend: `StreakRecovery { userId, expiresAt, required: 2, completed: 0 }` table; `StreakService.offerRecovery()` called when streak breaks
- Frontend: banner on the dashboard with a countdown + progress (0/2 problems solved)

**35. Code Template Library (`/templates`)**
Preloaded code templates for common patterns: BFS, DFS, Dijkstra, Binary Search, Sliding Window, Union-Find, Segment Tree. User can copy into the editor with one click or save their own modified version.
- Backend: `CodeTemplate { id, name, pattern, code, isPublic, userId }` table; seed with 15 standard templates
- Frontend: `/templates` page + "Insert template" button in the Monaco editor toolbar dropdown

**36. Problem Tag Filtering (Multiple Tags)**
Current `/problems` page filters by difficulty and topic. Extend to filter by: pattern tag (`HashMap`, `DFS`, `DP`), company, difficulty, solved/unsolved, bookmarked. Multi-select filters with a count badge.
- Backend: extend `GET /api/problems` to accept `?pattern=HashMap&company=Google&solved=false`
- Frontend: filter panel on `/problems` with multi-select chips for each dimension

**37. Hint Usage Tracking + Analytics**
Track which hint level each user used per problem (`NO_HINT`, `HINT1`, `HINT2`, `HINT3`). Surface on the analytics page: "You use Hint 3 on 60% of Hard problems — try stopping at Hint 1."
- Backend: add `hintLevel` field to `Submission`; already sent from frontend (`hintAssisted` bool exists, extend to int 0–3)
- Frontend: hint usage breakdown on `/analytics` — bar chart per difficulty

**38. Weekly Leaderboard**
Top 10 users by XP earned in the current week. Resets every Monday. Shows rank, name, XP this week, problems solved this week. Anonymous option (show only first name).
- Backend: `UserActivity` table aggregated by week; leaderboard endpoint `GET /api/leaderboard/weekly`
- Frontend: leaderboard card on dashboard (collapsed by default, expand to see top 10)

**39. Spaced Repetition for Problems (not just topics)**
Currently the SRS queue only queues topics. Extend it to also queue unsolved/weak problems: if a user rated a problem "Forgot" or "Hard" in a review, re-queue the problem itself for another attempt in N days.
- Backend: `SpacedRepetitionEntry` already supports `itemType = PROBLEM`; add problem scheduling in `SpacedRepetitionService`
- Frontend: `ReviewPage` already renders problem cards differently — just ensure problem SRS items navigate to the problem editor

**40. Mobile PWA (Progressive Web App)**
Add a `manifest.json` and service worker so DevLearner installs as a home-screen app on Android/iOS. Offline support for theory reading (cache topic data). Push notifications for streak reminders.
- Frontend: `manifest.json`, `service-worker.js` (Workbox), `<meta>` tags for iOS
- Cache strategy: cache-first for theory JSON, network-first for submissions
- Backend: Web Push API integration for streak/review notifications (`webpush` Java library)

---

## Data Changes Required (Schema + Seed)

This section tracks every data model change needed to support the features above. All are additive — no breaking changes to existing tables.

### New Columns on Existing Tables

| Table | Column | Type | Purpose | Needed by |
|-------|--------|------|---------|-----------|
| `problems` | `companies` | TEXT (JSON array) | Company tags `["Google","Amazon"]` | Feature 3, 36 |
| `problems` | `hint_level_required` | INT default 0 | Min hint level unlocked (0=free) | Feature 37 |
| `topics` | `related_topic_ids` | TEXT (JSON array) | IDs of linked topics | Feature 9, 33 |
| `topics` | `estimated_hours` | DECIMAL(3,1) | Study time estimate for path planner | Feature 31 |
| `quiz_questions` | `topic_tag` | VARCHAR(50) | Maps question to a topic for custom quiz | Feature 8 |
| `submissions` | `hint_level` | INT (0–3) | Which hint level was used | Feature 37 |
| `submissions` | `first_opened_at` | DATETIME | When Practice tab was first opened | Feature 2 |
| `algorithms` | `related_algorithm_ids` | TEXT (JSON array) | Links between algorithms | Feature 33 |

### New Tables

| Table | Columns | Purpose | Needed by |
|-------|---------|---------|-----------|
| `daily_challenges` | `id, date, problem_id, created_at` | One row per day | Feature 1 |
| `daily_challenge_entries` | `id, challenge_id, user_id, solve_time_secs, created_at` | Leaderboard rows | Feature 1 |
| `problem_sets` | `id, title, description, is_public, created_by, created_at` | Curated problem lists | Feature 21 |
| `problem_set_items` | `id, set_id, problem_id, display_order` | Items in a set | Feature 21 |
| `discussions` | `id, problem_id, user_id, parent_id, content, upvotes, created_at` | Problem threads | Feature 23 |
| `notifications` | `id, user_id, type, message, is_read, created_at` | In-app bell | Feature 25 |
| `problem_difficulty_votes` | `id, problem_id, user_id, agrees, created_at` | Difficulty feedback | Feature 30 |
| `study_plans` | `id, user_id, target_date, hours_per_week, generated_at` | Plan header | Feature 31 |
| `study_plan_items` | `id, plan_id, scheduled_date, topic_id, problem_ids, task_type` | Day-by-day tasks | Feature 31 |
| `real_interview_tags` | `id, problem_id, user_id, company, interview_date, created_at` | "I was asked this" | Feature 32 |
| `code_templates` | `id, name, pattern, code, is_public, user_id, created_at` | Template library | Feature 35 |
| `streak_recoveries` | `id, user_id, expires_at, required, completed, created_at` | Rescue challenge | Feature 34 |
| `weekly_activity` | `id, user_id, week_start, xp_earned, problems_solved` | Leaderboard source | Feature 38 |
| `interview_logs` | `id, user_id, company, interview_date, round_type, notes, outcome` | Real interview tracker | Feature 10 |

### New Seed Files Required

**Topics (theory content — these gaps must be filled before any UI is built on them):**

| File | Category | Topics | Priority |
|------|----------|--------|----------|
| B33 | JAVA | Virtual Threads (Project Loom) — the new concurrency model | High |
| B34 | JAVA | Records, Sealed Classes, Pattern Matching (Java 17+) | High |
| B35 | ADVANCED_JAVA | Reactive Programming (Project Reactor, WebFlux basics) | Medium |
| B36 | ADVANCED_JAVA | Java Memory Model — happens-before, volatile, atomic | High |
| S07 | SPRING_BOOT | Spring Boot Testing — @SpringBootTest, @DataJpaTest, @WebMvcTest, TestContainers | High |
| S08 | SPRING_BOOT | Spring Batch — jobs, steps, chunk processing | Medium |
| S09 | SPRING_BOOT | Spring WebFlux — reactive endpoints, backpressure | Medium |
| SD05 | SYSTEM_DESIGN | Real System Design Cases — design Twitter feed, WhatsApp, Uber surge | High |
| SD06 | SYSTEM_DESIGN | Database Design Patterns — CQRS, Event Sourcing, Outbox Pattern | High |
| T02 | TESTING | Integration Testing with TestContainers | High |
| T03 | TESTING | Spring Boot Test Slices — @DataJpaTest, @WebMvcTest, @JsonTest | High |
| T04 | TESTING | Contract Testing — Pact, Spring Cloud Contract | Medium |
| M07 | MYSQL | Transactions & Locking — ACID, isolation levels, gap locks, deadlock analysis | High |
| M08 | MYSQL | Replication & High Availability — master-replica, GTID, failover | Medium |

**Algorithm seeds (A19–A25 — see Algorithm Gap table above):**

| File | Contents |
|------|----------|
| A19 | MST — Prim's (min-heap), Kruskal's (union-find), Borůvka's |
| A20 | Advanced String — Z-algorithm, Suffix Array, Rabin-Karp |
| A21 | Monotonic Queue — Sliding Window Maximum, Jump Game variants |
| A22 | Number Theory — GCD/LCM, Sieve of Eratosthenes, Modular Exponentiation |
| A23 | Interval Problems — Merge Intervals, Insert Interval, Meeting Rooms |
| A24 | Matrix Patterns — Spiral, Rotate 90°, Diagonal traversal, Search in 2D matrix |
| A25 | Geometry & Misc — Convex Hull, Game Theory basics (Nim), Reservoir Sampling |

**Interview Q&A additions to `interviewData.js`:**

| Category | Questions to add |
|----------|-----------------|
| Spring Boot | DI vs IoC, @Transactional propagation levels, N+1 problem + fix, bean scopes, auto-config mechanism, circular dependency, Spring Security filter chain, JWT flow in Spring |
| System Design | Design rate limiter, URL shortener, notification service, typeahead search, distributed cache; CAP theorem with real examples; consistent hashing with virtual nodes; leader election |
| Advanced Java | Virtual threads vs platform threads, Java Memory Model + happens-before, CompletableFuture chaining + exception handling, ForkJoinPool, custom ClassLoader |
| Testing | What to unit test vs integration test, Mockito spy vs mock, TestContainers setup, @DataJpaTest isolation, test pyramid |
| Behavioural | STAR format for: debugging production incident, disagreeing with tech decision, onboarding to a large codebase, delivering under deadline |

**Problem Sets to seed (for Feature 21):**

| Set Name | Problems | Source |
|----------|----------|--------|
| Blind 75 | 75 problems covering all DSA patterns | Classic FAANG prep list |
| Amazon Top 30 | 30 Amazon-tagged problems | Frequently reported in interviews |
| Spring Boot Coding | 20 problems requiring Spring knowledge | Backend-specific |
| DSA Essentials | 40 problems, 5 per core pattern | Minimum viable DSA prep |
| SQL 20 | 20 SQL query problems (window fns, CTEs, EXPLAIN) | Backend data interviews |

### Data Quality Rules (apply to all new seeds)

1. **No orphan problems** — every problem must have at least 3 test cases in `testCases` JSON
2. **No empty editorials** — if `editorial` is blank the problem is incomplete; do not import it
3. **Starter code must compile** — every `starterCode` must have a `main()` that reads stdin and calls the solution method
4. **Companies must be from the canonical list**: `Amazon`, `Google`, `Microsoft`, `Meta`, `Apple`, `Netflix`, `Flipkart`, `Uber`, `LinkedIn`, `Twitter` — no typos, no "FAANG" as a company name
5. **Pattern must be canonical**: `HashMap`, `Two Pointers`, `Sliding Window`, `BFS`, `DFS`, `Dynamic Programming`, `Binary Search`, `Greedy`, `Backtracking`, `Stack`, `Heap`, `Union-Find`, `Trie`, `Math`, `Sorting`, `Divide and Conquer`, `Monotonic Stack`, `Matrix` — nothing else
6. **Memory anchor pills** — format is always `key: value` with a colon separator; the renderer splits on `: ` to bold the key
7. **Story must have a character** — "Imagine you are a librarian…" not "HashMap is a data structure…"

### Deliberately NOT doing
- **SQL Practice Engine** (H2 embedded DB + query editor) — over-engineering; topic seeds cover SQL theory adequately
- **Voice notes** — mobile-first feature, not worth building before core content is complete
- **AI-generated hints on the fly** — latency + cost; the 3-tier static hints are good enough and faster

### ✅ Completed (2026-04-12)
- **Spaced Repetition Review UI** (`/review`) — full session flow with SM-2 ratings
- **Interview Mode** (`/interview-mode`) — timed session, approach-first, auto-submit, scorecard
- **Performance Analytics** (`/analytics`) — confidence scores, error breakdown, mistake journal
- **Admin: Example CRUD** — add/edit/delete individual examples per topic
- **Admin: Bulk Problems** — paste a JSON array to create many problems at once
- **Admin: Quick Import** — universal paste/upload that auto-detects topics / algorithms / quiz JSON

---

## Data Plan — Content is the Product

The platform is only as good as its content. This section defines exactly what "complete" means for each data type and the priority order for filling gaps.

### Current Inventory (2026-04-12)

| Category | Topics | Problems (est.) | Examples | Status |
|----------|--------|-----------------|----------|--------|
| Java Core (B01–B32) | 32 | Sparse (2–4/topic) | Sparse | Theory good, problems weak |
| Spring Boot (S01–S06) | 6 | Very sparse | Sparse | Theory good, problems missing |
| DSA Core (D01–D09) | 9 | Moderate | Moderate | Best quality currently |
| DSA Patterns (D10–D14) | 5 | Sparse | Sparse | Theory decent |
| MySQL (M01–M06) | 6 | Sparse | Sparse | Theory good |
| AWS (A01–A04) | 4 | None | Sparse | Theory only |
| System Design (SD01–SD04) | 4 | None | None | Theory only |
| Testing (T01) | 1 | None | None | Skeleton |
| Algorithms (A01–A18) | 70+ algos | N/A | Code only | Good, no drills |

**The gap:** ~67 topics × 8 problems minimum = ~536 problems needed. Currently ~150 exist.

---

### Topic Theory — Completeness Checklist

Every topic seed must hit all of these before it is considered complete:

| Field | Requirement |
|-------|-------------|
| `story` | 3–4 sentences, one character, one aha moment — not a textbook definition |
| `memoryAnchor` | 4–6 `key: value` pills — the facts that must stick in memory |
| `analogy` | One sentence: real-world X = code Y (e.g. "HashMap = a library index card") |
| `firstPrinciples` | 3–5 numbered sentences explaining WHY it works from scratch |
| `examples[]` | Minimum 2, maximum 4 — see Example Schema below |
| `problems[]` | 3 Easy + 3 Medium + 2 Hard — see Problem Schema below |

**Fields currently thin across most topics:**
- `story` — exists in DSA, weak in Java/Spring/MySQL; should NOT just restate the description
- `memoryAnchor` — many topics only have 1–2 pills; need 4–6 distinct facts
- `firstPrinciples` — often copied from description; must explain WHY the concept exists, not what it is
- `examples` — most Java/Spring topics have 0–1 examples with no working code
- `problems` — Java Core and Spring have almost no problems with test cases

---

### Example Schema — What a Complete Example Looks Like

```json
{
  "title": "HashMap frequency count",
  "displayOrder": 1,
  "description": "Count character frequency in a string using HashMap",
  "code": "Map<Character, Integer> freq = new HashMap<>();\nfor (char c : s.toCharArray()) {\n    freq.merge(c, 1, Integer::sum);\n}\n// freq = {'a':3, 'b':1, ...}",
  "explanation": "merge() is cleaner than getOrDefault+put. First call sets value to 1; subsequent calls add 1 to the existing value via Integer::sum.",
  "realWorldUse": "Used in every anagram/duplicate detection problem. Redis HINCRBY does the same thing at the cache layer.",
  "pseudocode": "FOR each char c in string:\n    freq[c] = freq.getOrDefault(c, 0) + 1"
}
```

**Rules for good examples:**
- `code` must be real, runnable Java — not pseudocode (pseudocode goes in the `pseudocode` field)
- `realWorldUse` must name a specific production system (Redis, MySQL index, Spring bean registry, etc.)
- `explanation` must explain the non-obvious line, not just restate what the code does
- One example should be basic ("hello world of the concept"), one should be production-grade

---

### Problem Schema — What a Complete Problem Looks Like

```json
{
  "title": "Two Sum",
  "difficulty": "EASY",
  "displayOrder": 1,
  "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Assume exactly one solution exists.",
  "inputFormat": "Line 1: space-separated integers. Line 2: integer target.",
  "outputFormat": "Two space-separated indices (0-indexed), smaller index first.",
  "sampleInput": "2 7 11 15\n9",
  "sampleOutput": "0 1",
  "constraints": "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nExactly one valid answer exists.",
  "hint":  "What value do you need to reach target from nums[i]?",
  "hint1": "For each element, compute target - nums[i]. Have you seen that value before?",
  "hint2": "Use a HashMap mapping value → index. Check before inserting.",
  "hint3": "Map<Integer,Integer> seen. For each i: if seen.containsKey(target-nums[i]) → return [seen.get(...), i]. Else seen.put(nums[i], i).",
  "starterCode": "import java.util.*;\npublic class Solution {\n    public static int[] twoSum(int[] nums, int target) {\n        // your code here\n        return new int[]{};\n    }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int[] nums = Arrays.stream(sc.nextLine().trim().split(\" \")).mapToInt(Integer::parseInt).toArray();\n        int target = sc.nextInt();\n        int[] res = twoSum(nums, target);\n        System.out.println(res[0] + \" \" + res[1]);\n    }\n}",
  "testCases": "[{\"input\":\"2 7 11 15\\n9\",\"expectedOutput\":\"0 1\"},{\"input\":\"3 2 4\\n6\",\"expectedOutput\":\"1 2\"},{\"input\":\"3 3\\n6\",\"expectedOutput\":\"0 1\"}]",
  "pattern": "HashMap",
  "editorial": "Brute force O(n²): check every pair. Better: O(n) HashMap.\n\nKey insight: instead of 'do any two numbers sum to target?', ask 'for this number, does its complement exist?'\n\nFor each nums[i], check if (target - nums[i]) is already in the map. If yes → answer found. If no → add nums[i]→i to the map and continue.",
  "companies": "[\"Amazon\",\"Google\",\"Microsoft\"]"
}
```

**Rules for complete problems:**
- `starterCode` MUST have a `main()` that reads from stdin — the executor uses stdin/stdout
- `testCases` must have 3–5 cases: happy path + edge (empty/single/negative) + a slightly larger input
- Three-tier hints must be strictly progressive: hint1 = direction only, hint2 = approach name, hint3 = near-pseudocode (do NOT give the answer in hint3)
- `editorial` must explain both the brute-force AND the optimal, and name the key insight
- `pattern` must be one of the canonical tags: `HashMap`, `Two Pointers`, `Sliding Window`, `BFS`, `DFS`, `Dynamic Programming`, `Binary Search`, `Greedy`, `Backtracking`, `Stack`, `Heap`, `Union-Find`, `Trie`, `Math`, `Sorting`
- `companies` is a JSON string array — tag every problem you know has appeared in a real interview

---

### Algorithm Seed — What a Complete Algorithm Looks Like

All 18 files (A01–A18) are in good shape. Remaining gaps to fill as A19–A25:

| Planned File | Contents | Why important |
|--------------|----------|---------------|
| A19 | Minimum Spanning Tree (Prim's, Kruskal's) | Google/Amazon system design rounds |
| A20 | Suffix Array, Z-algorithm, Rabin-Karp | String matching in senior roles |
| A21 | Monotonic Queue (sliding window maximum) | Very common FAANG problem type |
| A22 | Number Theory (GCD, Sieve, modular arithmetic) | Crypto roles + competitive programming |
| A23 | Interval Scheduling (merge intervals, sweep line) | Amazon SDE1/2 favourite pattern |
| A24 | Matrix Traversal (spiral, diagonal, rotate 90°) | Google onsite staple |
| A25 | Game Theory basics (Nim, Sprague-Grundy) | Rare but appears at senior FAANG level |

---

### Data Priority Roadmap

**Phase 1 — Fill DSA (highest interview ROI)**
- Add 3 Easy + 3 Medium + 2 Hard problems to every DSA topic D01–D14 → ~112 problems
- Add 2 working code examples to every DSA topic → ~28 examples
- Add Spring Boot + System Design sections to `interviewData.js` (static Q&A bank)

**Phase 2 — Make Java Core practisable**
- Add problems to B11–B22 (OOP, Collections, Streams, Threads) → ~88 problems
- Focus: design-pattern problems (Strategy, Factory, Observer, Decorator implementations)
- Add threading/concurrency problems (producer-consumer, deadlock detection, thread-safe counter)

**Phase 3 — Complete remaining categories**
- Spring Boot: mini coding problems (implement custom filter, write JPA query, Spring Security config)
- MySQL: SQL query problems (window functions, CTEs, EXPLAIN output interpretation)
- Add A19–A25 algorithm seeds
- Add T02–T04 testing seeds (integration tests, TestContainers, Spring Boot Test slice tests)

**Quick wins — do via Quick Import today**
- Add `companies` tags to all existing DSA problems in seed files
- Backfill `editorial` on problems that have accepted solutions but empty editorial text
- Add `relatedTopicIds` to HashMap, Trees, Heaps topics to link them
- Promote `memoryAnchor` from 2 pills → 5 pills for every Java Core topic

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
| Security config | `learning-system/src/main/java/com/learnsystem/config/SecurityConfig.java` |
| Interview Q&A bank | `frontend/src/pages/interview/interviewData.js` |
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
