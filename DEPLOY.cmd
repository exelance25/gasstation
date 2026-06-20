@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo.
echo  ============================================
echo   GASSTATION — Deploy (onayli adimlar)
echo   Repo: https://github.com/exelance25/gasstation
echo  ============================================
echo.

set GIT_USER_NAME=exelance25
set GIT_USER_EMAIL=exelance25@users.noreply.github.com
set REPO_URL=https://github.com/exelance25/gasstation.git

REM --- ADIM 0: GitHub ac ---
echo [0] GitHub repo aciliyor...
start https://github.com/exelance25/gasstation
timeout /t 2 >nul

REM --- ADIM 1: Guvenlik ---
echo.
echo [1/4] Guvenlik taramasi...
call node scripts\security-audit.mjs
if errorlevel 1 (
  echo HATA: Guvenlik — push durdu.
  pause
  exit /b 1
)
echo OK
echo.
choice /C YN /M "Guvenlik temiz — GitHub PUSH onayliyor musun"
if errorlevel 2 (
  echo Push iptal.
  pause
  exit /b 0
)

REM --- ADIM 2: Remote + commit + push ---
echo.
echo [2/4] Git push hazirligi...

REM contracts icindeki ic .git push'u bozar
if exist "contracts\.git" (
  echo contracts\.git kaldiriliyor...
  rmdir /s /q "contracts\.git"
)
if exist ".gitmodules" del /f ".gitmodules"
git rm -rf --cached akln-nft/contracts/lib/forge-std 2>nul
git rm -rf --cached akln-nft/contracts/lib/openzeppelin-contracts 2>nul

git remote get-url origin >nul 2>&1
if errorlevel 1 (
  git remote add origin %REPO_URL%
) else (
  git remote set-url origin %REPO_URL%
)

git add -A
git status -sb

git rev-parse HEAD >nul 2>&1
if errorlevel 1 (
  git -c user.name="%GIT_USER_NAME%" -c user.email="%GIT_USER_EMAIL%" commit -m "feat: GASSTATION — cross-chain gas pump, SDK, UI, Vercel hazirlik"
) else (
  git diff --cached --quiet
  if not errorlevel 1 (
    echo Degisiklik yok — commit atlandi.
  ) else (
    git -c user.name="%GIT_USER_NAME%" -c user.email="%GIT_USER_EMAIL%" commit -m "feat: GASSTATION — UI, SDK, deploy hazirlik"
  )
)

echo.
echo Push basliyor (GitHub giris penceresi acilabilir)...
git push -u origin main
if errorlevel 1 (
  echo.
  echo Push basarisiz. Cozum:
  echo   gh auth login
  echo   .\DEPLOY.cmd
  pause
  exit /b 1
)
echo OK — push tamam!
start https://github.com/exelance25/gasstation

REM --- ADIM 3: Vercel ---
echo.
choice /C YN /M "Vercel deploy sayfasini acayim mi"
if not errorlevel 2 (
  echo [3/4] Vercel import...
  start https://vercel.com/new/import?s=https://github.com/exelance25/gasstation
  echo.
  echo Vercel'de:
  echo   - Framework: Next.js (otomatik)
  echo   - Env: NEXT_PUBLIC_APP_ENV=testnet
  echo   - Env: NEXT_PUBLIC_GITHUB_REPO=https://github.com/exelance25/gasstation
  echo   - Env: NEXT_PUBLIC_WC_PROJECT_ID=Reown project id
  echo   - Operator key'leri SADECE Production + Encrypted
  echo.
  echo Detay: docs\VERCEL_DEPLOY.md
) else (
  echo Vercel atlandi.
)

REM --- ADIM 4: Domain ---
echo.
choice /C YN /M "Vercel domain ayarlari acilsin mi (vercel.app)"
if not errorlevel 2 (
  echo [4/4] Deploy sonrasi Vercel ^> Project ^> Settings ^> Domains
  start https://vercel.com/dashboard
)

echo.
echo === Bitti ===
echo GitHub: https://github.com/exelance25/gasstation
pause
endlocal
