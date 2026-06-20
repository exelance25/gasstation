@echo off
title GASSTATION - Otomatik Test
cd /d "%~dp0"

echo.
echo  GASSTATION otomatik test basliyor...
echo.

if not exist "node_modules\next\" (
  echo [1/5] Paketler kuruluyor...
  call npm.cmd install
  if errorlevel 1 goto :fail
) else (
  echo [1/5] node_modules OK
)

echo [2/5] Dev sunucusu yeni pencerede baslatiliyor...
start "GASSTATION-DEV" cmd /c "cd /d %~dp0 && npm.cmd run dev"

echo [3/5] Sunucu hazir olana kadar bekleniyor...
set /a tries=0
:wait_loop
set /a tries+=1
powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000/api/health' -TimeoutSec 3).StatusCode -eq 200 } catch { $false }" >nul 2>&1
if %errorlevel%==0 goto :server_ready
if %tries% GEQ 30 goto :server_timeout
timeout /t 2 /nobreak >nul
goto :wait_loop

:server_ready
echo [4/5] Testler calisiyor...
echo.
call npm.cmd run lint
if errorlevel 1 goto :fail_tests
call npm.cmd run test:workflow
if errorlevel 1 goto :fail_tests
call npm.cmd run test:quick
if errorlevel 1 goto :fail_tests

echo.
echo [5/5] Tum testler tamamlandi.
echo.
goto :end

:server_timeout
echo.
echo Sunucu 60 saniye icinde hazir olmadi.
echo Dev penceresini kontrol edin: GASSTATION-DEV
echo.
goto :end

:fail_tests
echo.
echo Testlerden en az biri basarisiz.
echo Ciktiyi bu sohbete yapistir, eksikleri ben kapatayim.
echo.
goto :end

:fail
echo.
echo Kurulum / komut hatasi.
echo.

:end
pause
