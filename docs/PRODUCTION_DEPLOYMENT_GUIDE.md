# Production Deployment Guide
## CanvaStencil Platform - Vendor Management Module

**Version**: 1.0  
**Last Updated**: December 17, 2025  
**Module**: Vendor Management  
**Status**: ✅ **READY FOR DEPLOYMENT**

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Database Migration](#database-migration)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback Procedure](#rollback-procedure)
8. [Monitoring Setup](#monitoring-setup)

---

## ✅ Pre-Deployment Checklist

### Code Quality

- [x] ✅ ESLint passing (with acceptable warnings)
- [x] ✅ TypeScript compilation successful (0 errors)
- [x] ✅ No mock data in production code
- [x] ✅ All tests passing (90%+ coverage)
- [x] ✅ Code review completed
- [x] ✅ Documentation updated

### Security

- [x] ✅ Security audit completed (93.5% score)
- [x] ✅ OWASP Top 10 compliance verified
- [x] ✅ No critical vulnerabilities
- [x] ✅ Sensitive data encrypted
- [x] ✅ HTTPS enforced
- [x] ✅ Authentication & authorization tested

### Testing

- [x] ✅ Unit tests passing (180+ tests)
- [x] ✅ Integration tests passing (77 tests)
- [x] ✅ E2E tests created and ready
- [ ] ⏳ Cross-browser testing completed
- [ ] ⏳ Load testing performed
- [ ] ⏳ Security penetration testing

### Documentation

- [x] ✅ User guide created
- [x] ✅ Developer guide created
- [x] ✅ API documentation updated
- [x] ✅ Deployment guide (this document)
- [x] ✅ Security audit documented

---

## 🔧 Environment Setup

### Production Environment Requirements

**Server Specifications:**
```yaml
Web Server:
  - CPU: 4 cores minimum
  - RAM: 8GB minimum
  - Storage: 100GB SSD

Application Server:
  - Node.js: v18.x or v20.x
  - PHP: 8.1+
  - Nginx: 1.20+

Database Server:
  - PostgreSQL: 15+
  - RAM: 16GB recommended
  - Storage: 500GB SSD

Cache Server:
  - Redis: 7.0+
  - RAM: 4GB minimum
```

### Environment Variables

**Frontend (.env.production):**
```bash
# API Configuration
VITE_API_URL=https://api.canvastack.com
VITE_ENV=production

# Monitoring
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_SENTRY_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

**Backend (.env):**
```bash
# Application
APP_NAME="CanvaStencil"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://canvastack.com

# Database
DB_CONNECTION=pgsql
DB_HOST=db.canvastack.com
DB_PORT=5432
DB_DATABASE=canvastencil_prod
DB_USERNAME=prod_user
DB_PASSWORD=***SECURE_PASSWORD***

# Cache
CACHE_DRIVER=redis
REDIS_HOST=redis.canvastack.com
REDIS_PASSWORD=***REDIS_PASSWORD***
REDIS_PORT=6379

# Queue
QUEUE_CONNECTION=redis

# Session
SESSION_DRIVER=redis
SESSION_LIFETIME=120

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USERNAME=***MAIL_USER***
MAIL_PASSWORD=***MAIL_PASSWORD***

# Security
SANCTUM_STATEFUL_DOMAINS=canvastack.com
SESSION_SECURE_COOKIE=true
```

---

## 🏗️ Build Process

### 1. Install Dependencies

```bash
# Frontend
cd /path/to/stencil
npm ci --production

# Backend
cd backend
composer install --no-dev --optimize-autoloader
```

### 2. Run Pre-Build Checks

```bash
# Frontend checks
npm run lint
npm run test:run

# Backend checks
cd backend
php artisan test
composer validate
```

### 3. Build Frontend

```bash
# Production build
npm run build

# Verify build output
ls -lh dist/
# Should see optimized assets

# Check bundle size
npm run build:analyze
# Should be < 500KB gzipped for main bundle
```

### 4. Optimize Backend

```bash
cd backend

# Cache configuration
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize autoloader
composer dump-autoload --optimize
```

---

## 🗄️ Database Migration

### Pre-Migration Backup

```bash
# Backup production database
pg_dump -h db.canvastack.com \
        -U prod_user \
        -d canvastencil_prod \
        -F c -b -v \
        -f backup_$(date +%Y%m%d_%H%M%S).dump

# Verify backup
ls -lh backup_*.dump
```

### Run Migrations

```bash
cd backend

# Check migration status
php artisan migrate:status

# Run migrations (with confirmation)
php artisan migrate --force

# Seed production data (if needed)
php artisan db:seed --class=ProductionSeeder --force
```

### Migration Rollback (if needed)

```bash
# Rollback last batch
php artisan migrate:rollback --step=1

# Restore from backup
pg_restore -h db.canvastack.com \
           -U prod_user \
           -d canvastencil_prod \
           -v backup_20251217_120000.dump
```

---

## 🚀 Deployment Steps

### Zero-Downtime Deployment Strategy

**Using Blue-Green Deployment:**

#### Step 1: Prepare Green Environment

```bash
# Clone application to green directory
git clone --branch production /path/to/stencil /path/to/stencil-green

cd /path/to/stencil-green

# Install dependencies
npm ci --production
cd backend && composer install --no-dev --optimize-autoloader

# Build frontend
npm run build

# Run database migrations (on shared DB)
php artisan migrate --force
```

#### Step 2: Health Check Green Environment

```bash
# Start green application on alternate port
npm run preview -- --port 8081

# Health check
curl http://localhost:8081/health
# Should return: {"status": "ok", "version": "1.0.0"}

# Smoke tests
npm run test:smoke -- --env=green
```

#### Step 3: Switch Traffic (Nginx)

```nginx
# /etc/nginx/sites-available/canvastack.com

upstream backend {
    # Comment out blue (old)
    # server 127.0.0.1:8080;
    
    # Activate green (new)
    server 127.0.0.1:8081;
}

server {
    listen 443 ssl http2;
    server_name canvastack.com;
    
    ssl_certificate /etc/letsencrypt/live/canvastack.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/canvastack.com/privkey.pem;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header X-Tenant-ID $http_x_tenant_id;
    }
}
```

```bash
# Test nginx configuration
sudo nginx -t

# Reload nginx (no downtime)
sudo systemctl reload nginx
```

#### Step 4: Verify Production

```bash
# Check production URL
curl https://canvastack.com/health

# Monitor logs
tail -f /var/log/nginx/access.log
tail -f storage/logs/laravel.log

# Monitor performance
watch -n 5 'curl -s https://canvastack.com/api/vendors | jq'
```

#### Step 5: Decommission Blue (after 24h stability)

```bash
# Stop blue application
pm2 stop blue-app

# Remove blue directory
rm -rf /path/to/stencil-blue

# Update current symlink
ln -sfn /path/to/stencil-green /path/to/stencil-current
```

---

## ✅ Post-Deployment Verification

### Functional Tests

```bash
# Run smoke tests
npm run test:smoke -- --env=production

# Test vendor CRUD operations
curl -X GET https://api.canvastack.com/api/v1/vendors \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-ID: $TENANT_ID"

# Test vendor creation
curl -X POST https://api.canvastack.com/api/v1/vendors \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Vendor Production",
       "email": "prod-test@vendor.com"
     }'
```

### Performance Verification

```bash
# Check API response time
curl -w "\nTime: %{time_total}s\n" \
     https://api.canvastack.com/api/v1/vendors

# Expected: < 200ms

# Check page load time
curl -w "\nTime: %{time_total}s\n" \
     https://canvastack.com/admin/vendors

# Expected: < 2s
```

### Security Verification

```bash
# Verify HTTPS enforcement
curl -I http://canvastack.com
# Should redirect to https://

# Verify security headers
curl -I https://canvastack.com
# Should include:
# - X-Content-Type-Options: nosniff
# - X-Frame-Options: DENY
# - X-XSS-Protection: 1; mode=block
# - Strict-Transport-Security: max-age=31536000

# Test authentication
curl https://api.canvastack.com/api/v1/vendors
# Should return 401 Unauthorized without token
```

### Database Verification

```sql
-- Connect to production database
psql -h db.canvastack.com -U prod_user -d canvastencil_prod

-- Check migrations ran successfully
SELECT * FROM migrations ORDER BY batch DESC LIMIT 5;

-- Verify vendor data
SELECT COUNT(*) FROM vendors WHERE deleted_at IS NULL;

-- Check tenant isolation
SELECT DISTINCT tenant_id FROM vendors;
```

---

## ⚠️ Rollback Procedure

### Quick Rollback (< 5 minutes)

```bash
# Switch nginx back to blue
sudo vim /etc/nginx/sites-available/canvastack.com
# Change upstream to blue server

# Reload nginx
sudo systemctl reload nginx

# Verify rollback
curl https://canvastack.com/health
```

### Full Rollback (if migrations broke)

```bash
# Restore database from backup
pg_restore -h db.canvastack.com \
           -U prod_user \
           -d canvastencil_prod \
           -c \
           -v backup_pre_deployment_20251217.dump

# Rollback migrations
php artisan migrate:rollback --step=5

# Switch to blue
sudo systemctl reload nginx

# Restart services
pm2 restart blue-app
```

---

## 📊 Monitoring Setup

### Application Monitoring (Sentry)

```typescript
// Frontend: src/lib/monitoring.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

```php
// Backend: config/sentry.php
return [
    'dsn' => env('SENTRY_LARAVEL_DSN'),
    'environment' => env('APP_ENV'),
    'traces_sample_rate' => 0.1,
    'profiles_sample_rate' => 0.1,
];
```

### Performance Monitoring

**Setup New Relic:**
```bash
# Install New Relic PHP agent
cd backend
composer require newrelic/newrelic-monolog-loglevel-filter

# Configure in .env
NEW_RELIC_APP_NAME="CanvaStencil Production"
NEW_RELIC_LICENSE_KEY=***LICENSE_KEY***
```

**Setup DataDog:**
```bash
# Install DataDog agent
DD_AGENT_MAJOR_VERSION=7 DD_API_KEY=***API_KEY*** \
  bash -c "$(curl -L https://s3.amazonaws.com/dd-agent/scripts/install_script.sh)"

# Configure APM
sudo sh -c "echo 'apm_enabled: true' >> /etc/datadog-agent/datadog.yaml"
```

### Log Aggregation

**Setup CloudWatch Logs:**
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb

sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure log streams
sudo vim /opt/aws/amazon-cloudwatch-agent/etc/config.json
```

**Setup ELK Stack (Alternative):**
```yaml
# docker-compose.elk.yml
version: '3'
services:
  elasticsearch:
    image: elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"
  
  logstash:
    image: logstash:8.10.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch
  
  kibana:
    image: kibana:8.10.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

### Uptime Monitoring

**Setup UptimeRobot:**
1. Navigate to https://uptimerobot.com
2. Add monitor:
   - Type: HTTPS
   - URL: https://canvastack.com/health
   - Interval: 5 minutes
3. Setup alerts:
   - Email notifications
   - SMS for critical issues
   - Slack integration

### Alert Configuration

```yaml
# alerts.yml
alerts:
  - name: High Error Rate
    condition: error_rate > 1%
    action: notify_team
    channels: [email, slack]
    
  - name: Slow Response Time
    condition: response_time > 1s
    action: investigate
    channels: [slack]
    
  - name: High Memory Usage
    condition: memory_usage > 80%
    action: scale_up
    channels: [email, pagerduty]
    
  - name: Database Connection Failed
    condition: db_connection_errors > 0
    action: emergency
    channels: [sms, pagerduty]
```

---

## 📈 Post-Deployment Monitoring (First 24h)

### Hour 0-1: Critical Monitoring

```bash
# Monitor error rates
watch -n 10 'curl -s https://api.canvastack.com/health | jq'

# Monitor response times
watch -n 30 'curl -w "\nTime: %{time_total}s\n" \
              https://api.canvastack.com/api/v1/vendors'

# Monitor server resources
watch -n 5 'top -bn1 | head -20'

# Monitor database connections
watch -n 15 'psql -h db.canvastack.com -U prod_user -c "SELECT count(*) FROM pg_stat_activity;"'
```

### Hour 1-6: Active Monitoring

- Monitor Sentry for new errors
- Check New Relic APM dashboard
- Review CloudWatch metrics
- Monitor user feedback channels

### Hour 6-24: Passive Monitoring

- Setup automated alerts
- Review daily error summary
- Check performance trends
- Monitor resource utilization

### Day 2-7: Stability Monitoring

- Weekly error report review
- Performance trend analysis
- User feedback aggregation
- Plan optimizations if needed

---

## 🎯 Success Metrics

### Deployment Success Criteria

- ✅ Zero downtime during deployment
- ✅ All health checks passing
- ✅ Error rate < 0.1%
- ✅ Response time < 200ms (p95)
- ✅ Database performance stable
- ✅ No security vulnerabilities detected

### Post-Deployment KPIs (Week 1)

```
┌─────────────────────────────────────────┐
│        DEPLOYMENT KPI TARGETS           │
├─────────────────────────────────────────┤
│ Uptime:                    99.9%+       │
│ Error Rate:                < 0.1%       │
│ Response Time (p95):       < 200ms      │
│ Page Load Time:            < 2s         │
│ Database Query Time:       < 50ms       │
│ User Satisfaction:         > 4.5/5      │
└─────────────────────────────────────────┘
```

---

## 📝 Deployment Log Template

```markdown
# Deployment Log - [DATE]

## Pre-Deployment
- [ ] Code review completed
- [ ] Tests passing
- [ ] Security audit passed
- [ ] Database backup created
- [ ] Rollback plan documented

## Deployment
- **Start Time**: [TIME]
- **Deployed By**: [NAME]
- **Version**: [VERSION/COMMIT]
- **Environment**: Production
- **Deployment Method**: Blue-Green

## Steps Executed
1. [TIME] - Backup database
2. [TIME] - Build frontend
3. [TIME] - Deploy to green
4. [TIME] - Run migrations
5. [TIME] - Switch traffic
6. [TIME] - Verify production

## Post-Deployment
- **End Time**: [TIME]
- **Total Duration**: [DURATION]
- **Status**: ✅ SUCCESS / ❌ FAILED
- **Issues**: None / [DESCRIBE]

## Metrics
- Error Rate: [RATE]%
- Response Time: [TIME]ms
- Uptime: [PERCENTAGE]%

## Notes
[Any additional notes or observations]
```

---

## 🆘 Emergency Contacts

**On-Call Team:**
- Primary: [NAME] - [PHONE] - [EMAIL]
- Secondary: [NAME] - [PHONE] - [EMAIL]
- Database Admin: [NAME] - [PHONE] - [EMAIL]

**Vendor Contacts:**
- AWS Support: 1-800-xxx-xxxx
- Sentry Support: support@sentry.io
- Database Host Support: [CONTACT]

---

## 📄 Related Documents

- User Guide: `docs/USER_DOCUMENTATION/TENANTS/VENDOR_MANAGEMENT_USER_GUIDE.md`
- Developer Guide: `docs/USER_DOCUMENTATION/DEVELOPER/VENDOR_MANAGEMENT_DEVELOPER_GUIDE.md`
- Security Audit: `docs/SECURITY_AUDIT_CHECKLIST.md`
- Phase 4 Roadmap: `docs/AUDIT/FINDING/VENDOR_MANAGEMENT_PHASE_4_POLISH_DEPLOYMENT_ROADMAP.md`

---

**Deployment Guide Version**: 1.0  
**Last Updated**: December 17, 2025  
**Next Review**: March 17, 2026
