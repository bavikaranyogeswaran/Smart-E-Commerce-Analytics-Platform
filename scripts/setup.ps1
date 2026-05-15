# ============================================================
# Smart E-Commerce Analytics Platform — Windows Setup Script
# ============================================================
# PURPOSE: One-command setup for Windows developers.
#          Copies .env, starts Docker services, and verifies
#          the database is ready for data ingestion.
# USAGE:   .\scripts\setup.ps1
# ============================================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    Smart E-Commerce Analytics Platform Setup         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$ProjectRoot = (Get-Item $PSScriptRoot).Parent.FullName
Set-Location $ProjectRoot

# ── Step 1: Create .env from .env.example ────────────────────
if (-Not (Test-Path ".env")) {
    Write-Host "[1/5] Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "      .env created. Edit it to set your credentials before proceeding." -ForegroundColor Green
} else {
    Write-Host "[1/5] .env already exists — skipping copy." -ForegroundColor Green
}

# ── Step 2: Create airflow logs placeholder ──────────────────
Write-Host "[2/5] Ensuring airflow/logs directory exists..." -ForegroundColor Yellow
New-Item -ItemType File -Path "airflow/logs/.gitkeep" -Force | Out-Null
Write-Host "      Done." -ForegroundColor Green

# ── Step 3: Check Docker is running ──────────────────────────
Write-Host "[3/5] Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "      Docker is running." -ForegroundColor Green
} catch {
    Write-Host "      [ERROR] Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# ── Step 4: Start PostgreSQL container ───────────────────────
Write-Host "[4/5] Starting PostgreSQL container..." -ForegroundColor Yellow
docker compose -f docker/docker-compose.yml --env-file .env up postgres -d

# Wait for health check
Write-Host "      Waiting for PostgreSQL to be healthy..."
$MaxWait = 60
$Elapsed = 0
do {
    Start-Sleep -Seconds 3
    $Elapsed += 3
    $Status = docker inspect --format="{{.State.Health.Status}}" olist_postgres 2>$null
    Write-Host "      Status: $Status ($Elapsed s)" -ForegroundColor DarkGray
} while ($Status -ne "healthy" -and $Elapsed -lt $MaxWait)

if ($Status -eq "healthy") {
    Write-Host "      PostgreSQL is healthy!" -ForegroundColor Green
} else {
    Write-Host "      [ERROR] PostgreSQL did not become healthy within $MaxWait seconds." -ForegroundColor Red
    Write-Host "      Check logs: docker logs olist_postgres" -ForegroundColor Yellow
    exit 1
}

# ── Step 5: Start Airflow ─────────────────────────────────────
Write-Host "[5/5] Starting Airflow services..." -ForegroundColor Yellow
docker compose -f docker/docker-compose.yml --env-file .env up airflow-init --wait
docker compose -f docker/docker-compose.yml --env-file .env up airflow-scheduler airflow-webserver -d

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                   Setup Complete!                    ║" -ForegroundColor Green
Write-Host "╠══════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  PostgreSQL:   localhost:5432  (olist_admin)         ║" -ForegroundColor White
Write-Host "║  Airflow UI:   http://localhost:8080                 ║" -ForegroundColor White
Write-Host "║  Credentials: admin / admin123                       ║" -ForegroundColor White
Write-Host "╠══════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  Next steps:                                         ║" -ForegroundColor Yellow
Write-Host "║  1. Download dataset: python data/download_dataset.py║" -ForegroundColor White
Write-Host "║  2. Open Airflow UI and trigger: olist_etl_pipeline  ║" -ForegroundColor White
Write-Host "╚══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
