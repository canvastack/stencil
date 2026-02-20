@echo off
REM Payment Simulation Seeder Runner (Windows)
REM This script runs the PaymentSimulationSeeder to create test payment data

echo.
echo 🚀 Running Payment Simulation Seeder...
echo.

php artisan db:seed --class=PaymentSimulationSeeder

echo.
echo ✅ Payment simulation data created!
echo.
echo 📊 Summary of created quotes:
echo   1. Pending Payment - Just accepted, awaiting payment
echo   2. Partial Payment - 50%% DP paid, production starting
echo   3. Fully Paid - 100%% paid, in production
echo   4. Overdue Payment - Payment deadline passed
echo   5. Refunded Payment - Order cancelled, refunded
echo.
echo 🔗 View quotes at: http://localhost:5173/customer/quotes
echo 👤 Login as: customer@demo.com
echo.
pause
