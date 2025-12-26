# Platform Domain Migration Guide
## Migrating to stencil.canvastack.com

**Current Setup:** Tenant CEX on `etchingxenial.com`  
**Target Setup:** Platform on `stencil.canvastack.com`, Tenant CEX remains on `etchingxenial.com`

---

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Architecture After Migration](#architecture-after-migration)
3. [Pre-Migration Planning](#pre-migration-planning)
4. [Backend API Strategy](#backend-api-strategy)
5. [Frontend Migration Steps](#frontend-migration-steps)
6. [DNS Configuration](#dns-configuration)
7. [Testing Strategy](#testing-strategy)
8. [Cutover Plan](#cutover-plan)
9. [Post-Migration Verification](#post-migration-verification)
10. [Rollback Plan](#rollback-plan)

---

## Migration Overview

### Current State

```
┌────────────────────────────────────┐
│  etchingxenial.com                 │
│  - Tenant CEX frontend             │
│  - Public pages: /etchinx/*        │
│  - Admin panel: /admin/*           │
└────────────┬───────────────────────┘
             │ API Calls
             ▼
┌────────────────────────────────────┐
│  api.etchingxenial.biz.id          │
│  - Laravel API                     │
│  - Multi-tenant database           │
└────────────────────────────────────┘
```

### Target State (Phase 2)

```
┌────────────────────────────────────┐    ┌────────────────────────────────────┐
│  stencil.canvastack.com            │    │  etchingxenial.com                 │
│  - Platform frontend               │    │  - Tenant CEX frontend             │
│  - Platform admin: /admin/*        │    │  - Public pages: /etchinx/*        │
│  - Public pages: /about, /faq      │    │  - Tenant admin: /admin/*          │
└────────────┬───────────────────────┘    └────────────┬───────────────────────┘
             │                                          │
             │ API Calls                               │ API Calls
             │                                          │
             └────────────────┬─────────────────────────┘
                              ▼
             ┌────────────────────────────────────────┐
             │  api.canvastack.com (or existing)      │
             │  - Laravel API                         │
             │  - Multi-tenant database               │
             │  - Serves both platform & tenants      │
             └────────────────────────────────────────┘
```

### Migration Goals

1. **Platform frontend** → Move to `stencil.canvastack.com`
2. **Tenant CEX** → Keep on `etchingxenial.com` (or optionally migrate routing)
3. **Backend API** → Migrate to `api.canvastack.com` OR keep at `api.etchingxenial.biz.id`
4. **Zero downtime** → Use DNS cutover strategy
5. **Data integrity** → No database changes required

---

## Architecture After Migration

### Option A: Shared API (Recommended)

**Single API serves both platform and tenant:**

```
Platform (stencil.canvastack.com)
└─> api.canvastack.com/api/v1/platform/*

Tenant CEX (etchingxenial.com)
└─> api.canvastack.com/api/v1/tenant/etchinx/*
```

**Pros:**
- Single codebase, easier maintenance
- Shared authentication system
- Centralized database

**Cons:**
- Platform and tenant share API infrastructure
- Requires good CORS and subdomain management

### Option B: Separate APIs

**Platform API and Tenant API are separate:**

```
Platform (stencil.canvastack.com)
└─> api.canvastack.com/api/v1/platform/*

Tenant CEX (etchingxenial.com)
└─> api.etchingxenial.biz.id/api/v1/tenant/etchinx/*
```

**Pros:**
- Complete isolation
- Tenant-specific performance tuning
- Independent scaling

**Cons:**
- More infrastructure to manage
- Database synchronization if needed
- Higher costs

**Recommendation:** Use **Option A** unless you need complete tenant isolation.

---

## Pre-Migration Planning

### 1. Inventory Current Setup

**Backend:**
- [ ] Current API domain: `api.etchingxenial.biz.id`
- [ ] Database location and access
- [ ] Environment variables
- [ ] SSL certificates
- [ ] External integrations (mail, storage, etc.)

**Frontend:**
- [ ] Current domain: `etchingxenial.com`
- [ ] Hosting provider and access
- [ ] CDN usage (if any)
- [ ] Analytics tracking codes
- [ ] Third-party scripts

### 2. Acquire New Resources

- [ ] Register `stencil.canvastack.com` domain
- [ ] Register `api.canvastack.com` subdomain (if migrating API)
- [ ] Setup hosting for platform frontend
- [ ] Setup backend hosting (if migrating API)
- [ ] Obtain SSL certificates for new domains

### 3. Backup Everything

```bash
# Backup current database
pg_dump -U username -h localhost stencil_production > backup_pre_migration_20251226.sql

# Backup backend files
tar -czf backend_backup_20251226.tar.gz /path/to/api.etchingxenial.biz.id

# Backup frontend files
tar -czf frontend_cex_backup_20251226.tar.gz /path/to/public_html
```

### 4. Communication Plan

- [ ] Notify users of planned maintenance window
- [ ] Prepare rollback communication
- [ ] Schedule migration during low-traffic hours
- [ ] Prepare status page or banner

---

## Backend API Strategy

### Option 1: Keep Existing API (Easiest)

**No backend changes needed:**

1. Keep API at `api.etchingxenial.biz.id`
2. Update CORS to allow new platform domain
3. Update frontend to point to existing API

**Backend `.env` changes:**

```env
# Add new frontend domain to CORS
FRONTEND_URL=https://stencil.canvastack.com,https://etchingxenial.com
SANCTUM_STATEFUL_DOMAINS=stencil.canvastack.com,etchingxenial.com,www.etchingxenial.com
```

**Backend `config/cors.php`:**

```php
'allowed_origins' => [
    'https://stencil.canvastack.com',
    'https://www.stencil.canvastack.com',
    'https://etchingxenial.com',
    'https://www.etchingxenial.com',
],
```

**Clear config cache:**
```bash
php artisan config:clear
php artisan config:cache
```

### Option 2: Migrate API to New Domain

**Steps to migrate API to `api.canvastack.com`:**

1. **Setup new server/subdomain:**
   - Point `api.canvastack.com` to new server IP
   - Install SSL certificate
   - Configure web server (Apache/Nginx)

2. **Deploy backend code:**
   - Follow [BACKEND-DEPLOYMENT.md](./BACKEND-DEPLOYMENT.md)
   - Use same database or migrate database
   - Update `.env` with new domain:
     ```env
     APP_URL=https://api.canvastack.com
     FRONTEND_URL=https://stencil.canvastack.com,https://etchingxenial.com
     ```

3. **Database migration (if moving database):**
   ```bash
   # On old server
   pg_dump -U user -h localhost stencil_production > db_migration.sql

   # Transfer to new server
   scp db_migration.sql user@new-server:/tmp/

   # On new server
   psql -U user -h localhost stencil_production_new < /tmp/db_migration.sql
   ```

4. **Test new API:**
   ```bash
   curl https://api.canvastack.com/api/v1/health
   curl https://api.canvastack.com/api/v1/public/pages/home
   ```

5. **Run in parallel:**
   - Keep old API running
   - New API operational
   - Test thoroughly before switching

---

## Frontend Migration Steps

### Step 1: Build Platform Frontend

**Separate platform and tenant code:**

The current codebase supports both. You'll build two separate instances:

1. **Platform build** (for `stencil.canvastack.com`):
   ```bash
   cd frontend/

   # Create platform environment
   cp .env.production .env.production.platform

   # Edit .env.production.platform
   nano .env.production.platform
   ```

   **Platform `.env.production.platform`:**
   ```env
   VITE_API_URL=https://api.canvastack.com/api/v1
   VITE_PUBLIC_API_URL=https://api.canvastack.com/api/v1
   VITE_APP_BASE_URL=/
   VITE_APP_ENVIRONMENT=production
   VITE_DEBUG_MODE=false
   VITE_APP_DEPLOY_PLATFORM=webhost
   VITE_APP_IS_PLATFORM=true
   ```

   ```bash
   # Build platform
   cp .env.production.platform .env.production
   npm run build

   # Rename output
   mv dist/ dist-platform/
   ```

2. **Tenant build** (for `etchingxenial.com`):
   ```bash
   # Create tenant environment
   cp .env.production .env.production.tenant

   # Edit .env.production.tenant
   nano .env.production.tenant
   ```

   **Tenant `.env.production.tenant`:**
   ```env
   VITE_API_URL=https://api.canvastack.com/api/v1
   VITE_PUBLIC_API_URL=https://api.canvastack.com/api/v1
   VITE_APP_BASE_URL=/
   VITE_APP_ENVIRONMENT=production
   VITE_DEBUG_MODE=false
   VITE_APP_DEPLOY_PLATFORM=webhost
   VITE_APP_IS_TENANT=true
   VITE_APP_TENANT_SLUG=etchinx
   ```

   ```bash
   # Build tenant
   cp .env.production.tenant .env.production
   npm run build

   # Rename output
   mv dist/ dist-tenant/
   ```

### Step 2: Deploy Platform Frontend

**Upload to `stencil.canvastack.com`:**

1. **Via FTP:**
   - Connect to hosting for `stencil.canvastack.com`
   - Navigate to `/public_html/` (or site root)
   - Upload all files from `dist-platform/`

2. **Create `.htaccess`:**
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /

     # Force HTTPS
     RewriteCond %{HTTPS} off
     RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

     # SPA routing
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule ^ index.html [L]
   </IfModule>

   Options -Indexes

   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
   </IfModule>

   <IfModule mod_headers.c>
     Header set X-Content-Type-Options "nosniff"
     Header set X-Frame-Options "SAMEORIGIN"
     Header set X-XSS-Protection "1; mode=block"
   </IfModule>
   ```

3. **Test platform:**
   - Visit `https://stencil.canvastack.com`
   - Test platform pages: `/about`, `/faq`, `/contact`
   - Test platform admin: `/admin/login`

### Step 3: Update Tenant Frontend (Optional)

If you want to update tenant to point to new API:

1. **Update API URL:**
   - Rebuild with new `.env.production.tenant` (API URL changed)
   - Upload to `etchingxenial.com/public_html/`

2. **Or keep as-is:**
   - If keeping old API, no changes needed

---

## DNS Configuration

### DNS Records to Configure

#### 1. Platform Domain: `stencil.canvastack.com`

```
Type    Name       Value                   TTL
A       stencil    [platform-server-ip]    3600
A       www        [platform-server-ip]    3600
CNAME   www        stencil.canvastack.com  3600
```

#### 2. API Domain (if migrating): `api.canvastack.com`

```
Type    Name    Value                  TTL
A       api     [api-server-ip]        3600
```

#### 3. Tenant Domain: `etchingxenial.com` (no changes unless migrating)

```
Type    Name    Value                        TTL
A       @       [current-server-ip]          3600
A       www     [current-server-ip]          3600
```

### DNS Propagation

- **TTL:** Set to 300 (5 minutes) before migration for faster propagation
- **Propagation time:** 15 minutes - 48 hours
- **Test:** Use `dig` or online DNS checkers
  ```bash
  dig stencil.canvastack.com
  dig api.canvastack.com
  ```

### Hosts File Testing (Before DNS)

Test before DNS propagation:

**On your local machine:**

```
# Windows: C:\Windows\System32\drivers\etc\hosts
# Linux/Mac: /etc/hosts

[platform-server-ip]  stencil.canvastack.com
[platform-server-ip]  www.stencil.canvastack.com
[api-server-ip]       api.canvastack.com
```

Then test in browser.

---

## Testing Strategy

### Phase 1: Parallel Testing

1. **Old system:** `etchingxenial.com` + `api.etchingxenial.biz.id`
2. **New system:** `stencil.canvastack.com` + `api.canvastack.com`
3. **Both operational:** Test new without affecting old

### Test Checklist - Platform

**Platform Frontend (`stencil.canvastack.com`):**
- [ ] Homepage loads
- [ ] Platform pages: /about, /faq, /contact
- [ ] Platform admin login
- [ ] Platform admin dashboard
- [ ] Platform content editing
- [ ] API calls successful
- [ ] Authentication working
- [ ] No console errors

**Tenant Frontend (`etchingxenial.com`):**
- [ ] Still operational
- [ ] Tenant pages: /etchinx/*
- [ ] Tenant admin login
- [ ] Tenant content editing
- [ ] API calls successful (to old or new API)
- [ ] No disruption

### Phase 2: Load Testing

**Simulate traffic:**
```bash
# Use Apache Bench
ab -n 1000 -c 10 https://stencil.canvastack.com/

# Or use k6, Gatling, JMeter
```

### Phase 3: End-to-End Testing

**Complete user journeys:**
1. Anonymous user visits platform
2. Anonymous user visits tenant site
3. Platform admin logs in, edits content
4. Tenant admin logs in, edits content
5. Changes reflected immediately on public pages

---

## Cutover Plan

### Zero-Downtime Cutover

**Timeline: 2-4 hours**

#### Step 1: Pre-Cutover (1 hour before)

- [ ] All tests passed
- [ ] Backups completed
- [ ] Rollback plan ready
- [ ] Team on standby
- [ ] Monitoring active

#### Step 2: Deploy Backend (if migrating)

- [ ] Deploy new API to `api.canvastack.com`
- [ ] Run migrations (no breaking changes)
- [ ] Test API endpoints
- [ ] Keep old API running

#### Step 3: Deploy Frontend

- [ ] Upload platform to `stencil.canvastack.com`
- [ ] Upload updated tenant to `etchingxenial.com` (if needed)
- [ ] Test with hosts file

#### Step 4: DNS Cutover

- [ ] Update DNS for `stencil.canvastack.com` → new server
- [ ] Update DNS for `api.canvastack.com` → new server (if migrating)
- [ ] Monitor DNS propagation
- [ ] Test from multiple locations

#### Step 5: Monitoring (2 hours after)

- [ ] Check error logs
- [ ] Monitor API response times
- [ ] Check user reports
- [ ] Verify analytics tracking

#### Step 6: Decommission Old System (After 7 days)

- [ ] Keep old system running for 1 week
- [ ] Monitor traffic (should drop to zero)
- [ ] Archive data
- [ ] Shut down old infrastructure

---

## Post-Migration Verification

### Health Checks

```bash
# Platform API
curl https://api.canvastack.com/api/v1/health

# Platform frontend
curl -I https://stencil.canvastack.com

# Tenant frontend
curl -I https://etchingxenial.com

# Tenant API (via platform API)
curl https://api.canvastack.com/api/v1/public/tenant/etchinx/home
```

### Database Verification

```sql
-- Check tenant data
SELECT * FROM tenants WHERE slug = 'etchinx';

-- Check tenant pages
SELECT uuid, slug, status, updated_at FROM tenant_pages WHERE tenant_id = [etchinx-id];

-- Check platform pages
SELECT uuid, slug, status, updated_at FROM platform_pages;
```

### Application Monitoring

- [ ] Setup New Relic / Datadog / Application Insights
- [ ] Configure alerts for errors
- [ ] Monitor API latency
- [ ] Track user sessions

---

## Rollback Plan

### If Migration Fails

**Within 1 hour:**

1. **DNS Rollback:**
   ```
   # Revert DNS to old IP
   A  stencil.canvastack.com  [old-ip]
   ```

2. **Notify users:**
   - Display maintenance message
   - Explain issue

3. **Fix issues:**
   - Investigate logs
   - Fix problems
   - Re-test

4. **Retry cutover:**
   - When ready, attempt again

**Within 24 hours:**

1. **Keep old system:**
   - Old system remains primary
   - New system becomes staging

2. **Extended testing:**
   - More comprehensive testing
   - Performance tuning
   - Bug fixes

3. **Schedule new cutover:**
   - After all issues resolved

### Critical Issues

**Database corruption:**
- Restore from backup
- Re-run migrations
- Verify data integrity

**API failures:**
- Check logs: `storage/logs/laravel.log`
- Verify `.env` configuration
- Check database connection
- Restart web server

**Frontend issues:**
- Verify correct build uploaded
- Check `.htaccess` configuration
- Clear browser cache
- Check API URLs in build

---

## Post-Migration Tasks

### Week 1

- [ ] Daily monitoring
- [ ] Review error logs
- [ ] Performance tuning
- [ ] User feedback collection

### Month 1

- [ ] Weekly reports
- [ ] Performance analysis
- [ ] Cost analysis
- [ ] Optimization opportunities

### Quarter 1

- [ ] Archive old infrastructure
- [ ] Update documentation
- [ ] Conduct retrospective
- [ ] Plan next improvements

---

## Configuration Reference

### Platform Frontend (.env.production.platform)

```env
VITE_API_URL=https://api.canvastack.com/api/v1
VITE_PUBLIC_API_URL=https://api.canvastack.com/api/v1
VITE_APP_BASE_URL=/
VITE_APP_ENVIRONMENT=production
VITE_APP_DEPLOY_PLATFORM=webhost
```

### Tenant Frontend (.env.production.tenant)

```env
VITE_API_URL=https://api.canvastack.com/api/v1
VITE_PUBLIC_API_URL=https://api.canvastack.com/api/v1
VITE_APP_BASE_URL=/
VITE_APP_ENVIRONMENT=production
VITE_APP_DEPLOY_PLATFORM=webhost
VITE_APP_TENANT_SLUG=etchinx
```

### Backend API (.env - Production)

```env
APP_URL=https://api.canvastack.com
FRONTEND_URL=https://stencil.canvastack.com,https://etchingxenial.com

SANCTUM_STATEFUL_DOMAINS=stencil.canvastack.com,etchingxenial.com,www.stencil.canvastack.com,www.etchingxenial.com

SESSION_DOMAIN=.canvastack.com
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
```

---

## Support Contacts

Maintain list of contacts:

- **Hosting Provider:** [contact info]
- **DNS Provider:** [contact info]
- **SSL Provider:** [contact info]
- **Development Team:** [contact info]
- **Database Admin:** [contact info]

---

## Conclusion

Migration to platform domain is a significant but manageable task. Follow this guide step-by-step, test thoroughly, and maintain communication with stakeholders.

**Key Success Factors:**
1. Thorough testing before cutover
2. Parallel systems during transition
3. Clear rollback plan
4. Post-migration monitoring

**Next Steps:**
1. Review this guide with team
2. Schedule migration date
3. Assign responsibilities
4. Execute migration plan

---

**Document Version:** 1.0  
**Last Updated:** December 26, 2025  
**Maintained By:** Development Team
