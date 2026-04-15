---
name: DevLearner Project Vision
description: Core goal — Interview Preparation OS for Backend Engineers, not a LeetCode clone. Full 15-point master plan.
type: project
originSessionId: f2fea455-68a5-408d-b680-4b462a4406db
---
## End Goal
**NOT** a LeetCode clone. Target: **Interview Preparation Operating System for Backend Engineers**

System flow: Input (Topic) → Understand (Concepts + Patterns) → Practice (Problems) → Track (Weak Areas) → Revise (Fast recall) → Simulate (Interview) → Output: **Confidence**

## Navigation Vision
`[ Problems ] [ Topics ] [ Patterns ] [ Interview ] [ Revision ]`

## User's 3 Core Problems
1. **Terminology gap** — knows the concept deeply, doesn't know the formal name interviewers use
2. **Recall speed** — forgets everything under pressure
3. **Coding confidence** — knows pseudocode mentally, hands shake writing real code in interviews

## 15 Vision Items

### Already Built
- Pattern Name Drill (`/drill`) — terminology gap
- `interviewData.js` — 50 curated Q&A (Java / Advanced Java / DSA / SQL / AWS)

### High Priority (directly fixes core problems)
1. **InterviewPrepPage + RevisionPage** — browsable Q&A study view + 30-min timed revision (data already exists, UI not built yet)
2. **Smart Approach System** — replace free-text with: pattern dropdown + complexity selector + structured text before coding
3. **Editorial unlock** — after 2 attempts OR 10+ min spent (currently only after AC) — removes frustration blocker
4. **Pattern as first-class entity** — `/patterns` page: pattern name + explanation + when to use + common mistakes + problems list
5. **Interview Mode** — timed 45 min session, no hints, approach-first flow

### Medium Priority
6. **Topic Learning Layer** — structured: Theory → Concepts → Patterns → Problems → Interview Questions (one flow per topic)
7. **30-Min Topic Revision** — per-topic: key concepts + patterns + problems + interview questions + your mistakes
8. **Progress Intelligence** — per topic: progress %, patterns covered N/M, weak areas flagged, last revised date

### Lower Priority (later)
9. Test Case Visualization (linked list / tree pointer movement step-by-step)
10. "Why This Problem?" layer per problem (companies, concept tested, frequency)
11. Curriculum Engine (full Module → Topic → Concept → Pattern → Problem hierarchy)
12. Smart SRS upgrade (mistake tracking, weak area prioritization, `/api/revision/today`)
13. Trace Engine frontend (step execution, variable changes)
14. Learning Flow Engine (guided roadmap steps per topic)
15. Pattern Abstraction Layer (backend Pattern entity with `whenToUse`, `commonMistakes`)

**How to apply:** Every feature decision should answer: "does this help Aditya name a pattern faster, recall an answer under pressure, or write code confidently in an interview?"
