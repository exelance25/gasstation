@echo off
title GASSTATION Marketplace
cd /d "%~dp0"
REM PowerShell: .\START_MARKETPLACE.cmd  veya  npm run marketplace

echo [1/3] Docker: PostgreSQL + Redis...
docker compose up -d
if errorlevel 1 (
  echo Docker baslatilamadi. Docker Desktop acik mi?
  pause
  exit /b 1
)

echo [2/3] Marketplace bagimliliklari...
cd services\marketplace
if not exist node_modules call npm install
if not exist .env copy .env.example .env

echo [3/3] Marketplace API + Workers baslatiliyor...
echo API: http://localhost:4000/health
echo Siparis UI: http://localhost:3000/siparis
call npm run dev
