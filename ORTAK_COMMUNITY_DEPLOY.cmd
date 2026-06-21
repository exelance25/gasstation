@echo off
title GASSTATION Community Deploy
cd /d "C:\Users\omerr\.cursor\projects\empty-window"

echo.
echo ============================================================
echo   GASSTATION - Base USDC fix + Admin + English UI
echo ============================================================
set /p ONAY=Type E to deploy (Enter = cancel): 
if /i not "%ONAY%"=="E" exit /b 0

call npm.cmd run build
if errorlevel 1 (
  echo BUILD FAILED
  pause
  exit /b 1
)

set GIT_AUTHOR_NAME=exelance25
set GIT_AUTHOR_EMAIL=exelance25@users.noreply.github.com
set GIT_COMMITTER_NAME=exelance25
set GIT_COMMITTER_EMAIL=exelance25@users.noreply.github.com

git add src/ config/ scripts/recover-native-deposit.mjs ORTAK_COMMUNITY_DEPLOY.cmd
git commit -m "fix: Base USDC chain switch, admin fallback, English UI, Solana testnet"
git push -u origin main

echo Done. Vercel ~3 min.
pause
