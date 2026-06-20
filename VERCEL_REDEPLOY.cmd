@echo off
title GASSTATION — Vercel Redeploy (env sonrasi)
color 0B
echo.
echo  Operator key Vercel'de var ama CANLI deploy eski.
echo  Bu script GitHub'a bos commit atip yeni deploy tetikler.
echo.
pause
cd /d "C:\Users\omerr\.cursor\projects\empty-window"
git add vercel.json 2>nul
git commit --allow-empty -m "chore: redeploy — pick up EVM_OPERATOR_PRIVATE_KEY on Vercel"
git push -u origin main
if errorlevel 1 (
  color 0C
  echo PUSH BASARISIZ
  pause
  exit /b 1
)
color 0A
echo.
echo  Push OK — Vercel ~3 dk icinde yeni deploy.
echo  Sonra test: https://gasstation-flame.vercel.app/api/health
echo  operators.evm true olmali.
start https://vercel.com/exelance25s-projects/gasstation/deployments
pause
