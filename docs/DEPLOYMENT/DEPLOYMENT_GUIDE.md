# 🚀 Deployment Guide - CanvaStencil

## Arsitektur Production

```
Frontend: https://etchingxenial.com
Backend API: https://api.etchingxenial.biz.id
VPS IP: 36.50.77.63
Hosting: DomaiNesia
```

---

## 📋 Prerequisites

- [x] VPS sudah running di 36.50.77.63
- [x] Domain `etchingxenial.biz.id` sudah pointing ke VPS ✅
- [ ] Domain `etchingxenial.com` perlu konfigurasi DNS
- [x] Frontend build sudah selesai (`frontend/dist/`) ✅
- [ ] Backend Laravel perlu di-deploy

---

## STEP 1: Konfigurasi DNS untuk etchingxenial.com

### A. Login ke DNS Provider (Cloudflare/Namecheap/GoDaddy)

### B. Tambahkan A Record:

```
Type: A
Name: @ (atau root/etchingxenial.com)
Value: 36.50.77.63
TTL: 3600 atau Auto
Proxy: Disabled (jika pakai Cloudflare, set DNS Only)
```

### C. (Optional) Tambahkan www subdomain:

```
Type: A
Name: www
Value: 36.50.77.63
TTL: 3600
```

### D. Verify DNS Propagation (tunggu 5-30 menit):

```bash
# Windows
nslookup etchingxenial.com

# Seharusnya return: 36.50.77.63
```

---

## STEP 2: Deploy Frontend (Windows - Manual via FTP)

### A. Menggunakan FileZilla (Recommended untuk Windows)

1. **Download FileZilla:** https://filezilla-project.org/

2. **Connect ke VPS:**
   ```
   Host: etchingxenial.com atau 36.50.77.63
   Username: [your-ftp-username]
   Password: [your-ftp-password]
   Port: 21 (FTP) atau 22 (SFTP)
   ```

3. **Upload Files:**
   - Local (kiri): Navigate ke `D:\worksites\canvastack\projects\canvastencil\frontend\dist\`
   - Remote (kanan): Navigate ke `/public_html/` atau `/home/[username]/public_html/`
   - Select semua files di `dist/` folder
   - Klik kanan → Upload
   - **PENTING:** Upload semua files termasuk:
     - `index.html`
     - `assets/` folder (all CSS/JS files)
     - `favicon.ico`
     - `.htaccess` (jika ada)

4. **Create .htaccess** (jika belum ada):
   
   Di remote server, buat file `.htaccess` dengan content:
   
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   
   # Security Headers
   <IfModule mod_headers.c>
     Header set X-Content-Type-Options "nosniff"
     Header set X-Frame-Options "SAMEORIGIN"
     Header set X-XSS-Protection "1; mode=block"
   </IfModule>
   ```

### B. Verify File Permissions (via FileZilla)

- Klik kanan pada file/folder → File permissions
- Files: `644` (rw-r--r--)
- Folders: `755` (rwxr-xr-x)

---

## STEP 3: Deploy Frontend (Linux/WSL - SSH Method)

### A. Prepare SSH Access:

```bash
# Test SSH connection
ssh your-username@36.50.77.63

# If asked for password, enter your SSH password
```

### B. Edit & Run Deploy Script:

1. **Edit `frontend/scripts/deploy-ssh.sh`:**
   ```bash
   SSH_USER="your-ssh-username"
   REMOTE_PATH="/home/your-username/public_html/etchingxenial.com"
   ```

2. **Make executable & run:**
   ```bash
   cd frontend
   chmod +x scripts/deploy-ssh.sh
   ./scripts/deploy-ssh.sh
   ```

---

## STEP 4: Setup Backend Laravel

### A. SSH ke VPS:

```bash
ssh your-username@36.50.77.63
```

### B. Create Backend Directory:

```bash
mkdir -p /home/your-username/laravel
cd /home/your-username/laravel
```

### C. Upload Backend Files via Git (Recommended):

```bash
# Clone repository
git clone https://github.com/your-repo/canvastencil.git
cd canvastencil/backend

# Install dependencies
composer install --optimize-autoloader --no-dev

# Setup environment
cp .env.example .env
nano .env  # Edit database, APP_URL, dll
```

### D. Configure `.env` untuk Production:

```env
APP_NAME=CanvaStencil
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.etchingxenial.biz.id

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=canvastencil_db
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

# API Keys, Mail, dll...
```

### E. Run Laravel Setup:

```bash
# Generate key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Seed database (if needed)
php artisan db:seed --force

# Cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Storage link
php artisan storage:link

# Set permissions
chmod -R 755 storage bootstrap/cache
```

### F. Configure Nginx Virtual Host:

Create file: `/etc/nginx/sites-available/api.etchingxenial.biz.id`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.etchingxenial.biz.id;

    root /home/your-username/laravel/canvastencil/backend/public;
    index index.php index.html;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;  # Adjust PHP version
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
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

### G. Install SSL Certificate (Let's Encrypt):

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.etchingxenial.biz.id
sudo certbot --nginx -d etchingxenial.com -d www.etchingxenial.com
```

---

## STEP 5: Verify Deployment

### A. Test Frontend:

```bash
# Should return HTML
curl https://etchingxenial.com

# Should show React app
# Open in browser: https://etchingxenial.com
```

### B. Test Backend API:

```bash
# Health check
curl https://api.etchingxenial.biz.id/api/v1/health

# Should return JSON
```

### C. Test Frontend-Backend Integration:

1. Open browser: `https://etchingxenial.com`
2. Check Network tab (F12)
3. Verify API calls go to `api.etchingxenial.biz.id`
4. No CORS errors
5. Data loaded correctly

---

## 🔧 Troubleshooting

### Issue: DNS Not Propagating

```bash
# Check DNS
nslookup etchingxenial.com
ping etchingxenial.com

# Wait 5-30 minutes, clear DNS cache
ipconfig /flushdns  # Windows
```

### Issue: 404 Not Found on React Routes

→ Check `.htaccess` file exists
→ Enable `mod_rewrite` in Apache: `sudo a2enmod rewrite`

### Issue: CORS Errors

→ Check Laravel `config/cors.php`:
```php
'allowed_origins' => ['https://etchingxenial.com'],
```

### Issue: 500 Internal Server Error (Laravel)

```bash
# Check logs
tail -f /home/your-username/laravel/canvastencil/backend/storage/logs/laravel.log

# Common fixes:
chmod -R 755 storage bootstrap/cache
php artisan config:clear
php artisan cache:clear
```

---

## 📝 Quick Deployment Commands

### Update Frontend:

```bash
cd frontend
npm run build
# Upload dist/ via FileZilla or run deploy-ssh.sh
```

### Update Backend:

```bash
ssh your-username@36.50.77.63
cd /home/your-username/laravel/canvastencil/backend
git pull origin main
composer install --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 🎯 Next Steps

- [ ] Configure DNS untuk etchingxenial.com
- [ ] Upload frontend build via FTP/SSH
- [ ] Setup Laravel backend
- [ ] Install SSL certificates
- [ ] Test full integration
- [ ] Setup automatic backups
- [ ] Configure monitoring (optional)

---

## 📞 Support

Jika ada kendala, cek:
1. DomaiNesia control panel untuk FTP/SSH credentials
2. Server error logs: `/var/log/nginx/error.log`
3. Laravel logs: `storage/logs/laravel.log`
