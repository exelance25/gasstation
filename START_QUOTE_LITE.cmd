@echo off

title GASSTATION — Quote + Settlement (Docker yok)

cd /d "%~dp0"

REM Docker olmadan Katman A+B+Web — matris testleri icin yeterli



echo ========================================

echo  GASSTATION Lite Stack (A+B+Web)

echo ========================================

echo.



echo [1/3] Quote Engine :4100...

start "GASSTATION Quote" cmd /k "cd /d %~dp0services\quote-engine && if not exist node_modules npm install && if not exist .env copy .env.example .env && npm run dev"



echo [2/3] Settlement Engine :4200...

start "GASSTATION Settlement" cmd /k "cd /d %~dp0services\settlement-engine && if not exist node_modules npm install && if not exist .env copy .env.example .env && npm run dev"



timeout /t 3 /nobreak >nul



echo [3/3] Web UI :3000...

start "GASSTATION Web" cmd /k "cd /d %~dp0 && npm.cmd run dev"



echo.

echo  Quote:        http://localhost:4100/health

echo  Settlement:   http://localhost:4200/health

echo  Yakit al:     http://localhost:3000/yakit-al

echo.

echo  Test: npm run test:matrix

echo.

pause

