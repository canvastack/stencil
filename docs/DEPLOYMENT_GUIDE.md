# Deployment Guide: Uploading and Running the Project on Hosting

This project is a full-stack application with:
- Backend: Laravel (PHP) located in `backend/`
- Frontend: Vite + React/TypeScript located in `src/` with build artifacts into `public/` (root) or `dev-dist/` depending on the script
- API documentation and tooling: `openapi/`
- DevOps and server configuration samples: `Dockerfile`, `nginx*.conf`, deployment scripts under `scripts/`

This guide explains:
1. Which files/folders must be uploaded
2. Which files/folders can be excluded
3. Configuration required to run the app on a web server (Nginx/Apache), including environment variables and build steps
4. Step-by-step instructions for both typical shared hosting (Apache) and VPS (Nginx + PHP-FPM)

---

## 1) Files and folders that must be uploaded

Upload these items to the server, preserving structure:

- Root build and runtime assets:
  - `public/` (root) – contains `index.html`, `favicon.ico`, `robots.txt`, public images; this is typically the web root for the frontend
  - `dev-dist/` (if used for a dev/staging static preview)
  - `index.html` (root) – Vite entry if serving SPA directly from root; see "Frontend deployment" section

- Frontend source (only if you plan to build on the server):
  - `src/`, `index.html`, `package.json`, `tsconfig*.json`, `vite.config.ts`, `postcss.config.js`, `tailwind.config.ts`, `eslint.config.js`
  - `public/` (root) images and static assets

- Backend (Laravel):
  - `backend/` entire folder, including:
    - `app/`, `bootstrap/`, `config/`, `database/`, `public/`, `resources/`, `routes/`, `storage/`, `vendor/` (if you built locally), `artisan`, `composer.json`, `composer.lock`, `phpunit.xml`
    - `.env` (to be created on the server, not committed)

- Server configuration samples (only if useful for your server):
  - `nginx.conf`, `nginx-default.conf`, `nginx-security.conf`
  - `Dockerfile` (if containerizing)

- Documentation and scripts (optional but recommended for team reference):
  - `docs/`, `scripts/`

Notes:
- For typical production deployments, you do NOT need to upload dev/test files, but keeping documentation can be useful.
- If you build the frontend locally, you only need to upload the built assets (usually `dist/`), not the entire `src/`. See Section 4.

---

## 2) Files and folders that can be excluded (do not upload)

You can safely skip these on production servers:

- VCS and editor configs:
  - `.git/`, `.gitignore`, `.gitattributes`, `.editorconfig`

- Local environment files:
  - `.env.development`, `.env.example` (create a real `.env` on the server instead)

- Node/JS build artifacts and caches (if building locally and uploading only the output):
  - `node_modules/`, `bun.lockb`
  - Any local `dist/` variants unless you specifically use them as your deployable artifacts (see Frontend deployment)

- Test, playground, and CI files (unless your server builds/tests):
  - `src/__tests__/`, `tests/`, `playwright.config.ts`, `test*.*`, `*.spec.*`
  - `docs/DEBUG_ERRORS/`, `docs/AUDIT/` (keep locally; optional on server)

- OpenAPI dev tooling (not required in production runtime):
  - `openapi/*` (unless you serve generated docs statically)

- Development scripts and configs not needed in runtime:
  - `scripts/*` (unless specifically used in runtime)
  - `*.map` files if present

- Misc local configs:
  - `.lighthouserc.json`, `eslint.config.js` (not needed in runtime)

- Backend development-only files:
  - `backend/tests/`, `backend/.env.example` (use real `.env` on server), `backend/docs/`

---

## 3) How to configure so the project runs on the website

There are two typical setups:

A) Single Server (Nginx/Apache) serving:
- Frontend SPA build (static files) – served directly by Nginx/Apache
- Backend Laravel API – served via PHP-FPM; API accessible at `/api` or a subdomain like `api.yourdomain.com`

B) Shared Hosting (Apache) – Laravel public/ as document root and the frontend build served from a subdirectory or separate domain

Important decisions:
- Routing: Decide whether your frontend routes are served from `/` and API from `/api`, or use subdomains.
- Build: Decide if you build the frontend locally and upload `dist/`, or build on server.

Environment variables:
- Frontend:
  - `.env.production` in the frontend root (or build-time env via Vite) must set `VITE_API_BASE_URL`, etc.
- Backend (Laravel):
  - `.env` under `backend/` must set `APP_ENV=production`, `APP_KEY`, `APP_URL`, `DB_*`, `CACHE_*`, `QUEUE_*`, `FILESYSTEM_DISK`, `SESSION_DRIVER`, etc.

---

## 4) Frontend deployment

Build locally (recommended):
1. Ensure Node.js (LTS) installed locally.
2. Configure `src/.env.production` or root `.env.production` with production values (e.g., `VITE_API_BASE_URL=https://api.yourdomain.com`).
3. Install deps: `npm ci` (or `npm install`)
4. Build: `npm run build`
5. The output folder (commonly `dist/`) will contain static files to upload to your web root.
6. Upload `dist/` contents to your server’s web root (e.g., `/var/www/yourdomain/html` or `/usr/share/nginx/html`).
7. If using history router, configure fallback to `index.html`:
   - Nginx: `try_files $uri /index.html;`
   - Apache: Use `.htaccess` rewrite to index.html

Build on server (if required by your hosting):
1. Upload frontend source: `src/`, `index.html`, `package.json`, `vite.config.ts`, `tsconfig*`, `tailwind.config.ts`, etc.
2. On the server, run:
   - `npm ci`
   - `npm run build`
3. Point web root to the generated `dist/` folder.

Notes on this repo:
- There is a `public/` at repository root containing some static assets and `404.html`. Decide whether to keep root `public/` as the SPA web root or use a dedicated build `dist/` path based on `vite.config.ts`.
- The file `dev-dist/` exists for dev preview; do not use it for production unless explicitly intended.

---

## 5) Backend (Laravel) deployment

Prerequisites on server (VPS):
- PHP 8.1+ (match your `composer.json`), PHP extensions required by Laravel
- Composer
- Web server: Nginx or Apache
- Database: MySQL/MariaDB/PostgreSQL per your config
- Redis (optional, if used for cache/queue)

Steps:
1. Upload `backend/` directory to server, e.g., `/var/www/yourdomain/backend`.
2. On the server, from `backend/` directory:
   - Install dependencies: `composer install --no-dev --optimize-autoloader`
   - Copy env: `cp .env.example .env` (or create manually)
   - Generate key: `php artisan key:generate`
   - Set app env vars in `.env` (DB credentials, APP_URL, etc.)
   - Run migrations: `php artisan migrate --force`
   - (Optional) Seed: `php artisan db:seed --force`
   - (Optional) Storage link: `php artisan storage:link`
3. File permissions (Linux):
   - `storage/` and `bootstrap/cache/` must be writable by web server user.
4. Configure web server:
   - Nginx site root to `backend/public`
   - Apache DocumentRoot to `backend/public`
5. Configure HTTPS and domain.

---

## 6) Nginx sample configuration (VPS)

Option 1: Frontend on root domain, API on subpath `/api` pointing to Laravel

server {
    listen 80;
    server_name yourdomain.com;

    # Frontend SPA
    root /var/www/yourdomain/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # API proxy to Laravel
    location /api/ {
        alias /var/www/yourdomain/backend/public/;
        index index.php;

        location ~ \.(php)$ {
            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            fastcgi_pass unix:/run/php/php8.2-fpm.sock; # adjust PHP-FPM socket
        }

        try_files $uri $uri/ /index.php?$query_string;
    }
}

Option 2: Subdomain API (recommended)

server {
    listen 80;
    server_name app.yourdomain.com;

    root /var/www/yourdomain/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com;

    root /var/www/yourdomain/backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock; # adjust
    }
}

---

## 7) Apache (shared hosting) sample

- Point DocumentRoot to the frontend build directory (e.g., `/public_html/`). Upload `dist/*` there.
- If your hosting supports a subdirectory for Laravel, place `backend/` outside the web root if possible and point a subdomain (e.g., `api.yourdomain.com`) to `backend/public`.
- `.htaccess` for SPA (in the frontend web root):

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

- Ensure PHP version and extensions match Laravel requirements.

---

## 8) Environment variables

Frontend (Vite):
- Create `.env.production` at project root (or wherever your Vite config reads from):
  - Example:
    - VITE_API_BASE_URL=https://api.yourdomain.com
    - VITE_APP_ENV=production

Backend (Laravel) `.env` inside `backend/`:
- Example (adjust to your environment):
  - APP_NAME="YourApp"
  - APP_ENV=production
  - APP_KEY=base64:GENERATED_KEY
  - APP_DEBUG=false
  - APP_URL=https://api.yourdomain.com
  - LOG_CHANNEL=stack
  - DB_CONNECTION=mysql
  - DB_HOST=127.0.0.1
  - DB_PORT=3306
  - DB_DATABASE=yourdb
  - DB_USERNAME=youruser
  - DB_PASSWORD=yourpass
  - CACHE_DRIVER=redis (or file)
  - QUEUE_CONNECTION=redis (or sync)
  - SESSION_DRIVER=file
  - FILESYSTEM_DISK=public

---

## 9) Step-by-step: Full deployment (VPS, recommended)

1. Prepare server
   - Create DNS records for `yourdomain.com` and `api.yourdomain.com`.
   - Install Nginx, PHP-FPM, Composer, Node.js LTS.

2. Backend setup
   - Upload `backend/` to `/var/www/yourdomain/backend`.
   - `cd /var/www/yourdomain/backend`
   - `composer install --no-dev --optimize-autoloader`
   - `cp .env.example .env` and edit with production secrets
   - `php artisan key:generate`
   - `php artisan migrate --force`
   - `php artisan storage:link`
   - Ensure permissions for `storage/` and `bootstrap/cache/`

3. Frontend build
   - Upload the repo (or only frontend) to `/var/www/yourdomain/frontend`.
   - `cd /var/www/yourdomain/frontend`
   - Create `.env.production` with API base URL
   - `npm ci`
   - `npm run build` (outputs `dist/`)

4. Web server config
   - Configure Nginx using Option 2 (subdomain split) or Option 1 (subpath).
   - Enable HTTPS via Let’s Encrypt (Certbot) for both domains.

5. Validate
   - Open `https://yourdomain.com` for the frontend.
   - API health check at `https://api.yourdomain.com` (e.g., `/api/health` if exists) or hit a known endpoint.

6. Hardening and performance
   - Set `APP_DEBUG=false`
   - Configure caching: `php artisan config:cache`, `php artisan route:cache` (after env set)
   - Set up queues: `php artisan queue:work` or supervisor
   - Set proper CORS in `backend/config/cors.php`

---

## 10) Step-by-step: Shared hosting (Apache)

1. Upload frontend build
   - Build locally: `npm install && npm run build`
   - Upload `dist/*` to `/public_html/` (or hosting document root)
   - Ensure `.htaccess` SPA rewrite exists (see section 7)

2. Upload Laravel backend
   - If your hosting allows a subdomain, create `api.yourdomain.com` pointing to `backend/public`.
   - Upload the `backend/` folder. Run Composer via hosting terminal if available:
     - `composer install --no-dev --optimize-autoloader`
     - Create `.env`, run `php artisan key:generate`, `php artisan migrate --force`
   - If you cannot run Composer, you must upload `backend/vendor/` from your local machine (after running `composer install` locally with the same PHP version).

3. Configure `.env` and permissions
   - Set DB credentials, disable debug.
   - Ensure `storage/` and `bootstrap/cache/` are writable.

4. Connect frontend to API
   - Ensure the frontend build has `VITE_API_BASE_URL` pointing to your API domain/path.

---

## 11) Directory quick reference

Must upload (at least one of these strategies):
- Frontend production artifacts: `dist/` (preferred), or build from `src/` on server.
- Backend Laravel runtime: `backend/` (with `vendor/` present or install via Composer on server).

Can skip in production:
- `.git`, `node_modules/` (if uploading built `dist/`), tests, OpenAPI tooling, dev docs.

---

## 12) Common pitfalls

- Uploading source without building the frontend – results in a blank page or 404s.
- Not pointing Nginx/Apache to the correct web root (`dist/` for frontend, `backend/public` for Laravel).
- Missing `.env` variables (APP_KEY, DB credentials).
- Wrong CORS settings when frontend and backend use different domains.
- Incorrect history router fallback, causing 404 on page refresh.

---

## 13) Post-deploy checks

- Frontend loads at root domain with no console errors.
- API endpoints return expected JSON.
- SSL certificates valid for both domains.
- Laravel logs (`backend/storage/logs/laravel.log`) show no errors.
- CSS/JS assets return 200 and correct content type.

---

## 14) Rollback and backups

- Keep a copy of previous `dist/` for quick rollback by symlink switch.
- Database backups before migrations.
- Use `.env` versioning in a secure vault (not in Git).

---

## 15) Appendix: Matching this repo specifics

- There is a `vite.config.ts` and also a timestamped variant file. Use `vite.config.ts` for builds; ignore timestamped artifact in production.
- Root `public/` includes `404.html`, `robots.txt`, `images/`. If you use a pure `dist/` deployment, move or copy required assets into Vite’s `public/` directory and rebuild.
- Provided Nginx configs (`nginx*.conf`) are templates; adapt paths and PHP-FPM socket.
- The backend has `public/.htaccess` for Apache routing. Ensure your host honors it or configure virtual host accordingly.

---

End of guide.
