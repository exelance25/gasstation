@echo off
title GASSTATION Deploy + Tx Kurtarma
cd /d "C:\Users\omerr\.cursor\projects\empty-window"

echo.
echo ============================================================
echo   GASSTATION - Deploy Onayli Islem
echo ============================================================
echo   1. npm build
echo   2. git commit (native Sepolia -^> MON fix)
echo   3. git push origin main  --^> Vercel deploy ~3 dk
echo ============================================================
echo.
set /p ONAY=Devam etmek icin E yazin (Enter = iptal): 
if /i not "%ONAY%"=="E" (
  echo Iptal edildi.
  pause
  exit /b 0
)

echo.
echo [1/3] Build...
call npm.cmd run build
if errorlevel 1 (
  echo.
  echo BUILD BASARISIZ - push yapilmadi.
  pause
  exit /b 1
)

echo.
echo [2/3] Commit...
set GIT_AUTHOR_NAME=exelance25
set GIT_AUTHOR_EMAIL=exelance25@users.noreply.github.com
set GIT_COMMITTER_NAME=exelance25
set GIT_COMMITTER_EMAIL=exelance25@users.noreply.github.com

git add src/server/gas/ src/app/api/gas/ src/hooks/useGasPump.ts src/lib/api/dispense-gas.ts scripts/recover-native-deposit.mjs ORTAK_DISPENSE_FIX.cmd ORTAK_DEPLOY_NOW.cmd
git commit -m "fix: Sepolia native odeme MON teslimat + Vercel timeout + native retry"
if errorlevel 1 (
  echo Commit atlandi veya degisiklik yok.
)

echo.
echo [3/3] Push (Vercel deploy baslar)...
git push -u origin main
if errorlevel 1 (
  echo PUSH BASARISIZ - GitHub giris veya ag kontrol edin.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo   DEPLOY BASLADI
echo   Health: https://gasstation-flame.vercel.app/api/health
echo   ~3 dk sonra tx kurtarma:
echo.
echo   set TARGET=0xSIZIN_CUZDAN
echo   set ASSET=MON
echo   node scripts/recover-native-deposit.mjs
echo ============================================================
pause
