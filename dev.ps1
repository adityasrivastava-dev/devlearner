# dev.ps1 — Start DevLearner backend + frontend (+ optional execution service)
#
# Usage (from repo root):
#   .\dev.ps1                   — backend + frontend
#   .\dev.ps1 -Execution        — backend + frontend + execution service (needs Docker)
#
# What it does:
#   1. Checks Java / Maven / Node.js are on PATH
#   2. Loads .env.local if it exists
#   3. Runs npm install if node_modules is missing
#   4. Opens Windows Terminal with tabs for each service
#        Tab 1 — Spring Boot backend       (port 8080)
#        Tab 2 — Vite frontend             (port 3000)
#        Tab 3 — Execution microservice    (port 8081)  ← only with -Execution
#
# To stop: close each tab (or press Ctrl+C inside the tab)

param(
    [switch]$Execution   # also start the execution microservice on port 8081
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

# ── Helpers ───────────────────────────────────────────────────────────────────
function ok($msg)   { Write-Host "  [OK]   $msg" -ForegroundColor Green }
function warn($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function err($msg)  { Write-Host "  [ERR]  $msg" -ForegroundColor Red }
function step($msg) { Write-Host "  $msg"         -ForegroundColor Cyan }

Write-Host ""
Write-Host "  DevLearner — Local Dev" -ForegroundColor White
Write-Host "  ──────────────────────────────────────────" -ForegroundColor DarkGray
if ($Execution) {
    Write-Host "  Mode: backend + frontend + execution service" -ForegroundColor DarkGray
} else {
    Write-Host "  Mode: backend + frontend  (use -Execution to also start port 8081)" -ForegroundColor DarkGray
}
Write-Host ""

# ── 1. Prerequisites ──────────────────────────────────────────────────────────
step "Checking prerequisites..."
$abort = $false

if (Get-Command java -ErrorAction SilentlyContinue) {
    $jv = (java -version 2>&1 | Select-String "version" | Select-Object -First 1).ToString().Trim()
    ok "Java    : $jv"
} else {
    err "Java not found. Install JDK 17+ from https://adoptium.net/"
    $abort = $true
}

if (Get-Command mvn -ErrorAction SilentlyContinue) {
    $mv = (mvn --version 2>&1 | Select-Object -First 1).ToString().Trim()
    ok "Maven   : $mv"
} else {
    err "Maven not found. Install from https://maven.apache.org/ and add to PATH."
    $abort = $true
}

if (Get-Command node -ErrorAction SilentlyContinue) {
    ok "Node.js : $(node --version)"
} else {
    err "Node.js not found. Install from https://nodejs.org/"
    $abort = $true
}

if (Get-Command npm -ErrorAction SilentlyContinue) {
    ok "npm     : $(npm --version)"
} else {
    err "npm not found (should come with Node.js)."
    $abort = $true
}

# Docker check — only required when -Execution is passed
if ($Execution) {
    if (Get-Command docker -ErrorAction SilentlyContinue) {
        $dockerRunning = $false
        try {
            docker info 2>&1 | Out-Null
            $dockerRunning = ($LASTEXITCODE -eq 0)
        } catch {}

        if ($dockerRunning) {
            ok "Docker  : running"
        } else {
            err "Docker is installed but not running — start Docker Desktop first."
            $abort = $true
        }
    } else {
        err "Docker not found. Install Docker Desktop from https://www.docker.com/products/docker-desktop/"
        $abort = $true
    }
}

if ($abort) {
    Write-Host ""
    err "Fix the issues above, then run .\dev.ps1 again."
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# ── 2. Load .env.local ────────────────────────────────────────────────────────
Write-Host ""
step "Loading environment..."
$envLocal = Join-Path $root ".env.local"
if (Test-Path $envLocal) {
    ok ".env.local found — loading variables into this session"
    Get-Content $envLocal | Where-Object { $_ -match "^\s*[A-Za-z_][A-Za-z0-9_]*\s*=.+" -and $_ -notmatch "^\s*#" } | ForEach-Object {
        $kv = ($_ -replace "^\s+|\s+$").Split("=", 2)
        if ($kv.Length -eq 2) {
            [System.Environment]::SetEnvironmentVariable($kv[0].Trim(), $kv[1].Trim(), "Process")
        }
    }
} else {
    warn ".env.local not found — copy .env.local.example and fill in your keys"
    warn "(AI hints, Google OAuth will be disabled until keys are set)"
}

# Show which optional keys are configured
$keys = @{
    "GROQ_API_KEY"         = "Groq AI (primary hints)"
    "GEMINI_API_KEY"       = "Gemini AI (fallback hints)"
    "GOOGLE_CLIENT_ID"     = "Google OAuth"
    "GOOGLE_CLIENT_SECRET" = "Google OAuth"
    "JWT_SECRET"           = "JWT (using weak dev default if unset)"
}
foreach ($k in $keys.Keys) {
    if ([System.Environment]::GetEnvironmentVariable($k, "Process")) {
        ok "$k set"
    } else {
        warn "$k not set — $($keys[$k]) disabled/degraded"
    }
}

# ── 3. Frontend deps ──────────────────────────────────────────────────────────
Write-Host ""
step "Checking frontend dependencies..."
$nm = Join-Path $root "frontend\node_modules"
if (-not (Test-Path $nm)) {
    warn "node_modules missing — running npm install (one-time, takes ~30s)..."
    Push-Location (Join-Path $root "frontend")
    npm install
    Pop-Location
    ok "npm install complete"
} else {
    ok "node_modules present"
}

# ── 4. Pull Docker image if needed ───────────────────────────────────────────
if ($Execution) {
    Write-Host ""
    step "Checking Docker image for execution service..."
    $image = "eclipse-temurin:17-jre-alpine"
    $exists = docker images -q $image 2>$null
    if ($exists) {
        ok "Image '$image' already pulled"
    } else {
        warn "Image '$image' not found — pulling now (one-time, ~150 MB)..."
        docker pull $image
        ok "Image pulled"
    }
}

# ── 5. Launch ─────────────────────────────────────────────────────────────────
Write-Host ""
step "Starting services..."
Write-Host ""

$backendDir   = Join-Path $root "learning-system"
$frontendDir  = Join-Path $root "frontend"
$executionDir = Join-Path $root "execution-service"

# Forward env vars from .env.local into each child shell
$envForward = ""
foreach ($k in @("GROQ_API_KEY","GEMINI_API_KEY","OPENAI_API_KEY","GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET","JWT_SECRET","DATABASE_URL","DATABASE_USERNAME","DATABASE_PASSWORD")) {
    $val = [System.Environment]::GetEnvironmentVariable($k, "Process")
    if ($val) {
        $escaped = $val -replace "'", "''"
        $envForward += "`$env:$k = '$escaped'; "
    }
}

# Tell the main API to use the execution service when -Execution is passed
$execServiceEnv = ""
if ($Execution) {
    $execServiceEnv = "`$env:EXECUTION_SERVICE_URL = 'http://localhost:8081'; "
}

$backendCmd   = "$envForward $execServiceEnv cd '$backendDir'; Write-Host ''; Write-Host '  Backend starting on http://localhost:8080' -ForegroundColor Cyan; Write-Host ''; mvn spring-boot:run"
$frontendCmd  = "cd '$frontendDir'; Write-Host ''; Write-Host '  Frontend starting on http://localhost:3000' -ForegroundColor Green; Write-Host ''; npm run dev"
$executionCmd = "`$env:DOCKER_ENABLED = 'true'; cd '$executionDir'; Write-Host ''; Write-Host '  Execution service starting on http://localhost:8081' -ForegroundColor Magenta; Write-Host ''; mvn spring-boot:run"

# Use Windows Terminal (wt) if available — opens all services as tabs in one window
$wt = Get-Command wt -ErrorAction SilentlyContinue
if ($wt) {
    $wtArgs = @(
        "new-tab", "--title", "Backend :8080",  "--", "powershell", "-NoExit", "-NoProfile", "-Command", $backendCmd,
        ";", "new-tab", "--title", "Frontend :3000", "--", "powershell", "-NoExit", "-NoProfile", "-Command", $frontendCmd
    )
    if ($Execution) {
        $wtArgs += @(";", "new-tab", "--title", "Execution :8081", "--", "powershell", "-NoExit", "-NoProfile", "-Command", $executionCmd)
    }
    Start-Process wt -ArgumentList $wtArgs
    $tabCount = if ($Execution) { "three" } else { "two" }
    Write-Host "  Opened Windows Terminal with $tabCount tabs." -ForegroundColor White
} else {
    # Fallback: open separate PowerShell windows
    Start-Process powershell -ArgumentList "-NoExit", "-NoProfile", "-Command", $backendCmd
    Start-Sleep -Milliseconds 300
    Start-Process powershell -ArgumentList "-NoExit", "-NoProfile", "-Command", $frontendCmd
    if ($Execution) {
        Start-Sleep -Milliseconds 300
        Start-Process powershell -ArgumentList "-NoExit", "-NoProfile", "-Command", $executionCmd
    }
    $winCount = if ($Execution) { "three" } else { "two" }
    Write-Host "  Opened $winCount PowerShell windows (wt not found)." -ForegroundColor White
}

Write-Host ""
if ($Execution) {
    Write-Host "  ┌──────────────────────────────────────────────────┐" -ForegroundColor DarkGray
    Write-Host "  │                                                  │" -ForegroundColor DarkGray
    Write-Host "  │   Backend            →  http://localhost:8080    │" -ForegroundColor Cyan
    Write-Host "  │   Frontend           →  http://localhost:3000    │" -ForegroundColor Green
    Write-Host "  │   Execution service  →  http://localhost:8081    │" -ForegroundColor Magenta
    Write-Host "  │   Health check       →  http://localhost:8081/   │" -ForegroundColor DarkGray
    Write-Host "  │                          internal/health         │" -ForegroundColor DarkGray
    Write-Host "  │                                                  │" -ForegroundColor DarkGray
    Write-Host "  │   Code runs in Docker containers (isolated).     │" -ForegroundColor DarkGray
    Write-Host "  │   Close the terminal tabs to stop.               │" -ForegroundColor DarkGray
    Write-Host "  │                                                  │" -ForegroundColor DarkGray
    Write-Host "  └──────────────────────────────────────────────────┘" -ForegroundColor DarkGray
} else {
    Write-Host "  ┌──────────────────────────────────────────────────┐" -ForegroundColor DarkGray
    Write-Host "  │                                                  │" -ForegroundColor DarkGray
    Write-Host "  │   Backend   →  http://localhost:8080             │" -ForegroundColor Cyan
    Write-Host "  │   Frontend  →  http://localhost:3000             │" -ForegroundColor Green
    Write-Host "  │   Health    →  http://localhost:8080/actuator/   │" -ForegroundColor DarkGray
    Write-Host "  │                health                            │" -ForegroundColor DarkGray
    Write-Host "  │                                                  │" -ForegroundColor DarkGray
    Write-Host "  │   Code runs in child JVM processes (no Docker).  │" -ForegroundColor DarkGray
    Write-Host "  │   Use .\dev.ps1 -Execution for Docker isolation. │" -ForegroundColor DarkGray
    Write-Host "  │   Close the terminal tabs to stop.               │" -ForegroundColor DarkGray
    Write-Host "  │                                                  │" -ForegroundColor DarkGray
    Write-Host "  └──────────────────────────────────────────────────┘" -ForegroundColor DarkGray
}
Write-Host ""
