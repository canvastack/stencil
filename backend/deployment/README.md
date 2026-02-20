# Customer Quote & Approval Workflow - Deployment Files

This directory contains all necessary configuration files and scripts for deploying the Customer Quote & Approval Workflow system to production.

## Contents

### Configuration Files

1. **supervisor-stencil-worker.conf**
   - Supervisor configuration for Laravel queue workers
   - Manages 4 default workers + specialized workers for emails and documents
   - Copy to `/etc/supervisor/conf.d/` on production server

2. **crontab.txt**
   - Cron job configuration for scheduled tasks
   - Includes Laravel scheduler and optional manual jobs
   - Add to system crontab with `crontab -e`

3. **nginx-site.conf**
   - Nginx web server configuration
   - Includes SSL, security headers, rate limiting, and API routing
   - Copy to `/etc/nginx/sites-available/` and create symlink

4. **.env.production.example**
   - Production environment variables template
   - Copy to `.env` and fill in actual values
   - Located in `backend/.env.production.example`

### Deployment Scripts

1. **deploy-checklist.sh**
   - Interactive deployment checklist
   - Verifies all requirements before deployment
   - Tests database, Redis, email, storage, etc.
   - Usage: `./deploy-checklist.sh [environment] [test-email]`

2. **deploy.sh**
   - Automated deployment script
   - Handles code updates, migrations, cache clearing, service restarts
   - Usage: `./deploy.sh [environment] [skip-backup] [skip-tests]`

3. **rollback.sh**
   - Emergency rollback script
   - Supports Git, database, and full rollbacks
   - Usage: `./rollback.sh`

## Quick Start

### First-Time Deployment

1. **Prepare Server**
   ```bash
   # Install required software
   sudo apt-get update
   sudo apt-get install nginx php8.2-fpm postgresql redis-server supervisor
   
   # Install Composer
   curl -sS https://getcomposer.org/installer | php
   sudo mv composer.phar /usr/local/bin/composer
   ```

2. **Configure Environment**
   ```bash
   # Copy environment template
   cp .env.production.example .env
   
   # Edit with your values
   nano .env
   
   # Generate application key
   php artisan key:generate
   ```

3. **Setup Database**
   ```bash
   # Create database
   sudo -u postgres psql
   CREATE DATABASE stencil_production;
   CREATE USER stencil_user WITH ENCRYPTED PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE stencil_production TO stencil_user;
   \q
   
   # Run migrations
   php artisan migrate --force
   
   # Seed required data
   php artisan db:seed --class=ApprovalSettingsSeeder
   php artisan db:seed --class=DocumentTemplateSeeder
   ```

4. **Configure Queue Workers**
   ```bash
   # Copy supervisor config
   sudo cp deployment/supervisor-stencil-worker.conf /etc/supervisor/conf.d/
   
   # Update paths in config file
   sudo nano /etc/supervisor/conf.d/stencil-worker.conf
   
   # Start workers
   sudo supervisorctl reread
   sudo supervisorctl update
   sudo supervisorctl start stencil-worker:*
   ```

5. **Configure Cron Jobs**
   ```bash
   # Edit crontab
   crontab -e
   
   # Add Laravel scheduler (adjust path)
   * * * * * cd /var/www/stencil/backend && php artisan schedule:run >> /dev/null 2>&1
   ```

6. **Configure Nginx**
   ```bash
   # Copy nginx config
   sudo cp deployment/nginx-site.conf /etc/nginx/sites-available/stencil
   
   # Update server_name and paths
   sudo nano /etc/nginx/sites-available/stencil
   
   # Create symlink
   sudo ln -s /etc/nginx/sites-available/stencil /etc/nginx/sites-enabled/
   
   # Test configuration
   sudo nginx -t
   
   # Reload nginx
   sudo systemctl reload nginx
   ```

7. **Setup SSL**
   ```bash
   # Install certbot
   sudo apt-get install certbot python3-certbot-nginx
   
   # Obtain certificate
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   
   # Test auto-renewal
   sudo certbot renew --dry-run
   ```

8. **Run Deployment Checklist**
   ```bash
   # Make scripts executable (Linux/Mac)
   chmod +x deploy-checklist.sh deploy.sh rollback.sh
   
   # Run checklist
   ./deploy-checklist.sh production admin@your-domain.com
   ```

### Subsequent Deployments

```bash
# Run deployment script
./deploy.sh production

# Or with options
./deploy.sh production skip-backup skip-tests
```

### Emergency Rollback

```bash
# Run rollback script
./rollback.sh

# Follow interactive prompts to select rollback option
```

## Configuration Details

### Supervisor Workers

The system uses multiple queue workers:

- **stencil-worker** (4 processes): Default queue processing
- **stencil-worker-high** (2 processes): High-priority queue
- **stencil-worker-email** (2 processes): Email sending
- **stencil-worker-documents** (2 processes): PDF generation

Adjust `numprocs` in supervisor config based on server capacity.

### Scheduled Jobs

The following jobs run automatically via Laravel scheduler:

- **Check Expired Quotes**: Every hour
- **Check Quote Metrics**: Every 5 minutes
- **Database Backup**: Daily at 2 AM (configurable)
- **Clean Old Backups**: Weekly (configurable)

### File Storage

Supports multiple storage backends:

- **AWS S3**: Recommended for production
- **DigitalOcean Spaces**: Alternative cloud storage
- **Local**: Development only

Configure in `.env`:
```bash
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_BUCKET=your_bucket
```

### Email Configuration

Supports multiple email providers:

- **SendGrid**: Recommended (SMTP)
- **AWS SES**: Alternative
- **Mailgun**: Alternative
- **Log**: Development only

Configure in `.env`:
```bash
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_USERNAME=apikey
MAIL_PASSWORD=your_api_key
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

# Nginx access logs
sudo tail -f /var/log/nginx/stencil-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/stencil-error.log
```

### Queue Monitoring

```bash
# Check queue size
php artisan queue:monitor redis --max=100

# List failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all

# Check worker status
sudo supervisorctl status stencil-worker:*
```

### Scheduled Jobs

```bash
# List scheduled jobs
php artisan schedule:list

# Test scheduled jobs
php artisan schedule:test

# Run scheduler manually
php artisan schedule:run
```

## Troubleshooting

### Queue Workers Not Processing

```bash
# Check worker status
sudo supervisorctl status stencil-worker:*

# Restart workers
sudo supervisorctl restart stencil-worker:*

# Check logs
tail -f storage/logs/worker.log
```

### Emails Not Sending

```bash
# Test email configuration
php artisan tinker
>>> Mail::raw('Test', fn($m) => $m->to('test@example.com')->subject('Test'));

# Check queue
php artisan queue:work --once

# Check mail logs
tail -f storage/logs/laravel.log | grep -i mail
```

### Database Connection Issues

```bash
# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();

# Check database status
sudo systemctl status postgresql

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### High Memory Usage

```bash
# Check memory usage
free -h

# Restart PHP-FPM
sudo systemctl restart php8.2-fpm

# Optimize PHP-FPM config
sudo nano /etc/php/8.2/fpm/pool.d/www.conf
```

## Security Checklist

- [ ] APP_DEBUG=false in production
- [ ] Strong database passwords
- [ ] SSL certificate installed and valid
- [ ] File permissions set correctly (775 for storage)
- [ ] .env file secured (600 permissions)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Security headers configured in Nginx
- [ ] Firewall configured (UFW or iptables)
- [ ] SSH key-based authentication only
- [ ] Regular security updates applied

## Backup Strategy

### Automated Backups

Backups run automatically via scheduled jobs:

- **Database**: Daily at 2 AM
- **Files**: Weekly on Sunday
- **Retention**: 30 days

### Manual Backup

```bash
# Backup database only
php artisan backup:run --only-db

# Backup files only
php artisan backup:run --only-files

# Full backup
php artisan backup:run

# List backups
php artisan backup:list

# Clean old backups
php artisan backup:clean
```

### Restore from Backup

```bash
# List available backups
php artisan backup:list

# Restore specific backup
php artisan backup:restore --backup=backup-name.zip

# Restore database only
php artisan backup:restore --backup=backup-name.zip --only-db
```

## Performance Optimization

### PHP-FPM Tuning

Edit `/etc/php/8.2/fpm/pool.d/www.conf`:

```ini
pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
pm.max_requests = 500
```

### Nginx Tuning

Edit `/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
client_max_body_size 10M;
```

### Database Optimization

```bash
# Optimize database
php artisan db:optimize

# Analyze slow queries
sudo tail -f /var/log/postgresql/postgresql-*.log | grep "duration:"
```

### Redis Optimization

Edit `/etc/redis/redis.conf`:

```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

## Support

For deployment issues or questions:

- **Documentation**: `backend/docs/CUSTOMER_QUOTE_DEPLOYMENT_GUIDE.md`
- **Technical Support**: tech@your-domain.com
- **DevOps Team**: devops@your-domain.com
- **Emergency**: +62 xxx xxxx xxxx

## Additional Resources

- [Laravel Deployment Documentation](https://laravel.com/docs/deployment)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)
- [Supervisor Documentation](http://supervisord.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

---

**Last Updated**: February 2024  
**Version**: 1.0
