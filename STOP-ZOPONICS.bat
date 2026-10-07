@echo off
TITLE Zoqonyx Email Marketing - Graceful Stop
COLOR 0E

echo ===============================================================================
echo   ZOQONYX EMAIL MARKETING - GRACEFUL SHUTDOWN
echo   Developed by: NAWIX TECH SOLUTION (https://newixtechsolutions.com/)
echo ===============================================================================
echo.

echo [INFO] Stopping all running Next.js and Worker Node processes on Windows...

:: Kill node tasks associated with Next.js or tsx
taskkill /F /FI "WINDOWTITLE eq Zoqonyx Web Server*" >nul 2>nul
taskkill /F /FI "WINDOWTITLE eq Zoqonyx Queue Worker*" >nul 2>nul

echo.
echo [OK] All Zoqonyx services have been gracefully stopped.
echo.
pause
