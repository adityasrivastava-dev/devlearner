# DevLearner — Interview Preparation OS for Backend Engineers

> Not a LeetCode clone. A structured recall + pattern drilling system built for developers with production experience who want to crack MAANG interviews.

---

## What is DevLearner?

DevLearner is a full-stack interview prep platform combining spaced repetition, AI-powered interviews, adaptive question generation, and hands-on coding — all personalised to your resume and experience level.

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
| **Smart AI Interviewer** | Upload resume → Alex (AI) conducts a full 20-question adaptive interview. Voice support (TTS + STT). |
| **Practice Set** | Upload resume → 30 Q&As revealed at once. Study mode, not quiz mode. |
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
- Streak + pause days · XP & Levels (Beginner → Architect)
- Performance Analytics · Mastery Map · Submission Heatmap

### Content
- Videos, Roadmap, Timetable, System Design Canvas, Learning Path

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | Spring Boot 3.2 (Java 17) |
| Database | MySQL 8.0 (Hibernate `ddl-auto=update`) |
| Auth | JWT + Google OAuth2 |
| AI | Groq (Llama 3.1) → Gemini (Flash 2.0) → OpenAI (gpt-4o-mini) |
| Code execution | Java Compiler API + Docker containers (or child JVM processes) |
| Async queue | MySQL job queue (`execution_jobs` table), 400ms poll |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite |
| Routing | React Router v6 |
| State / Cache | TanStack Query + Zustand |
| Code editor | Monaco Editor |
| Styling | CSS Modules + CSS custom properties |

### Infrastructure
| Component | Default |
|-----------|---------|
| Main API | Render web service (port 8080) |
| Frontend | Render static site |
| Database | Railway MySQL 8.0 |
| Execution service (optional) | Home server / VPS with Docker |

---

## Project Structure

```
devlearner/
├── frontend/                  # React 19 + Vite SPA
│   ├── src/
│   │   ├── api/index.js       # All HTTP calls (Axios + interceptors)
│   │   ├── components/        # Shared + feature components
│   │   ├── pages/             # Route-level pages
│   │   ├── context/           # AuthContext (JWT + user profile)
│   │   └── utils/helpers.js   # Category metadata, formatters
│   └── public/
│       └── interview-batches/ # Bundled interview Q&A JSON files
│
├── learning-system/           # Spring Boot main API (port 8080)
│   └── src/main/java/com/learnsystem/
│       ├── controller/        # REST controllers
│       ├── service/           # Business logic, AI, async worker
│       ├── model/             # JPA entities (incl. ExecutionJob)
│       ├── dto/               # Request/response objects
│       ├── security/          # JWT, OAuth2, SecurityConfig
│       ├── config/            # Seeders, DataInitializer
│       └── runner/            # Startup runners
│
└── execution-service/         # Standalone code execution microservice (port 8081)
    └── src/main/java/com/execservice/
        ├── controller/        # POST /internal/execute|submit|syntax-check
        ├── service/           # ExecutionService (Docker), EvaluationService
        └── dto/               # Internal request/response objects
```

---

## Running Locally

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Java JDK | 17+ | Backend compilation + code runner (JDK required, not JRE) |
| Maven | 3.8+ | Backend build |
| Node.js | 18+ | Frontend |
| MySQL | 8.0 | Database (must be running before you start) |
| Docker Desktop | any | Optional — for Docker execution mode |

---

### One-command start (recommended)

**Step 1 — Create your database** (first time only):

```sql
-- In MySQL Workbench or any MySQL client
CREATE DATABASE devlearn;
```

**Step 2 — Set up your environment file** (first time only):

```powershell
# In the repo root
Copy-Item .env.local.example .env.local
# Open .env.local and fill in at minimum:
#   - spring.datasource.password  (your local MySQL root password)
#   - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET  (for Google login)
#   - GROQ_API_KEY / GEMINI_API_KEY  (for AI features — free keys)
```

**Step 3 — Run:**

```powershell
# Backend + frontend only (code runs in child JVM — no Docker needed)
.\dev.ps1

# Backend + frontend + execution service (code runs in Docker containers)
.\dev.ps1 -Execution
```

That's it. The script:
- Checks Java, Maven, Node.js are installed (and Docker if `-Execution`)
- Loads your `.env.local` automatically
- Pulls the Docker image if missing (first `-Execution` run only, ~150 MB)
- Runs `npm install` if `node_modules` is missing (first run only)
- Opens **Windows Terminal** with a tab for each service

**Without `-Execution`** (default):

| Tab | Service | URL |
|-----|---------|-----|
| 1 | Backend | http://localhost:8080 |
| 2 | Frontend | http://localhost:3000 |

Code runs in **child JVM processes** — safe for local dev, no Docker needed.

**With `-Execution`** (Docker isolation):

| Tab | Service | URL |
|-----|---------|-----|
| 1 | Backend | http://localhost:8080 |
| 2 | Frontend | http://localhost:3000 |
| 3 | Execution service | http://localhost:8081 |

Code runs in **isolated Docker containers** — matches production behaviour. `System.exit()` is safe, memory is cgroup-limited, network is disabled inside the container.

To stop: close the terminal tabs (or press `Ctrl+C` inside each tab).

> **Note:** If Windows Terminal is not installed, the script opens separate PowerShell windows instead.

---

### What goes in `.env.local`

Copy `.env.local.example` to `.env.local` and fill in:

```env
# Your local MySQL password (if it isn't "password")
DATABASE_PASSWORD=your_mysql_password

# Google OAuth — from Google Cloud Console
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx

# AI hints — free keys, app works without them (hints just won't work)
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIzaSy...

# JWT secret — any long string is fine for local dev
JWT_SECRET=any-long-random-string-for-local-dev
```

The `.env.local` file is git-ignored — your keys are never committed.

---

### Manual start (alternative)

If you prefer running each service yourself:

**Database** (first time only):
```sql
CREATE DATABASE devlearn;
```

**Backend:**
```bash
cd learning-system
mvn spring-boot:run
# http://localhost:8080  — tables + seed data created automatically
```

**Frontend:**
```bash
cd frontend
npm install   # first time only
npm run dev
# http://localhost:3000
```

---

### 4. Execution service (optional — for Docker isolation)

Only needed if you want code to run in isolated Docker containers (matches LeetCode's architecture). Without it, code runs in child JVM processes inside the main API — which is safe and works fine for local dev.

**Prerequisites:** Docker Desktop running.

```bash
# Pull the runtime image once
docker pull eclipse-temurin:17-jre-alpine

cd execution-service
mvn spring-boot:run
# Runs on http://localhost:8081
# Docker execution is ON by default in this service
```

Then tell the main API to use it:

```bash
# In a new terminal, restart the main API with:
export EXECUTION_SERVICE_URL=http://localhost:8081
mvn spring-boot:run
```

Or add to `application.properties`:
```properties
execution.service.url=http://localhost:8081
```

---

### 5. Enable Docker mode in the main API directly (alternative)

If you don't want to run the execution service separately but still want Docker isolation:

```properties
# In learning-system/src/main/resources/application.properties
execution.docker.enabled=true
# Docker Desktop must be running
```

This compiles code locally (fast) and runs each program in its own container. `System.exit()` becomes safe — the container dies, Spring Boot lives.

---

### Full local stack summary

| Service | URL | How to start |
|---------|-----|-------------|
| MySQL | `localhost:3306` | Start MySQL service |
| Main API | `http://localhost:8080` | `cd learning-system && mvn spring-boot:run` |
| Frontend | `http://localhost:3000` | `cd frontend && npm run dev` |
| Execution service | `http://localhost:8081` | `cd execution-service && mvn spring-boot:run` (optional) |

---

### Docker Compose (all-in-one)

```bash
cd frontend
docker-compose up
# Builds frontend + backend, runs behind Nginx on port 80
```

---

## AI Provider Chain

All AI features use a three-tier fallback:

```
Groq (llama-3.1-8b-instant)    ← free, 14 400 req/day, no card needed
  ↓ on failure
Gemini (gemini-2.0-flash)       ← free, Google AI Studio
  ↓ on failure
OpenAI (gpt-4o-mini)            ← paid fallback, ~$0.15/1M tokens
```

Get keys:
- Groq: [console.groq.com](https://console.groq.com) — free
- Gemini: [aistudio.google.com](https://aistudio.google.com/app/apikey) — free
- OpenAI: [platform.openai.com](https://platform.openai.com/api-keys) — paid

---

## Deploying to a Server

### Architecture overview

```
Internet
    │
    ▼
[Render — Frontend (static)]       React build, served by Nginx
    │
    ▼
[Render — Main API (port 8080)]    Spring Boot, JWT + Google OAuth2
    │                                Async job queue (MySQL)
    │                                WORKER_ENABLED=false on free tier
    ▼
[Railway — MySQL 8.0]              Single shared DB
    │
    ▼ (optional)
[VPS / Home Server — Execution Service (port 8081)]
    │                                Docker containers for code isolation
    └── docker.sock mount           Real LeetCode-style execution
```

---

### Step 1 — Database (Railway)

1. Create a project at [railway.app](https://railway.app)
2. Add a **MySQL** service
3. Copy the connection string from the Railway dashboard (Variables tab)

---

### Step 2 — Main API (Render)

1. Connect your GitHub repo at [render.com](https://render.com) → New Web Service
2. **Root directory:** `learning-system`
3. **Build command:** `mvn clean package -DskipTests`
4. **Start command:** `java -jar target/learning-system-*.jar`
5. **Environment:** Java 17

Set these environment variables on Render:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `jdbc:mysql://interchange.proxy.rlwy.net:PORT/devlearn?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC` |
| `DATABASE_USERNAME` | `root` |
| `DATABASE_PASSWORD` | from Railway |
| `JWT_SECRET` | any long random base64 string |
| `GOOGLE_CLIENT_ID` | from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud Console |
| `FRONTEND_URL` | `https://your-app.onrender.com` |
| `GROQ_API_KEY` | from console.groq.com |
| `GEMINI_API_KEY` | from aistudio.google.com |
| `WORKER_ENABLED` | `false` (Render free tier — no Docker) |
| `EXECUTION_SERVICE_URL` | `http://YOUR_VPS_IP:8081` (if using execution service) |

> **Note:** `WORKER_ENABLED=false` means code execution jobs are queued but not processed on Render. You need the execution service on a separate machine to actually run code. Alternatively, set `WORKER_ENABLED=true` if Render has enough resources.

---

### Step 3 — Frontend (Render Static Site)

1. New Static Site → connect repo
2. **Root directory:** `frontend`
3. **Build command:** `npm install && npm run build`
4. **Publish directory:** `dist`
5. Set environment variable:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | *(leave blank — uses relative URLs proxied by Nginx)* |

Add a rewrite rule for React Router:
- Source: `/*`
- Destination: `/index.html`
- Action: Rewrite

---

### Step 4 — Execution Service on VPS / Home Server (for Docker isolation)

This is the component that gives true LeetCode-style isolation. Any Linux server with Docker works: a $6/mo DigitalOcean droplet, a home server, an EC2 instance.

**One-time setup:**

```bash
# On the VPS/server
# 1. Install Java 17 JDK
sudo apt update && sudo apt install -y openjdk-17-jdk

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# 3. Pull the runtime image
docker pull eclipse-temurin:17-jre-alpine
```

**Option A — Run as a JAR (recommended for first deploy):**

```bash
# On your local machine: build the JAR
cd execution-service
mvn clean package -DskipTests

# Copy to server
scp target/execution-service-*.jar user@YOUR_SERVER:/opt/execution-service/app.jar

# On the server: run it
java -jar /opt/execution-service/app.jar \
  --server.port=8081 \
  --execution.docker.enabled=true
```

**Option B — Run as a Docker container (Docker-in-Docker style):**

```bash
# On the server: build the image
cd execution-service
docker build -t execution-service .

# Run — mount the host Docker socket so containers can be spawned
docker run -d \
  --name execution-service \
  --restart unless-stopped \
  -p 8081:8081 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  execution-service
```

**Option C — systemd service (auto-start on reboot):**

```ini
# /etc/systemd/system/execution-service.service
[Unit]
Description=DevLearner Execution Service
After=docker.service
Requires=docker.service

[Service]
ExecStart=/usr/bin/java -jar /opt/execution-service/app.jar \
  --server.port=8081 \
  --execution.docker.enabled=true
Restart=always
RestartSec=10
User=ubuntu
Environment=DOCKER_ENABLED=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable execution-service
sudo systemctl start execution-service
sudo systemctl status execution-service
```

**Verify it's running:**

```bash
curl http://localhost:8081/internal/health
# {"status":"UP","service":"execution-service"}
```

**Security — expose only to Render, not the public internet:**

```bash
# UFW — allow port 8081 only from Render's outbound IPs
sudo ufw allow from <RENDER_IP_RANGE> to any port 8081
# Or use a private network / VPN between Render and the VPS
```

---

### Step 5 — Google OAuth2 setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add Authorized redirect URIs:
   - `https://your-backend.onrender.com/login/oauth2/code/google`
   - `http://localhost:8080/login/oauth2/code/google` (for local dev)
4. Copy Client ID and Client Secret → set as `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` on Render

---

### Full production env vars reference

**Main API (Render):**

```
DATABASE_URL          jdbc:mysql://...railway.../devlearn?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DATABASE_USERNAME     root
DATABASE_PASSWORD     <railway password>
JWT_SECRET            <base64 random string, 64+ chars>
GOOGLE_CLIENT_ID      <from Google Cloud Console>
GOOGLE_CLIENT_SECRET  <from Google Cloud Console>
FRONTEND_URL          https://your-frontend.onrender.com
GROQ_API_KEY          gsk_...
GEMINI_API_KEY        AIza...
OPENAI_API_KEY        sk-... (optional)
WORKER_ENABLED        false
EXECUTION_SERVICE_URL http://YOUR_VPS_IP:8081
```

**Execution service (VPS):**

```
DOCKER_ENABLED        true
DOCKER_IMAGE          eclipse-temurin:17-jre-alpine
DOCKER_MEMORY_MB      256
DOCKER_CPUS           0.5
DOCKER_TIMEOUT_SECONDS 15
```

---

## Code Execution Architecture

```
User clicks Run / Submit
        │
        ▼
POST /api/execute/async      ← returns {token} in < 5ms
        │
        ▼
execution_jobs table (MySQL) ← job sits at PENDING
        │
        ▼ (worker polls every 400ms)
ExecutionWorkerScheduler
        │
        ├── if EXECUTION_SERVICE_URL set
        │       ▼
        │   ExecutionClient → POST http://execution-service:8081/internal/execute
        │                          │
        │                          ▼
        │                   docker run --rm -m 256m --cpus 0.5 --network none
        │                          openjdk:17-jre-alpine java Solution
        │
        └── if no EXECUTION_SERVICE_URL
                ▼
            Local ExecutionService (child JVM process)
                docker run if execution.docker.enabled=true
                child java process if docker.enabled=false
        │
        ▼
Frontend polls GET /api/jobs/{token} every 1.5s
        │
        ▼
PENDING → "Waiting in queue…"
STARTED → "Running your code…"
DONE    → show result
```

Each code execution:
- Compiles with Java Compiler API (local, fast, gives exact line/col errors)
- Runs in Docker container with: 256MB memory cap, 0.5 CPU, no network, 64 PID limit
- `System.exit()` kills only the container — server is unaffected
- OOM → exit 137 → reported as `MEMORY_LIMIT`
- Timeout → container killed → reported as `TIMEOUT`

---

## Key API Endpoints

```
POST /api/auth/login                    JWT login
POST /api/auth/register                 Register
GET  /api/topics                        All topics (optional ?category=)
GET  /api/problems                      Paginated problems
POST /api/execute/async                 Async run (returns token)
POST /api/submissions/submit/async      Async submit (returns token)
GET  /api/jobs/{token}                  Poll job status

POST /api/smart-interview/start         Start AI interview (multipart PDF)
POST /api/smart-interview/:id/respond   Send answer, get next question
GET  /api/smart-interview/:id/summary   Full performance report

POST /api/practice-set/generate         Generate 30 Q&As from resume
POST /api/resume/analyze                Resume gap analysis
POST /api/mock-interview/start          Start mock interview session

GET  /api/interview-questions           Q&A bank (?category=&difficulty=)
GET  /api/algorithms                    Algorithm list
GET  /api/daily                         Today's challenge

# Execution microservice (internal — not exposed to internet)
POST /internal/execute
POST /internal/submit
POST /internal/syntax-check
GET  /internal/health
```

---

## User Roles

| Role | Access |
|------|--------|
| `STUDENT` | All learning features (default on register) |
| `ADMIN` | `/admin` panel — topic/problem/quiz/algorithm/user management |

To make yourself admin: update the `user_roles` table directly in MySQL:
```sql
INSERT INTO user_roles (user_id, roles) VALUES (<your_user_id>, 'ADMIN');
```

---

## Local Quick Reference

```powershell
# Backend + frontend (no Docker needed)
.\dev.ps1

# Backend + frontend + execution service (Docker required)
.\dev.ps1 -Execution

# Frontend → http://localhost:3000
# Backend  → http://localhost:8080
# Execution service → http://localhost:8081  (only with -Execution)
```

```bash
# Or manually (separate terminals):

# Terminal 1 — Backend
cd learning-system && mvn spring-boot:run

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev

# Terminal 3 — Execution service (optional, needs Docker Desktop running)
cd execution-service && mvn spring-boot:run
```

---

## License

MIT
