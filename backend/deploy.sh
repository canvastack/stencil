#!/bin/bash

# ========================================
# CanvaStencil Production Deployment Script
# Customer Quote & Approval Workflow
# ========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-production}
SKIP_BACKUP=${2:-false}
SKIP_TESTS=${3:-false}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CanvaStencil Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then 
    echo -e "${RED}Error: Do not run this script as root${NC}"
    exit 1
fi

# Confirmation prompt
echo -e "${YELLOW}This will deploy to ${ENVIRONMENT} environment${NC}"
read -p "Continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 1
fi

echo ""

# 1. Pre-deployment backup
if [ "$SKIP_BACKUP" != "true" ]; then
    echo -e "${BLUE}1. Creating backup...${NC}"
    php artisan backup:run --only-db
    echo -e "${GREEN}✓ Backup created${NC}"
    echo ""
fi

# 2. Enable maintenance mode
echo -e "${BLUE}2. Enabling maintenance mode...${NC}"
php artisan down --message="Upgrading system. Back in 10 minutes." --retry=60
echo -e "${GREEN}✓ Maintenance mode enabled${NC}"
echo ""

# 3. Pull latest code
echo -e "${BLUE}3. Pulling latest code...${NC}"
git fetch origin
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"
echo ""

# 4. Install dependencies
echo -e "${BLUE}4. Installing dependencies...${NC}"

# Backend dependencies
echo "Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader --no-interaction
echo -e "${GREEN}✓ PHP dependencies installed${NC}"

# Frontend dependencies and build
echo "Building frontend..."
cd ../frontend
npm ci --production=false
npm run build
cd ../backend
echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# 5. Run tests (optional)
if [ "$SKIP_TESTS" != "true" ]; then
    echo -e "${BLUE}5. Running tests...${NC}"
    php artisan test --stop-on-failure
    echo -e "${GREEN}✓ All tests passed${NC}"
    echo ""
fi

# 6. Run migrations
echo -e "${BLUE}6. Running database migrations...${NC}"
php artisan migrate --force
echo -e "${GREEN}✓ Migrations completed${NC}"
echo ""

# 7. Seed required data
echo -e "${BLUE}7. Seeding required data...${NC}"
php artisan db:seed --class=ApprovalSettingsSeeder --force
php artisan db:seed --class=DocumentTemplateSeeder --force
echo -e "${GREEN}✓ Data seeded${NC}"
echo ""

# 8. Clear and rebuild caches
echo -e "${BLUE}8. Clearing and rebuilding caches...${NC}"

# Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
echo "Caches cleared"

# Rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo "Caches rebuilt"

# Optimize autoloader
composer dump-autoload --optimize
echo -e "${GREEN}✓ Caches optimized${NC}"
echo ""

# 9. Set permissions
echo -e "${BLUE}9. Setting file permissions...${NC}"
chmod -R 775 storage bootstrap/cache
echo -e "${GREEN}✓ Permissions set${NC}"
echo ""

# 10. Restart services
echo -e "${BLUE}10. Restarting services...${NC}"

# Restart queue workers
if command -v supervisorctl &> /dev/null; then
    sudo supervisorctl restart stencil-worker:*
    echo "Queue workers restarted"
fi

# Restart PHP-FPM
if systemctl is-active --quiet php8.2-fpm; then
    sudo systemctl restart php8.2-fpm
    echo "PHP-FPM restarted"
fi

# Reload Nginx
if systemctl is-active --quiet nginx; then
    sudo systemctl reload nginx
    echo "Nginx reloaded"
fi

echo -e "${GREEN}✓ Services restarted${NC}"
echo ""

# 11. Disable maintenance mode
echo -e "${BLUE}11. Disabling maintenance mode...${NC}"
php artisan up
echo -e "${GREEN}✓ Maintenance mode disabled${NC}"
echo ""

# 12. Post-deployment verification
echo -e "${BLUE}12. Running post-deployment checks...${NC}"

# Check application status
php artisan about > /dev/null 2>&1
echo "✓ Application responding"

# Check database connection
php artisan tinker --execute="DB::connection()->getPdo();" > /dev/null 2>&1
echo "✓ Database connected"

# Check Redis connection
php artisan tinker --execute="Redis::ping();" > /dev/null 2>&1
echo "✓ Redis connected"

# Check queue workers
if command -v supervisorctl &> /dev/null; then
    sudo supervisorctl status stencil-worker:* | grep RUNNING > /dev/null 2>&1
    echo "✓ Queue workers running"
fi

echo -e "${GREEN}✓ All checks passed${NC}"
echo ""

# 13. Create deployment log
echo -e "${BLUE}13. Creating deployment log...${NC}"
cat >> storage/logs/deployment.log << EOF
========================================
Deployment: $(date)
Environment: ${ENVIRONMENT}
Git Commit: $(git rev-parse --short HEAD)
Git Branch: $(git rev-parse --abbrev-ref HEAD)
Deployed By: $(whoami)
========================================

EOF
echo -e "${GREEN}✓ Deployment log created${NC}"
echo ""

# 14. Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Completed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Deployment Summary:"
echo "  Environment: ${ENVIRONMENT}"
echo "  Time: $(date)"
echo "  Git Commit: $(git rev-parse --short HEAD)"
echo "  Git Branch: $(git rev-parse --abbrev-ref HEAD)"
echo ""
echo "Next Steps:"
echo "  1. Monitor logs: tail -f storage/logs/laravel.log"
echo "  2. Check queue: php artisan queue:monitor redis"
echo "  3. Verify functionality manually"
echo "  4. Monitor error rates"
echo "  5. Check performance metrics"
echo ""
echo -e "${BLUE}Application URL: ${APP_URL}${NC}"
echo ""

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ Deployment to ${ENVIRONMENT} completed successfully\"}" \
        "$SLACK_WEBHOOK" > /dev/null 2>&1
fi

exit 0
