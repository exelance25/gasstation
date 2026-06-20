@echo off
cd /d "%~dp0.."
echo === GASSTATION pre-push guvenlik kontrolu ===
echo.

echo [1] .env.local git izleme...
git ls-files .env.local 2>nul | findstr /R "." >nul
if %ERRORLEVEL%==0 (
  echo HATA: .env.local git'te izleniyor! Once kaldirin.
  exit /b 1
) else (
  echo OK — .env.local izlenmiyor
)

echo.
echo [2] Guvenlik taramasi...
call node scripts\security-audit.mjs
if %ERRORLEVEL% NEQ 0 (
  echo HATA: security audit basarisiz
  exit /b 1
)

echo.
echo [3] Git durumu...
git status -sb

echo.
echo === Temiz — commit ve push icin hazir ===
echo   git add -A
echo   git commit -m "feat: GASSTATION UI, SDK, Vercel hazirlik"
echo   git push -u origin main
