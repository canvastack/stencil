#!/bin/bash

# ========================================
# CanvaStencil Rollback Script
# Customer Quote & Approval Workflow
# ========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}========================================${NC}"
echo -e "${RED}CanvaStencil Rollback${NC}"
echo -e "${RED}========================================${NC}"
echo ""

# Confirmation prompt
echo -e "${YELLOW}WARNING: This will rollback the application to a previous state${NC}"
echo -e "${YELLOW}This action should only be performed if there is a critical issue${NC}"
echo ""
read -p "Are you sure you want to rollback? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo -e "${GREEN}Rollback cancelled${NC}"
    exit 0
fi

echo ""

# Get rollback target
echo "Available options:"
echo "  1. Rollback to previous Git commit"
echo "  2. Rollback database migrations (1 step)"
echo "  3. Restore from backup"
echo "  4. Full rollback (all of the above)"
echo ""
read -p "Select option (1-4): " -n 1 -r OPTION
echo ""
echo ""

# 1. Enable maintenance mode
echo -e "${BLUE}1. Enabling maintenance mode...${NC}"
php artisan down --message="System maintenance in progress. Please try again shortly."
echo -e "${GREEN}✓ Maintenance mode enabled${NC}"
echo ""

# 2. Create emergency backup
echo -e "${BLUE}2. Creating emergency backup...${NC}"
php artisan backup:run --only-db
echo -e "${GREEN}✓ Emergency backup created${NC}"
echo ""

# 3. Perform rollback based on option
case $OPTION in
    1)
        echo -e "${BLUE}3. Rolling back Git commit...${NC}"
        
        # Show recent commits
        echo "Recent commits:"
        git log --oneline -5
        echo ""
        
        read -p "Enter commit hash to rollback to: " COMMIT_HASH
        
        # Stash any local changes
        git stash
        
        # Checkout target commit
        git checkout $COMMIT_HASH
        
        # Reinstall dependencies
        composer install --no-dev --optimize-autoloader
        
        echo -e "${GREEN}✓ Code rolled back${NC}"
        ;;
        
    2)
        echo -e "${BLUE}3. Rolling back database migrations...${NC}"
        
        # Show migration status
        php artisan migrate:status
        echo ""
        
        read -p "How many migration steps to rollback? (default: 1): " STEPS
        STEPS=${STEPS:-1}
        
        # Rollback migrations
        php artisan migrate:rollback --step=$STEPS --force
        
        echo -e "${GREEN}✓ Migrations rolled back${NC}"
        ;;
        
    3)
        echo -e "${BLUE}3. Restoring from backup...${NC}"
        
        # List available backups
        php artisan backup:list
        echo ""
        
        read -p "Enter backup filename to restore: " BACKUP_FILE
        
        # Restore backup
        php artisan backup:restore --backup=$BACKUP_FILE
        
        echo -e "${GREEN}✓ Backup restored${NC}"
        ;;
        
    4)
        echo -e "${BLUE}3. Performing full rollback...${NC}"
        
        # List available backups
        echo "Available backups:"
        php artisan backup:list
        echo ""
        
        read -p "Enter backup filename to restore: " BACKUP_FILE
        
        # Restore database
        echo "Restoring database..."
        php artisan backup:restore --backup=$BACKUP_FILE --only-db
        
        # Rollback Git
        echo "Rolling back code..."
        git log --oneline -5
        echo ""
        read -p "Enter commit hash to rollback to: " COMMIT_HASH
        git stash
        git checkout $COMMIT_HASH
        
        # Reinstall dependencies
        echo "Reinstalling dependencies..."
        composer install --no-dev --optimize-autoloader
        
        # Rollback migrations
        echo "Rolling back migrations..."
        read -p "How many migration steps to rollback? (default: 1): " STEPS
        STEPS=${STEPS:-1}
        php artisan migrate:rollback --step=$STEPS --force
        
        echo -e "${GREEN}✓ Full rollback completed${NC}"
        ;;
        
    *)
        echo -e "${RED}Invalid option${NC}"
        php artisan up
        exit 1
        ;;
esac

echo ""

# 4. Clear caches
echo -e "${BLUE}4. Clearing caches...${NC}"
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
echo -e "${GREEN}✓ Caches cleared${NC}"
echo ""

# 5. Rebuild caches
echo -e "${BLUE}5. Rebuilding caches...${NC}"
php artisan config:cache
php artisan route:cache
php artisan view:cache
composer dump-autoload --optimize
echo -e "${GREEN}✓ Caches rebuilt${NC}"
echo ""

# 6. Restart services
echo -e "${BLUE}6. Restarting services...${NC}"

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

# 7. Verification
echo -e "${BLUE}7. Running verification checks...${NC}"

# Check application status
php artisan about > /dev/null 2>&1
echo "✓ Application responding"

# Check database connection
php artisan tinker --execute="DB::connection()->getPdo();" > /dev/null 2>&1
echo "✓ Database connected"

# Check Redis connection
php artisan tinker --execute="Redis::ping();" > /dev/null 2>&1
echo "✓ Redis connected"

echo -e "${GREEN}✓ All checks passed${NC}"
echo ""

# 8. Disable maintenance mode
echo -e "${BLUE}8. Disabling maintenance mode...${NC}"
php artisan up
echo -e "${GREEN}✓ Maintenance mode disabled${NC}"
echo ""

# 9. Create rollback log
echo -e "${BLUE}9. Creating rollback log...${NC}"
cat >> storage/logs/rollback.log << EOF
========================================
Rollback: $(date)
Option: ${OPTION}
Git Commit: $(git rev-parse --short HEAD)
Git Branch: $(git rev-parse --abbrev-ref HEAD)
Performed By: $(whoami)
Reason: Manual rollback
========================================

EOF
echo -e "${GREEN}✓ Rollback log created${NC}"
echo ""

# 10. Summary
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Rollback Completed${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Rollback Summary:"
echo "  Time: $(date)"
echo "  Option: ${OPTION}"
echo "  Current Commit: $(git rev-parse --short HEAD)"
echo "  Current Branch: $(git rev-parse --abbrev-ref HEAD)"
echo ""
echo -e "${RED}IMPORTANT: Post-Rollback Actions${NC}"
echo "  1. Verify critical functionality manually"
echo "  2. Monitor error logs: tail -f storage/logs/laravel.log"
echo "  3. Check queue status: php artisan queue:monitor redis"
echo "  4. Notify stakeholders of rollback"
echo "  5. Investigate root cause of issue"
echo "  6. Plan fix and re-deployment"
echo ""
echo -e "${YELLOW}Emergency backup created at: storage/app/backups/${NC}"
echo ""

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"⚠️ Rollback performed on production. Current commit: $(git rev-parse --short HEAD)\"}" \
        "$SLACK_WEBHOOK" > /dev/null 2>&1
fi

exit 0
