@echo off
title Stopping Compounder Screener
cd /d "D:\compounder-screener"

echo Stopping Compounder Screener services (ports 8000 and 5173)...
powershell.exe -ExecutionPolicy Bypass -File "D:\compounder-screener\scripts\stop_app.ps1"
echo Done!
ping -n 3 127.0.0.1 >nul
