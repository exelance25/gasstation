@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title GASSTATION — Son Duzeltme Push
color 0E

echo.
echo  SON DUZELTME — Vercel icin dogru kod GitHub'a gidecek
echo  (Onceki script force-push ile ESKI kodu geri yuklemisti — bu duzeltir)
echo.
pause

if exist "contracts\.git" rmdir /s /q "contracts\.git"
if exist ".gitmodules" del /f ".gitmodules"

git remote set-url origin https://github.com/exelance25/gasstation.git

echo.
echo [1/4] Duzeltme dosyalari ekleniyor...
git add config/web3.ts next.config.ts tsconfig.json vercel.json src/instrumentation.ts src/lib/auto-fee/chain-map.ts src/lib/auto-fee/execute-automatic-fee.ts src/lib/auto-fee/path-resolver.ts src/lib/auto-fee/treasury-native.ts sdk/package.json

git status -sb

echo.
echo [2/4] Commit...
git -c user.name=exelance25 -c user.email=exelance25@users.noreply.github.com commit -m "fix: Vercel build — web3 types, tsconfig scope, instrumentation skip, auto-fee imports"
if errorlevel 1 (
  echo Commit atlandi veya hata — devam ediliyor...
)

echo.
echo [3/3] Push ^(rebase yok — commit zaten origin/main uzerinde^)...
git fetch origin main
git push -u origin main
if errorlevel 1 (
  color 0C
  echo Push basarisiz — GitHub girisini kontrol et.
  pause
  exit /b 1
)

color 0A
echo.
echo  ===== TAMAM =====
echo  GitHub guncellendi. Vercel otomatik deploy baslar (~3 dk).
echo  Link: https://gasstation-git-main-exelance25s-projects.vercel.app/yakit-al
echo.
start https://vercel.com/exelance25s-projects/gasstation/deployments
pause
