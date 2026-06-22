@echo off

cd /d "C:\Users\omerr\.cursor\projects\empty-window"

set GIT_AUTHOR_NAME=exelance25

set GIT_AUTHOR_EMAIL=exelance25@users.noreply.github.com

set GIT_COMMITTER_NAME=exelance25

set GIT_COMMITTER_EMAIL=exelance25@users.noreply.github.com

echo Kasa + JSON fix deploy...

call npm run build

if errorlevel 1 exit /b 1

git add src/app/api/treasury/collector/route.ts src/app/api/health/route.ts src/hooks/useCollectorAddress.ts src/hooks/useGasPump.ts src/lib/api/parse-response-json.ts src/lib/api/dispense-precheck.ts src/lib/api/dispense-gas.ts src/lib/api/deposit-intent.ts ORTAK_KASA_FIX.cmd

git commit -m "fix: kasa sunucudan + guvenli API JSON parse"

git push -u origin main

echo Bitti. Vercel ~3 dk.

