# End-to-End Deployment Guide
## CanvasTencil to Production Web Hosting

**Last Updated:** December 26, 2025  
**Project:** CanvasTencil Multi-Tenant Platform  
**Target Environment:** Production Web Hosting (cPanel/Shared Hosting)

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Future Migration Plan](#future-migration-plan)
7. [Troubleshooting](#troubleshooting)

---

## Deployment Overview

### Current Production Setup

| Component | Domain | Folder Path | Purpose |
|-----------|--------|-------------|---------|
| **Backend API** | `api.etchingxenial.biz.id` | `/api.etchingxenial.biz.id` | Laravel API server |
| **Frontend** | `etchingxenial.com` | `/public_html` | React SPA (Tenant CEX) |

### Architecture

```
┌─────────────────────────────────────────────┐
│  etchingxenial.com (Frontend)               │
│  ┌─────────────────────────────────────┐   │
│  │  React SPA (Vite Build)             │   │
│  │  - Tenant: PT CEX                   │   │
│  │  - Public Pages: /etchinx/*         │   │
│  │  - Admin Panel: /admin/*            │   │
│  └─────────────────────────────────────┘   │
└─────────────────┬───────────────────────────┘
                  │
                  │ API Calls
                  ▼
┌─────────────────────────────────────────────┐
│  api.etchingxenial.biz.id (Backend)         │
│  ┌─────────────────────────────────────┐   │
│  │  Laravel 10 API                     │   │
│  │  - Multi-Tenant System              │   │
│  │  - PostgreSQL Database              │   │
│  │  - Authentication (Sanctum)         │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Future Migration (Phase 2)

- **Platform Domain:** `stencil.canvastack.com` → Main platform webapp
- **Tenant Domain:** `etchingxenial.com` → Remains as PT CEX tenant site
- **Backend API:** `api.etchingxenial.biz.id` → Will be migrated or remain depending on architecture

---

## Pre-Deployment Checklist

### Development Environment Verification

- [ ] All tests passing (`npm test`, `php artisan test`)
- [ ] No console errors in browser
- [ ] Database seeded with production-ready data
- [ ] All environment variables documented
- [ ] Mock data completely removed (✅ Already completed)
- [ ] Authentication working correctly
- [ ] Admin pages loading and saving correctly
- [ ] Public pages displaying tenant content

### Required Access & Credentials

- [ ] Web hosting cPanel access (username/password)
- [ ] FTP/SFTP credentials
- [ ] SSH access (if available)
- [ ] Database credentials from hosting provider
- [ ] Domain DNS management access
- [ ] SSL certificates (or Let's Encrypt via cPanel)

### Required Software (Local Machine)

- [ ] Git
- [ ] Node.js 18+ & npm
- [ ] PHP 8.1+
- [ ] Composer
- [ ] FileZilla or equivalent FTP client
- [ ] PostgreSQL client (e.g., pgAdmin, DBeaver)

### Backup Strategy

- [ ] Backup existing production database (if any)
- [ ] Backup existing files on server
- [ ] Document rollback procedure
- [ ] Keep local copy of deployment files

---

## Backend Deployment

See [BACKEND-DEPLOYMENT.md](./BACKEND-DEPLOYMENT.md) for detailed backend deployment instructions.

**Quick Summary:**

1. Setup database on hosting provider
2. Upload Laravel files to `/api.etchingxenial.biz.id`
3. Configure `.env` for production
4. Install Composer dependencies
5. Run migrations and seeders
6. Configure web server (`.htaccess`)
7. Set proper file permissions

---

## Frontend Deployment

See [FRONTEND-DEPLOYMENT.md](./FRONTEND-DEPLOYMENT.md) for detailed frontend deployment instructions.

**Quick Summary:**

1. Update `.env.production` with production API URL
2. Build production bundle (`npm run build`)
3. Upload `dist/` contents to `/public_html`
4. Configure routing for SPA (`.htaccess`)
5. Test all routes and functionality

---

## Post-Deployment Verification

### Backend API Health Check

```bash
# Test API endpoint
curl https://api.etchingxenial.biz.id/api/v1/health

# Expected Response:
{
  "status": "ok",
  "timestamp": "2025-12-26T14:30:00.000000Z",
  "environment": "production"
}
```

### Frontend Verification Checklist

- [ ] Homepage loads: `https://etchingxenial.com`
- [ ] Public pages load: `/etchinx/home`, `/etchinx/about`, `/etchinx/contact`, `/etchinx/faq`
- [ ] Admin login works: `/admin/login`
- [ ] Admin pages load: `/admin/content/home`, `/admin/content/about`, etc.
- [ ] Content editing works (save/update)
- [ ] Images and assets load correctly
- [ ] No console errors
- [ ] API calls return 200 (check Network tab)

### Database Verification

```sql
-- Check tenants
SELECT id, name, slug, domain FROM tenants;

-- Check tenant pages
SELECT uuid, tenant_id, slug, status FROM tenant_pages;

-- Check platform pages
SELECT uuid, slug, status FROM platform_pages;
```

### Authentication Test

1. Login as platform admin
2. Login as tenant admin (PT CEX)
3. Verify role-based access control
4. Test token expiration and refresh

---

## Future Migration Plan

See [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md) for detailed migration instructions.

### Phase 2: Platform Domain Migration

When `stencil.canvastack.com` is ready:

1. **Platform Frontend:**
   - Build with `VITE_APP_BASE_URL=/`
   - Deploy to new hosting/domain
   - Update API URLs to point to backend

2. **Tenant Frontend (etchingxenial.com):**
   - Remains on current hosting
   - Update API URLs if backend changes
   - Configure tenant-specific routing

3. **Backend API:**
   - Option A: Keep at `api.etchingxenial.biz.id`
   - Option B: Migrate to `api.canvastack.com`
   - Update CORS settings for new frontend domains

4. **DNS Configuration:**
   - Point `stencil.canvastack.com` → Platform hosting
   - Ensure `etchingxenial.com` remains → Tenant hosting
   - Update API subdomain DNS if needed

---

## Troubleshooting

### Common Issues

#### Issue: 404 on API Calls

**Solution:**
- Check `.htaccess` in backend root
- Verify `APP_URL` in backend `.env`
- Ensure mod_rewrite enabled on server

#### Issue: White Screen on Frontend

**Solution:**
- Check browser console for errors
- Verify `VITE_API_URL` in build
- Check `.htaccess` for SPA routing
- Inspect Network tab for failed requests

#### Issue: Authentication Fails

**Solution:**
- Verify `SANCTUM_STATEFUL_DOMAINS` in backend `.env`
- Check CORS configuration in `config/cors.php`
- Ensure cookies are allowed (SameSite settings)
- Verify `SESSION_DOMAIN` in backend `.env`

#### Issue: Images Not Loading

**Solution:**
- Check file permissions (755 for directories, 644 for files)
- Verify storage symlink: `php artisan storage:link`
- Check `ASSET_URL` in backend `.env`
- Ensure `/images` path correct in frontend

#### Issue: Database Connection Failed

**Solution:**
- Verify database credentials in `.env`
- Check database server IP/host
- Ensure PostgreSQL port (5432) is open
- Test connection with database client

---

## Support & Maintenance

### Monitoring

- Setup uptime monitoring (e.g., UptimeRobot)
- Enable Laravel logging: check `storage/logs/laravel.log`
- Monitor disk space usage
- Track API response times

### Regular Maintenance

- Weekly: Check error logs
- Monthly: Update dependencies (security patches)
- Quarterly: Database backup verification
- Annually: SSL certificate renewal (auto with Let's Encrypt)

### Rollback Procedure

1. Restore database from backup
2. Replace files with previous version
3. Clear cache: `php artisan cache:clear`
4. Verify functionality

---

## Additional Resources

- [Backend Deployment Guide](./BACKEND-DEPLOYMENT.md)
- [Frontend Deployment Guide](./FRONTEND-DEPLOYMENT.md)
- [Migration Guide](./MIGRATION-GUIDE.md)
- [Environment Configuration](./ENVIRONMENT-CONFIG.md)

---

**Next Steps:**  
Proceed to [BACKEND-DEPLOYMENT.md](./BACKEND-DEPLOYMENT.md) to begin backend deployment.
