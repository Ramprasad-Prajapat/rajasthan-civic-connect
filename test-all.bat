@echo off
setlocal
set "PROJECT_ROOT=%~dp0"

echo ========================================================
echo Running Full Test Suite (Rajasthan Civic Connect)
echo ========================================================

echo [1/2] Running Backend Tests with Maven Wrapper...
cd /d "%PROJECT_ROOT%backend"
call mvnw.cmd test
if errorlevel 1 (
    echo [ERROR] Backend tests failed!
    exit /b 1
)

echo.
echo [2/2] Running Frontend Production Build with Vite...
cd /d "%PROJECT_ROOT%frontend"
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed!
    exit /b 1
)

echo.
echo ========================================================
echo [SUCCESS] All backend tests and frontend build passed!
echo ========================================================
exit /b 0
