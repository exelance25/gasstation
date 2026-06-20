@echo off
title GASSTATION — isim duzeltme + Vercel redeploy
color 0B
cd /d "C:\Users\omerr\.cursor\projects\empty-window"
echo.
echo  1) npm install
echo  2) npm run build
echo  3) git push (Vercel yeni deploy — operator env icin)
echo.
pause
call npm install
call npm run build
if errorlevel 1 (
  color 0C
  echo BUILD BASARISIZ — hata yukarida
  pause
  exit /b 1
)
git add -A
git commit -m "refactor: marka adi gasstation (@gasstation/sdk) + operator env redeploy"
git push -u origin main
color 0A
echo.
echo  Push OK. Vercel ~3 dk sonra:
echo  https://gasstation-flame.vercel.app/api/health
echo  operators.evm: true olmali
start https://vercel.com/exelance25s-projects/gasstation/deployments
pause
