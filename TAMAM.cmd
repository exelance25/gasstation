@echo off
cd /d "%~dp0"
cls
echo.
echo   ========================================
echo     GASSTATION - GitHub'a yukle
echo   ========================================
echo.
echo   LUTFEN HICBIR SEY YAPISTIRMA.
echo   Bu pencere kapanana kadar bekle.
echo.
pause
if exist "contracts\.git" rmdir /s /q "contracts\.git"
if exist ".gitmodules" del /f ".gitmodules"
git rm -rf --cached akln-nft/contracts/lib/forge-std 2>nul
git rm -rf --cached akln-nft/contracts/lib/openzeppelin-contracts 2>nul
node scripts\security-audit.mjs
if errorlevel 1 ( echo GUvenlik hatasi & pause & exit /b 1 )
git remote set-url origin https://github.com/exelance25/gasstation.git 2>nul
git remote add origin https://github.com/exelance25/gasstation.git 2>nul
git add -A
git -c user.name=exelance25 -c user.email=exelance25@users.noreply.github.com commit -m "feat: GASSTATION tam kaynak" 2>nul
git push -u origin main
if errorlevel 1 (
  echo.
  echo  PUSH BASARISIZ - GitHub giris penceresine bak
  pause
  exit /b 1
)
echo.
echo  ===== BASARILI =====
echo  Kod GitHub'a gitti!
start https://github.com/exelance25/gasstation
start https://vercel.com/new/import?s=https://github.com/exelance25/gasstation
echo.
pause
