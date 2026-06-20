@echo off
cd /d "%~dp0"
echo Installing dependencies...
call npm.cmd install
if errorlevel 1 (
  echo Install failed.
  pause
  exit /b 1
)
echo Done. Run dev.cmd or: npm.cmd run dev
pause
