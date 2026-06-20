@echo off
title GASSTATION — Tam Stack
cd /d "%~dp0"
REM PowerShell: .\START_FULL_STACK.cmd  veya  npm run stack:full

echo ========================================
echo  GASSTATION Tam Stack (Katman A-E)
echo ========================================
echo.

echo [1/5] Docker: Postgres + Redis...
docker compose up -d
if errorlevel 1 (
  echo Docker baslatilamadi. Docker Desktop acik mi?
  pause
  exit /b 1
)

echo [2/5] Quote Engine :4100...
start "GASSTATION Quote" cmd /k "cd /d %~dp0services\quote-engine && if not exist node_modules npm install && if not exist .env copy .env.example .env && npm run dev"

echo [3/5] Settlement Engine :4200...
start "GASSTATION Settlement" cmd /k "cd /d %~dp0services\settlement-engine && if not exist node_modules npm install && if not exist .env copy .env.example .env && npm run dev"

echo [4/5] Marketplace :4000...
start "GASSTATION Marketplace" cmd /k "cd /d %~dp0services\marketplace && if not exist node_modules npm install && if not exist .env copy .env.example .env && npm run dev"

timeout /t 4 /nobreak >nul

echo [5/5] Web UI :3000...
start "GASSTATION Web" cmd /k "cd /d %~dp0 && npm run go"

echo.
echo  Quote:        http://localhost:4100/health
echo  Settlement:   http://localhost:4200/health
echo  Marketplace:  http://localhost:4000/health
echo  Yakit al:     http://localhost:3000/yakit-al
echo  Siparis:      http://localhost:3000/siparis
echo.
echo  Test (sonra): npm run preflight:stack
echo.
pause
