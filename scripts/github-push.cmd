@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0.."

echo.
echo === GASSTATION GitHub Push (guvenli) ===
echo.

REM --- 1. Guvenlik ---
echo [1/5] Guvenlik taramasi...
call node scripts\security-audit.mjs
if errorlevel 1 (
  echo HATA: Guvenlik taramasi basarisiz — push durduruldu.
  exit /b 1
)

git ls-files .env.local 2>nul | findstr /R "." >nul
if not errorlevel 1 (
  echo HATA: .env.local git'te izleniyor!
  exit /b 1
)
echo OK — .env.local izlenmiyor

REM --- 2. Git kimligi (global config degistirmez) ---
if "%GIT_USER_NAME%"=="" set GIT_USER_NAME=omerr
if "%GIT_USER_EMAIL%"=="" set GIT_USER_EMAIL=omerr@users.noreply.github.com

echo.
echo [2/5] Commit kimligi: %GIT_USER_NAME% ^<%GIT_USER_EMAIL%^>
echo       Farkli kullanmak icin: set GIT_USER_NAME=... ^& set GIT_USER_EMAIL=...

REM --- 3. Placeholder remote temizle ---
echo.
echo [3/5] Remote kontrol...
git remote get-url origin >nul 2>&1
if not errorlevel 1 (
  for /f "delims=" %%u in ('git remote get-url origin') do set ORIGIN_URL=%%u
  echo !ORIGIN_URL! | findstr /I "SENIN_KULLANICI" >nul
  if not errorlevel 1 (
    echo Placeholder remote kaldiriliyor...
    git remote remove origin
  )
)

REM --- 4. Stage + commit ---
echo.
echo [4/5] Stage ve commit...
git add -A
git status -sb

git rev-parse HEAD >nul 2>&1
if errorlevel 1 (
  git -c user.name="%GIT_USER_NAME%" -c user.email="%GIT_USER_EMAIL%" commit -m "feat: GASSTATION — cross-chain gas pump, SDK, UI ve Vercel hazirlik"
  if errorlevel 1 (
    echo HATA: Commit basarisiz.
    exit /b 1
  )
) else (
  git diff --cached --quiet
  if errorlevel 1 (
    git -c user.name="%GIT_USER_NAME%" -c user.email="%GIT_USER_EMAIL%" commit -m "feat: GASSTATION — UI, SDK, iletisim formu, deploy hazirlik"
  ) else (
    echo Degisiklik yok — commit atlandi.
  )
)

REM --- 5. Push ---
echo.
echo [5/5] Push...
git remote get-url origin >nul 2>&1
if errorlevel 1 (
  echo.
  echo REMOTE YOK — once GitHub'da repo olustur, sonra:
  echo   git remote add origin https://github.com/KULLANICI/gasstation.git
  echo   git push -u origin main
  echo.
  echo GitHub yeni repo: https://github.com/new
  start https://github.com/new?name=gasstation^&description=GASSTATION+cross-chain+gas+pump
  exit /b 0
)

git push -u origin main
if errorlevel 1 (
  echo.
  echo Push basarisiz — GitHub giris / repo URL kontrol et.
  echo   gh auth login
  echo   git remote set-url origin https://github.com/KULLANICI/gasstation.git
  exit /b 1
)

echo.
echo === Push tamam ===
endlocal
