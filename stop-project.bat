@echo off
setlocal
echo Stopping Rajasthan Civic Connect processes...

taskkill /FI "WINDOWTITLE eq civic-backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq civic-frontend*" /T /F >nul 2>&1

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /PID %%a /T /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173 ^| findstr LISTENING') do (
    taskkill /PID %%a /T /F >nul 2>&1
)

echo All services stopped.
