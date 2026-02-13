#!/bin/bash

# Test Database Setup Script
# This script creates and configures the test database for PHPUnit tests

set -e

# Configuration
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-@admin}"
DB_NAME="stencil_canvastack_test"

echo "=========================================="
echo "Test Database Setup"
echo "=========================================="
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "Username: $DB_USERNAME"
echo "=========================================="

# Check if PostgreSQL is running
echo "Checking PostgreSQL connection..."
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -lqt | cut -d \| -f 1 | grep -qw postgres; then
    echo "Error: Cannot connect to PostgreSQL server"
    echo "Please ensure PostgreSQL is running and credentials are correct"
    exit 1
fi

echo "✓ PostgreSQL connection successful"

# Drop existing test database if it exists
echo "Dropping existing test database (if exists)..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -c "DROP DATABASE IF EXISTS $DB_NAME;" postgres

echo "✓ Existing test database dropped"

# Create test database
echo "Creating test database..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -c "CREATE DATABASE $DB_NAME;" postgres

echo "✓ Test database created"

# Run migrations
echo "Running migrations..."
cd "$(dirname "$0")/.."
php artisan migrate --env=testing --force

echo "✓ Migrations completed"

# Optional: Seed test data
read -p "Do you want to seed test data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Seeding test data..."
    php artisan db:seed --env=testing --class=Testing\\VendorPortalInfrastructureTestSeeder
    echo "✓ Test data seeded"
fi

echo "=========================================="
echo "Test database setup complete!"
echo "=========================================="
echo "You can now run tests with:"
echo "  php artisan test"
echo "  php artisan test --testsuite=Unit"
echo "  php artisan test --testsuite=Integration"
echo "  php artisan test --testsuite=Feature"
echo "=========================================="
