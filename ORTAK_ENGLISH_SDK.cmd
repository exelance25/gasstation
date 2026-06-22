@echo off
title GASSTATION - English UI + 3-Layer SDK Deploy
cd /d "C:\Users\omerr\.cursor\projects\empty-window"

set GIT_AUTHOR_NAME=exelance25
set GIT_AUTHOR_EMAIL=exelance25@users.noreply.github.com
set GIT_COMMITTER_NAME=exelance25
set GIT_COMMITTER_EMAIL=exelance25@users.noreply.github.com

echo.
echo Changes:
git status --short
echo.

git add -A
git commit -m "feat: full English user UI, 3-layer auto gas (SDK, Quoter, Liquidity Engine)"
if errorlevel 1 (
  echo.
  echo COMMIT FAILED - check error above.
  pause
  exit /b 1
)

git push -u origin main
if errorlevel 1 (
  echo PUSH FAILED
  pause
  exit /b 1
)

echo.
echo SUCCESS - Vercel deploy ~3 min
git log -1 --oneline
pause
