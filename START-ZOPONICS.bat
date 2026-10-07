@echo off
TITLE Zoqonyx Email Marketing - Platform Launcher
COLOR 0B
SETLOCAL EnableDelayedExpansion

echo ===============================================================================
echo   ZOQONYX EMAIL MARKETING - COMMERCIAL SAAS PLATFORM
echo   Developed by: NAWIX TECH SOLUTION (https://newixtechsolutions.com/)
echo ===============================================================================
echo.

:: 1. Check Node.js
echo [1/6] Verifying Node.js environment...
where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    COLOR 0C
    echo [ERROR] Node.js is NOT installed or not found in system PATH.
    echo Please install Node.js v20+ from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)
node -v
echo [OK] Node.js is ready.
echo.

:: 2. Check Dependencies
echo [2/6] Verifying project dependencies...
IF NOT EXIST "node_modules\" (
    echo [INFO] Installing required dependencies...
    call npm install
    IF %ERRORLEVEL% NEQ 0 (
        COLOR 0C
        echo [ERROR] Failed to install npm dependencies.
        pause
        exit /b 1
    )
)
echo [OK] Dependencies verified.
echo.

:: 3. Generate Prisma Client
echo [3/6] Generating Prisma ORM Client...
call npx prisma generate
IF %ERRORLEVEL% NEQ 0 (
    echo [WARN] Prisma generation had warnings, continuing...
)
echo.

:: 4. Database Setup & Seeding
echo [4/6] Initializing Database Schema & Demo Organization...
call npx prisma db push --skip-generate
call npx tsx prisma/seed.ts
echo.

:: 5. Launch Background Worker & Web Application
echo [5/6] Starting Zoqonyx Asynchronous Worker & Next.js Server...
echo.
echo Starting Web Server on http://localhost:3000...
start "Zoqonyx Web Server" cmd /k "npm run dev"

echo.
echo Starting Background Campaign Queue Worker...
start "Zoqonyx Queue Worker" cmd /k "npm run worker"

:: 6. Launch Browser
echo [6/6] Launching default browser...
timeout /t 3 >nul
start http://localhost:3000

echo.
echo ===============================================================================
echo   ZOQONYX IS RUNNING!
echo   Web Application: http://localhost:3000
echo   Super Admin:     http://localhost:3000/admin (admin@zoqonyx.com)
echo   Developer:       Nawix Tech Solution (https://newixtechsolutions.com/)
echo ===============================================================================
echo.
echo Press any key to close this launcher window (Services will continue running in background).
pause >nul
