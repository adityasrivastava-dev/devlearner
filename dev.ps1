# dev.ps1 — Start DevLearner backend + frontend in one command
#
# Usage (from repo root):
#   .\dev.ps1
#
# What it does:
#   1. Checks Java / Maven / Node.js are on PATH
#   2. Loads .env.local if it exists
#   3. Runs npm install if node_modules is missing
#   4. Opens Windows Terminal with two tabs:
#        Tab 1 — Spring Boot backend  (port 8080)
#        Tab 2 — Vite frontend        (port 3000)
#
# To stop: close each tab (or press Ctrl+C inside the tab)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

# ── Helpers ───────────────────────────────────────────────────────────────────
function ok($msg)   { Write-Host "  [OK]   $msg" -ForegroundColor Green }
function warn($msg) { Write-Host "  [WARN] $msg" -ForegroundColor Yellow }
function err($msg)  { Write-Host "  [ERR]  $msg" -ForegroundColor Red }
function step($msg) { Write-Host "  $msg"         -ForegroundColor Cyan }

Clear-Host
Write-Host ""
Write-Host "  DevLearner — Local Dev" -ForegroundColor White
Write-Host "  ──────────────────────────────────────────" -ForegroundColor DarkGray
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

if ($abort) {
    Write-Host ""
    err "Fix the missing prerequisites above, then run .\dev.ps1 again."
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
    "GROQ_API_KEY"        = "Groq AI (primary hints)"
    "GEMINI_API_KEY"      = "Gemini AI (fallback hints)"
    "GOOGLE_CLIENT_ID"    = "Google OAuth"
    "GOOGLE_CLIENT_SECRET"= "Google OAuth"
    "JWT_SECRET"          = "JWT (using weak dev default if unset)"
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

# ── 4. Launch ─────────────────────────────────────────────────────────────────
Write-Host ""
step "Starting services..."
Write-Host ""

$backendDir  = Join-Path $root "learning-system"
$frontendDir = Join-Path $root "frontend"

# Build the env-var forwarding block for the backend tab
# Passes GROQ_API_KEY, GEMINI_API_KEY, etc. into the child shell if they are set.
$envForward = ""
foreach ($k in @("GROQ_API_KEY","GEMINI_API_KEY","OPENAI_API_KEY","GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET","JWT_SECRET","DATABASE_URL","DATABASE_USERNAME","DATABASE_PASSWORD")) {
    $val = [System.Environment]::GetEnvironmentVariable($k, "Process")
    if ($val) {
        $escaped = $val -replace "'", "''"
        $envForward += "`$env:$k = '$escaped'; "
    }
}

$backendCmd  = "$envForward cd '$backendDir'; Write-Host ''; Write-Host '  Backend starting on http://localhost:8080' -ForegroundColor Cyan; Write-Host ''; mvn spring-boot:run"
$frontendCmd = "cd '$frontendDir'; Write-Host ''; Write-Host '  Frontend starting on http://localhost:3000' -ForegroundColor Green; Write-Host ''; npm run dev"

# Use Windows Terminal (wt) if available — opens both as tabs in one window
$wt = Get-Command wt -ErrorAction SilentlyContinue
if ($wt) {
    $wtArgs = @(
        "new-tab", "--title", "Backend :8080", "--", "powershell", "-NoExit", "-NoProfile", "-Command", $backendCmd,
        ";", "new-tab", "--title", "Frontend :3000", "--", "powershell", "-NoExit", "-NoProfile", "-Command", $frontendCmd
    )
    Start-Process wt -ArgumentList $wtArgs
    Write-Host "  Opened Windows Terminal with two tabs." -ForegroundColor White
} else {
    # Fallback: open two separate PowerShell windows
    Start-Process powershell -ArgumentList "-NoExit", "-NoProfile", "-Command", $backendCmd
    Start-Sleep -Milliseconds 300
    Start-Process powershell -ArgumentList "-NoExit", "-NoProfile", "-Command", $frontendCmd
    Write-Host "  Opened two PowerShell windows (wt not found)." -ForegroundColor White
}

Write-Host ""
Write-Host "  ┌──────────────────────────────────────────────┐" -ForegroundColor DarkGray
Write-Host "  │                                              │" -ForegroundColor DarkGray
Write-Host "  │   Backend   →  http://localhost:8080         │" -ForegroundColor Cyan
Write-Host "  │   Frontend  →  http://localhost:3000         │" -ForegroundColor Green
Write-Host "  │   API Docs  →  http://localhost:8080/actuator│" -ForegroundColor DarkGray
Write-Host "  │                                              │" -ForegroundColor DarkGray
Write-Host "  │   Close the terminal tabs to stop.           │" -ForegroundColor DarkGray
Write-Host "  │                                              │" -ForegroundColor DarkGray
Write-Host "  └──────────────────────────────────────────────┘" -ForegroundColor DarkGray
Write-Host ""
