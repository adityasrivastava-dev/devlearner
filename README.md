# DevLearner — Interview Preparation OS for Backend Engineers

> Not a LeetCode clone. A structured recall + pattern drilling system built for developers with production experience who want to crack MAANG interviews.

---

## What is DevLearner?

DevLearner is a full-stack interview prep platform that combines spaced repetition, AI-powered interviews, adaptive question generation, and hands-on coding — all personalised to your resume and experience level.

**Target user:** Backend engineers with 2–6 years of production experience who know the concepts but freeze in interviews due to terminology gaps or coding anxiety.

---

## Features

### Learning System
- **Learning Gate** — five-stage mastery path (Theory → Easy → Medium → Hard → Mastered) with SM-2 spaced repetition
- **Theory Tab** — Memory Anchor, Story (character-based), Analogy, and First Principles for every topic
- **Recall Drill** — pattern-name drilling to build muscle memory
- **Spaced Repetition Review** — SM-2 queue of due items surfaced daily

### AI Interview Suite
| Feature | Description |
|---------|-------------|
| **Smart AI Interviewer** | Upload resume → Alex (AI) conducts a full 20-question adaptive interview covering Theory, Coding, Projects, Behavioral, System Design. Questions get harder/easier based on your answers. Voice support (TTS + STT). |
| **Practice Set** | Upload resume → all 30 Q&As revealed at once (answers visible). Click "Load More" per topic for 10 deeper questions. Study mode, not quiz mode. |
| **Mock Interview** | Configurable category + difficulty + duration. AI scores each answer. |
| **Resume Analyzer** | Gap analysis against job requirements + AI interview prep from your PDF. |
| **Story Builder** | STAR-format behavioral answer builder with AI polish. |

### Practice Tools
- **Problems** — difficulty pills, search, bookmarks, editorial (unlocked after accepted submission)
- **Algorithms** — 70+ algorithms with visualiser, key insight, complexity, practice problems
- **Quiz** — MCQ sets by category
- **Complexity Analyzer** — static code analysis in Monaco editor
- **Playground** — free-form code editor with execution
- **Daily Challenge** — one problem per day with leaderboard

### Progress & Analytics
- **Streak** — daily streak with pause days earned from activity
- **XP & Levels** — Beginner → Architect progression
- **Performance Analytics** — confidence trends, error breakdown, mistake tracker
- **Mastery Map** — visual topic-by-topic progress
- **Heatmap** — submission activity calendar

### Content
- **Videos** — per-topic curated + personal video links
- **Roadmap** — custom learning paths
- **Timetable** — AI-generated study schedule
- **System Design Canvas** — diagram + notes per design
- **Learning Path** — recommended next topics

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | Spring Boot 3.2 (Java 17) |
| Database | MySQL 8.0 (Hibernate `ddl-auto=update`) |
| Auth | JWT + Google OAuth2 |
| AI | Groq (Llama 3.1) → Gemini (Flash 2.0) → OpenAI (gpt-4o-mini) |
| PDF parsing | Apache PDFBox |
| HTTP client | OkHttp |
| Code execution | Java Compiler API + child JVM processes |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite |
| Routing | React Router v6 |
| State / Cache | TanStack Query + Zustand |
| Code editor | Monaco Editor |
| Styling | CSS Modules + CSS custom properties |
| Charts | Recharts |
| Diagrams | Mermaid, Cytoscape |

### Infrastructure
- Docker + Nginx reverse proxy
- Deployed on Render (backend) + Render Static (frontend)
- MySQL on Railway

---

## Project Structure

```
devlearner/
├── frontend/                  # React 19 + Vite SPA
│   ├── src/
│   │   ├── api/index.js       # All HTTP calls (Axios + interceptors)
│   │   ├── components/        # Shared + feature components
│   │   ├── pages/             # Route-level pages (code-split)
│   │   ├── context/           # AuthContext (JWT + user profile)
│   │   └── utils/helpers.js   # Category metadata, formatters
│   └── public/
│       └── interview-batches/ # Bundled interview Q&A JSON files
│
└── learning-system/           # Spring Boot backend
    └── src/main/java/com/learnsystem/
        ├── controller/        # REST controllers
        ├── service/           # Business logic + AI services
        ├── model/             # JPA entities
        ├── dto/               # Request/response objects
        ├── security/          # JWT, OAuth2, SecurityConfig
        ├── config/            # Seeders, DataInitializer
        └── runner/            # Startup runners
```

---

## Running Locally

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL 8.0 running locally

### Backend

```bash
cd learning-system

# Set environment variables (or edit application.properties for local dev)
export GROQ_API_KEY=your_groq_key
export GEMINI_API_KEY=your_gemini_key
export OPENAI_API_KEY=your_openai_key   # optional fallback

mvn spring-boot:run
# Runs on http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
# Proxies /api → http://localhost:8080 automatically
```

### Docker (full stack)

```bash
cd frontend
docker-compose up
```

---

## AI Provider Chain

All AI features use a three-tier fallback — the next provider is only called if the previous one fully fails:

```
Groq (Llama 3.1-8b-instant)       ← free, 14 400 req/day
  ↓ on failure
Gemini (gemini-2.0-flash)          ← free, Google AI Studio
  ↓ on failure
OpenAI (gpt-4o-mini)               ← paid fallback, ~$0.15/1M tokens
```

Get keys:
- Groq: [console.groq.com](https://console.groq.com) — free, no card needed
- Gemini: [aistudio.google.com](https://aistudio.google.com/app/apikey) — free
- OpenAI: [platform.openai.com](https://platform.openai.com/api-keys) — paid

---

## Key API Endpoints

```
POST /api/auth/login                    JWT login
POST /api/auth/register                 Register
GET  /api/topics                        All topics (optional ?category=)
GET  /api/problems                      Paginated problems
POST /api/execute                       Run Java code
POST /api/submissions/submit            Submit solution

POST /api/smart-interview/start         Start AI interview (multipart PDF)
POST /api/smart-interview/:id/respond   Send answer, get next question
GET  /api/smart-interview/:id/summary   Full performance report

POST /api/practice-set/generate         Generate 30 Q&As from resume
POST /api/practice-set/more             10 more questions on a topic

POST /api/resume/analyze                Resume gap analysis
POST /api/mock-interview/start          Start mock interview session

GET  /api/interview-questions           Q&A bank (?category=&difficulty=)
GET  /api/algorithms                    Algorithm list
GET  /api/daily                         Today's challenge
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Production | MySQL JDBC URL |
| `DATABASE_USERNAME` | Production | MySQL username |
| `DATABASE_PASSWORD` | Production | MySQL password |
| `JWT_SECRET` | Production | HS512 secret (base64) |
| `GOOGLE_CLIENT_ID` | Production | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | Production | Google OAuth2 client secret |
| `FRONTEND_URL` | Production | Frontend origin for CORS |
| `GROQ_API_KEY` | Recommended | Groq free tier key |
| `GEMINI_API_KEY` | Recommended | Google AI Studio key |
| `OPENAI_API_KEY` | Optional | OpenAI fallback key |
| `VITE_API_URL` | Frontend prod | Backend base URL (baked at build time) |

---

## User Roles

| Role | Access |
|------|--------|
| `STUDENT` | All learning features (default) |
| `TEACHER` | — |
| `ADMIN` | `/admin` panel — topic/problem/quiz/algorithm/user management |

---

## License

MIT
