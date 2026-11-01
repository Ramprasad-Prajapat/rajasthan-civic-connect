@echo off
setlocal
echo ========================================================
echo Starting Rajasthan Civic Connect (Simple Stack)
echo Backend:  http://localhost:8080/api/health
echo Frontend: http://localhost:5173
echo ========================================================

set "PROJECT_ROOT=%~dp0"

echo Starting Spring Boot Backend in window 'civic-backend'...
start "civic-backend" /d "%PROJECT_ROOT%backend" cmd /k "mvnw.cmd spring-boot:run"

echo Starting Vite Frontend in window 'civic-frontend'...
start "civic-frontend" /d "%PROJECT_ROOT%frontend" cmd /k "npm run dev"

echo Both processes launched.
echo Frontend URL: http://localhost:5173
echo Backend Health: http://localhost:8080/api/health
