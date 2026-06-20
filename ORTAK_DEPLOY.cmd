@echo off

setlocal EnableDelayedExpansion

cd /d "%~dp0"

title ORTAK — Build + GitHub + Vercel

color 0E



set LOG=%~dp0deploy-log.txt

echo ===== ORTAK DEPLOY %DATE% %TIME% ===== > "%LOG%"



echo.

echo  ORTAK — GASSTATION canliya cikis

echo  Log: deploy-log.txt

echo.

pause



call :step "Temizlik" "if exist contracts\.git rmdir /s /q contracts\.git & if exist .gitmodules del /f .gitmodules"

call :step "Git durum" "git status -sb"

call :step "Remote" "git remote -v"



echo.

echo  BUILD basliyor (3-5 dk)...

call :step "npm run build" "call npm.cmd run build"

if errorlevel 1 (

  color 0C

  echo.

  echo  BUILD BASARISIZ — deploy-log.txt dosyasina bak

  type "%LOG%"

  pause

  exit /b 1

)



color 0A

echo  BUILD OK!

echo.



if not exist ".git" (

  call :step "git init" "git init -b main"

  call :step "remote add" "git remote add origin https://github.com/exelance25/gasstation.git"

)



call :step "git add" "git add .gitignore README.md LICENSE package.json package-lock.json next.config.ts tsconfig.json vercel.json tailwind.config.ts postcss.config.js postcss.config.mjs components.json .eslintrc.json .npmrc .env.example .env.testnet.example .env.mainnet.example .env.test.local.example dev.cmd DEPLOY.cmd GASSTATION_YENI.cmd VERCEL_HAZIR.cmd ORTAK_DEPLOY.cmd NASIL_YUKLE.txt docker-compose.yml public src config sdk packages docs scripts hooks services contracts/src contracts/script contracts/test contracts/foundry.toml contracts/README.md test-integration.ts assets 2>nul"



git diff --cached --quiet

if errorlevel 1 (

  call :step "commit" "git -c user.name=exelance25 -c user.email=exelance25@users.noreply.github.com commit -m \"fix: Vercel build — SDK alias, eslint, env\""

) else (

  echo Degisiklik yok >> "%LOG%"

)



call :step "git push" "git push -u origin main"

if errorlevel 1 (
  echo Push reddedildi — rebase deneniyor... >> "%LOG%"
  call :step "git pull rebase" "git pull --rebase origin main"
  call :step "git push retry" "git push -u origin main"
)



echo.

echo  ===== GITHUB TAMAM =====

echo  https://github.com/exelance25/gasstation

echo.



where vercel >nul 2>&1

if not errorlevel 1 (

  echo  Vercel CLI bulundu — deploy deneniyor...

  call :step "vercel deploy" "vercel --prod --yes"

) else (

  echo  Vercel CLI yok — tarayicidan import et

  start https://vercel.com/new/import?s=https://github.com/exelance25/gasstation

)



echo.

echo  Vercel env (Settings ^> Environment Variables):

echo    NEXT_PUBLIC_APP_ENV=testnet

echo    NEXT_PUBLIC_WC_PROJECT_ID=Reown project id

echo    NEXT_PUBLIC_GITHUB_REPO=https://github.com/exelance25/gasstation

echo.

start https://vercel.com/dashboard

echo  Log kaydedildi: %LOG%

pause

exit /b 0



:step

echo [%~1] ...

echo. >> "%LOG%"

echo ===== %~1 ===== >> "%LOG%"

%~2 >> "%LOG%" 2>&1

echo EXIT: %ERRORLEVEL% >> "%LOG%"

exit /b %ERRORLEVEL%

