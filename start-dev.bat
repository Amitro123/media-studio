@echo off
chcp 65001 > nul
echo.
echo  Media Studio - Development Servers
echo ========================================
echo.

REM Navigate to script directory
cd /d "%~dp0"

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo.
)

REM Start backend in new window
echo Starting FastAPI backend on port 8000...
start "Media Studio Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --port 8000"

REM Wait for backend to initialize
echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

REM Start frontend in new window
echo Starting Vite frontend on port 5173...
start "Media Studio Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo  Both servers started!
echo ========================================
echo.
echo  Frontend: http://localhost:5173
echo  Backend API: http://localhost:8000/docs
echo.
echo  Close this window to continue working.
echo  Close the server windows to stop them.
echo.
