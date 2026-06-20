@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title GASSTATION — Vercel hazirlik
color 0B
cls

echo.
echo  ================================================
echo   GASSTATION — Build test + GitHub + Vercel
echo  ================================================
echo.
echo  Adim 1: Yerel build (Vercel ile ayni)
echo  Adim 2: GitHub'a yukle
echo  Adim 3: Vercel redeploy ac
echo.
pause

REM --- Temizlik ---
if exist "contracts\.git" rmdir /s /q "contracts\.git"
if exist ".gitmodules" del /f ".gitmodules"

echo.
echo [1/3] npm run build ...
echo       (2-5 dakika surebilir)
echo.
call npm.cmd run build
if errorlevel 1 (
  color 0C
  echo.
  echo ===== BUILD BASARISIZ =====
  echo Vercel de ayni hatayi verir. Yukaridaki kirmizi satirlari oku.
  echo.
  pause
  exit /b 1
)
color 0A
echo.
echo ===== BUILD BASARILI =====
echo.

echo [2/3] GitHub push...
if not exist ".git" (
  git init -b main
  git remote add origin https://github.com/exelance25/gasstation.git
) else (
  git remote get-url origin >nul 2>&1
  if errorlevel 1 git remote add origin https://github.com/exelance25/gasstation.git
)

git add .gitignore README.md LICENSE package.json package-lock.json
git add next.config.ts tsconfig.json vercel.json tailwind.config.ts
git add postcss.config.js postcss.config.mjs components.json .eslintrc.json .npmrc
git add .env.example .env.testnet.example .env.mainnet.example .env.test.local.example
git add dev.cmd DEPLOY.cmd GASSTATION_YENI.cmd VERCEL_HAZIR.cmd NASIL_YUKLE.txt docker-compose.yml
git add public src config sdk packages docs scripts hooks services
git add contracts/src contracts/script contracts/test contracts/foundry.toml contracts/README.md
git add test-integration.ts assets 2>nul

git diff --cached --quiet
if errorlevel 1 (
  git -c user.name=exelance25 -c user.email=exelance25@users.noreply.github.com commit -m "fix: Vercel build — SDK alias, eslint, env"
) else (
  echo Degisiklik yok — commit atlandi.
)

git push -u origin main
if errorlevel 1 (
  git push -u origin main --force
)
if errorlevel 1 (
  color 0C
  echo Push basarisiz — GitHub giris yap, tekrar dene.
  pause
  exit /b 1
)

color 0A
echo.
echo ===== GITHUB TAMAM =====
echo.

echo [3/3] Vercel...
echo.
echo  Vercel Dashboard ^> projen ^> Deployments ^> Redeploy
echo  veya yeni import:
echo  https://vercel.com/new/import?s=https://github.com/exelance25/gasstation
echo.
echo  Ortam degiskenleri (Settings ^> Environment Variables):
echo    NEXT_PUBLIC_APP_ENV = testnet
echo    NEXT_PUBLIC_WC_PROJECT_ID = Reown project id
echo    NEXT_PUBLIC_GITHUB_REPO = https://github.com/exelance25/gasstation
echo.
choice /C YN /M "Vercel sayfasini acayim mi"
if not errorlevel 2 start https://vercel.com/dashboard

echo.
echo ===== BITTI =====
pause
endlocal
