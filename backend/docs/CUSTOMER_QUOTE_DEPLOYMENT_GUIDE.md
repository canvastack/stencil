# Customer Quote & Approval Workflow - Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Customer Quote & Approval Workflow system to production. Follow these steps carefully to ensure a smooth deployment.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Queue Configuration](#queue-configuration)
5. [Scheduled Jobs](#scheduled-jobs)
6. [File Storage](#file-storage)
7. [Email Configuration](#email-configuration)
8. [Testing in Staging](#testing-in-staging)
9. [Production Deployment](#production-deployment)
10. [Post-Deployment Verification](#post-deployment-verification)
11. [Monitoring Setup](#monitoring-setup)
12. [Rollback Procedures](#rollback-procedures)

## Pre-Deployment Checklist

### Code Readiness

- [ ] All tests passing (1063+ tests)
- [ ] Code reviewed and approved
- [ ] No console errors or warnings
- [ ] Documentation updated
- [ ] API endpoints documented
- [ ] Database migrations tested
- [ ] Seeders tested

### Infrastructure Readiness

- [ ] Production server provisioned
- [ ] Database server ready
- [ ] Redis server configured
- [ ] File storage configured (S3/Spaces)
- [ ] Email service configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Backup system in place

### Security Checklist

- [ ] Environment variables secured
- [ ] API keys rotated for production
- [ ] Database credentials secured
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] CSRF protection enabled
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

## Environment Configuration

### Required Environment Variables

Create `.env` file with the following:

```bash
# Application
APP_NAME="CanvaStencil"
APP_ENV=production
APP_KEY=base64:YOUR_APP_KEY_HERE
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database
DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_PORT=5432
DB_DATABASE=stencil_production
DB_USERNAME=your_db_user
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your_redis_password
REDIS_PORT=6379

# Queue
QUEUE_CONNECTION=redis
QUEUE_FAILED_DRIVER=database

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your_sendgrid_api_key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"

# File Storage
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=your-bucket-name
AWS_URL=https://your-bucket.s3.amazonaws.com
AWS_USE_PATH_STYLE_ENDPOINT=false

# Customer Quote Settings
CUSTOMER_QUOTE_DEFAULT_VALIDITY_DAYS=7
CUSTOMER_QUOTE_MAX_NEGOTIATION_ROUNDS=3
CUSTOMER_QUOTE_AUTO_APPROVAL_THRESHOLD=5000000

# Sanctum
SANCTUM_STATEFUL_DOMAINS=your-domain.com,www.your-domain.com
SESSION_DOMAIN=.your-domain.com

# Frontend URL
FRONTEND_URL=https://your-domain.com
```


### Generate Application Key

```bash
php artisan key:generate
```

### Cache Configuration

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Database Setup

### 1. Create Database

```sql
CREATE DATABASE stencil_production;
CREATE USER stencil_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE stencil_production TO stencil_user;
```

### 2. Run Migrations

```bash
# Backup existing database first!
php artisan backup:run --only-db

# Run migrations
php artisan migrate --force

# Verify migrations
php artisan migrate:status
```

### 3. Seed Required Data

```bash
# Seed approval settings for all tenants
php artisan db:seed --class=ApprovalSettingsSeeder

# Seed document templates
php artisan db:seed --class=DocumentTemplateSeeder

# Verify seeding
php artisan tinker
>>> App\Models\CustomerQuoteApprovalSettings::count();
>>> App\Models\DocumentTemplate::count();
```

### 4. Create Indexes

```sql
-- Customer quotes indexes
CREATE INDEX IF NOT EXISTS idx_customer_quotes_tenant ON customer_quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_quotes_order ON customer_quotes(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_quotes_status ON customer_quotes(status);
CREATE INDEX IF NOT EXISTS idx_customer_quotes_token ON customer_quotes(response_token);
CREATE INDEX IF NOT EXISTS idx_customer_quotes_valid_until ON customer_quotes(valid_until);

-- Order documents indexes
CREATE INDEX IF NOT EXISTS idx_order_documents_tenant ON order_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_documents_order ON order_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_order_documents_type ON order_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_order_documents_status ON order_documents(status);
```

## Queue Configuration

### 1. Install Supervisor

```bash
sudo apt-get install supervisor
```

### 2. Create Queue Worker Configuration

Create `/etc/supervisor/conf.d/stencil-worker.conf`:

```ini
[program:stencil-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/stencil/backend/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=4
redirect_stderr=true
stdout_logfile=/var/www/stencil/backend/storage/logs/worker.log
stopwaitsecs=3600
```

### 3. Start Queue Workers

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start stencil-worker:*
```

### 4. Verify Queue Workers

```bash
sudo supervisorctl status stencil-worker:*
```

### 5. Monitor Queue

```bash
# Check queue size
php artisan queue:monitor redis

# Check failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all
```

## Scheduled Jobs

### 1. Configure Cron

Add to crontab (`crontab -e`):

```bash
* * * * * cd /var/www/stencil/backend && php artisan schedule:run >> /dev/null 2>&1
```

### 2. Verify Scheduled Jobs

```bash
# List scheduled jobs
php artisan schedule:list

# Test scheduled job
php artisan schedule:test
```

### 3. Customer Quote Scheduled Jobs

The following jobs run automatically:

**Check Expired Quotes** (Hourly)
```bash
# Runs every hour
php artisan customer-quotes:check-expired
```

**Check Quote Metrics** (Every 5 minutes)
```bash
# Monitors quote metrics and sends alerts
php artisan customer-quotes:check-metrics
```

### 4. Manual Job Execution (Testing)

```bash
# Check expired quotes manually
php artisan customer-quotes:check-expired

# Check metrics manually
php artisan customer-quotes:check-metrics
```

## File Storage

### Option 1: AWS S3

#### 1. Create S3 Bucket

```bash
aws s3 mb s3://your-bucket-name --region ap-southeast-1
```

#### 2. Configure Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/public/*"
    }
  ]
}
```

#### 3. Configure CORS

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Option 2: DigitalOcean Spaces

#### 1. Create Space

- Go to DigitalOcean Spaces
- Create new Space
- Choose region (SGP1 recommended for Asia)
- Enable CDN

#### 2. Generate API Keys

- Go to API > Spaces Keys
- Generate new key pair
- Save access key and secret key

#### 3. Configure Environment

```bash
AWS_ACCESS_KEY_ID=your_spaces_key
AWS_SECRET_ACCESS_KEY=your_spaces_secret
AWS_DEFAULT_REGION=sgp1
AWS_BUCKET=your-space-name
AWS_ENDPOINT=https://sgp1.digitaloceanspaces.com
AWS_URL=https://your-space-name.sgp1.digitaloceanspaces.com
AWS_USE_PATH_STYLE_ENDPOINT=false
```

### Test File Upload

```bash
php artisan tinker
>>> Storage::disk('s3')->put('test.txt', 'Hello World');
>>> Storage::disk('s3')->exists('test.txt');
>>> Storage::disk('s3')->url('test.txt');
```

## Email Configuration

### Option 1: SendGrid

#### 1. Create SendGrid Account

- Sign up at sendgrid.com
- Verify sender identity
- Create API key

#### 2. Configure Environment

```bash
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your_sendgrid_api_key
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="CanvaStencil"
```

#### 3. Test Email

```bash
php artisan tinker
>>> Mail::raw('Test email', function($msg) {
    $msg->to('test@example.com')->subject('Test');
});
```

### Option 2: AWS SES

#### 1. Verify Domain

```bash
aws ses verify-domain-identity --domain your-domain.com
```

#### 2. Configure Environment

```bash
MAIL_MAILER=ses
AWS_ACCESS_KEY_ID=your_ses_key
AWS_SECRET_ACCESS_KEY=your_ses_secret
AWS_DEFAULT_REGION=ap-southeast-1
MAIL_FROM_ADDRESS=noreply@your-domain.com
```

### Email Queue Configuration

Emails are automatically queued. Ensure queue workers are running:

```bash
sudo supervisorctl status stencil-worker:*
```

## Testing in Staging

### 1. Deploy to Staging

```bash
# Pull latest code
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader
npm ci
npm run build

# Run migrations
php artisan migrate --force

# Clear caches
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 2. Run Test Suite

```bash
# Backend tests
php artisan test

# Frontend tests
npm run test

# E2E tests
npm run test:e2e
```

### 3. Manual Testing Checklist

- [ ] Create customer quote
- [ ] Send quote to customer
- [ ] Customer views quote
- [ ] Customer accepts quote
- [ ] Auto-approval works
- [ ] Manual approval works
- [ ] Counter offer flow
- [ ] Document generation
- [ ] Email delivery
- [ ] Payment flow
- [ ] Queue processing
- [ ] Scheduled jobs

### 4. Performance Testing

```bash
# Load testing with k6
cd k6
k6 run load-tests/customer-quote-load-test.js
```

### 5. Security Testing

- [ ] SQL injection tests
- [ ] XSS tests
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Authentication
- [ ] Authorization
- [ ] Data encryption


## Production Deployment

### 1. Pre-Deployment Backup

```bash
# Backup database
php artisan backup:run --only-db

# Backup files
php artisan backup:run --only-files

# Verify backups
php artisan backup:list
```

### 2. Enable Maintenance Mode

```bash
php artisan down --message="Upgrading system. Back in 10 minutes."
```

### 3. Deploy Code

```bash
# Pull latest code
git pull origin main

# Install dependencies
composer install --no-dev --optimize-autoloader

# Frontend build
cd ../frontend
npm ci
npm run build
cd ../backend
```

### 4. Run Migrations

```bash
# Run migrations
php artisan migrate --force

# Verify migrations
php artisan migrate:status
```

### 5. Seed Required Data

```bash
# Seed approval settings (only for new tenants)
php artisan db:seed --class=ApprovalSettingsSeeder

# Seed document templates
php artisan db:seed --class=DocumentTemplateSeeder
```

### 6. Clear and Cache

```bash
# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Rebuild caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Optimize autoloader
composer dump-autoload --optimize
```

### 7. Restart Services

```bash
# Restart queue workers
sudo supervisorctl restart stencil-worker:*

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm

# Restart Nginx
sudo systemctl restart nginx
```

### 8. Disable Maintenance Mode

```bash
php artisan up
```

### 9. Verify Deployment

```bash
# Check application status
php artisan about

# Check queue workers
sudo supervisorctl status stencil-worker:*

# Check scheduled jobs
php artisan schedule:list

# Test critical endpoints
curl https://your-domain.com/api/health
```

## Post-Deployment Verification

### 1. Smoke Tests

Run these tests immediately after deployment:

```bash
# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();

# Test Redis connection
>>> Redis::ping();

# Test file storage
>>> Storage::disk('s3')->exists('test.txt');

# Test email
>>> Mail::raw('Deployment test', function($msg) {
    $msg->to('admin@example.com')->subject('Test');
});
```

### 2. Functional Tests

- [ ] Admin login works
- [ ] Create customer quote
- [ ] Send quote email
- [ ] Customer portal access
- [ ] Quote acceptance
- [ ] Approval workflow
- [ ] Document generation
- [ ] Payment flow

### 3. Monitor Logs

```bash
# Application logs
tail -f storage/logs/laravel.log

# Queue worker logs
tail -f storage/logs/worker.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### 4. Check Metrics

- Response times
- Error rates
- Queue size
- Database connections
- Memory usage
- CPU usage

## Monitoring Setup

### 1. Application Monitoring

#### Laravel Telescope (Development/Staging)

```bash
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

#### Sentry (Production)

```bash
composer require sentry/sentry-laravel
php artisan sentry:publish --dsn=your_sentry_dsn
```

### 2. Server Monitoring

#### Install Monitoring Agent

```bash
# Example: New Relic
wget -O - https://download.newrelic.com/548C16BF.gpg | sudo apt-key add -
echo "deb http://apt.newrelic.com/debian/ newrelic non-free" | sudo tee /etc/apt/sources.list.d/newrelic.list
sudo apt-get update
sudo apt-get install newrelic-php5
```

### 3. Database Monitoring

```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow-query.log';
```

### 4. Queue Monitoring

```bash
# Monitor queue size
php artisan queue:monitor redis --max=100

# Alert on failed jobs
php artisan queue:failed-table
php artisan migrate
```

### 5. Custom Metrics

The system tracks:
- Quote creation rate
- Quote acceptance rate
- Auto-approval rate
- Average negotiation rounds
- Document generation time
- Email delivery rate

Access metrics at: `/admin/reports/quote-analytics`

### 6. Alerting

Configure alerts for:
- High error rate (>5%)
- Slow response time (>2s)
- Queue backlog (>100 jobs)
- Failed jobs (>10)
- Disk space low (<10%)
- Memory usage high (>80%)
- CPU usage high (>80%)

## Rollback Procedures

### When to Rollback

Rollback if:
- Critical bugs discovered
- Data corruption detected
- Performance degradation
- Security vulnerability
- Failed deployment

### Rollback Steps

#### 1. Enable Maintenance Mode

```bash
php artisan down
```

#### 2. Restore Database

```bash
# List available backups
php artisan backup:list

# Restore from backup
php artisan backup:restore --backup=backup-name.zip
```

#### 3. Revert Code

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or checkout previous tag
git checkout v1.0.0
```

#### 4. Restore Files

```bash
# Restore from backup
php artisan backup:restore --only-files
```

#### 5. Rollback Migrations

```bash
# Rollback last migration batch
php artisan migrate:rollback --step=1

# Or rollback to specific batch
php artisan migrate:rollback --batch=5
```

#### 6. Clear Caches

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

#### 7. Restart Services

```bash
sudo supervisorctl restart stencil-worker:*
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx
```

#### 8. Disable Maintenance Mode

```bash
php artisan up
```

#### 9. Verify Rollback

- Test critical functionality
- Check error logs
- Monitor metrics
- Notify stakeholders

## Troubleshooting

### Common Issues

#### Issue: Queue Workers Not Processing

**Symptoms**: Jobs stuck in queue

**Solution**:
```bash
# Check worker status
sudo supervisorctl status stencil-worker:*

# Restart workers
sudo supervisorctl restart stencil-worker:*

# Check logs
tail -f storage/logs/worker.log
```

#### Issue: Emails Not Sending

**Symptoms**: Emails not delivered

**Solution**:
```bash
# Check mail configuration
php artisan config:show mail

# Test email
php artisan tinker
>>> Mail::raw('Test', fn($m) => $m->to('test@example.com')->subject('Test'));

# Check queue
php artisan queue:work --once
```

#### Issue: Documents Not Generating

**Symptoms**: PDF generation fails

**Solution**:
```bash
# Check storage permissions
ls -la storage/app/documents

# Test PDF generation
php artisan tinker
>>> $service = app(App\Application\Document\Services\DocumentGenerationService::class);
>>> $quote = App\Models\CustomerQuote::first();
>>> $doc = $service->generateQuotationPDF($quote);
```

#### Issue: High Memory Usage

**Symptoms**: Server running out of memory

**Solution**:
```bash
# Check memory usage
free -h

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm

# Optimize PHP-FPM config
sudo nano /etc/php/8.2/fpm/pool.d/www.conf
# Adjust pm.max_children, pm.start_servers, etc.
```

#### Issue: Slow Response Times

**Symptoms**: Pages loading slowly

**Solution**:
```bash
# Enable query logging
DB::enableQueryLog();

# Check slow queries
tail -f /var/log/mysql/slow-query.log

# Optimize database
php artisan db:optimize

# Clear caches
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Security Hardening

### 1. File Permissions

```bash
# Set correct ownership
sudo chown -R www-data:www-data /var/www/stencil

# Set directory permissions
find /var/www/stencil -type d -exec chmod 755 {} \;

# Set file permissions
find /var/www/stencil -type f -exec chmod 644 {} \;

# Storage and cache writable
chmod -R 775 storage bootstrap/cache
```

### 2. Environment Security

```bash
# Secure .env file
chmod 600 .env
chown www-data:www-data .env

# Prevent .env access via web
# Add to .htaccess or nginx config
```

### 3. Database Security

```sql
-- Use strong passwords
ALTER USER stencil_user WITH PASSWORD 'very_strong_password_here';

-- Limit privileges
REVOKE ALL ON DATABASE stencil_production FROM PUBLIC;
GRANT CONNECT ON DATABASE stencil_production TO stencil_user;
```

### 4. SSL/TLS

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 5. Rate Limiting

Already configured in routes:
- Customer portal: 60 requests/minute (view), 10 requests/minute (actions)
- Admin API: 100 requests/minute
- Public API: 60 requests/minute

### 6. CORS Configuration

```php
// config/cors.php
'allowed_origins' => [
    'https://your-domain.com',
    'https://www.your-domain.com',
],
```

## Maintenance

### Daily Tasks

- [ ] Check error logs
- [ ] Monitor queue size
- [ ] Review failed jobs
- [ ] Check disk space
- [ ] Verify backups

### Weekly Tasks

- [ ] Review performance metrics
- [ ] Check security alerts
- [ ] Update dependencies
- [ ] Review user feedback
- [ ] Optimize database

### Monthly Tasks

- [ ] Security audit
- [ ] Performance review
- [ ] Backup testing
- [ ] Documentation update
- [ ] Capacity planning

## Support

### Documentation

- [Admin User Guide](./CUSTOMER_QUOTE_ADMIN_GUIDE.md)
- [Customer User Guide](./CUSTOMER_QUOTE_CUSTOMER_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Approval Settings](./CUSTOMER_QUOTE_APPROVAL_SETTINGS.md)

### Contact

- Technical Support: tech@example.com
- DevOps Team: devops@example.com
- Emergency: +62 xxx xxxx xxxx

---

**Document Version**: 1.0  
**Last Updated**: February 2024  
**Next Review**: May 2024
