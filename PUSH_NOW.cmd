@echo off
cd /d "%~dp0"
echo PowerShell icin: .\DEPLOY.cmd  veya  .\PUSH_NOW.cmd
call "%~dp0DEPLOY.cmd"
