@echo off
TITLE Zoqonyx Email Marketing - Database Reset
COLOR 0C

echo ===============================================================================
echo   WARNING: ZOQONYX DATABASE RESET & RE-SEED
echo ===============================================================================
echo This will reset the development database and restore fresh demo organizations.
echo.
set /p CONFIRM="Are you sure you want to proceed? (Y/N): "
if /i "%CONFIRM%" neq "Y" (
    echo Reset cancelled.
    pause
    exit /b 0
)

echo.
echo [1/2] Pushing fresh schema migrations...
call npx prisma db push --force-reset

echo.
echo [2/2] Seeding initial plans, admin account, and demo sequences...
call npx tsx prisma/seed.ts

echo.
echo [OK] Database reset and demo seeding complete.
pause
