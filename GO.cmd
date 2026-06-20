@echo off
title GASSTATION — Baslat
cd /d "%~dp0"
REM PowerShell: .\GO.cmd  veya  npm run go

echo.
echo  GASSTATION — Yerel sunucu
echo  ==========================
echo.

if not exist "node_modules\next\" (
  echo [1/2] Paketler kuruluyor...
  call npm.cmd install
  if errorlevel 1 goto :fail
) else (
  echo [1/2] node_modules OK
)

echo [2/2] Dev sunucusu baslatiliyor...
echo.
echo  http://localhost:3000/yakit-al
echo.

start /B cmd /c "timeout /t 12 /nobreak >nul && start http://localhost:3000/yakit-al"
call npm.cmd run dev
goto :end

:fail
echo Kurulum basarisiz.
pause
exit /b 1

:end
pause
