@echo off
cd /d "C:\Users\omerr\.cursor\projects\empty-window"
echo ===== START %DATE% %TIME% ===== > redeploy-log.txt
git log -1 --oneline >> redeploy-log.txt 2>&1
git commit --allow-empty -m "chore: redeploy — pick up EVM_OPERATOR_PRIVATE_KEY on Vercel" >> redeploy-log.txt 2>&1
git push -u origin main >> redeploy-log.txt 2>&1
echo EXIT: %ERRORLEVEL% >> redeploy-log.txt
git log -1 --oneline >> redeploy-log.txt 2>&1
