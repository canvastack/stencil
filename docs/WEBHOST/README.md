# Web Hosting Deployment Documentation
## CanvaStencil Production Deployment Guides

**Last Updated:** December 26, 2025  
**Project:** CanvaStencil Multi-Tenant Platform

---

## 📚 Documentation Index

This folder contains comprehensive guides for deploying CanvaStencil to production web hosting (cPanel/shared hosting) and future platform migration planning.

---

## 🚀 Quick Start

**For first-time deployment, follow in this order:**

1. **[E2E Deployment Guide](./E2E-DEPLOYMENT-GUIDE.md)** ← Start here for overview
2. **[Backend Deployment](./BACKEND-DEPLOYMENT.md)** - Deploy Laravel API
3. **[Frontend Deployment](./FRONTEND-DEPLOYMENT.md)** - Deploy React SPA
4. **[Environment Configuration](./ENVIRONMENT-CONFIG.md)** - Reference for all `.env` settings

**For future platform migration:**

5. **[Migration Guide](./MIGRATION-GUIDE.md)** - Migrate to `stencil.canvastack.com`

---

## 📖 Documentation Files

### 1. [E2E-DEPLOYMENT-GUIDE.md](./E2E-DEPLOYMENT-GUIDE.md)

**Complete end-to-end deployment overview**

- Architecture overview
- Current and future deployment setup
- Pre-deployment checklist
- Overview of backend and frontend deployment
- Post-deployment verification
- Troubleshooting common issues

**When to use:** Read this first to understand the complete deployment process.

---

### 2. [BACKEND-DEPLOYMENT.md](./BACKEND-DEPLOYMENT.md)

**Detailed Laravel API deployment guide**

- Server requirements and setup
- Database creation and configuration
- File upload via FTP/SSH
- Environment configuration (`.env`)
- Composer dependencies installation
- Database migrations and seeding
- Web server configuration (`.htaccess`)
- File permissions
- Testing and optimization

**When to use:** When deploying or updating the backend API.

**Target:**
- **Domain:** `api.etchingxenial.biz.id`
- **Folder:** `/api.etchingxenial.biz.id`
- **Stack:** Laravel 10, PostgreSQL, PHP 8.1+

---

### 3. [FRONTEND-DEPLOYMENT.md](./FRONTEND-DEPLOYMENT.md)

**Detailed React SPA deployment guide**

- Environment configuration for production
- Building production bundle with Vite
- Upload methods (FTP, SSH, cPanel)
- Web server configuration (`.htaccess` for SPA routing)
- SSL/HTTPS setup
- Comprehensive testing checklist
- Troubleshooting frontend issues
- Performance optimization

**When to use:** When deploying or updating the frontend application.

**Target:**
- **Domain:** `etchingxenial.com`
- **Folder:** `/public_html`
- **Stack:** React 18, Vite, TypeScript

---

### 4. [ENVIRONMENT-CONFIG.md](./ENVIRONMENT-CONFIG.md)

**Complete environment variables reference**

- Backend `.env` template with all variables explained
- Frontend `.env` template with all variables explained
- Environment-specific configurations (dev, staging, production)
- CORS configuration
- Session configuration
- Security best practices
- Troubleshooting environment issues
- Quick reference commands

**When to use:** When configuring `.env` files or troubleshooting configuration issues.

---

### 5. [MIGRATION-GUIDE.md](./MIGRATION-GUIDE.md)

**Platform domain migration guide**

- Migration from single tenant setup to multi-domain platform
- Current state vs. target state architecture
- Backend API migration strategies
- Frontend separation (platform vs. tenant)
- DNS configuration
- Testing strategy
- Zero-downtime cutover plan
- Rollback procedures

**When to use:** When ready to migrate platform to `stencil.canvastack.com`.

**Future Setup:**
- **Platform:** `stencil.canvastack.com` → Main platform
- **Tenant CEX:** `etchingxenial.com` → PT CEX tenant site
- **API:** `api.canvastack.com` or keep at `api.etchingxenial.biz.id`

---

## 🎯 Current Production Setup

```
┌─────────────────────────────────────────────┐
│  etchingxenial.com (Frontend)               │
│  Folder: /public_html                       │
│  - React SPA (Vite build)                   │
│  - Tenant: PT CEX (Etching Xenial)          │
│  - Public pages: /etchinx/*                 │
│  - Admin panel: /admin/*                    │
└─────────────────┬───────────────────────────┘
                  │
                  │ HTTPS API Calls
                  ▼
┌─────────────────────────────────────────────┐
│  api.etchingxenial.biz.id (Backend)         │
│  Folder: /api.etchingxenial.biz.id          │
│  - Laravel 10 API                           │
│  - PostgreSQL Database                      │
│  - Multi-tenant architecture                │
│  - Sanctum authentication                   │
└─────────────────────────────────────────────┘
```

---

## 🔮 Future Platform Setup (Phase 2)

After migrating to platform domain:

```
┌────────────────────────────────┐    ┌────────────────────────────────┐
│  stencil.canvastack.com        │    │  etchingxenial.com             │
│  - Platform frontend           │    │  - Tenant CEX frontend         │
│  - Platform admin              │    │  - Tenant pages                │
└────────────┬───────────────────┘    └────────────┬───────────────────┘
             │                                      │
             │                                      │
             └────────────────┬─────────────────────┘
                              │
                              ▼
             ┌────────────────────────────────────┐
             │  api.canvastack.com                │
             │  - Unified API for platform        │
             │  - Multi-tenant database           │
             └────────────────────────────────────┘
```

---

## ✅ Deployment Checklist

Use this checklist for first deployment:

### Pre-Deployment

- [ ] Read [E2E-DEPLOYMENT-GUIDE.md](./E2E-DEPLOYMENT-GUIDE.md)
- [ ] All tests passing locally
- [ ] No mock data in codebase (already verified ✅)
- [ ] Web hosting access (cPanel, FTP, SSH)
- [ ] Database credentials ready
- [ ] Domain DNS configured
- [ ] SSL certificates ready
- [ ] Backup strategy documented

### Backend Deployment

- [ ] Follow [BACKEND-DEPLOYMENT.md](./BACKEND-DEPLOYMENT.md)
- [ ] Database created and configured
- [ ] Files uploaded to `/api.etchingxenial.biz.id`
- [ ] `.env` configured for production
- [ ] Composer dependencies installed
- [ ] Migrations run successfully
- [ ] Database seeded with content
- [ ] `.htaccess` configured
- [ ] File permissions set (755/644)
- [ ] API endpoints tested
- [ ] SSL enabled

### Frontend Deployment

- [ ] Follow [FRONTEND-DEPLOYMENT.md](./FRONTEND-DEPLOYMENT.md)
- [ ] `.env.production` configured
- [ ] Production build successful (`npm run build`)
- [ ] Files uploaded to `/public_html`
- [ ] `.htaccess` configured for SPA routing
- [ ] All routes tested
- [ ] API integration verified
- [ ] Authentication tested
- [ ] Cross-browser tested
- [ ] Mobile responsive verified
- [ ] Performance audit passed

### Post-Deployment

- [ ] All admin pages loading
- [ ] All public pages loading
- [ ] Content editing working
- [ ] No console errors
- [ ] API calls successful (200 OK)
- [ ] Authentication working
- [ ] Monitor error logs for 24-48 hours
- [ ] User acceptance testing

---

## 🔧 Common Tasks

### Update Backend Code

```bash
# 1. Make changes locally and test
# 2. Build and upload
cd backend
composer install --optimize-autoloader --no-dev

# 3. Upload via FTP to /api.etchingxenial.biz.id

# 4. On server, clear cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# 5. Re-cache
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Update Frontend Code

```bash
# 1. Make changes locally and test
# 2. Build production bundle
cd frontend
npm run build

# 3. Backup current production
# Download /public_html via FTP

# 4. Upload new build
# Upload dist/* to /public_html via FTP

# 5. Test all routes
```

### Run Database Migrations

```bash
# On server via SSH
cd /api.etchingxenial.biz.id
php artisan migrate --force

# Check migration status
php artisan migrate:status
```

### View Logs

```bash
# Backend logs
tail -f /api.etchingxenial.biz.id/storage/logs/laravel.log

# Or via cPanel File Manager
# Navigate to: /api.etchingxenial.biz.id/storage/logs/laravel.log
```

---

## 🐛 Troubleshooting

### Quick Diagnostics

**Backend not responding:**
```bash
# Check if backend is accessible
curl https://api.etchingxenial.biz.id/api/v1/health

# Expected: {"status":"ok","timestamp":"..."}
```

**Frontend not loading:**
```bash
# Check if frontend is accessible
curl -I https://etchingxenial.com

# Expected: HTTP/2 200
```

**Database connection failed:**
```bash
# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();
>>> exit
```

### Common Issues

| Issue | Solution | Documentation |
|-------|----------|---------------|
| 404 on API calls | Check `.htaccess` in backend | [Backend Guide](./BACKEND-DEPLOYMENT.md#web-server-configuration) |
| White screen on frontend | Check base URL in build | [Frontend Guide](./FRONTEND-DEPLOYMENT.md#troubleshooting) |
| CORS errors | Configure CORS in backend | [Environment Config](./ENVIRONMENT-CONFIG.md#cors-configuration-backend) |
| Authentication fails | Check Sanctum domains | [Backend Guide](./BACKEND-DEPLOYMENT.md#environment-configuration) |
| Routes 404 on frontend | Check `.htaccess` for SPA | [Frontend Guide](./FRONTEND-DEPLOYMENT.md#web-server-configuration) |

---

## 📞 Support & Resources

### External Resources

- **Laravel Documentation:** https://laravel.com/docs/10.x
- **Vite Documentation:** https://vitejs.dev/
- **React Documentation:** https://react.dev/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/

### Internal Resources

- **Project Repository:** [Add GitHub/GitLab URL]
- **Issue Tracker:** [Add issue tracker URL]
- **Team Wiki:** [Add wiki URL]

### Getting Help

1. **Check documentation** in this folder first
2. **Review logs** for error details
3. **Search GitHub issues** for similar problems
4. **Contact team** with detailed error information

---

## 📝 Maintenance Schedule

### Regular Tasks

- **Daily:** Monitor error logs
- **Weekly:** Check disk space and database size
- **Monthly:** Security updates (dependencies)
- **Quarterly:** Performance audit and optimization
- **Annually:** SSL certificate renewal (auto with Let's Encrypt)

---

## 🔐 Security Notes

**Critical Security Reminders:**

- ✅ **Never commit `.env` files** to version control
- ✅ **Set `APP_DEBUG=false`** in production
- ✅ **Use HTTPS** for all production domains
- ✅ **Strong passwords** for database and admin accounts
- ✅ **Regular backups** of database and files
- ✅ **Keep dependencies updated** for security patches
- ✅ **Restrict file permissions** (755/644, not 777)
- ✅ **Monitor logs** for suspicious activity

---

## 📊 Performance Optimization

### Backend Optimization

```bash
# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Optimize Composer autoloader
composer dump-autoload --optimize
```

### Frontend Optimization

- ✅ Gzip compression enabled (`.htaccess`)
- ✅ Browser caching configured (`.htaccess`)
- ✅ Lazy loading for images
- ✅ Code splitting by Vite
- ✅ Asset optimization in build

---

## 🎓 Learning Path

**For new team members:**

1. **Week 1:** Read all documentation
2. **Week 2:** Deploy to staging environment
3. **Week 3:** Practice updates and rollbacks
4. **Week 4:** Perform supervised production deployment

---

## 📅 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 26, 2025 | Initial comprehensive deployment documentation |

---

## 🚀 Next Steps

**You are here:** Documentation complete ✅

**What's next:**

1. **Review** all documentation with your team
2. **Prepare** hosting accounts and credentials
3. **Test** deployment in staging environment first
4. **Deploy** to production following the guides
5. **Monitor** and maintain the production system
6. **Plan** for future platform migration (Phase 2)

---

## 📧 Feedback

This documentation is maintained by the development team. If you find errors, have suggestions, or need clarification:

- Create an issue in the project repository
- Contact the development team
- Submit a pull request with improvements

---

**Document Version:** 1.0  
**Maintained By:** Development Team  
**Last Review:** December 26, 2025

---

**Happy Deploying! 🎉**
