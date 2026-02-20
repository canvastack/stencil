# Customer Quote & Approval Workflow - Deployment Summary

## Overview

This document provides a comprehensive summary of all deployment-related files, configurations, and procedures for the Customer Quote & Approval Workflow system.

## Deployment Files Created

### 1. Scripts

#### `backend/deploy-checklist.sh`
Interactive deployment checklist script that verifies all requirements before deployment.

**Features:**
- Pre-deployment checks (database, Redis, tests)
- Environment configuration validation
- Database setup and seeding
- Queue worker verification
- Scheduled jobs verification
- File storage testing
- Email configuration testing
- Cache optimization
- Security checks
- Post-deployment verification

**Usage:**
```bash
./deploy-checklist.sh [environment] [test-email]

# Example
./deploy-checklist.sh production admin@example.com
```

#### `backend/deploy.sh`
Automated deployment script for production deployments.

**Features:**
- Pre-deployment backup
- Maintenance mode management
- Code updates (Git pull)
- Dependency installation
- Frontend build
- Database migrations
- Data seeding
- Cache management
- Service restarts
- Post-deployment verification
- Deployment logging

**Usage:**
```bash
./deploy.sh [environment] [skip-backup] [skip-tests]

# Standard deployment
./deploy.sh production

# Skip backup and tests (faster)
./deploy.sh production skip-backup skip-tests
```

#### `backend/rollback.sh`
Emergency rollback script for reverting deployments.

**Features:**
- Git commit rollback
- Database migration rollback
- Backup restoration
- Full rollback (all of the above)
- Service restarts
- Verification checks
- Rollback logging

**Usage:**
```bash
./rollback.sh

# Follow interactive prompts
```

#### `backend/verify-deployment.sh`
Post-deployment verification script.

**Features:**
- Application health checks
- Database connectivity tests
- Redis connectivity tests
- Queue system verification
- Scheduled jobs verification
- File storage tests
- Email configuration checks
- Cache verification
- Security checks
- Customer quote system checks
- API endpoint tests
- Performance checks
- Monitoring & logging checks

**Usage:**
```bash
./verify-deployment.sh
```

### 2. Configuration Files

#### `backend/.env.production.example`
Production environment variables template.

**Includes:**
- Application settings
- Database configuration
- Redis configuration
- Queue configuration
- Mail configuration (SendGrid, AWS SES)
- File storage (AWS S3, DigitalOcean Spaces)
- Customer quote settings
- Sanctum authentication
- Monitoring (Sentry)
- Performance settings
- Security settings

**Usage:**
```bash
cp .env.production.example .env
nano .env  # Edit with actual values
php artisan key:generate
```

#### `backend/deployment/supervisor-stencil-worker.conf`
Supervisor configuration for Laravel queue workers.

**Workers Configured:**
- **stencil-worker** (4 processes): Default queue
- **stencil-worker-high** (2 processes): High-priority queue
- **stencil-worker-email** (2 processes): Email queue
- **stencil-worker-documents** (2 processes): Document generation queue

**Installation:**
```bash
sudo cp deployment/supervisor-stencil-worker.conf /etc/supervisor/conf.d/
sudo nano /etc/supervisor/conf.d/stencil-worker.conf  # Update paths
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start stencil-worker:*
```

#### `backend/deployment/crontab.txt`
Cron job configuration for scheduled tasks.

**Jobs Configured:**
- Laravel scheduler (every minute)
- Check expired quotes (hourly)
- Check quote metrics (every 5 minutes)
- Database backups (daily)
- Clean old backups (weekly)
- Session garbage collection (daily)
- Log rotation (weekly)
- Queue monitoring (every 5 minutes)
- Disk space checks (daily)
- Failed jobs report (daily)

**Installation:**
```bash
crontab -e
# Add: * * * * * cd /var/www/stencil/backend && php artisan schedule:run >> /dev/null 2>&1
```

#### `backend/deployment/nginx-site.conf`
Nginx web server configuration.

**Features:**
- HTTP to HTTPS redirect
- SSL/TLS configuration
- Security headers
- Gzip compression
- API routing
- Frontend SPA routing
- Static asset caching
- Rate limiting (commented examples)
- Health check endpoint
- Access control for sensitive files

**Installation:**
```bash
sudo cp deployment/nginx-site.conf /etc/nginx/sites-available/stencil
sudo nano /etc/nginx/sites-available/stencil  # Update server_name and paths
sudo ln -s /etc/nginx/sites-available/stencil /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3. Documentation

#### `backend/deployment/README.md`
Comprehensive deployment documentation.

**Contents:**
- Quick start guide
- First-time deployment steps
- Subsequent deployment procedures
- Configuration details
- Monitoring instructions
- Troubleshooting guide
- Security checklist
- Backup strategy
- Performance optimization
- Support information

#### `backend/docs/CUSTOMER_QUOTE_DEPLOYMENT_GUIDE.md`
Detailed deployment guide (already existed, enhanced).

**Contents:**
- Pre-deployment checklist
- Environment configuration
- Database setup
- Queue configuration
- Scheduled jobs
- File storage setup
- Email configuration
- Testing in staging
- Production deployment
- Post-deployment verification
- Monitoring setup
- Rollback procedures
- Troubleshooting
- Security hardening
- Maintenance tasks

## Deployment Workflow

### First-Time Deployment

1. **Prepare Server**
   - Install required software (Nginx, PHP, PostgreSQL, Redis, Supervisor)
   - Configure firewall
   - Setup SSL certificates

2. **Configure Application**
   - Copy `.env.production.example` to `.env`
   - Fill in environment variables
   - Generate application key

3. **Setup Database**
   - Create database and user
   - Run migrations
   - Seed required data

4. **Configure Services**
   - Setup queue workers (Supervisor)
   - Configure cron jobs
   - Configure Nginx

5. **Run Deployment Checklist**
   ```bash
   ./deploy-checklist.sh production admin@example.com
   ```

6. **Verify Deployment**
   ```bash
   ./verify-deployment.sh
   ```

### Subsequent Deployments

1. **Run Deployment Script**
   ```bash
   ./deploy.sh production
   ```

2. **Verify Deployment**
   ```bash
   ./verify-deployment.sh
   ```

3. **Monitor Application**
   - Check logs
   - Monitor queue
   - Verify functionality

### Emergency Rollback

1. **Run Rollback Script**
   ```bash
   ./rollback.sh
   ```

2. **Select Rollback Option**
   - Git commit rollback
   - Database migration rollback
   - Restore from backup
   - Full rollback

3. **Verify Rollback**
   ```bash
   ./verify-deployment.sh
   ```

## Environment Variables

### Required Variables

```bash
# Application
APP_NAME="CanvaStencil"
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database
DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_DATABASE=stencil_production
DB_USERNAME=stencil_user
DB_PASSWORD=your_password

# Redis
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your_password

# Queue
QUEUE_CONNECTION=redis

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_USERNAME=apikey
MAIL_PASSWORD=your_api_key
MAIL_FROM_ADDRESS=noreply@your-domain.com

# Storage
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BUCKET=your_bucket

# Customer Quote
CUSTOMER_QUOTE_DEFAULT_VALIDITY_DAYS=7
CUSTOMER_QUOTE_MAX_NEGOTIATION_ROUNDS=3
CUSTOMER_QUOTE_AUTO_APPROVAL_THRESHOLD=5000000
```

## Service Configuration

### Queue Workers (Supervisor)

**Configuration File:** `/etc/supervisor/conf.d/stencil-worker.conf`

**Workers:**
- 4 default workers
- 2 high-priority workers
- 2 email workers
- 2 document workers

**Management:**
```bash
# Start workers
sudo supervisorctl start stencil-worker:*

# Stop workers
sudo supervisorctl stop stencil-worker:*

# Restart workers
sudo supervisorctl restart stencil-worker:*

# Check status
sudo supervisorctl status stencil-worker:*
```

### Scheduled Jobs (Cron)

**Configuration:** Added to crontab

**Jobs:**
- Laravel scheduler (every minute)
- Check expired quotes (hourly)
- Check quote metrics (every 5 minutes)

**Management:**
```bash
# View scheduled jobs
php artisan schedule:list

# Test scheduled jobs
php artisan schedule:test

# Run manually
php artisan schedule:run
```

### Web Server (Nginx)

**Configuration File:** `/etc/nginx/sites-available/stencil`

**Features:**
- HTTPS with SSL
- Security headers
- API routing
- SPA routing
- Static asset caching

**Management:**
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx
```

## Monitoring

### Application Logs

```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Queue worker logs
tail -f storage/logs/worker.log

# Deployment logs
tail -f storage/logs/deployment.log
```

### Queue Monitoring

```bash
# Check queue size
php artisan queue:monitor redis --max=100

# List failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all
```

### System Monitoring

```bash
# Check worker status
sudo supervisorctl status stencil-worker:*

# Check scheduled jobs
php artisan schedule:list

# Check application health
curl https://your-domain.com/health
```

## Security

### Security Checklist

- [x] APP_DEBUG=false in production
- [x] Strong database passwords
- [x] SSL certificate installed
- [x] File permissions set correctly
- [x] .env file secured (600 permissions)
- [x] CORS configured
- [x] Rate limiting enabled
- [x] Security headers configured
- [ ] Firewall configured
- [ ] SSH key-based authentication
- [ ] Regular security updates

### Security Headers (Nginx)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## Backup & Recovery

### Automated Backups

- **Database**: Daily at 2 AM
- **Files**: Weekly on Sunday
- **Retention**: 30 days

### Manual Backup

```bash
# Full backup
php artisan backup:run

# Database only
php artisan backup:run --only-db

# Files only
php artisan backup:run --only-files
```

### Restore from Backup

```bash
# List backups
php artisan backup:list

# Restore specific backup
php artisan backup:restore --backup=backup-name.zip
```

## Troubleshooting

### Common Issues

1. **Queue Workers Not Processing**
   ```bash
   sudo supervisorctl restart stencil-worker:*
   tail -f storage/logs/worker.log
   ```

2. **Emails Not Sending**
   ```bash
   php artisan queue:work --once
   tail -f storage/logs/laravel.log | grep -i mail
   ```

3. **Database Connection Issues**
   ```bash
   php artisan tinker
   >>> DB::connection()->getPdo();
   ```

4. **High Memory Usage**
   ```bash
   sudo systemctl restart php8.2-fpm
   ```

## Performance Optimization

### PHP-FPM Tuning

```ini
pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
```

### Nginx Tuning

```nginx
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
```

### Database Optimization

```bash
php artisan db:optimize
```

### Redis Optimization

```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

## Support

- **Documentation**: `backend/docs/CUSTOMER_QUOTE_DEPLOYMENT_GUIDE.md`
- **Deployment Files**: `backend/deployment/`
- **Technical Support**: tech@your-domain.com
- **DevOps Team**: devops@your-domain.com

## Conclusion

All deployment files and configurations have been created and documented. The system is ready for production deployment following the procedures outlined in this document and the deployment guide.

**Key Deliverables:**
- ✅ Deployment scripts (deploy-checklist.sh, deploy.sh, rollback.sh, verify-deployment.sh)
- ✅ Configuration files (supervisor, cron, nginx, .env template)
- ✅ Comprehensive documentation
- ✅ Monitoring and troubleshooting guides
- ✅ Security hardening procedures
- ✅ Backup and recovery procedures

---

**Document Version**: 1.0  
**Last Updated**: February 2024  
**Status**: Complete
