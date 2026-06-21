@echo off
cd /d "C:\Users\omerr\.cursor\projects\empty-window"
set GIT_AUTHOR_NAME=exelance25
set GIT_AUTHOR_EMAIL=exelance25@users.noreply.github.com
set GIT_COMMITTER_NAME=exelance25
set GIT_COMMITTER_EMAIL=exelance25@users.noreply.github.com
echo Dispense 500 + retry + otomatik SDK fix deploy...
call npm run build
if errorlevel 1 exit /b 1
git add src/server/gas/ src/app/api/gas/ src/app/api/health/route.ts src/hooks/useGasPump.ts src/lib/api/deposit-intent.ts src/lib/auto-fee/path-resolver.ts src/config/client-env.ts packages/fee-sdk/src/auto-sponsor.ts packages/fee-sdk/src/index.ts packages/gas-engine-stub/index.ts sdk/src/auto-sponsor.ts sdk/src/index.ts ORTAK_DISPENSE_FIX.cmd
git commit -m "fix: gas teslimat 500 + retry recovery + otomatik SDK sponsor"
git push -u origin main
echo Bitti. Vercel ~3 dk. Health: /api/health operators.tanks
