@echo off
setlocal
echo ========================================================
echo Starting Rajasthan Civic Connect (Simple Stack)
echo Backend:  http://localhost:8080/api/health
echo Frontend: http://localhost:5173
echo ========================================================

set "PROJECT_ROOT=%~dp0"

echo Starting Spring Boot Backend in window 'civic-backend'...
start "civic-backend" cmd /k "cd /d "%PROJECT_ROOT%backend" && call mvnw.cmd spring-boot:run"

echo Starting Vite Frontend in window 'civic-frontend'...
start "civic-frontend" cmd /k "cd /d "%PROJECT_ROOT%frontend" && npm run dev"

echo Both processes launched.
echo Frontend URL: http://localhost:5173
echo Backend Health: http://localhost:8080/api/health
