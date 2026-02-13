#!/bin/bash

echo "========================================"
echo "CanvaStencil Queue Worker"
echo "========================================"
echo ""
echo "Starting queue worker for vendor emails..."
echo "Queue: vendor-emails"
echo "Max Attempts: 3"
echo "Timeout: 120 seconds"
echo ""
echo "Press Ctrl+C to stop the worker"
echo "========================================"
echo ""

php artisan queue:work --queue=vendor-emails --tries=3 --timeout=120 --sleep=3 --verbose
