@echo off
title GASSTATION - ORTAK Full Deploy
cd /d "C:\Users\omerr\.cursor\projects\empty-window"

echo.
echo ============================================================
echo   GASSTATION ORTAK - Tam deploy
echo   - Kullanici arayuzu: Ingilizce
echo   - Admin paneli: Turkce + KPI
echo ============================================================
echo.
set /p ONAY=Devam icin E yazin (Enter = iptal): 
if /i not "%ONAY%"=="E" exit /b 0

echo [1/3] Build...
call npm.cmd run build
if errorlevel 1 (
  echo BUILD BASARISIZ
  pause
  exit /b 1
)

echo [2/3] Commit...
set GIT_AUTHOR_NAME=exelance25
set GIT_AUTHOR_EMAIL=exelance25@users.noreply.github.com
set GIT_COMMITTER_NAME=exelance25
set GIT_COMMITTER_EMAIL=exelance25@users.noreply.github.com
git add -A
git commit -m "feat: English user UI, Turkish admin panel, admin access fix, KPI dashboard"
if errorlevel 1 (
  echo COMMIT BASARISIZ - git kullanici/eposta veya degisiklik yok.
  pause
  exit /b 1
)

echo [3/3] Push...
git push -u origin main
if errorlevel 1 (
  echo PUSH BASARISIZ
  pause
  exit /b 1
)

echo.
echo DEPLOY BASLADI - ~3 dk
echo https://gasstation-flame.vercel.app/yakit-al
echo https://gasstation-flame.vercel.app/api/health
pause
