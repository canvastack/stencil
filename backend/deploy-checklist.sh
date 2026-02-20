#!/bin/bash

# Customer Quote & Approval Workflow - Deployment Checklist Script
# This script helps verify deployment readiness and execute deployment steps

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment environment (default: production)
ENVIRONMENT=${1:-production}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Customer Quote Deployment Checklist${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
        return 0
    else
        echo -e "${RED}✗ $1${NC}"
        return 1
    fi
}

# Function to prompt user
prompt_user() {
    echo -e "${YELLOW}$1${NC}"
    read -p "Continue? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
}

# 1. Pre-Deployment Checks
echo -e "${BLUE}1. Pre-Deployment Checks${NC}"
echo "-----------------------------------"

# Check if .env exists
if [ -f .env ]; then
    check_status ".env file exists"
else
    echo -e "${RED}✗ .env file not found${NC}"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Check database connection
php artisan tinker --execute="DB::connection()->getPdo();" > /dev/null 2>&1
check_status "Database connection"

# Check Redis connection
php artisan tinker --execute="Redis::ping();" > /dev/null 2>&1
check_status "Redis connection"

# Run tests
echo ""
echo -e "${BLUE}Running test suite...${NC}"
php artisan test --stop-on-failure
check_status "All tests passing"

echo ""

# 2. Environment Configuration
echo -e "${BLUE}2. Environment Configuration${NC}"
echo "-----------------------------------"

# Check required environment variables
REQUIRED_VARS=(
    "APP_KEY"
    "DB_CONNECTION"
    "DB_HOST"
    "DB_DATABASE"
    "REDIS_HOST"
    "QUEUE_CONNECTION"
    "MAIL_MAILER"
    "MAIL_FROM_ADDRESS"
    "FILESYSTEM_DISK"
)

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" .env; then
        check_status "${var} configured"
    else
        echo -e "${RED}✗ ${var} not configured${NC}"
        exit 1
    fi
done

echo ""

# 3. Database Setup
echo -e "${BLUE}3. Database Setup${NC}"
echo "-----------------------------------"

prompt_user "Ready to run database migrations?"

# Backup database
echo "Creating database backup..."
php artisan backup:run --only-db
check_status "Database backup created"

# Run migrations
echo "Running migrations..."
php artisan migrate --force
check_status "Migrations completed"

# Check migration status
php artisan migrate:status
check_status "Migration status verified"

echo ""

# 4. Seed Required Data
echo -e "${BLUE}4. Seed Required Data${NC}"
echo "-----------------------------------"

prompt_user "Ready to seed approval settings and document templates?"

# Seed approval settings
php artisan db:seed --class=ApprovalSettingsSeeder
check_status "Approval settings seeded"

# Seed document templates
php artisan db:seed --class=DocumentTemplateSeeder
check_status "Document templates seeded"

# Verify seeding
APPROVAL_COUNT=$(php artisan tinker --execute="echo App\Models\CustomerQuoteApprovalSettings::count();")
echo "Approval settings count: ${APPROVAL_COUNT}"

TEMPLATE_COUNT=$(php artisan tinker --execute="echo App\Models\DocumentTemplate::count();")
echo "Document templates count: ${TEMPLATE_COUNT}"

echo ""

# 5. Queue Configuration
echo -e "${BLUE}5. Queue Configuration${NC}"
echo "-----------------------------------"

# Check if supervisor is installed
if command -v supervisorctl &> /dev/null; then
    check_status "Supervisor installed"
    
    # Check worker status
    sudo supervisorctl status stencil-worker:* > /dev/null 2>&1
    check_status "Queue workers configured"
else
    echo -e "${YELLOW}⚠ Supervisor not installed${NC}"
    echo "Please install supervisor and configure queue workers"
    echo "See: backend/docs/CUSTOMER_QUOTE_DEPLOYMENT_GUIDE.md"
fi

echo ""

# 6. Scheduled Jobs
echo -e "${BLUE}6. Scheduled Jobs${NC}"
echo "-----------------------------------"

# Check if cron is configured
if crontab -l | grep -q "artisan schedule:run"; then
    check_status "Cron job configured"
else
    echo -e "${YELLOW}⚠ Cron job not configured${NC}"
    echo "Add to crontab: * * * * * cd $(pwd) && php artisan schedule:run >> /dev/null 2>&1"
fi

# List scheduled jobs
echo "Scheduled jobs:"
php artisan schedule:list

echo ""

# 7. File Storage
echo -e "${BLUE}7. File Storage${NC}"
echo "-----------------------------------"

# Test file storage
echo "Testing file storage..."
php artisan tinker --execute="Storage::disk(config('filesystems.default'))->put('deployment-test.txt', 'Deployment test at ' . now());"
check_status "File storage write test"

php artisan tinker --execute="echo Storage::disk(config('filesystems.default'))->exists('deployment-test.txt') ? 'exists' : 'not found';"
check_status "File storage read test"

# Clean up test file
php artisan tinker --execute="Storage::disk(config('filesystems.default'))->delete('deployment-test.txt');"

echo ""

# 8. Email Configuration
echo -e "${BLUE}8. Email Configuration${NC}"
echo "-----------------------------------"

prompt_user "Ready to test email sending? (will send test email)"

# Test email
TEST_EMAIL=${2:-"admin@example.com"}
echo "Sending test email to: ${TEST_EMAIL}"
php artisan tinker --execute="Mail::raw('Deployment test email from Customer Quote system', function(\$msg) { \$msg->to('${TEST_EMAIL}')->subject('Deployment Test'); });"
check_status "Test email sent"

echo ""

# 9. Cache Configuration
echo -e "${BLUE}9. Cache Configuration${NC}"
echo "-----------------------------------"

# Clear all caches
php artisan cache:clear
check_status "Cache cleared"

php artisan config:clear
check_status "Config cache cleared"

php artisan route:clear
check_status "Route cache cleared"

php artisan view:clear
check_status "View cache cleared"

# Rebuild caches
php artisan config:cache
check_status "Config cached"

php artisan route:cache
check_status "Routes cached"

php artisan view:cache
check_status "Views cached"

# Optimize autoloader
composer dump-autoload --optimize
check_status "Autoloader optimized"

echo ""

# 10. Security Checks
echo -e "${BLUE}10. Security Checks${NC}"
echo "-----------------------------------"

# Check APP_DEBUG is false
if grep -q "^APP_DEBUG=false" .env; then
    check_status "APP_DEBUG is false"
else
    echo -e "${RED}✗ APP_DEBUG should be false in production${NC}"
    exit 1
fi

# Check APP_ENV
if grep -q "^APP_ENV=production" .env; then
    check_status "APP_ENV is production"
else
    echo -e "${YELLOW}⚠ APP_ENV is not production${NC}"
fi

# Check file permissions
if [ -w storage ] && [ -w bootstrap/cache ]; then
    check_status "Storage directories writable"
else
    echo -e "${RED}✗ Storage directories not writable${NC}"
    echo "Run: chmod -R 775 storage bootstrap/cache"
    exit 1
fi

echo ""

# 11. Verification Tests
echo -e "${BLUE}11. Verification Tests${NC}"
echo "-----------------------------------"

# Test customer quote creation
echo "Testing customer quote functionality..."
php artisan test --filter=CustomerQuoteWorkflowTest
check_status "Customer quote tests passing"

echo ""

# 12. Final Checklist
echo -e "${BLUE}12. Final Deployment Checklist${NC}"
echo "-----------------------------------"

echo ""
echo "Manual verification required:"
echo "  [ ] SSL certificate installed and valid"
echo "  [ ] Domain DNS configured correctly"
echo "  [ ] CORS settings configured"
echo "  [ ] Rate limiting enabled"
echo "  [ ] Monitoring tools configured"
echo "  [ ] Backup system verified"
echo "  [ ] Rollback plan documented"
echo "  [ ] Team notified of deployment"
echo ""

prompt_user "All manual checks completed?"

# 13. Deployment Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Checklist Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Review deployment guide: backend/docs/CUSTOMER_QUOTE_DEPLOYMENT_GUIDE.md"
echo "2. Monitor logs: tail -f storage/logs/laravel.log"
echo "3. Check queue workers: sudo supervisorctl status stencil-worker:*"
echo "4. Verify scheduled jobs: php artisan schedule:list"
echo "5. Test critical workflows manually"
echo "6. Monitor metrics dashboard"
echo ""
echo -e "${BLUE}Deployment completed at: $(date)${NC}"
echo ""

# Create deployment log
echo "Deployment completed at $(date)" >> storage/logs/deployment.log
echo "Environment: ${ENVIRONMENT}" >> storage/logs/deployment.log
echo "---" >> storage/logs/deployment.log

exit 0
