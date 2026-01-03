# 🚀 Quick Backend Deployment Guide

## Prerequisites
- SSH access ke VPS: `36.50.77.63`
- Domain `api.etchingxenial.biz.id` sudah pointing ke VPS ✅
- PostgreSQL database sudah disetup

---

## STEP 1: Upload Backend Files

### Via Git (Recommended):

```bash
# SSH ke VPS
ssh your-username@36.50.77.63

# Navigate to web directory
cd /home/your-username/
mkdir -p laravel
cd laravel

# Clone atau upload backend
git clone https://github.com/your-repo/canvastencil.git
cd canvastencil/backend

# Atau via rsync dari local:
# rsync -avz --progress backend/ user@36.50.77.63:/home/user/laravel/canvastencil/backend/
```

---

## STEP 2: Setup Environment

```bash
# Copy production environment
cp .env.production .env

# Edit jika perlu (database credentials, etc)
nano .env

# Install dependencies
composer install --optimize-autoloader --no-dev

# Generate application key
php artisan key:generate
```

---

## STEP 3: Database Setup

```bash
# Run migrations
php artisan migrate --force

# Seed database
php artisan db:seed --force

# Create storage link
php artisan storage:link

# Set permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

---

## STEP 4: Cache Optimization

```bash
# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Cache for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## STEP 5: Setup Nginx

Create file: `/etc/nginx/sites-available/api.etchingxenial.biz.id`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.etchingxenial.biz.id;
    
    root /home/your-username/laravel/canvastencil/backend/public;
    index index.php index.html;

    # Logging
    access_log /var/log/nginx/api.etchingxenial.access.log;
    error_log /var/log/nginx/api.etchingxenial.error.log;

    # Increase body size for file uploads
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        
        # Increase timeouts
        fastcgi_read_timeout 300;
        fastcgi_send_timeout 300;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/api.etchingxenial.biz.id /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## STEP 6: Install SSL Certificate

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.etchingxenial.biz.id

# Auto-renew test
sudo certbot renew --dry-run
```

---

## STEP 7: Setup Queue Worker (Optional)

Create systemd service: `/etc/systemd/system/laravel-worker.service`

```ini
[Unit]
Description=Laravel Queue Worker
After=network.target

[Service]
User=www-data
Group=www-data
Restart=always
ExecStart=/usr/bin/php /home/your-username/laravel/canvastencil/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable laravel-worker
sudo systemctl start laravel-worker
sudo systemctl status laravel-worker
```

---

## STEP 8: Setup Cron for Scheduler

```bash
sudo crontab -e -u www-data

# Add this line:
* * * * * php /home/your-username/laravel/canvastencil/backend/artisan schedule:run >> /dev/null 2>&1
```

---

## ✅ Verify Deployment

### Test API Endpoint:

```bash
# Health check
curl https://api.etchingxenial.biz.id/api/v1/health

# Should return JSON:
{"status":"ok","timestamp":"..."}
```

### Test CORS:

```bash
curl -I -X OPTIONS https://api.etchingxenial.biz.id/api/v1/public/content/pages/home \
  -H "Origin: https://etchingxenial.com" \
  -H "Access-Control-Request-Method: GET"

# Should see CORS headers:
# Access-Control-Allow-Origin: https://etchingxenial.com
# Access-Control-Allow-Credentials: true
```

---

## 🔧 Quick Update Commands

Ketika ada update code:

```bash
# SSH ke server
ssh your-username@36.50.77.63

# Navigate to backend
cd /home/your-username/laravel/canvastencil/backend

# Pull latest changes
git pull origin main

# Update dependencies (if needed)
composer install --no-dev

# Run migrations
php artisan migrate --force

# Clear & cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart queue worker (if using)
sudo systemctl restart laravel-worker
```

---

## 📝 Important Files Checklist

- [x] `.env` (production environment)
- [x] `config/cors.php` (updated untuk production domains)
- [x] `config/session.php` (SameSite dari env)
- [x] Nginx config
- [x] SSL certificate
- [x] Storage permissions (755)

---

## 🚨 Troubleshooting

### Issue: 500 Internal Server Error

```bash
# Check Laravel logs
tail -f storage/logs/laravel.log

# Check nginx error log
sudo tail -f /var/log/nginx/api.etchingxenial.error.log

# Check PHP-FPM log
sudo tail -f /var/log/php8.2-fpm.log
```

### Issue: CORS errors

```bash
# Verify config is cached
php artisan config:cache

# Check .env file
cat .env | grep SANCTUM
cat .env | grep SESSION
```

### Issue: Database connection failed

```bash
# Test database connection
php artisan tinker
>>> DB::connection()->getPdo();
```

### Issue: Permission denied

```bash
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

---

## 🎯 Performance Optimization

```bash
# Install Redis (optional but recommended)
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Update .env
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# Install PHP Redis extension
sudo apt install php8.2-redis
sudo systemctl restart php8.2-fpm
```

---

## ✅ Post-Deployment Checklist

- [ ] API endpoint accessible via HTTPS
- [ ] CORS headers present
- [ ] Database migrations completed
- [ ] SSL certificate installed
- [ ] Logs directory writable
- [ ] Queue worker running (if needed)
- [ ] Cron job for scheduler setup
- [ ] Test authentication flow
- [ ] Test public endpoints
- [ ] Test file uploads (if applicable)

---

**API URL:** `https://api.etchingxenial.biz.id`
**Frontend:** `https://etchingxenial.com`
**Server IP:** `36.50.77.63`
