---
name: Project Overview — devlearner
description: Core architecture, tech stack, complete feature inventory and seed content status as of 2026-04-11
type: project
originSessionId: f2fea455-68a5-408d-b680-4b462a4406db
---
Full-stack developer learning platform called **DevLearner**.

**Backend:** Spring Boot 3.2, Java 17, MySQL, Spring Security (JWT + Google OAuth2), JPA/Hibernate, Lombok. Maven build. Package root: `com.learnsystem`. Entry point: `LearningSystemApplication`. Located at `learning-system/`.

**Frontend:** React 19, Vite, React Router v6, TanStack Query, Zustand, Monaco Editor, Mermaid, Axios. Located at `frontend/`. Dev server on `http://localhost:3000`.

**Architecture:** Decoupled SPA. Spring Boot serves only `/api/**` REST endpoints. React handles all UI routing.

---

## What Is Built (as of 2026-04-11)

### Auth & Users
JWT login, Google OAuth2, email/password, multi-role (admin/user), 3-step onboarding (level → goal → roadmap), user profile with XP, streak, level badge.

### Learning Core
- Topics with story, analogy, memory anchor, first principles, Mermaid flowcharts
- 5 examples per topic: code + tracer steps + pseudocode
- Step-by-step algorithm tracer for 13 algorithms
- Monaco editor: Java version selector, autocomplete, syntax highlighting

### Theory Tab UI (redesigned 2026-04-11)
Each section now has a distinct visual identity:
- **Memory Anchor** → green chips (each sentence = one scannable pill, `key:` bolded)
- **The Story** → amber left-border, italic narrative text
- **Visual Analogy** → purple accent, `X = Y` sentences as concept ≡ meaning rows
- **First Principles** → sky-blue accent, numbered sentence list
Components: `MemoryAnchorCard`, `StoryCard`, `AnalogyCard`, `PrinciplesCard` in `TopicView.jsx`

### Sidebar Navigation (redesigned 2026-04-11)
Accordion sections (Learn, Practice, Interview, Account). Only active section auto-opens. Topic rows have border separator + dot indicator. Category tabs with horizontal scroll.

### Learning Gate System
Progressive unlocking: THEORY → EASY → MEDIUM → HARD → MASTERED. Theory requires 20+ char note. Practice requires solved count per difficulty.

### Practice System
Problems per topic with Easy/Medium/Hard gates. 3-tier hint system. Code submission with test case evaluation. Smart feedback card (algorithm detection, methodology, optimization). Recall drill modal after first accepted submission.

### Habit Engine
Daily streak + pause days (banked), XP + level (Beginner → Architect), GitHub-style 52-week heatmap, spaced repetition queue on dashboard.

### Analytics & Profile
Skill confidence bars, mistake journal (last 10 wrong submissions), XP progress bar.

### MCQ Quiz System (`/quiz`)
Quiz sets by category, per-question timer, results with grade + review accordion.
3 seed files: Java Collections, DSA Arrays/Sorting, Java Concurrency (20q each).

### Algorithms Page (`/algorithms`)
10 algorithms, 5-tab detail view. Data-driven (JS file).

### Pattern Name Drill (`/drill`)
Flashcard drill: problem description → type pattern name. Alias matching.

### ProblemsPage (`/problems`)
LeetCode-style table with difficulty pills, inline search, bookmark toggle, pagination.

### Notes & Bookmarks
Backend 100% complete (models, repos, controllers exist). Frontend: notes panel in TopicView + bookmark toggle in topic header and ProblemsPage.

### Admin Panel
Topic/example/problem management, seed file loader, user management, quiz builder.

---

## Category Enum (Topic.Category)
`JAVA`, `ADVANCED_JAVA`, `SPRING_BOOT` (all Spring topics — subCategory distinguishes), `DSA`, `MYSQL`, `AWS`, `SYSTEM_DESIGN` (added 2026-04-11), `TESTING` (added 2026-04-11).

Frontend `CATEGORIES` and `CATEGORY_META` in `src/utils/helpers.js` must match backend enum.

---

## Seed Content Status

### ✅ Complete (29 files)
- **Java Core:** B01–B32 (wrapper classes, datetime, GC, collections internals, reflection, serialization, CompletableFuture, locks, JDBC, Optional/parallel streams)
- **Spring Boot:** S01–S06 (core, boot, security, JPA, REST, microservices)
- **DSA Patterns:** D10–D14 (complexity, array patterns, strings, bit manipulation, greedy)
- **MySQL:** M01–M06 (basics, joins, advanced SQL, indexing, query optimization, InnoDB internals)
- **AWS:** A01–A04 (core services, serverless, networking, devops/containers)
- **System Design:** SD01–SD04 (fundamentals, auth, distributed systems, performance patterns)
- **Testing:** T01 (JUnit 5, Mockito)

### ❌ Missing — HIGH PRIORITY (Core DSA D01–D09)
D01 linked list, D02 stack/queue, D03 trees, D04 heaps, D05 graphs, D06 sorting, D07 DP, D08 backtracking, D09 trie
These are the most interview-heavy topics and should be created next.
