@echo off
TITLE Zoqonyx Email Marketing - Health Diagnostics
COLOR 0A

echo ===============================================================================
echo   ZOQONYX EMAIL MARKETING - SYSTEM HEALTH AUDIT
echo   Developed by: NAWIX TECH SOLUTION (https://newixtechsolutions.com/)
echo ===============================================================================
echo.

echo [INFO] Querying live health diagnostics from http://localhost:3000/api/health ...
echo.

curl -s http://localhost:3000/api/health
echo.
echo.
echo [INFO] Running Vitest regression test suite...
call npx vitest run

echo.
echo ===============================================================================
echo Diagnostics complete.
echo ===============================================================================
pause
