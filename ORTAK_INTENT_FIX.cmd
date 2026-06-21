@echo off

cd /d "C:\Users\omerr\.cursor\projects\empty-window"

set GIT_AUTHOR_NAME=exelance25

set GIT_AUTHOR_EMAIL=exelance25@users.noreply.github.com

set GIT_COMMITTER_NAME=exelance25

set GIT_COMMITTER_EMAIL=exelance25@users.noreply.github.com

echo Vercel siparis 500 fix deploy...

call npm run build

if errorlevel 1 exit /b 1

git add src/server/gas/signed-ticket.ts src/server/gas/pump-pass.ts src/server/gas/gas-order.ts src/server/gas/dispense-idempotency.ts src/server/gas/treasury-ledger.ts src/app/api/gas/intent/route.ts ORTAK_INTENT_FIX.cmd

git commit -m "fix: Vercel siparis — imzali bilet, disk yazimi yok"

git push -u origin main

echo Bitti. Vercel ~3 dk sonra /yakit-al tekrar dene.

