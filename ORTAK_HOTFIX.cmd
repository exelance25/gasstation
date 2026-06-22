@echo off
title GASSTATION - Hotfix deploy
cd /d "C:\Users\omerr\.cursor\projects\empty-window"
set GIT_AUTHOR_NAME=exelance25
set GIT_AUTHOR_EMAIL=exelance25@users.noreply.github.com
set GIT_COMMITTER_NAME=exelance25
set GIT_COMMITTER_EMAIL=exelance25@users.noreply.github.com

echo [1/3] Build...
call npm.cmd run build
if errorlevel 1 ( pause & exit /b 1 )

echo [2/3] Commit...
git add src/components/WalletContentPicker.tsx src/components/AdminOverlayPanel.tsx src/hooks/useAdminSession.ts src/components/AdminSignIn.tsx src/app/api/admin/status/route.ts src/i18n/admin-tr.ts
git commit -m "fix: cn import wallet crash, simplify admin login panel"
if errorlevel 1 ( pause & exit /b 1 )

echo [3/3] Push...
git push origin main
echo Bitti - ~3 dk Vercel
pause
