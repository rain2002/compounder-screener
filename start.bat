@echo off
title Compounder Screener
cd /d "D:\compounder-screener"

echo =================================================================
echo   Compounder Screener - Starting Full Stack Simultaneously
echo   Backend:  http://127.0.0.1:8000
echo   Frontend: http://127.0.0.1:5173
echo =================================================================
echo.

:: 1. Trigger FastAPI Backend in background
start "Compounder Backend (8000)" /min cmd /c "D:\compounder-screener\scripts\run_backend.cmd"

:: 2. Trigger Vite Frontend at the same time in background
start "Compounder Frontend (5173)" /min cmd /c "D:\compounder-screener\scripts\run_frontend.cmd"

echo [OK] Both Backend and Frontend triggered simultaneously!
echo Waiting for services to initialize...
ping -n 4 127.0.0.1 >nul

:: 3. Automatically open the browser
echo Launching http://localhost:5173 in browser...
start http://localhost:5173
