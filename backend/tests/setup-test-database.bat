@echo off
REM Test Database Setup Script for Windows
REM This script creates and configures the test database for PHPUnit tests

setlocal enabledelayedexpansion

REM Configuration
set DB_HOST=127.0.0.1
set DB_PORT=5432
set DB_USERNAME=postgres
set DB_PASSWORD=@admin
set DB_NAME=stencil_canvastack_test

echo ==========================================
echo Test Database Setup
echo ==========================================
echo Host: %DB_HOST%
echo Port: %DB_PORT%
echo Database: %DB_NAME%
echo Username: %DB_USERNAME%
echo ==========================================

REM Check if psql is available
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: psql command not found
    echo Please ensure PostgreSQL is installed and psql is in your PATH
    exit /b 1
)

echo Checking PostgreSQL connection...

REM Drop existing test database if it exists
echo Dropping existing test database (if exists)...
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USERNAME% -c "DROP DATABASE IF EXISTS %DB_NAME%;" postgres
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to drop existing database
    exit /b 1
)
echo √ Existing test database dropped

REM Create test database
echo Creating test database...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USERNAME% -c "CREATE DATABASE %DB_NAME%;" postgres
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to create test database
    exit /b 1
)
echo √ Test database created

REM Run migrations
echo Running migrations...
cd /d "%~dp0\.."
php artisan migrate --env=testing --force
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to run migrations
    exit /b 1
)
echo √ Migrations completed

REM Optional: Seed test data
set /p SEED_DATA="Do you want to seed test data? (y/n): "
if /i "%SEED_DATA%"=="y" (
    echo Seeding test data...
    php artisan db:seed --env=testing --class=Testing\VendorPortalInfrastructureTestSeeder
    if %ERRORLEVEL% NEQ 0 (
        echo Warning: Failed to seed test data
    ) else (
        echo √ Test data seeded
    )
)

echo ==========================================
echo Test database setup complete!
echo ==========================================
echo You can now run tests with:
echo   php artisan test
echo   php artisan test --testsuite=Unit
echo   php artisan test --testsuite=Integration
echo   php artisan test --testsuite=Feature
echo ==========================================

endlocal
