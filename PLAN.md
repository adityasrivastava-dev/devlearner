# DevLearner — Product Plan

Feature roadmap (Features 1–40), schema changes, seed content gaps, and data quality specs.
Architecture and file locations are in [CLAUDE.md](./CLAUDE.md).

---

## Feature Roadmap — Features 1–40 (ranked by impact ÷ effort, 2026-04-12)

### Tier 1 — High Impact, Buildable Now (1–10)

**1. Daily Challenge (`/daily`)**
Same problem for all users every day, Wordle-style. Countdown to next challenge. Shared leaderboard sorted by solve time. Solving the daily extends the streak.
- Backend: `DailyChallenge { date, problemId }` + scheduled job + leaderboard endpoint
- Frontend: `/daily` page — countdown clock, problem panel, leaderboard card

**2. Editorial Unlock Improvement**
Editorials currently only unlock after `ACCEPTED`. Also unlock after: 2 failed submissions OR 10+ minutes spent.
- Backend: `attemptsBeforeEditorial` check in `SubmissionController`; track `firstOpenedAt` on `UserTopicProgress`
- Frontend: track `startedAt = Date.now()` when Practice tab opens; pass elapsed time to unlock check

**3. Company Tags on Problems**
Add `companies` field (JSON string `["Google","Amazon"]`) to `Problem`. Filter by company on `/problems`.
- Backend: add `companies` column; add `?company=Google` filter in `ProblemsController`
- Frontend: company chips on problem cards, company filter dropdown on `/problems`
- Data: tag existing problems in seed files going forward

**4. Cheat Sheet View (`/cheat-sheet`)**
One-page printable summary per topic: memory anchor pills, complexity table, 3 key code snippets, when-to-use bullets. No new backend.
- Frontend: `/cheat-sheet?topic={id}` route, `@media print` CSS, `window.print()` button

**5. Guided Learning Path (`/path`)**
Week-by-week roadmap ("Week 1 → Java Core → Week 2 → DSA Basics"). Shows % complete per week from gate stages + displayOrder.
- No new backend — derive from existing gate stage data
- Frontend: timeline UI, nodes coloured by gate stage (THEORY=grey, MASTERED=green)

**6. Weak Topic Auto-Suggest on Dashboard**
"Focus today" card showing 3 topics with lowest confidence score from `UserTopicPerformance`. Frontend-only.
- Add a card to `DashboardPage` calling `analyticsApi.getDashboard()` and surfacing bottom-3 `weakAreas`

**7. System Design Interview Q&A Data**
Spring Boot questions live via iq-batch-05/06. Still missing: System Design category.
- Create a new batch JSON (see iq-batch-05 format): rate limiter, URL shortener, notification service, CAP theorem, consistent hashing, leader election
- Import via Admin → Interview Q&A → Batch Upload

**8. Custom Quiz Builder**
Pick topics (multi-select), difficulty, and question count (5/10/20), then generate a quiz from the MCQ bank.
- Backend: add `topicTag` field to `QuizQuestion`; add filter param to quiz sets endpoint
- Frontend: setup modal on `/quiz` before the session starts

**9. Topic Concept Links (Related Topics)**
"Related Topics" chips in the theory tab (HashMap → Trees → Heaps). Stored as `relatedTopicIds` (JSON) on `Topic`.
- Backend: add `relatedTopicIds` TEXT column to `Topic`
- Frontend: chips in theory tab header; clicking navigates to `/?topic={id}`
- Admin: multi-select field in topic editor Info tab

**10. Interview History Log (`/my-interviews`)**
Personal log of real interviews: company, date, round type (DSA/System Design/Behavioural), outcome.
- Backend: `InterviewLog { userId, company, date, roundType, notes, outcome }` table + CRUD endpoints
- Frontend: `/my-interviews` page — add entry form + timeline list

---

### Tier 2 — High Value, Slightly More Build (11–20)

**11. Problem Attempt Timer + Session Stats**
Track time-on-problem (starts when Practice tab opens, stops on submit). Show "Your fastest: 12 min" on problem card. `solveTimeSecs` already stored on `Submission`.
- Frontend: `startedAt` ref in `TopicView` Practice tab; pass elapsed time to submit call

**12. Bookmark Collections**
Currently bookmarks are a flat list. Named collections: "Google prep", "Week 3 review".
- Backend: `BookmarkCollection { id, userId, name }` table; add `collectionId` FK to `Bookmark`
- Frontend: collections sidebar on a `/bookmarks` page

**13. Code Snippet Library (`/snippets`)**
Personal library of reusable patterns. User saves from the code editor or pastes manually.
- Backend: `CodeSnippet { id, userId, title, code, tags }` table
- Frontend: `/snippets` page + "Save to Snippets" button in Monaco toolbar

**14. User Topic Difficulty Rating**
After reaching MASTERED, prompt: "How hard was this? 1–5 stars." Backend `TopicRating` already exists.
- Frontend: post-mastery modal in `TopicView.jsx` when gate stage flips to MASTERED

**15. Progress Export**
Export a "Study Report" as a printable page or PDF.
- Frontend only: `/report` route using `@media print` CSS or `jsPDF`; data from analytics + gate endpoints

**16. Friend Challenges / Groups**
Two users challenge each other: "Solve this problem in 30 min."
- Backend: `Group`, `GroupMember`, `Challenge` tables; websocket or polling
- Frontend: `/groups` page, challenge invite flow

**17. Pattern Relationship Map (`/patterns`)**
Visual graph: Sliding Window → Two Pointers → Prefix Sum → Kadane's.
- Backend: `Pattern { name, description, parentPatternId }` table; FK on `Problem.pattern`
- Frontend: D3 or simple CSS tree; click → filtered problems list

**18. Resume Gap Analyzer**
Upload resume PDF → extract tech → compare against mastery map.
- Backend: `PdfImportService` foundation already exists
- Frontend: file upload on profile page; gap table output

**19. Weekly Study Report Email**
Every Sunday: topics studied, problems solved, streak, 3 suggested topics. Cron job + JavaMailSender.
- Backend: `@Scheduled` cron + email template; analytics data already exists
- Frontend: opt-in toggle in settings

**20. Subscription Tiers**
Free / Pro ₹199/mo / Career Pro ₹399/mo.
- Backend: `Subscription { userId, tier, expiresAt }` table + middleware tier checks
- Frontend: `/pricing` page + upgrade prompts

---

### Tier 3 — Engagement & Depth (21–30)

**21. Problem Set Collections (`/problem-sets`)**
Curated lists: "Blind 75", "FAANG Top 50", "Spring Boot Interview Problems".
- Backend: `ProblemSet { id, title, description, isPublic, createdBy }` + `ProblemSetItem { setId, problemId, displayOrder }` tables
- Frontend: `/problem-sets` listing + set detail page (problem table with progress checkmarks)
- Seed: Blind 75, Amazon Top 30, DSA Essentials, Spring Boot Coding, SQL 20

**22. Skill Assessment Quiz on Onboarding**
10-question MCQ diagnostic after signup. Score sets starting gate stage + pre-fills SRS queue.
- Backend: endpoint accepts diagnostic answers → writes initial `UserTopicPerformance` records
- Frontend: step 2 of onboarding replaces blank form with diagnostic quiz

**23. Problem Discussion Thread**
Per-problem comment section. Visible after at least one submission (prevents spoilers).
- Backend: `Discussion { id, problemId, userId, parentId, content, upvotes, createdAt }` + CRUD
- Frontend: "Discussion" tab alongside Hints / Editorial

**24. Code Diff Viewer (Your Solution vs Editorial)**
Side-by-side diff after acceptance. JS diff library, green/red highlights.
- Frontend only: `diff` npm package; "Compare with editorial" button on submission history tab

**25. Notification Centre (In-App)**
Bell icon — streak warnings, SRS due, daily challenge live, group invites.
- Backend: `Notification { id, userId, type, message, isRead, createdAt }` + mark-read endpoint
- Frontend: bell icon with unread badge, dropdown, mark-all-read

**26. Learning Velocity Dashboard Card**
"At your current pace you'll be interview-ready in 6 weeks." Sparkline of topics mastered per week.
- Backend: derive from `UserTopicProgress.updatedAt` grouped by week — no new table
- Frontend: new dashboard card with sparkline + projected readiness date

**27. Category Completion Badge**
Award a badge when user masters ALL topics in a category. Show on profile page.
- Backend: computed field — no new table; add to profile endpoint response
- Frontend: badge row on profile with locked/unlocked state per category

**28. Topic Search (`/search`)**
Global search across topic titles, descriptions, memory anchors, and problem titles.
- Backend: `GET /api/search?q=...` — MySQL FULLTEXT search
- Frontend: search bar in sidebar header; results page grouped by Topics / Problems / Algorithms

**29. Pomodoro Study Timer**
Built-in 25/5 min timer. Floating widget (bottom-right), persisted in `localStorage`.
- Frontend only; optional: log pomodoro count to `UserActivity` for the heatmap

**30. Problem Difficulty Voting**
Post-solve: "Was this difficulty accurate? 👍 / 👎". Aggregate shown as "(73% agree: Hard)".
- Backend: `ProblemDifficultyVote { problemId, userId, agrees }` + vote endpoint
- Frontend: thumbs up/down below difficulty badge, shown post-submission

---

### Tier 4 — Power User Features (31–40)

**31. Personalised Study Plan Generator**
Input: target company, interview date, hours/week → day-by-day study calendar.
- Backend: `StudyPlan` + `StudyPlanItem` tables; planning algorithm uses analytics weak areas
- Frontend: `/plan` page with calendar view + "Generate Plan" setup modal

**32. Interview Question Tagger ("I was asked this")**
Button on problem and Q&A items → log with company + date. Aggregate shown anonymously.
- Backend: `RealInterviewTag { problemId, userId, company, date }` + aggregate endpoint
- Frontend: "Mark as asked in interview" button on problem cards and Q&A items

**33. Concept Dependency Map (`/map`)**
Force-directed graph of all topics with arrows showing dependencies. Nodes coloured by gate stage.
- Backend: `relatedTopicIds` on `Topic` (shared with Feature 9)
- Frontend: D3.js force-directed graph; click node → navigate to topic

**34. Streak Recovery Challenge**
When streak breaks, offer: "Solve 2 Medium in 24h to restore it." One rescue per 30 days.
- Backend: `StreakRecovery { userId, expiresAt, required, completed }` table; trigger on break
- Frontend: dashboard banner with countdown + progress (0/2)

**35. Code Template Library (`/templates`)**
Preloaded templates: BFS, DFS, Binary Search, Sliding Window, Union-Find, etc.
- Backend: `CodeTemplate { id, name, pattern, code, isPublic, userId }` + 15 seed templates
- Frontend: `/templates` page + "Insert template" dropdown in Monaco toolbar

**36. Problem Tag Filtering (Multiple Tags)**
Extend `/problems` filters: pattern, company, difficulty, solved/unsolved, bookmarked. Multi-select.
- Backend: extend `GET /api/problems` to accept `?pattern=HashMap&company=Google&solved=false`
- Frontend: filter panel with multi-select chips + count badges

**37. Hint Usage Tracking + Analytics**
Track hint level used per problem (0–3). Surface: "You use Hint 3 on 60% of Hard problems."
- Backend: add `hintLevel` INT (0–3) to `Submission`
- Frontend: hint usage breakdown on `/analytics` — bar chart per difficulty

**38. Weekly Leaderboard**
Top 10 users by XP earned this week. Resets every Monday. Anonymous option.
- Backend: `UserActivity` aggregated by week; `GET /api/leaderboard/weekly`
- Frontend: leaderboard card on dashboard (collapsed by default)

**39. Spaced Repetition for Problems**
SRS queue currently only queues topics. Extend to queue unsolved/weak problems.
- Backend: `SpacedRepetitionEntry` already supports `itemType = PROBLEM`; add scheduling in `SpacedRepetitionService`
- Frontend: `ReviewPage` already renders problem cards — ensure they navigate to the problem editor

**40. Mobile PWA**
`manifest.json` + service worker. Offline theory reading. Push notifications for streaks.
- Frontend: `manifest.json`, `service-worker.js` (Workbox), iOS `<meta>` tags
- Cache: cache-first for theory JSON, network-first for submissions
- Backend: Web Push API (`webpush` Java library)

---

## Data Changes Required (Schema + Seed)

All additive — no breaking changes to existing tables.

### New Columns on Existing Tables

| Table | Column | Type | Purpose | Feature |
|-------|--------|------|---------|---------|
| `problems` | `companies` | TEXT (JSON array) | Company tags | 3, 36 |
| `problems` | `hint_level_required` | INT default 0 | Min hint level unlocked | 37 |
| `topics` | `related_topic_ids` | TEXT (JSON array) | Linked topic IDs | 9, 33 |
| `topics` | `estimated_hours` | DECIMAL(3,1) | Study time for path planner | 31 |
| `quiz_questions` | `topic_tag` | VARCHAR(50) | Maps question to a topic | 8 |
| `submissions` | `hint_level` | INT (0–3) | Which hint level was used | 37 |
| `submissions` | `first_opened_at` | DATETIME | When Practice tab opened | 2 |
| `algorithms` | `related_algorithm_ids` | TEXT (JSON array) | Links between algorithms | 33 |

### New Tables

| Table | Key Columns | Purpose | Feature |
|-------|-------------|---------|---------|
| `daily_challenges` | `id, date, problem_id` | One row per day | 1 |
| `daily_challenge_entries` | `id, challenge_id, user_id, solve_time_secs` | Leaderboard | 1 |
| `problem_sets` | `id, title, description, is_public, created_by` | Curated lists | 21 |
| `problem_set_items` | `id, set_id, problem_id, display_order` | Items in a set | 21 |
| `discussions` | `id, problem_id, user_id, parent_id, content, upvotes` | Problem threads | 23 |
| `notifications` | `id, user_id, type, message, is_read` | In-app bell | 25 |
| `problem_difficulty_votes` | `id, problem_id, user_id, agrees` | Difficulty feedback | 30 |
| `study_plans` | `id, user_id, target_date, hours_per_week` | Plan header | 31 |
| `study_plan_items` | `id, plan_id, scheduled_date, topic_id, problem_ids, task_type` | Day-by-day tasks | 31 |
| `real_interview_tags` | `id, problem_id, user_id, company, interview_date` | "I was asked this" | 32 |
| `code_templates` | `id, name, pattern, code, is_public, user_id` | Template library | 35 |
| `streak_recoveries` | `id, user_id, expires_at, required, completed` | Rescue challenge | 34 |
| `weekly_activity` | `id, user_id, week_start, xp_earned, problems_solved` | Leaderboard source | 38 |
| `interview_logs` | `id, user_id, company, interview_date, round_type, notes, outcome` | Interview tracker | 10 |

---

## New Seed Files Required

### Topic Seeds (B33–B36, S07–S09, SD05–SD06, T02–T04, M07–M08)

| File | Category | Topic | Priority |
|------|----------|-------|----------|
| B33 | JAVA | Virtual Threads (Project Loom) | High |
| B34 | JAVA | Records, Sealed Classes, Pattern Matching (Java 17+) | High |
| B35 | ADVANCED_JAVA | Reactive Programming (Project Reactor, WebFlux basics) | Medium |
| B36 | ADVANCED_JAVA | Java Memory Model — happens-before, volatile, atomic | High |
| S07 | SPRING_BOOT | Spring Boot Testing — @SpringBootTest, @DataJpaTest, @WebMvcTest, TestContainers | High |
| S08 | SPRING_BOOT | Spring Batch — jobs, steps, chunk processing | Medium |
| S09 | SPRING_BOOT | Spring WebFlux — reactive endpoints, backpressure | Medium |
| SD05 | SYSTEM_DESIGN | Real System Design Cases — Twitter feed, WhatsApp, Uber surge | High |
| SD06 | SYSTEM_DESIGN | Database Design Patterns — CQRS, Event Sourcing, Outbox Pattern | High |
| T02 | TESTING | Integration Testing with TestContainers | High |
| T03 | TESTING | Spring Boot Test Slices — @DataJpaTest, @WebMvcTest, @JsonTest | High |
| T04 | TESTING | Contract Testing — Pact, Spring Cloud Contract | Medium |
| M07 | MYSQL | Transactions & Locking — ACID, isolation levels, gap locks, deadlocks | High |
| M08 | MYSQL | Replication & High Availability — master-replica, GTID, failover | Medium |

### Algorithm Seeds (A19–A25)

| File | Contents | Why important |
|------|----------|---------------|
| A19 | MST — Prim's, Kruskal's, Borůvka's | Google/Amazon system design rounds |
| A20 | Advanced String — Z-algorithm, Suffix Array, Rabin-Karp | String matching in senior roles |
| A21 | Monotonic Queue — Sliding Window Maximum, Jump Game variants | Very common FAANG type |
| A22 | Number Theory — GCD/LCM, Sieve, Modular Exponentiation | Crypto roles + competitive programming |
| A23 | Interval Scheduling — Merge Intervals, Insert Interval, Meeting Rooms | Amazon SDE1/2 favourite |
| A24 | Matrix Traversal — Spiral, Rotate 90°, Diagonal, Search in 2D | Google onsite staple |
| A25 | Game Theory — Nim, Sprague-Grundy, Reservoir Sampling | Senior FAANG level |

### Interview Q&A Additions (`interviewData.js`)

| Category | Questions to add |
|----------|-----------------|
| Spring Boot | DI vs IoC, @Transactional propagation, N+1 + fix, bean scopes, auto-config, circular dependency, Security filter chain, JWT flow |
| System Design | Rate limiter, URL shortener, notification service, typeahead, distributed cache, CAP theorem examples, consistent hashing with virtual nodes, leader election |
| Advanced Java | Virtual threads vs platform threads, Java Memory Model + happens-before, CompletableFuture chaining + exceptions, ForkJoinPool, custom ClassLoader |
| Testing | Unit vs integration test, Mockito spy vs mock, TestContainers setup, @DataJpaTest isolation, test pyramid |
| Behavioural | STAR: debugging prod incident, disagreeing with tech decision, onboarding to large codebase, delivering under deadline |

### Problem Sets to Seed (Feature 21)

| Set | Count | Source |
|-----|-------|--------|
| Blind 75 | 75 | Classic FAANG DSA prep |
| Amazon Top 30 | 30 | Frequently reported |
| Spring Boot Coding | 20 | Backend-specific |
| DSA Essentials | 40 | 5 per core pattern |
| SQL 20 | 20 | Window fns, CTEs, EXPLAIN |

---

## Content Gap — Current Inventory (2026-04-12)

| Category | Topics | Problems (est.) | Examples | Status |
|----------|--------|-----------------|----------|--------|
| Java Core (B01–B32) | 32 | Sparse (2–4/topic) | Sparse | Theory good, problems weak |
| Spring Boot (S01–S06) | 6 | Very sparse | Sparse | Theory good, problems missing |
| DSA Core (D01–D09) | 9 | Moderate | Moderate | Best quality |
| DSA Patterns (D10–D14) | 5 | Sparse | Sparse | Theory decent |
| MySQL (M01–M06) | 6 | Sparse | Sparse | Theory good |
| AWS (A01–A04) | 4 | None | Sparse | Theory only |
| System Design (SD01–SD04) | 4 | None | None | Theory only |
| Testing (T01) | 1 | None | None | Skeleton |
| Algorithms (A01–A18) | 70+ | N/A | Code only | Good, no drills |

**Gap:** ~67 topics × 8 problems minimum = ~536 problems needed. Currently ~150 exist.

### Data Priority Roadmap

**Phase 1 — Fill DSA (highest interview ROI)**
- Add 3 Easy + 3 Medium + 2 Hard problems to every DSA topic D01–D14 → ~112 problems
- Add 2 working code examples to every DSA topic → ~28 examples
- Add Spring Boot + System Design to `interviewData.js`

**Phase 2 — Make Java Core practisable**
- Add problems to B11–B22 (OOP, Collections, Streams, Threads) → ~88 problems
- Focus: design-pattern problems (Strategy, Factory, Observer, Decorator)
- Threading/concurrency problems (producer-consumer, deadlock detection, thread-safe counter)

**Phase 3 — Complete remaining categories**
- Spring Boot: implement custom filter, JPA query, Spring Security config problems
- MySQL: SQL query problems (window functions, CTEs, EXPLAIN output)
- Add A19–A25 algorithm seeds
- Add T02–T04 testing seeds

**Quick wins (via Quick Import today)**
- Add `companies` tags to all existing DSA problems in seed files
- Backfill `editorial` on problems that have accepted solutions but empty editorial
- Add `relatedTopicIds` to HashMap, Trees, Heaps topics
- Promote `memoryAnchor` from 2 pills → 5 pills for every Java Core topic

---

## Topic Theory — Completeness Checklist

Every topic seed must hit all of these:

| Field | Requirement |
|-------|-------------|
| `story` | 3–4 sentences, one character, one aha moment — not a textbook definition |
| `memoryAnchor` | 4–6 `key: value` pills — the facts that must stick in memory |
| `analogy` | One sentence: real-world X = code Y (e.g. "HashMap = a library index card") |
| `firstPrinciples` | 3–5 numbered sentences explaining WHY it works from scratch |
| `examples[]` | Minimum 2, maximum 4 |
| `problems[]` | 3 Easy + 3 Medium + 2 Hard |

**Fields currently thin across most topics:**
- `story` — exists in DSA, weak in Java/Spring/MySQL; must NOT just restate the description
- `memoryAnchor` — many topics only have 1–2 pills; need 4–6 distinct facts
- `firstPrinciples` — often copied from description; must explain WHY the concept exists
- `examples` — most Java/Spring topics have 0–1 examples with no working code
- `problems` — Java Core and Spring have almost no problems with test cases

---

## Example Schema (Complete Example)

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

Rules:
- `code` = real, runnable Java — not pseudocode (pseudocode goes in `pseudocode` field)
- `realWorldUse` must name a specific production system (Redis, MySQL index, Spring bean registry, etc.)
- `explanation` must explain the non-obvious line, not restate what the code does
- One example = basic ("hello world"), one = production-grade

---

## Problem Schema (Complete Problem)

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

Rules:
- `starterCode` MUST have a `main()` reading from stdin — executor uses stdin/stdout
- `testCases` = 3–5 cases: happy path + edge (empty/single/negative) + a larger input
- Hints strictly progressive: hint1 = direction, hint2 = approach name, hint3 = near-pseudocode (not the answer)
- `editorial` must explain brute-force AND optimal, and name the key insight

---

## Deliberately NOT Doing

- **SQL Practice Engine** (H2 embedded DB + query editor) — over-engineering; topic seeds cover SQL theory adequately
- **Voice notes** — mobile-first feature, not worth building before core content is complete
- **AI-generated hints on the fly** — latency + cost; 3-tier static hints are faster and good enough

---

## Completed (2026-04-12)

- Spaced Repetition Review UI (`/review`) — full session flow with SM-2 ratings
- Interview Mode (`/interview-mode`) — timed, approach-first, auto-submit, scorecard
- Performance Analytics (`/analytics`) — confidence scores, error breakdown, mistake journal
- Admin: Example CRUD — add/edit/delete individual examples per topic
- Admin: Bulk Problems — paste JSON array to create many problems at once
- Admin: Quick Import — universal paste/upload, auto-detects topics / algorithms / quiz JSON
