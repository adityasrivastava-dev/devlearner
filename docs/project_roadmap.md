---
name: DevLearner Feature Roadmap & Priorities
description: Full master plan — Phase status, content roadmap, pending features as of 2026-04-11
type: project
originSessionId: f2fea455-68a5-408d-b680-4b462a4406db
---
## What's Done (as of 2026-04-11)

### Learning Core ✅
- Theory tab full redesign: Memory Anchor chips, Story narrative card, Analogy key=value pairs, First Principles numbered list
- Sidebar accordion navigation: sections collapse, topic rows have visual separators
- Learning Gate system: THEORY → EASY → MEDIUM → HARD → MASTERED progressive unlock
- 3-tier hint system, smart feedback card (algorithm detection), recall drill modal

### Gamification ✅
- XP + level system (Beginner → Architect), streak + pause days, heatmap, SRS queue
- Streak recovery modal, content rating (1-5 stars per topic)
- Similar problems after solving, explain-it-back (Reflect tab)

### Content — Seed Files ✅ (29 files)
- Java Core: B01–B32 (full coverage: collections, streams, concurrency, JDBC, serialization, etc.)
- Spring Boot: S01–S06 (core, security, JPA, microservices)
- DSA Patterns: D10–D14 (complexity, arrays, strings, bit manipulation, greedy)
- MySQL: M01–M06 (basics through InnoDB internals)
- AWS: A01–A04 (core, serverless, networking, devops)
- System Design: SD01–SD04 (fundamentals, auth, distributed, performance patterns)
- Testing: T01 (JUnit 5, Mockito)

---

## Next Priorities

### Priority 1 — Missing Core DSA Content (D01–D09)
These 9 files cover the most interview-heavy data structure topics. Currently missing entirely.
- `D01-linked-list.json` — singly/doubly/circular, runner, sentinel
- `D02-stack-queue.json` — monotonic stack, deque, circular queue
- `D03-trees.json` — BST, DFS/BFS, LCA, height/diameter
- `D04-heaps.json` — top-K, two-heap, merge K sorted
- `D05-graphs.json` — adjacency list, DFS/BFS, topological sort, union-find, Dijkstra
- `D06-sorting.json` — merge/quick/counting/radix, stability
- `D07-dynamic-programming.json` — memoization, tabulation, knapsack, LCS, 1D/2D
- `D08-recursion-backtracking.json` — pruning, permutations, N-queens
- `D09-trie.json` — Trie insert/search/prefix, segment tree basics

### Priority 2 — InterviewPrepPage (`/interview-prep`)
Browse + study 50+ Q&A from `src/pages/interview/interviewData.js`.
Two-column layout: list on left, detail on right (quickAnswer + keyPoints + code snippet).
Categories: Java, Advanced Java, DSA, SQL, AWS.

### Priority 3 — RevisionPage (`/revision`)
30-min timed Q&A session. Draw 10 questions from interviewData, score card at end, review mode.

### Priority 4 — SQL Practice Engine
H2 embedded database, in-browser SQL query editor, EXPLAIN plan output display.
Separate from the existing problem system (no code execution sandbox needed).

### Priority 5 — Interview Mode
Timed 45-min session. No hints. Approach-first (must describe before coding). Score card.

---

## Phase 2 — Habit & Social
### ❌ Not started
- Daily challenge (Wordle-style, same problem all users, 24h window)
- Groups + friend challenges (Group, GroupMember, GroupChallenge tables needed)
- Live hackathon mode (WebSocket real-time leaderboard)
- Weekly report card (Sunday auto-generated — backend analytics exist, frontend not built)
- Concept connection graph (visual topic relationship map)
- Notification system (smart push — streak reminder, SRS prompt)
- Personal learning velocity dashboard (solve time trends, accuracy over time)

## Phase 3 — Career Prep
### ❌ Not started
- Resume upload + JD gap analyzer (PdfImportService foundation exists)
- Mock interview scorer
- Cheat sheet PDF generator (per-topic 1-page printable)
- Recall drill flashcard page (`/recall`)
- Company-specific prep packs

## Phase 4 — Real-World Engineering
### ❌ Not started
- System design visual builder (drag-drop canvas)
- Production bug simulator (broken codebases to fix)
- Code review simulator (AI-seeded issues, user reviews)
- Explain-this-code (paste any code → plain English line-by-line)
- Debug mode (breakpoint-style stepping)

## Phase 5 — Monetization
### ❌ Not started
- Subscription tiers: Free / Pro ₹199/mo / Career Pro ₹399/mo
- Razorpay + Stripe
- GitHub integration
- Mobile app (React Native)

---

## Subscription Model
- **Free:** 5 topics, code editor, 3 problems/topic, basic streak
- **Pro ₹199/mo:** all topics, unlimited problems, SRS, groups, pause days, algorithm suggester, offline
- **Career Pro ₹399/mo:** everything + JD roadmap, resume gap analyzer, interview mode, company packs

## The Single Most Important Thing
Content quality on the first 10 DSA topics. If a developer reads the Sliding Window story and says "I will never forget this again" — the product wins. Everything else is execution.
