@echo off
setlocal
cd /d "%~dp0"

echo.
echo === GASSTATION — Tam push duzeltmesi ===
echo.

REM contracts icindeki ayri .git push'u bozuyordu
if exist "contracts\.git" (
  echo contracts\.git kaldiriliyor ^(iç repo^)...
  rmdir /s /q "contracts\.git"
)

REM Submodule kalintisi — sadece kaynak kod gidecek
if exist ".gitmodules" del /f ".gitmodules"
git rm -rf --cached akln-nft/contracts/lib/forge-std 2>nul
git rm -rf --cached akln-nft/contracts/lib/openzeppelin-contracts 2>nul

echo Guvenlik...
call node scripts\security-audit.mjs
if errorlevel 1 exit /b 1

git remote set-url origin https://github.com/exelance25/gasstation.git

echo Dosyalar ekleniyor...
git add -A
git status -sb

git -c user.name=exelance25 -c user.email=exelance25@users.noreply.github.com commit -m "feat: GASSTATION tam kaynak — Next.js app, SDK, UI, docs"
if errorlevel 1 (
  git diff --cached --quiet
  if not errorlevel 1 echo Degisiklik yok.
)

echo Push...
git push origin main
if errorlevel 1 (
  echo HATA — gh auth login gerekebilir
  pause
  exit /b 1
)

echo.
echo === TAMAM ===
start https://github.com/exelance25/gasstation
start https://vercel.com/new/import?s=https://github.com/exelance25/gasstation
echo GitHub + Vercel acildi.
pause
