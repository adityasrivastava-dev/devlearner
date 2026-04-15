# DevLearner — Feature Suggestions

A prioritized list of feature ideas to make DevLearner the most complete interview preparation OS for backend engineers.

---

## Tier 1 — High Impact / Unique to This Platform

### 1. AI Code Reviewer
**What:** Paste any Java solution and receive line-by-line AI feedback — time/space complexity analysis, edge cases you missed, naming issues, cleaner approaches with explanation.  
**Why it's fabulous:** Feels like a senior engineer doing a live PR review. No other prep platform does this inline.  
**Pages affected:** New `/code-review` page, or as a tab inside TopicView's Practice section.  
**Backend:** POST `/api/ai/review` → sends code + problem context to an LLM, returns structured JSON (issues[], suggestions[], complexity, verdict).

---

### 2. Mock Interview Simulator
**What:** A full timed interview session. The app acts as an interviewer — presents a DSA problem, listens (via text) to your approach, then you code. At the end: structured debrief with scores for correctness, communication, edge-case coverage, and code quality.  
**Why it's fabulous:** Simulates the real 45-minute pressure loop. No flashcard tool does this.  
**Pages affected:** New `/mock-interview` page.  
**Backend:** New `MockInterviewSession` entity with stage machine (INTRO → APPROACH → CODING → DEBRIEF).

---

### 3. Mistake DNA Engine
**What:** Analyses every submission in your history and surfaces your personal recurring bug patterns: "You forget null checks in tree problems (8 times)", "Off-by-one in sliding window (5 times)", "Unclosed resource in I/O problems (3 times)".  
**Why it's fabulous:** Nobody else tracks *why* you fail, only *that* you failed. This turns mistakes into a learning signal.  
**Pages affected:** New card on `/analytics`, or dedicated `/mistakes` route.  
**Backend:** `SubmissionAnalyzer` service that classifies error types from stderr/wrong-answer patterns.

---

### 4. Concept Dependency Graph
**What:** An interactive force-directed graph where each topic is a node. Edges show prerequisites. Clicking a node shows "Master these first" and "This unlocks". Color-coded by gate stage (grey = not started, yellow = in progress, green = mastered).  
**Why it's fabulous:** Gives a bird's-eye view of your entire learning journey in one visual. Uniquely motivating.  
**Pages affected:** New `/graph` route or as a view toggle on `/mastery`.  
**Stack:** Use D3.js or a lightweight force-layout library for the graph rendering.

---

### 5. Interview Story Builder (STAR Format)
**What:** Guided form to write behavioral answers in STAR format (Situation, Task, Action, Result). Stories are stored, tagged by theme (leadership, failure, conflict, ownership). Before an interview, shows "Your 5 strongest stories" for a quick review.  
**Why it's fabulous:** MAANG interviews are 50% behavioral. No DSA-focused platform touches this gap.  
**Pages affected:** New `/stories` route.  
**Backend:** `BehavioralStory` entity: userId, theme, situation, task, action, result, tags, createdAt.

---

### 6. Spaced Repetition for Code Snippets
**What:** Show a code snippet and ask: "What does this output?", "What's the bug?", or "What pattern is this?". SM-2 scheduling on code *recognition*, not just Q&A text. Separate queue from the existing Q&A review.  
**Why it's fabulous:** Code reading is a distinct skill from theory recall. Trains muscle memory for interview whiteboard reading.  
**Pages affected:** Extend `/review` with a "Code Snippets" tab, or new `/snippet-review` route.  
**Backend:** New `CodeSnippet` entity with question type enum (OUTPUT / BUG / PATTERN) and SRS fields.

---

### 7. Algorithm Race (Beat Your Best)
**What:** Solve a problem against a timer. Your personal best is stored. The next time you attempt the same problem, a ghost timer shows your previous pace. Leaderboard of fastest solves per problem.  
**Why it's fabulous:** Adds competitive self-improvement loop. Seeing "your best: 18 min" makes you want to beat it.  
**Pages affected:** Problem solve view gains a race mode toggle; new `/leaderboard` page.  
**Backend:** `PersonalBest` entity: userId, problemId, timeMs, solvedAt.

---

### 8. Live Coding Pair Mode
**What:** Two users share a real-time problem session via WebSocket. One codes, one observes and can leave inline comments (like Google Docs but for code). Optional video overlay placeholder. Great for peer mock interviews.  
**Why it's fabulous:** No other self-hosted prep tool has collaborative live coding.  
**Pages affected:** New `/pair/:sessionId` route.  
**Backend:** WebSocket session manager, `PairSession` entity, CRDT-lite for code sync (or last-write-wins for simplicity).

---

### 9. Year-View Activity Heatmap (Full GitHub Graph)
**What:** A full 52-week heatmap showing daily study activity. Hovering a cell shows exactly what you did: "Solved 2 problems, reviewed 8 Q&A, mastered HashMap topic." Exportable as an image to share on LinkedIn.  
**Why it's fabulous:** The GitHub green graph is one of the most motivating UI patterns ever created. Applied to learning it becomes addictive.  
**Pages affected:** `/profile` page (replace or expand the existing streak section).  
**Backend:** Aggregate existing events from `PageView`, `UserEvent`, submissions, and gate completions per day.

---

### 10. Code Smell Detector
**What:** Static analysis pass on submitted Java code that highlights anti-patterns beyond complexity: raw types, unnecessary boxing/unboxing, `==` on Strings, unclosed streams, inefficient string concatenation inside loops, mutable statics.  
**Why it's fabulous:** Teaches production code quality, not just algorithm correctness. Directly relevant to real interviews.  
**Pages affected:** Results panel after any code submission; badge shown on the problem card.  
**Backend:** Extend `ComplexityAnalyzer` or new `CodeSmellAnalyzer` service using regex + AST walking on the source string.

---

### 11. Personalized Daily Study Plan Generator
**What:** Based on your gate stages, SRS queue, weak topics (from analytics), and a target interview date you set, the app auto-generates a day-by-day study plan: "Day 1: Theory for Graphs + 2 Easy problems. Day 2: Review HashMap + 1 Medium."  
**Why it's fabulous:** Removes the "I don't know what to study today" paralysis. Feels like a personal tutor.  
**Pages affected:** New `/plan` route; widget on home dashboard.  
**Backend:** `StudyPlanGenerator` service reading gate stages + SRS due dates + target date to produce a schedule.

---

### 12. Topic Confidence Self-Rating + Trend
**What:** After any study session on a topic, a 1-5 star "How confident do you feel?" prompt. Ratings are stored over time and shown as a trend chart per topic. Divergence between self-rating and actual solve rate is highlighted ("You rate yourself 4/5 on Trees but solve only 40% of Hard tree problems").  
**Why it's fabulous:** Exposes the Dunning-Kruger blind spot directly. Highly actionable.  
**Pages affected:** Modal after theory/problem sessions; chart in TopicView's Stats tab.  
**Backend:** `TopicConfidenceRating` entity: userId, topicId, rating, ratedAt.

---

### 13. Resume-Ready Achievement Exporter
**What:** Scans your activity — problems solved, topics mastered, streaks, daily challenges won — and generates a formatted text block you can copy into a resume or LinkedIn: "Solved 120+ DSA problems across 8 categories. 45-day learning streak. Mastered 18/32 core Java topics."  
**Why it's fabulous:** Bridges prep and job application. Turns invisible effort into visible credentials.  
**Pages affected:** Button on `/profile` page → opens modal with formatted text + copy button.  
**Backend:** Aggregate stats endpoint `/api/user/resume-stats`.

---

### 14. Problem Hint Tree (Progressive Unlocking)
**What:** Instead of 3 flat hints, hints are structured as a decision tree. "Did you think about sorting first? → Yes → Here's the next step. → No → Start here." Each branch leads to a different revelation path.  
**Why it's fabulous:** Mirrors how a real interviewer nudges you. Teaches *thinking process*, not just the answer.  
**Pages affected:** Hint panel inside TopicView's Practice tab.  
**Backend:** `hints` JSON field becomes a tree structure: `{ text, yes: {...}, no: {...} }`.

---

### 15. Weekly Digest Email
**What:** Every Sunday, an auto-generated email/notification summarizing the week: problems solved, topics mastered, streak status, SRS accuracy, and 3 recommended focus areas for next week. Includes a motivational insight ("You're in the top 20% of active users this week").  
**Why it's fabulous:** Keeps users coming back even when they haven't opened the app. Highest-ROI retention tool.  
**Pages affected:** Email preferences in `/profile` settings.  
**Backend:** Scheduled `@Scheduled(cron = "0 8 * * SUN")` job, `DigestEmailService`, Spring Mail or SendGrid integration.

---

### 16. Syntax-Highlighted Note Editor with Code Blocks
**What:** Upgrade the plain-text notes panel to a rich editor (like Notion-lite). Supports `code blocks` with syntax highlighting, bullet lists, bold/italic, and inline LaTeX for complexity notation. Notes are searchable across all topics.  
**Why it's fabulous:** Engineers think in code. A notes tool that renders `O(n log n)` and highlights Java snippets is infinitely more useful.  
**Pages affected:** Notes tab in TopicView; new `/notes` search page.  
**Stack:** Tiptap or CodeMirror 6 as the editor; `notes` field stays as Markdown/JSON in DB.

---

### 17. Peer Question Upvote + Discussion Threads
**What:** Under each interview Q&A, users can post clarifying comments, alternative answers, or company-specific notes ("Asked at Google 2024, they wanted O(1) space"). Other users upvote helpful threads.  
**Why it's fabulous:** Turns a static Q&A bank into a living knowledge base. Network effect grows content quality automatically.  
**Pages affected:** `/interview-prep` question cards expand to show thread.  
**Backend:** `QuestionComment` entity: userId, questionId, body, upvotes, createdAt.

---

## Summary Table

| # | Feature | Effort | Wow Factor | Unique? |
|---|---------|--------|-----------|---------|
| 1 | AI Code Reviewer | High | ★★★★★ | Yes |
| 2 | Mock Interview Simulator | High | ★★★★★ | Yes |
| 3 | Mistake DNA Engine | Medium | ★★★★★ | Yes |
| 4 | Concept Dependency Graph | Medium | ★★★★☆ | Yes |
| 5 | Interview Story Builder | Low | ★★★★☆ | Yes |
| 6 | Code Snippet SRS | Medium | ★★★★☆ | Partial |
| 7 | Algorithm Race | Medium | ★★★★☆ | Partial |
| 8 | Live Coding Pair Mode | High | ★★★★★ | Yes |
| 9 | Year-View Activity Heatmap | Low | ★★★★☆ | No |
| 10 | Code Smell Detector | Medium | ★★★★☆ | Yes |
| 11 | Personalized Study Plan | Medium | ★★★★★ | Partial |
| 12 | Confidence Self-Rating | Low | ★★★★☆ | Yes |
| 13 | Resume Exporter | Low | ★★★★☆ | Yes |
| 14 | Hint Decision Tree | Low | ★★★★☆ | Yes |
| 15 | Weekly Digest Email | Low | ★★★★☆ | No |
| 16 | Rich Note Editor | Medium | ★★★☆☆ | No |
| 17 | Peer Discussion Threads | Medium | ★★★★☆ | No |

---

*Suggested starting points (original 17): Features 3, 5, 9, 12, 13, 14 are low-to-medium effort with high uniqueness — fast wins that add visible value immediately.*

---

## Batch 2 — 30 More Features

### 18. Company-Specific Problem Packs
**What:** Filter the entire problem set by target company — Amazon, Google, Microsoft, Meta. Each pack shows: how frequently that company asks this topic, recent question themes reported by community, and a "Company Readiness Score" based on your solve rate within that pack.  
**Why it's fabulous:** Every candidate has a target company. This makes prep feel razor-focused instead of generic.  
**Pages affected:** `/problems` gets a company filter bar; new `/company/:name` route for the full pack view.  
**Backend:** `companyTags` field already exists on problems — add a `/api/problems/company/:name` aggregate endpoint with readiness score calculation.

---

### 19. Voice-Driven Revision Mode
**What:** Text-to-speech reads interview questions aloud, you think and respond verbally (or mentally), then reveal the answer. Mimics the real interview where questions are spoken, not typed. Adjustable reading speed. Works during a walk or commute.  
**Why it's fabulous:** Solves the "I can only study at my desk" problem. Turns dead time into prep time.  
**Pages affected:** New "Audio Mode" toggle in `/revision`.  
**Stack:** Web Speech API (`speechSynthesis`) — no backend needed, pure browser.

---

### 20. Problem Difficulty Predictor
**What:** User pastes a LeetCode-style problem statement. The app predicts: likely difficulty (Easy/Medium/Hard), likely patterns (DP + Binary Search), estimated interview frequency, and which companies typically ask this type. Confidence score shown.  
**Why it's fabulous:** Helps candidates calibrate new problems they encounter in mock interviews or OA rounds.  
**Pages affected:** New tool on `/playground` or standalone `/predict` route.  
**Backend:** POST `/api/ai/predict-difficulty` — LLM classification with structured output.

---

### 21. Code Execution Timeline Visualizer
**What:** After running code, show a step-by-step execution trace: variable states at each line, call stack depth, heap allocations (conceptual). Like a debugger but visual and interview-friendly.  
**Why it's fabulous:** The #1 reason candidates fail is they can't trace their own code mentally. This trains that skill directly.  
**Pages affected:** New "Trace" tab in the code editor results panel.  
**Backend:** Extend `ExecutionService` to return structured trace output; instrument code with logging injection before execution.

---

### 22. "Explain Like I'm Five" Mode for Any Topic
**What:** One-click button on any topic that generates a hyper-simplified explanation using analogies a child would understand — no jargon. Then a "Explain to a developer" view for the technical version. Toggle between the two.  
**Why it's fabulous:** Forces deep understanding. If you can explain it simply, you truly know it. Great for Feynman-technique self-testing.  
**Pages affected:** Button in TopicView's Theory tab.  
**Backend:** POST `/api/ai/eli5` with `{ topicId }` — returns simplified explanation, cached in DB after first generation.

---

### 23. Flashcard Battle Mode (Two-Player)
**What:** Two users join a room and are shown the same question simultaneously. First to submit a correct answer wins the round. Best of 10 rounds. Elo-style rating after each match. Invite-by-link or matchmaking queue.  
**Why it's fabulous:** Turns solo grinding into a social competitive game. Highly shareable ("battle me on DSA").  
**Pages affected:** New `/battle` route.  
**Backend:** WebSocket room management, `BattleSession` entity, Elo rating update after each match result.

---

### 24. Smart Problem Recommender
**What:** After each solved problem, the system recommends the next 3 problems to solve based on: your current weak patterns (from mistake DNA), SRS due topics, and an adaptive difficulty curve (don't jump from Easy to Hard). Shows *why* each is recommended.  
**Why it's fabulous:** Eliminates the "what do I do next?" decision fatigue. Feels like a coach, not a library.  
**Pages affected:** Widget at the bottom of the problem result screen; also on the home dashboard.  
**Backend:** `RecommendationService` scoring problems by (SRS weight × pattern weakness × difficulty delta).

---

### 25. Interview Calendar & Countdown
**What:** User sets their interview date(s) with company names. A persistent countdown banner appears on the dashboard: "37 days to Google SWE Interview". Calendar view shows booked prep sessions. Days with 0 activity are flagged red.  
**Why it's fabulous:** Anchors all prep to a real deadline. Creates urgency without overwhelming.  
**Pages affected:** Home dashboard widget; new `/calendar` route for full view.  
**Backend:** `InterviewSchedule` entity: userId, company, interviewDate, round (PHONE/ONSITE/FINAL), notes.

---

### 26. Annotated Editorial with Complexity Walkthrough
**What:** Every editorial gets an embedded step-by-step walkthrough: each code block is annotated with the loop iteration count, data structure state, and running time contribution. A "Why not X approach?" section explains rejected alternatives.  
**Why it's fabulous:** Most editorials just give the answer. This teaches the *reasoning process* behind it — exactly what interviewers evaluate.  
**Pages affected:** `/problems` editorial view, accessed after an ACCEPTED submission.  
**Backend:** `editorial` field extended to support a JSON annotation structure alongside the markdown content.

---

### 27. Topic "Boss Fight" Challenge
**What:** After mastering a topic (reaching MASTERED gate stage), unlock a timed "Boss Fight" — a hard multi-part problem that combines this topic with one other random topic (e.g., Trees + DP). Solving it awards a special badge shown on your profile.  
**Why it's fabulous:** Makes mastery feel earned, not just checked off. The badge is visible to others — social proof.  
**Pages affected:** Unlock prompt after gate reaches MASTERED; badge shown on `/profile`.  
**Backend:** `BossChallenge` entity linking two topics; `UserBadge` entity for earned rewards.

---

### 28. Interview Performance Journal
**What:** After each real or mock interview, log structured notes: what was asked, how you performed, what you forgot, emotional state (nervous/confident), interviewer reaction. Over time, shows performance trends and the most common "I forgot" patterns.  
**Why it's fabulous:** Self-reflection after real interviews is how top candidates accelerate. Nobody else builds a structured reflection loop.  
**Pages affected:** New `/journal` route with a chronological log and monthly trend chart.  
**Backend:** `InterviewJournal` entity: userId, date, company, round, questionTopics, selfScore, notes, forgottenTopics.

---

### 29. Side-by-Side Solution Comparator
**What:** Select any two of your past submissions for the same problem. The app diffs them side-by-side: highlights what changed, shows complexity delta, and adds a verdict — "Version 2 is 40% faster and uses less memory."  
**Why it's fabulous:** Learning from your own improvement is more motivating than seeing someone else's solution. Shows growth directly.  
**Pages affected:** Submission history view per problem gets a "Compare" checkbox + diff view.  
**Backend:** Store all submissions (already done). Add `/api/submissions/compare?id1=&id2=` endpoint returning diff + complexity deltas.

---

### 30. Pattern Recognition Quiz (Pattern-First Drill)
**What:** Given only the problem *description* (no hints, no code), identify the correct algorithmic pattern in 30 seconds. No coding required. Pure pattern-matching training. Scores tracked separately from coding performance.  
**Why it's fabulous:** The first thing every interviewer looks for is "can you identify the right approach fast?" This trains exactly that — in isolation.  
**Pages affected:** New `/pattern-quiz` route, or a mode inside `/drill`.  
**Backend:** Existing problems already have `patterns` tags — shuffle and serve as multiple-choice or free-text pattern identification.

---

### 31. Live Code Linter with Interview Rules
**What:** As you type in the Monaco editor, real-time lint feedback specific to interview context: "Avoid Scanner for competitive coding — use BufferedReader", "This HashMap can be replaced with a primitive int array for O(1) space savings", "Integer overflow risk on line 12."  
**Why it's fabulous:** Catches interview-specific mistakes in real time, not after submission. Like having a coach watching your screen.  
**Pages affected:** All code editor instances (TopicView, Playground, Complexity, Problem solve).  
**Stack:** Monaco editor built-in `IMarkerData` API + custom rule engine in a Web Worker.

---

### 32. Curated "30 Days to Interview" Sprint Program
**What:** A fixed 30-day structured program: each day has a locked set of tasks — 1 theory topic, 2 problems, 5 Q&A cards. Progress is locked-in (can't skip ahead). Completing all 30 days awards a certificate. Users can share their completion streak on LinkedIn.  
**Why it's fabulous:** Removes all decision-making. "Just do today's tasks." The locked-in structure is the entire value proposition.  
**Pages affected:** New `/sprint` route with a day-by-day progress tracker.  
**Backend:** Pre-authored `SprintDay` seed data (30 records); `UserSprintProgress` entity tracking day completions.

---

### 33. Blind Mode (No Examples, No Hints)
**What:** A toggle on any problem that hides the examples, input/output format, and all hints. Forces you to ask clarifying questions (in a notes box) before coding — exactly what happens in a real interview. Timer starts on open, not on first keystroke.  
**Why it's fabulous:** Recreates the most anxiety-inducing part of real interviews: the blank problem with zero scaffolding.  
**Pages affected:** Problem view toggle in TopicView's Practice tab.  
**Backend:** No backend change needed — pure frontend UI toggle hiding DOM sections.

---

### 34. Contribution Score & Public Profile
**What:** Every user gets a public profile URL (`/u/username`) showing: topics mastered, problems solved, streak history, badges earned, and contribution score (based on upvotes received on discussion threads and editorial annotations). Shareable as a portfolio.  
**Why it's fabulous:** Turns learning effort into social proof. Users can link their DevLearner profile in resumes and LinkedIn.  
**Pages affected:** New `/u/:username` public route; privacy toggle in `/profile` settings.  
**Backend:** `publicProfile` flag on User entity; `/api/users/:username/public` endpoint.

---

### 35. Codebase Reading Challenges
**What:** Show a real-world open-source Java snippet (Spring Boot controller, a LinkedHashMap implementation, a custom ThreadPool) and ask: "What does this do?", "Find the bug", "What's the time complexity of this method?". Different from algorithm problems — trains production code reading.  
**Why it's fabulous:** Senior backend interviews are increasingly asking "read this code and explain it." No prep platform trains this.  
**Pages affected:** New `/code-reading` route.  
**Backend:** `CodeReadingChallenge` entity: snippet (TEXT), questionType (EXPLAIN/BUG/COMPLEXITY), answer, difficulty, source.

---

### 36. Spaced Repetition Streaks Per Topic
**What:** Each topic has its own mini-streak: consecutive days you've either reviewed, solved a problem in, or completed an SRS card for it. Topics with broken streaks are surfaced as "at risk of forgetting." Forgetting curve shown per topic.  
**Why it's fabulous:** The overall streak is motivating but doesn't tell you *which* topics you're drifting from. This adds topic-level retention awareness.  
**Pages affected:** Topic list sidebar dot indicator upgraded to show streak; new section in `/mastery`.  
**Backend:** Aggregate existing activity events per topic per day; `TopicStreak` computed view or cached entity.

---

### 37. "What Would You Google?" Simulation
**What:** During problem solving, you have one "Google Lifeline" — a free-text search box that searches only the curated DevLearner knowledge base (topics, editorials, algorithm docs). No Stack Overflow, no LeetCode solutions. Forces learning from first principles, logs what you searched.  
**Why it's fabulous:** Real interviewers sometimes allow docs. This trains *efficient resource usage*, not just memorization.  
**Pages affected:** Floating search icon in the problem solve view.  
**Backend:** Full-text search across `Topic`, `Algorithm`, `Example` entities using MySQL FULLTEXT or a simple `/api/search?q=` endpoint.

---

### 38. Multi-Language Code Runner (Python, C++, JS)
**What:** The code editor currently runs Java only. Add Python 3, C++17, and JavaScript as supported languages with per-language starter templates and test case execution. Users can compare their Java solution to a Python equivalent to understand syntax differences.  
**Why it's fabulous:** Many backend candidates are transitioning from Python to Java. Supporting both removes the language barrier to entry.  
**Pages affected:** Language dropdown in all code editor instances.  
**Backend:** Extend `ExecutionService` to call a language-specific Docker container or a sandboxed subprocess per language.

---

### 39. Interview Feedback Tracker (Post Real-Interview)
**What:** After a real interview, log: the exact questions asked (from a predefined list or free text), how you responded, whether you got the offer, and the feedback you received. Over multiple interviews, surfaces: "You always get asked DP + system design but score low on system design follow-ups."  
**Why it's fabulous:** Closes the loop between prep and real outcome. Most people never analyze *why* they failed an interview.  
**Pages affected:** New section in `/journal` or standalone `/feedback` route.  
**Backend:** `RealInterviewFeedback` entity: userId, company, date, questionsAsked[], selfScore, offerReceived, feedbackNotes.

---

### 40. Dark Pomodoro Mode with Study Sessions
**What:** A built-in Pomodoro timer (25 min work / 5 min break) integrated into the study flow. When a session starts, the app enters full-focus mode: hides the sidebar, mutes notifications, and auto-queues the next task. Session logs shown on the analytics page.  
**Why it's fabulous:** Deep work requires structure. Embedding the timer inside the app (not a separate tool) means zero context switching.  
**Pages affected:** Persistent timer widget in the header; session logs on `/analytics`.  
**Backend:** `StudySession` entity: userId, startedAt, endedAt, tasksCompleted[], sessionType (POMODORO/FREE).

---

### 41. Micro-Lesson Cards ("Today I Learned")
**What:** Every day, a small "TIL" card appears on the dashboard — one counterintuitive Java fact, one complexity gotcha, one subtle bug pattern. Takes 30 seconds to read. Users can save or dismiss. Reviewed later in `/review` like any other SRS card.  
**Why it's fabulous:** "One small thing per day" compounds enormously. Requires zero commitment, builds over a year into 365 insights.  
**Pages affected:** Dashboard widget; `/review` queue extension.  
**Backend:** `MicroLesson` entity seeded with 365 entries; `UserMicroLessonLog` to track seen/saved/dismissed.

---

### 42. Competitive Streak Leaderboard
**What:** A weekly opt-in leaderboard ranking users by: active streak, problems solved this week, and gate progressions this week. Shows rank delta from last week ("↑ 12 places"). Users can challenge each other with "@username I'll beat your streak."  
**Why it's fabulous:** Social accountability is the strongest motivation driver. Even seeing a stranger's streak makes you want to protect yours.  
**Pages affected:** New sidebar widget + full view at `/leaderboard`.  
**Backend:** Weekly aggregate job; opt-in `showOnLeaderboard` flag on User; `LeaderboardEntry` view.

---

### 43. Problem "War Stories" Community Section
**What:** Under each problem, a "War Stories" tab where users share real interview experiences: "Asked at Amazon London, 2024 SDE-2 loop. Interviewer wanted O(1) space strictly. Got rejected for using a HashSet." Anonymous by default, opt-in to show username.  
**Why it's fabulous:** Interview intelligence is the most valuable thing candidates share. Centralizing it in the problem view makes it actionable and contextual.  
**Pages affected:** New tab in the problem view sidebar.  
**Backend:** `WarStory` entity: userId (optional), problemId, company, role, year, story, upvotes.

---

### 44. Adaptive Difficulty Engine
**What:** The system tracks your solve time and attempts per difficulty tier. If you consistently solve Easy problems in under 5 minutes with one attempt, it stops recommending Easy for that topic and auto-escalates to Medium. If you struggle on Medium (3+ attempts), it flags the topic for more theory review before more practice.  
**Why it's fabulous:** Static difficulty labels are meaningless after a while. Dynamic calibration keeps the challenge in the "flow zone" — not too easy, not too hard.  
**Pages affected:** Problem recommendation widget; difficulty badge on topic cards updated dynamically.  
**Backend:** `UserDifficultyProfile` entity per topic: avgSolveTimeEasy, avgAttemptsEasy, recommendedNextDifficulty.

---

### 45. System Design Flashcard Deck
**What:** A dedicated flashcard deck for system design concepts: "What is consistent hashing and when do you use it?", "Explain the CAP theorem with a real-world example", "Design a rate limiter — what are the tradeoffs between token bucket and leaky bucket?". SRS-scheduled separately from algorithm cards.  
**Why it's fabulous:** System design is the biggest gap for mid-level engineers. No SRS tool covers it properly. Combined with the existing System Design Canvas, it's a complete system design module.  
**Pages affected:** New "System Design" deck in `/review`; cards accessible from `/system-design`.  
**Backend:** `SystemDesignCard` entity seeded with 100+ cards; separate SRS queue from algorithm Q&A.

---

### 46. Progress Export & Import (Backup)
**What:** Export your entire progress — solved problems, gate stages, SRS scores, notes, bookmarks, journal entries — as a single JSON file. Import it back on a different account or after account deletion. Full data portability.  
**Why it's fabulous:** Users trust platforms that respect their data. "Own your progress" is a powerful differentiator vs. LeetCode/Neetcode.  
**Pages affected:** "Export Data" and "Import Data" buttons in `/profile` settings.  
**Backend:** `/api/user/export` generates a signed JSON dump of all user-scoped tables; `/api/user/import` validates and restores with conflict resolution.

---

### 47. "Teach It Back" Mode
**What:** After reading a topic's theory, the app hides all content and gives you a blank text area: "Now explain this topic in your own words in 3 minutes." It then compares your explanation to the official theory using keyword matching and shows a coverage score: "You covered 7/10 key concepts. You missed: space complexity of HashMap.put() and amortized resizing."  
**Why it's fabulous:** The Feynman Technique is the most powerful learning method known. This automates it. No other interview prep tool does active recall this way.  
**Pages affected:** Button in TopicView's Theory tab after scrolling to the bottom.  
**Backend:** POST `/api/topics/:id/teach-back` — keyword extraction from theory content, comparison against user input, returns coverage report.

---

## Updated Summary Table (Features 18–47)

| # | Feature | Effort | Wow Factor | Unique? |
|---|---------|--------|-----------|---------|
| 18 | Company-Specific Problem Packs | Low | ★★★★☆ | No |
| 19 | Voice-Driven Revision Mode | Low | ★★★★☆ | Yes |
| 20 | Problem Difficulty Predictor | Medium | ★★★★☆ | Yes |
| 21 | Code Execution Timeline Visualizer | High | ★★★★★ | Yes |
| 22 | ELI5 Mode for Any Topic | Medium | ★★★★☆ | Yes |
| 23 | Flashcard Battle Mode | High | ★★★★★ | Yes |
| 24 | Smart Problem Recommender | Medium | ★★★★★ | Partial |
| 25 | Interview Calendar & Countdown | Low | ★★★★☆ | No |
| 26 | Annotated Editorial Walkthrough | Medium | ★★★★☆ | Yes |
| 27 | Topic Boss Fight Challenge | Medium | ★★★★★ | Yes |
| 28 | Interview Performance Journal | Low | ★★★★☆ | Yes |
| 29 | Side-by-Side Solution Comparator | Low | ★★★★☆ | Partial |
| 30 | Pattern Recognition Quiz | Low | ★★★★☆ | Partial |
| 31 | Live Code Linter (Interview Rules) | Medium | ★★★★★ | Yes |
| 32 | 30-Day Sprint Program | Medium | ★★★★★ | Partial |
| 33 | Blind Mode (No Examples/Hints) | Low | ★★★★☆ | Yes |
| 34 | Contribution Score & Public Profile | Medium | ★★★☆☆ | No |
| 35 | Codebase Reading Challenges | Medium | ★★★★★ | Yes |
| 36 | Spaced Repetition Streaks Per Topic | Medium | ★★★★☆ | Yes |
| 37 | "What Would You Google?" Simulation | Medium | ★★★★☆ | Yes |
| 38 | Multi-Language Code Runner | High | ★★★★☆ | No |
| 39 | Interview Feedback Tracker | Low | ★★★★☆ | Yes |
| 40 | Pomodoro Focus Mode | Low | ★★★☆☆ | No |
| 41 | Micro-Lesson TIL Cards | Low | ★★★★☆ | Partial |
| 42 | Competitive Streak Leaderboard | Medium | ★★★★☆ | No |
| 43 | Problem War Stories Community | Medium | ★★★★☆ | Partial |
| 44 | Adaptive Difficulty Engine | Medium | ★★★★★ | Yes |
| 45 | System Design Flashcard Deck | Low | ★★★★☆ | Partial |
| 46 | Progress Export & Import | Low | ★★★☆☆ | Yes |
| 47 | "Teach It Back" Mode | Medium | ★★★★★ | Yes |

---

*Top picks from Batch 2 by uniqueness + feasibility: #19 (Voice Revision), #27 (Boss Fight), #33 (Blind Mode), #35 (Codebase Reading), #41 (TIL Cards), #44 (Adaptive Difficulty), #47 (Teach It Back).*
