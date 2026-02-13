@echo off
REM Vendor Portal Load Test Runner
REM Simple batch script to run the load test

echo ========================================
echo Vendor Portal Load Test
echo ========================================
echo.

REM Check if k6 is installed
where k6 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: k6 is not installed
    echo.
    echo Please install k6 first:
    echo   choco install k6
    echo   OR
    echo   winget install k6
    echo.
    pause
    exit /b 1
)

echo k6 is installed
k6 version
echo.

echo Starting load test...
echo Duration: ~27 minutes
echo Max VUs: 500
echo.

REM Set environment variables
set API_BASE_URL=http://localhost:8000
set TENANT_DOMAIN=localhost

REM Run the load test
k6 run k6/load-tests/vendor-portal-load-test.js

echo.
echo ========================================
echo Load test completed!
echo Check results in: k6/results/
echo ========================================
pause
