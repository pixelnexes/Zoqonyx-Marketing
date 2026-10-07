@echo off
TITLE Zoqonyx Email Marketing - Restart
COLOR 0B

echo ===============================================================================
echo   RESTARTING ZOQONYX EMAIL MARKETING PLATFORM
echo ===============================================================================
echo.

call STOP-ZOPONICS.bat
timeout /t 2 >nul
call START-ZOPONICS.bat
