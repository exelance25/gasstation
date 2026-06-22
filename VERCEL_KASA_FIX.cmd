@echo off
title GASSTATION — Vercel KASA (NEXT_PUBLIC_COLLECTOR)
color 0E
cd /d "C:\Users\omerr\.cursor\projects\empty-window"
echo.
echo  SORUN: "Kasa yapilandirilmamis"
echo  Operator KEY tamam — kasa ADRESI tarayicida eksik.
echo.
echo  Vercel'e EKLE (Production + Preview):
echo    NEXT_PUBLIC_COLLECTOR_ADDRESS
echo  Deger: COLLECTOR_ADDRESS ile AYNI 0x... adres
echo        (private key DEGIL!)
echo.
echo  Ornek .env.local satiri:
findstr /b "NEXT_PUBLIC_COLLECTOR COLLECTOR_ADDRESS" .env.local 2>nul
echo.
echo  Sonra: Redeploy (Use existing Build Cache KAPALI)
echo.
start https://vercel.com/exelance25s-projects/gasstation/settings/environment-variables
echo.
echo  CLI ile (vercel login gerekir):
echo    vercel env add NEXT_PUBLIC_COLLECTOR_ADDRESS production
echo    vercel env add NEXT_PUBLIC_COLLECTOR_ADDRESS preview
echo.
pause
