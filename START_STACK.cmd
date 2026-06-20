@echo off
title GASSTATION Stack
cd /d "%~dp0"
REM PowerShell: .\START_STACK.cmd

echo [1/4] Docker...
docker compose up -d

echo [2/4] Quote Engine...
start "GASSTATION Quote" cmd /k "cd /d %~dp0services\quote-engine && if not exist node_modules npm install && if not exist .env copy .env.example .env && npm run dev"

echo [3/4] Settlement Engine...
start "GASSTATION Settlement" cmd /k "cd /d %~dp0services\settlement-engine && if not exist node_modules npm install && if not exist .env copy .env.example .env && npm run dev"

timeout /t 3 /nobreak >nul

echo [4/4] Web UI...
start "GASSTATION Web" cmd /k "cd /d %~dp0 && npm run go"

echo.
echo  Quote:      http://localhost:4100/health
echo  Settlement: http://localhost:4200/health
echo  Web:        http://localhost:3000/yakit-al
echo.
