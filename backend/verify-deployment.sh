#!/bin/bash

# ========================================
# Post-Deployment Verification Script
# Customer Quote & Approval Workflow
# ========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Post-Deployment Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

PASSED=0
FAILED=0
WARNINGS=0

# Function to check and report
check() {
    local description=$1
    local command=$2
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        ((FAILED++))
        return 1
    fi
}

# Function for warnings
warn() {
    local description=$1
    echo -e "${YELLOW}⚠${NC} $description"
    ((WARNINGS++))
}

# 1. Application Health
echo -e "${BLUE}1. Application Health${NC}"
echo "-----------------------------------"

check "Application responding" "php artisan about"
check "Environment is production" "grep -q '^APP_ENV=production' .env"
check "Debug mode is off" "grep -q '^APP_DEBUG=false' .env"
check "Application key is set" "grep -q '^APP_KEY=base64:' .env"

echo ""

# 2. Database Connectivity
echo -e "${BLUE}2. Database Connectivity${NC}"
echo "-----------------------------------"

check "Database connection" "php artisan tinker --execute='DB::connection()->getPdo();'"
check "Migrations up to date" "php artisan migrate:status | grep -q 'Ran'"

# Check customer quote tables exist
check "customer_quotes table exists" "php artisan tinker --execute='Schema::hasTable(\"customer_quotes\");' | grep -q 'true'"
check "customer_quote_approval_settings table exists" "php artisan tinker --execute='Schema::hasTable(\"customer_quote_approval_settings\");' | grep -q 'true'"
check "order_documents table exists" "php artisan tinker --execute='Schema::hasTable(\"order_documents\");' | grep -q 'true'"
check "document_templates table exists" "php artisan tinker --execute='Schema::hasTable(\"document_templates\");' | grep -q 'true'"

echo ""

# 3. Redis Connectivity
echo -e "${BLUE}3. Redis Connectivity${NC}"
echo "-----------------------------------"

check "Redis connection" "php artisan tinker --execute='Redis::ping();' | grep -q 'PONG'"
check "Redis cache working" "php artisan tinker --execute='Cache::put(\"test\", \"value\", 60); echo Cache::get(\"test\");' | grep -q 'value'"

echo ""

# 4. Queue System
echo -e "${BLUE}4. Queue System${NC}"
echo "-----------------------------------"

if command -v supervisorctl &> /dev/null; then
    check "Supervisor installed" "command -v supervisorctl"
    check "Queue workers running" "sudo supervisorctl status stencil-worker:* | grep -q RUNNING"
    
    # Count running workers
    WORKER_COUNT=$(sudo supervisorctl status stencil-worker:* | grep RUNNING | wc -l)
    if [ "$WORKER_COUNT" -ge 4 ]; then
        echo -e "${GREEN}✓${NC} $WORKER_COUNT queue workers running"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} Only $WORKER_COUNT queue workers running (expected 4+)"
        ((WARNINGS++))
    fi
else
    warn "Supervisor not installed - queue workers may not be configured"
fi

echo ""

# 5. Scheduled Jobs
echo -e "${BLUE}5. Scheduled Jobs${NC}"
echo "-----------------------------------"

if crontab -l | grep -q "artisan schedule:run"; then
    echo -e "${GREEN}✓${NC} Cron job configured"
    ((PASSED++))
else
    warn "Cron job not configured - scheduled tasks will not run"
fi

# Check if scheduled jobs are defined
SCHEDULED_COUNT=$(php artisan schedule:list | grep -c "customer-quotes" || true)
if [ "$SCHEDULED_COUNT" -ge 2 ]; then
    echo -e "${GREEN}✓${NC} Customer quote scheduled jobs configured ($SCHEDULED_COUNT jobs)"
    ((PASSED++))
else
    warn "Customer quote scheduled jobs may not be configured"
fi

echo ""

# 6. File Storage
echo -e "${BLUE}6. File Storage${NC}"
echo "-----------------------------------"

check "Storage directory writable" "[ -w storage ]"
check "Bootstrap cache writable" "[ -w bootstrap/cache ]"

# Test file storage
STORAGE_DISK=$(grep "^FILESYSTEM_DISK=" .env | cut -d'=' -f2)
echo "Storage disk: $STORAGE_DISK"

check "File storage write test" "php artisan tinker --execute='Storage::disk(config(\"filesystems.default\"))->put(\"verify-test.txt\", \"test\");'"
check "File storage read test" "php artisan tinker --execute='echo Storage::disk(config(\"filesystems.default\"))->exists(\"verify-test.txt\") ? \"exists\" : \"not found\";' | grep -q 'exists'"

# Clean up test file
php artisan tinker --execute="Storage::disk(config('filesystems.default'))->delete('verify-test.txt');" > /dev/null 2>&1

echo ""

# 7. Email Configuration
echo -e "${BLUE}7. Email Configuration${NC}"
echo "-----------------------------------"

MAIL_MAILER=$(grep "^MAIL_MAILER=" .env | cut -d'=' -f2)
echo "Mail mailer: $MAIL_MAILER"

check "Mail configuration set" "grep -q '^MAIL_FROM_ADDRESS=' .env"

if [ "$MAIL_MAILER" != "log" ]; then
    check "Mail host configured" "grep -q '^MAIL_HOST=' .env"
else
    warn "Mail mailer is set to 'log' - emails will not be sent"
fi

echo ""

# 8. Cache Configuration
echo -e "${BLUE}8. Cache Configuration${NC}"
echo "-----------------------------------"

check "Config cached" "[ -f bootstrap/cache/config.php ]"
check "Routes cached" "[ -f bootstrap/cache/routes-v7.php ]"
check "Views cached" "[ -d storage/framework/views ]"

echo ""

# 9. Security Checks
echo -e "${BLUE}9. Security Checks${NC}"
echo "-----------------------------------"

check "APP_DEBUG is false" "grep -q '^APP_DEBUG=false' .env"
check ".env file secured" "[ $(stat -c '%a' .env 2>/dev/null || stat -f '%A' .env 2>/dev/null) -le 600 ]"

# Check if running on HTTPS
if grep -q "^APP_URL=https://" .env; then
    echo -e "${GREEN}✓${NC} APP_URL uses HTTPS"
    ((PASSED++))
else
    warn "APP_URL does not use HTTPS"
fi

# Check CORS configuration
if grep -q "^SANCTUM_STATEFUL_DOMAINS=" .env; then
    echo -e "${GREEN}✓${NC} CORS domains configured"
    ((PASSED++))
else
    warn "CORS domains not configured"
fi

echo ""

# 10. Customer Quote Specific Checks
echo -e "${BLUE}10. Customer Quote System${NC}"
echo "-----------------------------------"

# Check if approval settings exist
APPROVAL_SETTINGS_COUNT=$(php artisan tinker --execute="echo App\Models\CustomerQuoteApprovalSettings::count();" 2>/dev/null || echo "0")
if [ "$APPROVAL_SETTINGS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Approval settings configured ($APPROVAL_SETTINGS_COUNT tenants)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} No approval settings found - run ApprovalSettingsSeeder"
    ((FAILED++))
fi

# Check if document templates exist
TEMPLATE_COUNT=$(php artisan tinker --execute="echo App\Models\DocumentTemplate::count();" 2>/dev/null || echo "0")
if [ "$TEMPLATE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Document templates configured ($TEMPLATE_COUNT templates)"
    ((PASSED++))
else
    echo -e "${RED}✗${NC} No document templates found - run DocumentTemplateSeeder"
    ((FAILED++))
fi

# Check if customer quote routes are registered
check "Customer quote routes registered" "php artisan route:list | grep -q 'customer-quotes'"

# Check if scheduled commands exist
check "Check expired quotes command exists" "php artisan list | grep -q 'customer-quotes:check-expired'"
check "Check metrics command exists" "php artisan list | grep -q 'customer-quotes:check-metrics'"

echo ""

# 11. API Endpoints
echo -e "${BLUE}11. API Endpoints${NC}"
echo "-----------------------------------"

APP_URL=$(grep "^APP_URL=" .env | cut -d'=' -f2)

if command -v curl &> /dev/null; then
    # Test health endpoint
    if curl -s -o /dev/null -w "%{http_code}" "$APP_URL/health" | grep -q "200"; then
        echo -e "${GREEN}✓${NC} Health endpoint responding"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Health endpoint not responding"
        ((FAILED++))
    fi
    
    # Test API endpoint
    if curl -s -o /dev/null -w "%{http_code}" "$APP_URL/api/v1/health" | grep -q "200\|401"; then
        echo -e "${GREEN}✓${NC} API endpoint responding"
        ((PASSED++))
    else
        warn "API endpoint may not be responding correctly"
    fi
else
    warn "curl not installed - cannot test API endpoints"
fi

echo ""

# 12. Performance Checks
echo -e "${BLUE}12. Performance${NC}"
echo "-----------------------------------"

# Check PHP version
PHP_VERSION=$(php -r "echo PHP_VERSION;")
echo "PHP Version: $PHP_VERSION"

if php -r "exit(version_compare(PHP_VERSION, '8.2.0', '>=') ? 0 : 1);"; then
    echo -e "${GREEN}✓${NC} PHP version is 8.2 or higher"
    ((PASSED++))
else
    warn "PHP version is below 8.2"
fi

# Check memory limit
MEMORY_LIMIT=$(php -r "echo ini_get('memory_limit');")
echo "PHP Memory Limit: $MEMORY_LIMIT"

# Check opcache
if php -r "exit(extension_loaded('opcache') ? 0 : 1);"; then
    echo -e "${GREEN}✓${NC} OPcache enabled"
    ((PASSED++))
else
    warn "OPcache not enabled - performance may be impacted"
fi

echo ""

# 13. Monitoring & Logging
echo -e "${BLUE}13. Monitoring & Logging${NC}"
echo "-----------------------------------"

check "Log directory writable" "[ -w storage/logs ]"
check "Laravel log exists" "[ -f storage/logs/laravel.log ]"

# Check log file size
if [ -f storage/logs/laravel.log ]; then
    LOG_SIZE=$(du -h storage/logs/laravel.log | cut -f1)
    echo "Laravel log size: $LOG_SIZE"
fi

# Check if Sentry is configured
if grep -q "^SENTRY_LARAVEL_DSN=" .env && ! grep -q "^SENTRY_LARAVEL_DSN=$" .env; then
    echo -e "${GREEN}✓${NC} Sentry error tracking configured"
    ((PASSED++))
else
    warn "Sentry error tracking not configured"
fi

echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Verification Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "Deployment appears to be successful."
    echo ""
    echo "Next steps:"
    echo "  1. Test critical workflows manually"
    echo "  2. Monitor logs: tail -f storage/logs/laravel.log"
    echo "  3. Check queue: php artisan queue:monitor redis"
    echo "  4. Review metrics dashboard"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some critical checks failed!${NC}"
    echo ""
    echo "Please review the failed checks above and fix the issues."
    echo ""
    echo "Common fixes:"
    echo "  - Run migrations: php artisan migrate --force"
    echo "  - Seed data: php artisan db:seed --class=ApprovalSettingsSeeder"
    echo "  - Configure queue workers: see deployment/README.md"
    echo "  - Configure cron jobs: see deployment/crontab.txt"
    echo ""
    exit 1
fi
