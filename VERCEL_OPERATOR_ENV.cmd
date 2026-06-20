@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title GASSTATION — Vercel operator env
color 0E

echo.
echo  Vercel'e sunucu degiskenleri (.env.local'den)
echo  EVM_OPERATOR_PRIVATE_KEY, COLLECTOR, RPC vb.
echo.
echo  ONCE: npm i -g vercel  ^&^&  vercel login
echo.

if not exist ".env.local" (
  echo HATA: .env.local yok
  pause
  exit /b 1
)

where vercel >nul 2>&1
if errorlevel 1 (
  echo HATA: vercel CLI yok. Calistir: npm i -g vercel
  pause
  exit /b 1
)

echo Proje: exelance25s-projects/gasstation
echo.

for %%K in (
  EVM_OPERATOR_PRIVATE_KEY
  COLLECTOR_ADDRESS
  NEXT_PUBLIC_COLLECTOR_ADDRESS
  ADMIN_WALLET_ADDRESS
  NEXT_PUBLIC_ETH_SEPOLIA_RPC
  NEXT_PUBLIC_MONAD_TESTNET_RPC
  NEXT_PUBLIC_BASE_SEPOLIA_RPC
  NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS
  NEXT_PUBLIC_BASE_USDC_ADDRESS
  MONAD_RPC_PRIVATE_URL
) do (
  set "VAL="
  for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /c:"%%K=" ".env.local"`) do set "VAL=%%B"
  if defined VAL (
    echo [+] %%K
    echo !VAL!| vercel env add %%K production --force 2>>vercel-env-log.txt
  ) else (
    echo [-] %%K .env.local'de yok, atlandi
  )
)

echo.
echo Bitti. Log: vercel-env-log.txt
echo Simdi Vercel'de Redeploy yap.
echo.
start https://vercel.com/exelance25s-projects/gasstation/deployments
pause
