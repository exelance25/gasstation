@echo off
title GASSTATION
cd /d "%~dp0"

echo.
echo  GASSTATION — Yerel sunucu
echo  ==========================
echo.

if not exist "node_modules\" (
  echo [1/2] Paketler kuruluyor...
  call npm.cmd install
  if errorlevel 1 goto :fail
)

echo [2/2] Sunucu baslatiliyor...
echo.
echo  Uygulama: http://localhost:3000/yakit-al
echo  Bu pencereyi KAPATMAYIN.
echo.

start "" "http://localhost:3000/yakit-al"
call npm.cmd run dev
goto :end

:fail
echo Kurulum basarisiz.
pause
exit /b 1

:end
pause
