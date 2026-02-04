# Quote Management Workflow - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Quote Management Workflow system to production. It covers database migrations, environment configuration, deployment procedures, verification steps, and rollback plans.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Migrations](#database-migrations)
3. [Environment Configuration](#environment-configuration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Review

- [ ] All Phase 1-4 tasks completed
- [ ] Code reviewed and approved
- [ ] All tests passing (1063+ tests)
- [ ] No console errors or warnings
- [ ] TypeScript compilation successful
- [ ] PHP linting passed (Laravel Pint)
- [ ] ESLint checks passed

### Testing Verification

- [ ] Unit tests: 100% pass rate
- [ ] Integration tests: All critical workflows tested
- [ ] E2E tests: User workflows verified
- [ ] Performance tests: Response times < 500ms
- [ ] Load tests: System handles expected traffic
- [ ] Security audit: No vulnerabilities found

### Documentation

- [ ] API documentation updated (OpenAPI)
- [ ] User guide created
- [ ] Developer documentation complete
- [ ] Deployment guide reviewed
- [ ] Changelog updated

### Infrastructure

- [ ] Staging environment tested
- [ ] Production database backed up
- [ ] Monitoring tools configured
- [ ] Error tracking enabled (Sentry)
- [ ] Log aggregation ready

### Team Readiness

- [ ] Deployment team briefed
- [ ] Support team trained
- [ ] Rollback plan reviewed
- [ ] Communication plan ready
- [ ] Maintenance window scheduled

---

## Database Migrations

### Migration Files

The following migrations need to be executed:

#### 1. Add Performance Indexes

```sql
-- File: database/migrations/2026_02_02_100000_add_quote_performance_indexes.php
```

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // 1. Composite index for duplicate check
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_order_vendor_negotiations_order_vendor_status 
            ON order_vendor_negotiations(order_id, vendor_id, status)
            WHERE status IN (\'draft\', \'open\', \'sent\', \'countered\')
        ');

        // 2. Index for quote listing by order
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_order_vendor_negotiations_order_created 
            ON order_vendor_negotiations(order_id, created_at DESC)
        ');

        // 3. Tenant scoping index
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_order_vendor_negotiations_tenant_status 
            ON order_vendor_negotiations(tenant_id, status, created_at DESC)
        ');

        // 4. Vendor quotes index
        DB::statement('
            CREATE INDEX IF NOT EXISTS idx_order_vendor_negotiations_vendor_status 
            ON order_vendor_negotiations(vendor_id, status, created_at DESC)
        ');
    }

    public function down()
    {
        DB::statement('DROP INDEX IF EXISTS idx_order_vendor_negotiations_order_vendor_status');
        DB::statement('DROP INDEX IF EXISTS idx_order_vendor_negotiations_order_created');
        DB::statement('DROP INDEX IF EXISTS idx_order_vendor_negotiations_tenant_status');
        DB::statement('DROP INDEX IF EXISTS idx_order_vendor_negotiations_vendor_status');
    }
};
```

### Migration Execution

#### Staging Environment

```bash
# 1. Backup database
pg_dump -h staging-db-host -U postgres -d stencil_staging > backup_staging_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations
cd backend
php artisan migrate --force

# 3. Verify indexes created
php artisan tinker
>>> DB::select("SELECT indexname FROM pg_indexes WHERE tablename = 'order_vendor_negotiations'");

# 4. Test query performance
>>> DB::enableQueryLog();
>>> OrderVendorNegotiation::where('order_id', 1)->where('vendor_id', 1)->where('status', 'open')->first();
>>> DB::getQueryLog();
```

#### Production Environment

```bash
# 1. Backup production database
pg_dump -h prod-db-host -U postgres -d stencil_production > backup_prod_$(date +%Y%m%d_%H%M%S).sql

# 2. Verify backup integrity
pg_restore --list backup_prod_$(date +%Y%m%d_%H%M%S).sql

# 3. Run migrations (during maintenance window)
cd backend
php artisan down --message="System maintenance in progress"
php artisan migrate --force
php artisan up

# 4. Verify indexes
psql -h prod-db-host -U postgres -d stencil_production -c "
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'order_vendor_negotiations' 
ORDER BY indexname;
"
```

### Index Verification

```sql
-- Check index usage
EXPLAIN ANALYZE
SELECT * FROM order_vendor_negotiations
WHERE order_id = 123 
  AND vendor_id = 456 
  AND status IN ('draft', 'open', 'sent', 'countered');

-- Expected output should show:
-- Index Scan using idx_order_vendor_negotiations_order_vendor_status
-- Execution time: < 10ms
```

---

## Environment Configuration

### Backend (.env)

No new environment variables required for Phase 1.

**Verify existing configuration**:

```bash
# .env
APP_NAME="CanvaStencil"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_PORT=5432
DB_DATABASE=stencil_production
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password

SANCTUM_STATEFUL_DOMAINS=your-domain.com
SESSION_DOMAIN=.your-domain.com

# Error tracking
SENTRY_LARAVEL_DSN=your_sentry_dsn
SENTRY_TRACES_SAMPLE_RATE=0.1

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=info
```

### Frontend (.env)

No new environment variables required for Phase 1.

**Verify existing configuration**:

```bash
# .env.production
VITE_API_BASE_URL=https://api.your-domain.com
VITE_APP_NAME="CanvaStencil"
VITE_SENTRY_DSN=your_sentry_dsn
VITE_GA_ID=your_google_analytics_id
```

---

## Backend Deployment

### Step 1: Prepare Release

```bash
# 1. Pull latest code
git checkout main
git pull origin main

# 2. Install dependencies
cd backend
composer install --no-dev --optimize-autoloader

# 3. Clear and cache config
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 4. Run tests one final time
php artisan test
```

### Step 2: Deploy to Production

```bash
# 1. Put application in maintenance mode
php artisan down --message="Deploying Quote Management features"

# 2. Pull latest code on production server
ssh user@prod-server
cd /var/www/stencil/backend
git pull origin main

# 3. Install dependencies
composer install --no-dev --optimize-autoloader

# 4. Run migrations
php artisan migrate --force

# 5. Clear caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# 6. Rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 7. Restart queue workers
php artisan queue:restart

# 8. Restart PHP-FPM
sudo systemctl restart php8.2-fpm

# 9. Bring application back online
php artisan up
```

### Step 3: Verify Backend

```bash
# Test API endpoints
curl -X GET https://api.your-domain.com/api/v1/health
# Expected: {"status": "ok"}

# Test quote endpoints (with auth token)
curl -X GET https://api.your-domain.com/api/v1/tenant/quotes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Tenant-ID: YOUR_TENANT_ID"
# Expected: {"success": true, "data": [...]}
```

---

## Frontend Deployment

### Step 1: Build Production Bundle

```bash
# 1. Pull latest code
cd frontend
git pull origin main

# 2. Install dependencies
npm ci

# 3. Run linting
npm run lint

# 4. Run tests
npm run test

# 5. Build production bundle
npm run build

# 6. Verify build output
ls -lh dist/
# Should see index.html, assets/, etc.

# 7. Check bundle size
npm run build:analyze
# Verify total size < 5MB
```

### Step 2: Deploy to CDN/Server

#### Option A: Deploy to Vercel/Netlify

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod --dir=dist
```

#### Option B: Deploy to Own Server

```bash
# 1. Upload build to server
rsync -avz --delete dist/ user@prod-server:/var/www/stencil/frontend/

# 2. Configure Nginx
sudo nano /etc/nginx/sites-available/stencil

# Add/verify configuration:
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/stencil/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass https://api.your-domain.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 3. Test Nginx configuration
sudo nginx -t

# 4. Reload Nginx
sudo systemctl reload nginx
```

### Step 3: Verify Frontend

```bash
# Test homepage loads
curl -I https://your-domain.com
# Expected: HTTP/1.1 200 OK

# Test quote management page (requires login)
# Open browser and navigate to:
# https://your-domain.com/admin/quotes

# Verify:
# - Page loads without errors
# - Quote list displays
# - Create quote modal opens
# - All actions work correctly
```

---

## Post-Deployment Verification

### Functional Testing

#### 1. Quote Creation Flow

```
✓ Navigate to order detail page
✓ Click "Manage Quote" button
✓ Modal opens (create or edit mode)
✓ Fill quote form
✓ Submit successfully
✓ Quote appears in list
```

#### 2. Quote Acceptance Flow

```
✓ Open quote detail page
✓ Click "Accept" button
✓ Confirmation dialog appears
✓ Confirm acceptance
✓ Success notification shown
✓ Redirected to order page
✓ Order status updated to "Customer Quote"
✓ Vendor information populated
✓ Quotation amount calculated correctly
```

#### 3. Quote Rejection Flow

```
✓ Open quote detail page
✓ Click "Reject" button
✓ Enter rejection reason (min 10 chars)
✓ Submit rejection
✓ Quote status updated to "Rejected"
✓ Quote becomes read-only
✓ If all quotes rejected, order reverts to "Vendor Sourcing"
```

#### 4. Duplicate Prevention

```
✓ Create quote for order
✓ Navigate to same order again
✓ Click "Manage Quote"
✓ Modal opens in EDIT mode
✓ Existing quote data loaded
✓ Cannot create duplicate
```

### Performance Testing

```bash
# 1. Test API response times
ab -n 1000 -c 10 https://api.your-domain.com/api/v1/tenant/quotes

# Expected:
# - Mean response time: < 300ms
# - 95th percentile: < 500ms
# - 99th percentile: < 1000ms

# 2. Test page load times
lighthouse https://your-domain.com/admin/quotes --view

# Expected:
# - Performance score: > 90
# - First Contentful Paint: < 1.5s
# - Time to Interactive: < 3.0s
```

### Security Testing

```bash
# 1. Test tenant isolation
# Login as Tenant A
# Try to access Tenant B's quote via API
curl -X GET https://api.your-domain.com/api/v1/tenant/quotes/TENANT_B_QUOTE_UUID \
  -H "Authorization: Bearer TENANT_A_TOKEN" \
  -H "X-Tenant-ID: TENANT_A_ID"

# Expected: 404 Not Found (due to tenant scoping)

# 2. Test authorization
# Login as user without quote permissions
# Try to accept quote
# Expected: 403 Forbidden

# 3. Test input validation
# Try to reject quote with short reason
curl -X POST https://api.your-domain.com/api/v1/tenant/quotes/QUOTE_UUID/reject \
  -H "Authorization: Bearer TOKEN" \
  -d '{"reason": "short"}'

# Expected: 422 Validation Error
```

### Database Verification

```sql
-- 1. Verify indexes exist
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'order_vendor_negotiations';

-- 2. Check quote data integrity
SELECT status, COUNT(*) 
FROM order_vendor_negotiations 
GROUP BY status;

-- 3. Verify no orphaned quotes
SELECT COUNT(*) 
FROM order_vendor_negotiations ovn
LEFT JOIN orders o ON ovn.order_id = o.id
WHERE o.id IS NULL;
-- Expected: 0

-- 4. Check tenant isolation
SELECT tenant_id, COUNT(*) 
FROM order_vendor_negotiations 
GROUP BY tenant_id;
```

---

## Monitoring & Alerts

### Application Monitoring

#### 1. Error Tracking (Sentry)

```javascript
// Verify Sentry is capturing errors
Sentry.captureMessage('Quote Management Deployment Test');

// Check Sentry dashboard for:
// - Error rate
// - Performance metrics
// - User feedback
```

#### 2. Performance Monitoring

```bash
# Setup New Relic/DataDog alerts for:
# - API response time > 500ms
# - Error rate > 1%
# - Database query time > 100ms
# - Memory usage > 80%
```

#### 3. Database Monitoring

```sql
-- Monitor slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE query LIKE '%order_vendor_negotiations%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Alert Configuration

```yaml
# alerts.yml
alerts:
  - name: quote_api_slow
    condition: response_time > 500ms
    action: notify_team
    
  - name: quote_error_rate_high
    condition: error_rate > 1%
    action: page_oncall
    
  - name: database_connection_pool_exhausted
    condition: active_connections > 90%
    action: notify_team
```

---

## Rollback Procedures

### When to Rollback

Rollback if:
- ❌ Critical bugs discovered
- ❌ Performance degradation > 50%
- ❌ Data integrity issues
- ❌ Security vulnerabilities
- ❌ User-facing errors > 5%

### Rollback Steps

#### 1. Backend Rollback

```bash
# 1. Put application in maintenance mode
php artisan down

# 2. Revert to previous release
git checkout <previous-release-tag>

# 3. Rollback migrations (if needed)
php artisan migrate:rollback --step=1

# 4. Clear caches
php artisan cache:clear
php artisan config:clear

# 5. Rebuild caches
php artisan config:cache
php artisan route:cache

# 6. Restart services
php artisan queue:restart
sudo systemctl restart php8.2-fpm

# 7. Bring application back online
php artisan up
```

#### 2. Frontend Rollback

```bash
# Option A: Vercel/Netlify
vercel rollback
# or
netlify rollback

# Option B: Own server
rsync -avz --delete previous-build/ user@prod-server:/var/www/stencil/frontend/
sudo systemctl reload nginx
```

#### 3. Database Rollback

```bash
# Only if migrations were run
php artisan migrate:rollback --step=1

# Verify rollback
php artisan migrate:status
```

### Post-Rollback Verification

```bash
# 1. Test application loads
curl -I https://your-domain.com

# 2. Test API endpoints
curl https://api.your-domain.com/api/v1/health

# 3. Verify database state
psql -c "SELECT COUNT(*) FROM order_vendor_negotiations"

# 4. Check error logs
tail -f storage/logs/laravel.log
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Migrations Fail

**Symptoms**:
```
SQLSTATE[42P07]: Duplicate table: 7 ERROR: index already exists
```

**Solution**:
```bash
# Check existing indexes
psql -c "SELECT indexname FROM pg_indexes WHERE tablename = 'order_vendor_negotiations'"

# Drop duplicate indexes
psql -c "DROP INDEX IF EXISTS idx_order_vendor_negotiations_order_vendor_status"

# Re-run migration
php artisan migrate --force
```

#### Issue 2: Frontend Build Fails

**Symptoms**:
```
ERROR: TypeScript compilation failed
```

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check

# Fix errors and rebuild
npm run build
```

#### Issue 3: API Returns 500 Errors

**Symptoms**:
```
{"success": false, "message": "Server Error"}
```

**Solution**:
```bash
# Check Laravel logs
tail -f storage/logs/laravel.log

# Check PHP-FPM logs
sudo tail -f /var/log/php8.2-fpm.log

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Common fixes:
# - Clear cache: php artisan cache:clear
# - Fix permissions: chmod -R 775 storage bootstrap/cache
# - Restart PHP-FPM: sudo systemctl restart php8.2-fpm
```

#### Issue 4: Quotes Not Loading

**Symptoms**:
- Quote list shows empty
- Console errors in browser

**Solution**:
```bash
# 1. Check API endpoint
curl https://api.your-domain.com/api/v1/tenant/quotes \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Tenant-ID: TENANT_ID"

# 2. Check database
psql -c "SELECT COUNT(*) FROM order_vendor_negotiations WHERE tenant_id = YOUR_TENANT_ID"

# 3. Check browser console for errors
# Open DevTools → Console

# 4. Verify tenant ID in request headers
# Open DevTools → Network → Check request headers
```

#### Issue 5: Performance Degradation

**Symptoms**:
- Slow page loads
- API timeouts

**Solution**:
```bash
# 1. Check database indexes
EXPLAIN ANALYZE SELECT * FROM order_vendor_negotiations WHERE order_id = 123;

# 2. Enable query logging
DB::enableQueryLog();
# ... run queries
dd(DB::getQueryLog());

# 3. Check for N+1 queries
# Install Laravel Debugbar
composer require barryvdh/laravel-debugbar --dev

# 4. Optimize queries with eager loading
OrderVendorNegotiation::with(['vendor', 'order'])->get();
```

---

## Success Criteria

Deployment is successful when:

- ✅ All migrations executed without errors
- ✅ All tests passing (1063+ tests)
- ✅ API response times < 500ms
- ✅ Page load times < 3 seconds
- ✅ Zero critical errors in logs
- ✅ Tenant isolation verified
- ✅ Quote workflows functioning correctly
- ✅ Order status integration working
- ✅ Dashboard notifications displaying
- ✅ No user-reported issues for 24 hours

---

## Post-Deployment Tasks

### Immediate (Day 1)

- [ ] Monitor error rates for 24 hours
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Address any critical issues
- [ ] Update status page

### Short-term (Week 1)

- [ ] Analyze usage patterns
- [ ] Gather user feedback
- [ ] Identify optimization opportunities
- [ ] Plan Phase 2 features
- [ ] Update documentation based on feedback

### Long-term (Month 1)

- [ ] Review performance trends
- [ ] Analyze quote acceptance rates
- [ ] Identify workflow improvements
- [ ] Plan advanced features
- [ ] Conduct retrospective

---

## Document Information

- **Version**: 1.0
- **Last Updated**: February 2, 2026
- **Deployment Date**: TBD
- **Deployed By**: DevOps Team
- **Approved By**: Technical Lead

---

**© 2026 CanvaStencil. All rights reserved.**
