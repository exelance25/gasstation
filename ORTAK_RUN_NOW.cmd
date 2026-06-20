@echo off
cd /d "C:\Users\omerr\.cursor\projects\empty-window"
echo ===== START %DATE% %TIME% ===== > ortak-deploy-log.txt

REM Git kimligi (commit icin — global config gerekmez)
set GIT_AUTHOR_NAME=exelance25
set GIT_AUTHOR_EMAIL=exelance25@users.noreply.github.com
set GIT_COMMITTER_NAME=exelance25
set GIT_COMMITTER_EMAIL=exelance25@users.noreply.github.com

echo [1/4] npm install >> ortak-deploy-log.txt
call npm install >> ortak-deploy-log.txt 2>&1
echo INSTALL_EXIT:%ERRORLEVEL% >> ortak-deploy-log.txt

echo [2/4] npm run build >> ortak-deploy-log.txt
call npm run build >> ortak-deploy-log.txt 2>&1
echo BUILD_EXIT:%ERRORLEVEL% >> ortak-deploy-log.txt
if errorlevel 1 (
  echo BUILD BASARISIZ >> ortak-deploy-log.txt
  exit /b 1
)

echo [3/4] git add + commit >> ortak-deploy-log.txt
git add -A >> ortak-deploy-log.txt 2>&1
git commit -m "refactor: marka adi gasstation (@gasstation/sdk) + operator env redeploy" >> ortak-deploy-log.txt 2>&1
echo COMMIT_EXIT:%ERRORLEVEL% >> ortak-deploy-log.txt

echo [4/4] git push >> ortak-deploy-log.txt
git push -u origin main >> ortak-deploy-log.txt 2>&1
echo PUSH_EXIT:%ERRORLEVEL% >> ortak-deploy-log.txt
git log -1 --oneline >> ortak-deploy-log.txt 2>&1
echo ===== END %DATE% %TIME% ===== >> ortak-deploy-log.txt
echo.
type ortak-deploy-log.txt | findstr /i "EXIT COMMIT_EXIT PUSH_EXIT BUILD_EXIT"
pause
