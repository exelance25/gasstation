@echo off
title GASSTATION - Commit + Push (git email fix)
cd /d "C:\Users\omerr\.cursor\projects\empty-window"

set GIT_AUTHOR_NAME=exelance25
set GIT_AUTHOR_EMAIL=exelance25@users.noreply.github.com
set GIT_COMMITTER_NAME=exelance25
set GIT_COMMITTER_EMAIL=exelance25@users.noreply.github.com

echo.
echo Degisiklikler:
git status --short
echo.

git add -A
git commit -m "feat: English user UI, Turkish admin panel, admin access fix, KPI dashboard"
if errorlevel 1 (
  echo.
  echo COMMIT BASARISIZ - yukaridaki hatayi kontrol edin.
  pause
  exit /b 1
)

git push -u origin main
if errorlevel 1 (
  echo PUSH BASARISIZ
  pause
  exit /b 1
)

echo.
echo BASARILI - Vercel ~3 dk
git log -1 --oneline
pause
