@echo off
setlocal
cd /d "%~dp0"
title GASSTATION — Sadece Push
color 0B

echo.
echo  Commit zaten yerelde var — rebase GEREKMEZ, direkt push.
echo.

if exist "contracts\.git" rmdir /s /q "contracts\.git"

echo ===== git durum ===== > push-log.txt
git status >> push-log.txt 2>&1
git log --oneline -3 >> push-log.txt 2>&1
echo. >> push-log.txt
echo ===== push ===== >> push-log.txt
git push -u origin main >> push-log.txt 2>&1
set PUSH_EXIT=%ERRORLEVEL%
echo EXIT: %PUSH_EXIT% >> push-log.txt

type push-log.txt

if %PUSH_EXIT% neq 0 (
  color 0C
  echo.
  echo  PUSH BASARISIZ — push-log.txt dosyasina bak.
  echo  GitHub girisi gerekebilir ^(git credential^).
  pause
  exit /b 1
)

color 0A
echo.
echo  ===== TAMAM =====
echo  GitHub guncellendi. Vercel ~3 dk icinde deploy eder.
echo  https://gasstation-git-main-exelance25s-projects.vercel.app/yakit-al
echo.
start https://vercel.com/exelance25s-projects/gasstation/deployments
pause
