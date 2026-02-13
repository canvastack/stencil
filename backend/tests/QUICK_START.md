# Test Database Quick Start

## First Time Setup

### 1. Create Test Database
```bash
# Windows (PowerShell/CMD)
cd backend\tests
setup-test-database.bat

# Linux/Mac
cd backend/tests
chmod +x setup-test-database.sh
./setup-test-database.sh
```

### 2. Verify Setup
```bash
cd backend
php artisan test tests/Integration/Infrastructure/RepositoryTestCaseTest.php
```

Expected output: All tests passing ✓

## Daily Usage

### Run All Tests
```bash
php artisan test
```

### Run Specific Test Suite
```bash
php artisan test --testsuite=Unit
php artisan test --testsuite=Integration
php artisan test --testsuite=Feature
```

### Run Single Test File
```bash
php artisan test tests/Unit/Domain/Vendor/Entities/VendorTest.php
```

### Run with Coverage
```bash
php artisan test --coverage
```

## Common Issues

### "Database does not exist"
```bash
# Run setup script again
cd backend/tests
./setup-test-database.sh  # or .bat on Windows
```

### "Migration table not found"
```bash
php artisan migrate --env=testing --force
```

### "Tests are slow"
- Already optimized with `BCRYPT_ROUNDS=4`
- Using array cache driver
- Using sync queue connection

## Configuration Files

- `backend/phpunit.xml` - PHPUnit configuration
- `backend/.env.testing` - Test environment variables
- `backend/config/database.php` - Database connections

## Test Database Details

- **Name**: `stencil_canvastack_test`
- **Connection**: PostgreSQL
- **Host**: 127.0.0.1
- **Port**: 5432
- **Username**: postgres
- **Password**: @admin

## Need Help?

See `TEST_DATABASE_SETUP.md` for detailed documentation.
