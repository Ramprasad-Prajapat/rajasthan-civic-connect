@echo off
title Rajasthan Civic Connect - Dev Server Launcher
echo ========================================================
echo     Starting Rajasthan Civic Connect (Dev Mode)
echo ========================================================
echo.
echo [1/2] Starting Backend Server (Port 5000) with Auto-Reload...
start "Rajasthan Civic Connect - Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

echo [2/2] Starting Frontend Server (Port 5173) with Vite HMR...
start "Rajasthan Civic Connect - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Waiting for servers to launch...
ping 127.0.0.1 -n 4 >nul

echo Opening App in Web Browser: http://localhost:5173
start http://localhost:5173

echo.
echo ========================================================
echo   SUCCESS! Backend and Frontend are running automatically.
echo   - Backend watches for changes and auto-restarts.
echo   - Frontend hot-reloads (HMR) instantly on save.
echo   - Database (Firebase/Firestore) is connected.
echo ========================================================
