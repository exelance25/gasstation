@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title GASSTATION GitHub
color 0E
cls

echo.
echo  GASSTATION — GitHub'a yukle (duzeltilmis)
echo.
pause

echo [1] Temizlik...
if exist ".git" rmdir /s /q ".git"
if exist ".gitmodules" del /f ".gitmodules"
if exist "contracts\.git" rmdir /s /q "contracts\.git"

echo [2] Git baslat...
git init -b main
git remote remove origin 2>nul
git remote add origin https://github.com/exelance25/gasstation.git

echo [3] Dosyalari tek tek ekle...
git add .gitignore README.md LICENSE package.json package-lock.json
git add next.config.ts tsconfig.json vercel.json tailwind.config.ts
git add postcss.config.js postcss.config.mjs components.json .eslintrc.json .npmrc
git add .env.example .env.testnet.example .env.mainnet.example .env.test.local.example
git add dev.cmd DEPLOY.cmd GASSTATION_YENI.cmd NASIL_YUKLE.txt docker-compose.yml
git add public src config sdk packages docs scripts hooks services
git add contracts/src contracts/script contracts/test contracts/foundry.toml contracts/README.md
git add test-integration.ts assets 2>nul

echo.
echo --- Staging durumu ---
git status -sb
echo.

git diff --cached --quiet
if not errorlevel 1 (
  color 0C
  echo HATA: Hic dosya eklenmedi!
  echo Antivirus veya git add engellendi olabilir.
  pause
  exit /b 1
)

echo [4] Commit...
git -c user.name=exelance25 -c user.email=exelance25@users.noreply.github.com commit -m "feat: GASSTATION yeni proje"
if errorlevel 1 (
  echo Commit hatasi
  pause
  exit /b 1
)

echo [5] Push...
git push -u origin main --force
if errorlevel 1 (
  color 0C
  echo Push basarisiz — GitHub giris yap, tekrar dene.
  pause
  exit /b 1
)

color 0A
echo.
echo ===== BASARILI =====
start https://github.com/exelance25/gasstation
pause
