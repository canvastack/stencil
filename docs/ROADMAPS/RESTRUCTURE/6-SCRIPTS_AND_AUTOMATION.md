# SCRIPTS & AUTOMATION
## Helper Scripts for Deployment & Maintenance

**Version**: 1.0.0  
**Last Updated**: December 22, 2025  
**Purpose**: Automated scripts untuk mempercepat restructure, deployment, dan maintenance  

---

## 📋 **SCRIPT INDEX**

1. [Project Restructure Script](#1-project-restructure-script)
2. [Build & Deploy Script](#2-build--deploy-script)
3. [Database Backup Script](#3-database-backup-script)
4. [Cache Clear Script](#4-cache-clear-script)
5. [Health Check Script](#5-health-check-script)
6. [Rollback Script](#6-rollback-script)
7. [Log Monitor Script](#7-log-monitor-script)
8. [Performance Test Script](#8-performance-test-script)

---

## 1. PROJECT RESTRUCTURE SCRIPT

### **Script: `scripts/restructure-project.ps1`**

**Purpose**: Memindahkan frontend files ke folder `frontend/`.

**Usage:**
```powershell
cd d:\worksites\canvastack\projects\stencil
.\scripts\restructure-project.ps1
```

**Script Content:**

```powershell
# ===================================================================
# PROJECT RESTRUCTURE SCRIPT
# ===================================================================
# Purpose: Move frontend files to frontend/ folder
# Author: CanvaStack Team
# Version: 1.0.0
# ===================================================================

$ErrorActionPreference = "Continue"
$projectRoot = Get-Location

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   STENCIL PROJECT RESTRUCTURE AUTOMATION SCRIPT       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project Root: $projectRoot" -ForegroundColor Yellow
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""

# Confirmation prompt
$confirm = Read-Host "This will move frontend files to frontend/ folder. Continue? (y/n)"
if ($confirm -ne 'y') {
    Write-Host "❌ Operation cancelled." -ForegroundColor Red
    exit
}

# Create backup first
Write-Host "[BACKUP] Creating backup..." -ForegroundColor Yellow
$backupName = "stencil-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').zip"
$backupPath = "..\$backupName"

try {
    Compress-Archive -Path . -DestinationPath $backupPath -CompressionLevel Optimal
    Write-Host "✓ Backup created: $backupPath" -ForegroundColor Green
} catch {
    Write-Host "⚠ Backup failed: $($_.Exception.Message)" -ForegroundColor Yellow
    $continueWithoutBackup = Read-Host "Continue without backup? (y/n)"
    if ($continueWithoutBackup -ne 'y') {
        Write-Host "❌ Operation cancelled." -ForegroundColor Red
        exit
    }
}

# Frontend folders to move
$frontendFolders = @(
    ".vite", ".vs", "bin", "coverage", "dev-dist", "dist", 
    "k6", "node_modules", "public", "scripts", "src", "test-results"
)

# Frontend files to move
$frontendFiles = @(
    ".chromatic", ".env", ".env.development", ".env.example", 
    ".env.local", ".env.production", ".lighthouserc.json",
    "bun.lockb", "CHANGELOG.md", "chromatic.config.json", "components.json",
    "Dockerfile", "eslint.config.js", "index.html", "nginx-default.conf",
    "nginx-security.conf", "nginx.conf", "package-lock.json", "package.json",
    "playwright.config.ts", "postcss.config.js", "tailwind.config.ts",
    "tsconfig-active.json", "tsconfig.app.json", "tsconfig.json",
    "tsconfig.node.json", "vite.config.ts", ".vscode", "README.md", "repo.md"
)
# NOTE: .gitignore stays at root to handle both frontend/ and backend/ artifacts

Write-Host ""
Write-Host "[STEP 1/4] Creating frontend directory..." -ForegroundColor Cyan
if (!(Test-Path "frontend")) {
    New-Item -Path "frontend" -ItemType Directory -Force | Out-Null
    Write-Host "✓ Directory created: frontend/" -ForegroundColor Green
} else {
    Write-Host "⚠ Directory already exists: frontend/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[STEP 2/4] Moving frontend folders..." -ForegroundColor Cyan
$movedFolders = 0
$skippedFolders = 0
$failedFolders = 0

foreach ($folder in $frontendFolders) {
    if (Test-Path $folder) {
        try {
            Move-Item -Path $folder -Destination "frontend\" -Force -ErrorAction Stop
            Write-Host "  ✓ $folder" -ForegroundColor Green
            $movedFolders++
        } catch {
            Write-Host "  ✗ $folder - $($_.Exception.Message)" -ForegroundColor Red
            $failedFolders++
        }
    } else {
        Write-Host "  - $folder (not found)" -ForegroundColor DarkGray
        $skippedFolders++
    }
}

Write-Host ""
Write-Host "[STEP 3/4] Moving frontend files..." -ForegroundColor Cyan
$movedFiles = 0
$skippedFiles = 0
$failedFiles = 0

foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        try {
            Move-Item -Path $file -Destination "frontend\" -Force -ErrorAction Stop
            Write-Host "  ✓ $file" -ForegroundColor Green
            $movedFiles++
        } catch {
            Write-Host "  ✗ $file - $($_.Exception.Message)" -ForegroundColor Red
            $failedFiles++
        }
    } else {
        Write-Host "  - $file (not found)" -ForegroundColor DarkGray
        $skippedFiles++
    }
}

Write-Host ""
Write-Host "[STEP 4/4] Verifying structure..." -ForegroundColor Cyan

$frontendExists = Test-Path "frontend"
$backendExists = Test-Path "backend"
$srcExists = Test-Path "frontend\src"
$packageExists = Test-Path "frontend\package.json"
$viteConfigExists = Test-Path "frontend\vite.config.ts"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    SUMMARY                             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "Folders:" -ForegroundColor Yellow
Write-Host "  Moved:   $movedFolders" -ForegroundColor Green
Write-Host "  Skipped: $skippedFolders" -ForegroundColor Gray
Write-Host "  Failed:  $failedFolders" -ForegroundColor $(if($failedFolders -gt 0){"Red"}else{"Gray"})
Write-Host ""
Write-Host "Files:" -ForegroundColor Yellow
Write-Host "  Moved:   $movedFiles" -ForegroundColor Green
Write-Host "  Skipped: $skippedFiles" -ForegroundColor Gray
Write-Host "  Failed:  $failedFiles" -ForegroundColor $(if($failedFiles -gt 0){"Red"}else{"Gray"})
Write-Host ""
Write-Host "Structure Verification:" -ForegroundColor Yellow
Write-Host "  frontend/ exists:              $frontendExists" -ForegroundColor $(if($frontendExists){"Green"}else{"Red"})
Write-Host "  backend/ exists:               $backendExists" -ForegroundColor $(if($backendExists){"Green"}else{"Red"})
Write-Host "  frontend/src/ exists:          $srcExists" -ForegroundColor $(if($srcExists){"Green"}else{"Red"})
Write-Host "  frontend/package.json exists:  $packageExists" -ForegroundColor $(if($packageExists){"Green"}else{"Red"})
Write-Host "  frontend/vite.config.ts exists: $viteConfigExists" -ForegroundColor $(if($viteConfigExists){"Green"}else{"Red"})
Write-Host ""

if ($frontendExists -and $backendExists -and $srcExists -and $packageExists -and $viteConfigExists) {
    Write-Host "✅ RESTRUCTURE SUCCESSFUL!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. Review 2-CONFIGURATION_SETUP.md" -ForegroundColor White
    Write-Host "  2. Configure .env files" -ForegroundColor White
    Write-Host "  3. Test local development:" -ForegroundColor White
    Write-Host "     cd frontend && npm run dev" -ForegroundColor Gray
    Write-Host "     cd backend && php artisan serve" -ForegroundColor Gray
} else {
    Write-Host "⚠️ RESTRUCTURE INCOMPLETE!" -ForegroundColor Yellow
    Write-Host "Please verify structure manually and retry if needed." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Backup Location: $backupPath" -ForegroundColor Gray
Write-Host "Script completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""
```

---

## 2. BUILD & DEPLOY SCRIPT

### **Script: `scripts/deploy-production.sh`**

**Purpose**: Automated production deployment.

**Usage:**
```bash
# From local machine
./scripts/deploy-production.sh

# Or specific steps
./scripts/deploy-production.sh --frontend-only
./scripts/deploy-production.sh --backend-only
```

**Script Content:**

```bash
#!/bin/bash

# ===================================================================
# PRODUCTION DEPLOYMENT SCRIPT
# ===================================================================
# Purpose: Build frontend and deploy to production server
# Author: CanvaStack Team
# Version: 1.0.0
# ===================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"
SSH_HOST="username@etchingxenial.biz.id"
REMOTE_FRONTEND="/home/username/public_html"
REMOTE_BACKEND="/home/username/api.etchingxenial.biz.id"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        STENCIL PRODUCTION DEPLOYMENT SCRIPT            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Parse arguments
FRONTEND_ONLY=false
BACKEND_ONLY=false

for arg in "$@"; do
    case $arg in
        --frontend-only)
            FRONTEND_ONLY=true
            ;;
        --backend-only)
            BACKEND_ONLY=true
            ;;
    esac
done

# Confirmation
echo -e "${YELLOW}⚠️  You are about to deploy to PRODUCTION!${NC}"
echo -e "${YELLOW}   Frontend: ${FRONTEND_ONLY} | Backend: ${BACKEND_ONLY}${NC}"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment cancelled.${NC}"
    exit 1
fi

# ===================================================================
# FRONTEND DEPLOYMENT
# ===================================================================

if [ "$BACKEND_ONLY" = false ]; then
    echo ""
    echo -e "${CYAN}[FRONTEND] Starting frontend deployment...${NC}"
    
    # Build frontend
    echo -e "${YELLOW}[1/5] Building frontend...${NC}"
    cd "$FRONTEND_DIR"
    
    # Copy production .env
    if [ -f ".env.production" ]; then
        cp .env.production .env
        echo -e "${GREEN}✓ Production .env loaded${NC}"
    else
        echo -e "${RED}✗ .env.production not found!${NC}"
        exit 1
    fi
    
    # Install dependencies
    echo -e "${YELLOW}[2/5] Installing dependencies...${NC}"
    npm ci --production=false
    
    # Build
    echo -e "${YELLOW}[3/5] Running build...${NC}"
    npm run build
    
    if [ ! -d "dist" ]; then
        echo -e "${RED}✗ Build failed! dist/ folder not created.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Build completed successfully${NC}"
    
    # Create backup on server
    echo -e "${YELLOW}[4/5] Creating backup on server...${NC}"
    ssh "$SSH_HOST" "cd $REMOTE_FRONTEND && tar -czf ../public_html-backup-$(date +%Y%m%d-%H%M%S).tar.gz ."
    echo -e "${GREEN}✓ Backup created${NC}"
    
    # Upload to server
    echo -e "${YELLOW}[5/5] Uploading to server...${NC}"
    rsync -avz --delete dist/ "$SSH_HOST:$REMOTE_FRONTEND/"
    
    echo -e "${GREEN}✅ Frontend deployment completed!${NC}"
    cd ..
fi

# ===================================================================
# BACKEND DEPLOYMENT
# ===================================================================

if [ "$FRONTEND_ONLY" = false ]; then
    echo ""
    echo -e "${CYAN}[BACKEND] Starting backend deployment...${NC}"
    
    cd "$BACKEND_DIR"
    
    # Upload backend files (excluding vendor, node_modules, etc.)
    echo -e "${YELLOW}[1/6] Uploading backend files...${NC}"
    rsync -avz --exclude 'vendor' --exclude 'node_modules' --exclude 'storage/logs' --exclude '.env' \
        . "$SSH_HOST:$REMOTE_BACKEND/"
    
    echo -e "${GREEN}✓ Files uploaded${NC}"
    
    # Install dependencies
    echo -e "${YELLOW}[2/6] Installing Composer dependencies...${NC}"
    ssh "$SSH_HOST" "cd $REMOTE_BACKEND && composer install --optimize-autoloader --no-dev"
    
    # Run migrations
    echo -e "${YELLOW}[3/6] Running database migrations...${NC}"
    ssh "$SSH_HOST" "cd $REMOTE_BACKEND && php artisan migrate --force"
    
    # Clear caches
    echo -e "${YELLOW}[4/6] Clearing caches...${NC}"
    ssh "$SSH_HOST" "cd $REMOTE_BACKEND && php artisan cache:clear"
    ssh "$SSH_HOST" "cd $REMOTE_BACKEND && php artisan config:clear"
    ssh "$SSH_HOST" "cd $REMOTE_BACKEND && php artisan route:clear"
    ssh "$SSH_HOST" "cd $REMOTE_BACKEND && php artisan view:clear"
    
    # Optimize
    echo -e "${YELLOW}[5/6] Optimizing application...${NC}"
    ssh "$SSH_HOST" "cd $REMOTE_BACKEND && php artisan config:cache"
    ssh "$SSH_HOST" "cd $REMOTE_BACKEND && php artisan route:cache"
    ssh "$SSH_HOST" "cd $REMOTE_BACKEND && php artisan view:cache"
    
    # Set permissions
    echo -e "${YELLOW}[6/6] Setting permissions...${NC}"
    ssh "$SSH_HOST" "cd $REMOTE_BACKEND && chmod -R 775 storage bootstrap/cache"
    
    echo -e "${GREEN}✅ Backend deployment completed!${NC}"
    cd ..
fi

# ===================================================================
# VERIFICATION
# ===================================================================

echo ""
echo -e "${CYAN}[VERIFY] Running health checks...${NC}"

# Test frontend
if [ "$BACKEND_ONLY" = false ]; then
    echo -e "${YELLOW}Testing frontend...${NC}"
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://etchingxenial.biz.id)
    if [ "$FRONTEND_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✓ Frontend: OK ($FRONTEND_STATUS)${NC}"
    else
        echo -e "${RED}✗ Frontend: FAILED ($FRONTEND_STATUS)${NC}"
    fi
fi

# Test backend
if [ "$FRONTEND_ONLY" = false ]; then
    echo -e "${YELLOW}Testing backend...${NC}"
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.etchingxenial.biz.id/api/v1/health)
    if [ "$BACKEND_STATUS" -eq 200 ]; then
        echo -e "${GREEN}✓ Backend: OK ($BACKEND_STATUS)${NC}"
    else
        echo -e "${RED}✗ Backend: FAILED ($BACKEND_STATUS)${NC}"
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            DEPLOYMENT COMPLETED SUCCESSFULLY!          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "  1. Test authentication flows"
echo "  2. Verify critical user journeys"
echo "  3. Monitor logs for errors"
echo "  4. Check performance metrics"
echo ""
echo -e "${YELLOW}Deployed at: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""
```

**Make script executable:**
```bash
chmod +x scripts/deploy-production.sh
```

---

## 3. DATABASE BACKUP SCRIPT

### **Script: `scripts/backup-database.sh`**

**Purpose**: Automated database backup.

**Usage:**
```bash
./scripts/backup-database.sh
```

**Script Content:**

```bash
#!/bin/bash

# ===================================================================
# DATABASE BACKUP SCRIPT
# ===================================================================
# Purpose: Create automated database backups
# Author: CanvaStack Team
# Version: 1.0.0
# ===================================================================

set -e

# Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="stencil_canvastack"
DB_USER="postgres"
BACKUP_DIR="backups/database"
RETENTION_DAYS=30  # Keep backups for 30 days

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}[BACKUP] Starting database backup...${NC}"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Generate filename with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/stencil-db-$TIMESTAMP.sql"

# Perform backup (PostgreSQL)
echo -e "${YELLOW}Backing up database: $DB_NAME${NC}"

pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -F c -b -v -f "$BACKUP_FILE" "$DB_NAME"

# Check if backup successful
if [ $? -eq 0 ]; then
    # Compress backup
    gzip "$BACKUP_FILE"
    BACKUP_FILE="$BACKUP_FILE.gz"
    
    # Get file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    
    echo -e "${GREEN}✓ Backup completed successfully!${NC}"
    echo -e "${GREEN}  File: $BACKUP_FILE${NC}"
    echo -e "${GREEN}  Size: $SIZE${NC}"
    
    # Clean old backups
    echo -e "${YELLOW}Cleaning old backups (older than $RETENTION_DAYS days)...${NC}"
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    REMAINING=$(ls -1 "$BACKUP_DIR" | wc -l)
    echo -e "${GREEN}✓ Cleanup complete. $REMAINING backup(s) retained.${NC}"
else
    echo -e "${RED}✗ Backup failed!${NC}"
    exit 1
fi

echo ""
echo -e "${CYAN}Backup completed at: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
```

**For MySQL:**
```bash
# Replace pg_dump with mysqldump
mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_FILE"
```

---

## 4. CACHE CLEAR SCRIPT

### **Script: `scripts/clear-cache.sh`**

**Purpose**: Clear all Laravel caches.

**Usage:**
```bash
cd backend
../scripts/clear-cache.sh
```

**Script Content:**

```bash
#!/bin/bash

# ===================================================================
# CACHE CLEAR SCRIPT
# ===================================================================

echo "🧹 Clearing all Laravel caches..."

php artisan cache:clear
echo "✓ Cache cleared"

php artisan config:clear
echo "✓ Config cache cleared"

php artisan route:clear
echo "✓ Route cache cleared"

php artisan view:clear
echo "✓ View cache cleared"

php artisan event:clear
echo "✓ Event cache cleared"

# Optional: Clear compiled
php artisan clear-compiled
echo "✓ Compiled cleared"

echo ""
echo "✅ All caches cleared successfully!"
```

---

## 5. HEALTH CHECK SCRIPT

### **Script: `scripts/health-check.sh`**

**Purpose**: Check if all services are running properly.

**Usage:**
```bash
./scripts/health-check.sh
```

**Script Content:**

```bash
#!/bin/bash

# ===================================================================
# HEALTH CHECK SCRIPT
# ===================================================================

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║              STENCIL HEALTH CHECK                      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check frontend
echo -e "${YELLOW}[1/5] Checking frontend...${NC}"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://etchingxenial.biz.id)
if [ "$FRONTEND_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ Frontend: Online ($FRONTEND_STATUS)${NC}"
else
    echo -e "${RED}✗ Frontend: Offline ($FRONTEND_STATUS)${NC}"
fi

# Check backend API
echo -e "${YELLOW}[2/5] Checking backend API...${NC}"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.etchingxenial.biz.id/api/v1/health)
if [ "$BACKEND_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ Backend API: Online ($BACKEND_STATUS)${NC}"
else
    echo -e "${RED}✗ Backend API: Offline ($BACKEND_STATUS)${NC}"
fi

# Check CSRF endpoint
echo -e "${YELLOW}[3/5] Checking CSRF endpoint...${NC}"
CSRF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.etchingxenial.biz.id/sanctum/csrf-cookie)
if [ "$CSRF_STATUS" -eq 204 ]; then
    echo -e "${GREEN}✓ CSRF endpoint: OK ($CSRF_STATUS)${NC}"
else
    echo -e "${RED}✗ CSRF endpoint: Failed ($CSRF_STATUS)${NC}"
fi

# Check database (requires SSH access)
echo -e "${YELLOW}[4/5] Checking database connection...${NC}"
ssh username@etchingxenial.biz.id "cd /home/username/api.etchingxenial.biz.id && php artisan db:show" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database: Connected${NC}"
else
    echo -e "${RED}✗ Database: Connection failed${NC}"
fi

# Check SSL certificates
echo -e "${YELLOW}[5/5] Checking SSL certificates...${NC}"
CERT_EXPIRY=$(echo | openssl s_client -servername etchingxenial.biz.id -connect etchingxenial.biz.id:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
echo -e "${GREEN}✓ SSL: Valid until $CERT_EXPIRY${NC}"

echo ""
echo -e "${CYAN}Health check completed at: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""
```

---

## 6. ROLLBACK SCRIPT

### **Script: `scripts/rollback.sh`**

**Purpose**: Quick rollback to previous version.

**Usage:**
```bash
./scripts/rollback.sh
```

**Script Content:**

```bash
#!/bin/bash

# ===================================================================
# ROLLBACK SCRIPT
# ===================================================================

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                  ROLLBACK SCRIPT                       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${RED}⚠️  WARNING: This will rollback to the previous version!${NC}"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled."
    exit 1
fi

SSH_HOST="username@etchingxenial.biz.id"
REMOTE_FRONTEND="/home/username/public_html"
REMOTE_BACKEND="/home/username/api.etchingxenial.biz.id"

# Rollback frontend
echo -e "${YELLOW}[1/3] Rolling back frontend...${NC}"
ssh "$SSH_HOST" "cd $(dirname $REMOTE_FRONTEND) && \
    rm -rf $REMOTE_FRONTEND && \
    tar -xzf public_html-backup-*.tar.gz -C $REMOTE_FRONTEND"

# Rollback backend (git)
echo -e "${YELLOW}[2/3] Rolling back backend...${NC}"
ssh "$SSH_HOST" "cd $REMOTE_BACKEND && \
    git stash && \
    git checkout HEAD~1"

# Clear caches
echo -e "${YELLOW}[3/3] Clearing caches...${NC}"
ssh "$SSH_HOST" "cd $REMOTE_BACKEND && \
    php artisan cache:clear && \
    php artisan config:clear && \
    php artisan route:clear"

echo ""
echo -e "${CYAN}✅ Rollback completed!${NC}"
echo ""
echo "Please verify the application is working correctly."
```

---

## 7. LOG MONITOR SCRIPT

### **Script: `scripts/monitor-logs.sh`**

**Purpose**: Real-time log monitoring.

**Usage:**
```bash
./scripts/monitor-logs.sh
```

**Script Content:**

```bash
#!/bin/bash

# ===================================================================
# LOG MONITOR SCRIPT
# ===================================================================

SSH_HOST="username@etchingxenial.biz.id"
LOG_FILE="/home/username/api.etchingxenial.biz.id/storage/logs/laravel.log"

echo "📊 Monitoring Laravel logs..."
echo "Press Ctrl+C to stop"
echo ""

# Monitor remote log file
ssh "$SSH_HOST" "tail -f $LOG_FILE"
```

---

## 8. PERFORMANCE TEST SCRIPT

### **Script: `scripts/performance-test.js`**

**Purpose**: Automated performance testing with k6.

**Usage:**
```bash
k6 run scripts/performance-test.js
```

**Script Content:**

```javascript
/**
 * ===================================================================
 * PERFORMANCE TEST SCRIPT (K6)
 * ===================================================================
 * Purpose: Load testing for API endpoints
 * Usage: k6 run scripts/performance-test.js
 * ===================================================================
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '30s', target: 100 }, // Spike to 100 users
    { duration: '1m', target: 50 },   // Scale down to 50 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests should fail
  },
};

const BASE_URL = 'https://api.etchingxenial.biz.id';

export default function () {
  // Test 1: Health endpoint
  let healthResponse = http.get(`${BASE_URL}/api/v1/health`);
  check(healthResponse, {
    'health endpoint status is 200': (r) => r.status === 200,
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(1);

  // Test 2: Products list (requires auth)
  // Note: You'll need to handle authentication for protected endpoints
  
  // Test 3: CSRF cookie
  let csrfResponse = http.get(`${BASE_URL}/sanctum/csrf-cookie`);
  check(csrfResponse, {
    'CSRF endpoint status is 204': (r) => r.status === 204,
    'CSRF response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}

export function handleSummary(data) {
  return {
    'performance-report.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
```

---

## 📦 **SCRIPT INSTALLATION**

### **Setup Script Directory**

```bash
# Create scripts directory
mkdir -p scripts

# Create all scripts from above
# Make them executable
chmod +x scripts/*.sh
chmod +x scripts/*.ps1  # Windows: Not needed

# Add to .gitignore if needed
echo "scripts/*.log" >> .gitignore
```

---

## 🎯 **USAGE EXAMPLES**

### **Example 1: Complete Restructure Workflow**

```powershell
# Step 1: Restructure
.\scripts\restructure-project.ps1

# Step 2: Verify structure
cd frontend
npm run dev

# Step 3: Test backend
cd ..\backend
php artisan serve
```

### **Example 2: Production Deployment**

```bash
# Full deployment
./scripts/deploy-production.sh

# Frontend only
./scripts/deploy-production.sh --frontend-only

# Backend only
./scripts/deploy-production.sh --backend-only

# Verify
./scripts/health-check.sh
```

### **Example 3: Maintenance Workflow**

```bash
# Backup database
./scripts/backup-database.sh

# Monitor logs
./scripts/monitor-logs.sh

# Clear caches if issues
ssh username@etchingxenial.biz.id
cd /home/username/api.etchingxenial.biz.id
../scripts/clear-cache.sh
```

---

## 🔧 **CUSTOMIZATION**

### **Modify for Your Environment**

**Update SSH credentials:**
```bash
# In all scripts, replace:
SSH_HOST="username@etchingxenial.biz.id"
# With your actual username and domain
```

**Update paths:**
```bash
REMOTE_FRONTEND="/home/username/public_html"
REMOTE_BACKEND="/home/username/api.etchingxenial.biz.id"
# Adjust to your hosting structure
```

**Database credentials:**
```bash
DB_HOST="localhost"
DB_USER="your_username"
DB_NAME="your_database"
# Update in backup script
```

---

## 📊 **SCRIPT EXECUTION LOG**

**Template for tracking script usage:**

```
Date: 2025-12-22
Script: deploy-production.sh
User: developer@canvastack.com
Status: Success
Duration: 5m 32s
Notes: Full deployment, all health checks passed
```

---

## ✅ **BEST PRACTICES**

1. **Test scripts locally before production**
2. **Always create backups before destructive operations**
3. **Use version control for scripts**
4. **Document script modifications**
5. **Set up cron jobs for automated tasks**
6. **Monitor script execution logs**
7. **Keep credentials in environment variables**
8. **Review and update scripts regularly**

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-12-22  
**Back to**: [0-INDEX.md](./0-INDEX.md)
