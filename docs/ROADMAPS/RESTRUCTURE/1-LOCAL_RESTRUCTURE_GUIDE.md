# LOCAL RESTRUCTURE GUIDE
## Step-by-Step Project Reorganization

**Version**: 1.0.0  
**Last Updated**: December 22, 2025  
**Estimated Time**: 2-4 hours  
**Difficulty**: 🟡 Medium  

---

## 🎯 **OBJECTIVE**

Memisahkan project CanvaStencil dari **monorepo structure** menjadi **separated frontend-backend structure** untuk memudahkan development, deployment, dan maintenance.

### **Current Structure (Monorepo)**

```
d:\worksites\canvastack\projects\stencil\
├── backend/           # Laravel already separated
├── src/               # React source (frontend)
├── public/            # Frontend public assets
├── dist/              # Frontend build output
├── node_modules/      # Frontend dependencies
├── package.json       # Frontend packages
├── vite.config.ts     # Frontend build config
├── index.html         # Frontend entry
└── ... mixed files
```

### **Target Structure (Separated)**

```
d:\worksites\canvastack\projects\stencil\
├── frontend/          # All React + Vite files
│   ├── src/
│   ├── public/
│   ├── dist/
│   ├── node_modules/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── ... all frontend files
│
└── backend/           # All Laravel files (unchanged)
    ├── app/
    ├── routes/
    ├── database/
    └── ... all backend files
```

---

## ⚠️ **PRE-REQUISITES**

### **1. Backup Everything**

```powershell
# Full project backup
cd d:\worksites\canvastack\projects\stencil
Compress-Archive -Path . -DestinationPath "../stencil-backup-$(Get-Date -Format 'yyyy-MM-dd-HHmmss').zip"
```

### **2. Git Status Check**

```bash
git status
# Ensure working directory is clean
# Commit any pending changes

git commit -am "Pre-restructure checkpoint"
git tag -a "pre-restructure" -m "Backup before frontend-backend separation"
```

### **3. Verify Dependencies**

```powershell
# Frontend dependencies installed
Test-Path node_modules # Should return True

# Backend dependencies installed
Test-Path backend\vendor # Should return True
```

### **4. Stop Running Processes**

- Stop Vite dev server (Ctrl+C)
- Stop Laravel server (Ctrl+C)
- Close any file watchers or build processes

---

## 📋 **STEP-BY-STEP PROCESS**

### **STEP 1: Create Frontend Folder**

```powershell
cd d:\worksites\canvastack\projects\stencil

# Create frontend directory
New-Item -Path "frontend" -ItemType Directory -Force
```

**Expected Output:**
```
Directory: d:\worksites\canvastack\projects\stencil

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        12/22/2025   9:00 PM                frontend
```

---

### **STEP 2: Move Frontend Files**

**Manual Method (Recommended for First Time):**

```powershell
# Navigate to project root
cd d:\worksites\canvastack\projects\stencil

# Move frontend-specific folders
Move-Item -Path ".vite" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path ".vs" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "bin" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "coverage" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "dev-dist" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "dist" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "k6" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "node_modules" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "public" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "scripts" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "src" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "test-results" -Destination "frontend\" -Force -ErrorAction SilentlyContinue

# Move frontend-specific files
Move-Item -Path ".chromatic" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path ".env" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path ".env.development" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path ".env.example" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path ".env.local" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path ".env.production" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
# NOTE: Keep .gitignore at root - will update it in STEP 4
Move-Item -Path ".lighthouserc.json" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "bun.lockb" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "CHANGELOG.md" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "chromatic.config.json" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "components.json" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "Dockerfile" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "eslint.config.js" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "index.html" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "nginx-default.conf" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "nginx-security.conf" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "nginx.conf" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "package-lock.json" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "package.json" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "playwright.config.ts" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "postcss.config.js" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "tailwind.config.ts" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "tsconfig-active.json" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "tsconfig.app.json" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "tsconfig.json" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "tsconfig.node.json" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
Move-Item -Path "vite.config.ts" -Destination "frontend\" -Force -ErrorAction SilentlyContinue

# Move .vscode if exists (optional, developer preference)
Move-Item -Path ".vscode" -Destination "frontend\" -Force -ErrorAction SilentlyContinue
```

**Automated Script Method:**

Save this as `restructure-project.ps1`:

```powershell
# Stencil Project Restructure Script
# Run from project root: d:\worksites\canvastack\projects\stencil

$ErrorActionPreference = "Continue"
$projectRoot = Get-Location

Write-Host "=== STENCIL PROJECT RESTRUCTURE SCRIPT ===" -ForegroundColor Cyan
Write-Host "Project Root: $projectRoot" -ForegroundColor Yellow
Write-Host ""

# Frontend items to move
$frontendFolders = @(
    ".vite", ".vs", "bin", "coverage", "dev-dist", "dist", 
    "k6", "node_modules", "public", "scripts", "src", "test-results"
)

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
# NOTE: .gitignore stays at root - will be updated in STEP 4

# Create frontend directory
Write-Host "[1/4] Creating frontend directory..." -ForegroundColor Green
New-Item -Path "frontend" -ItemType Directory -Force | Out-Null

# Move folders
Write-Host "[2/4] Moving frontend folders..." -ForegroundColor Green
$movedFolders = 0
foreach ($folder in $frontendFolders) {
    if (Test-Path $folder) {
        try {
            Move-Item -Path $folder -Destination "frontend\" -Force -ErrorAction Stop
            Write-Host "  ✓ Moved: $folder" -ForegroundColor Gray
            $movedFolders++
        } catch {
            Write-Host "  ✗ Failed: $folder - $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  - Skipped: $folder (not found)" -ForegroundColor DarkGray
    }
}

# Move files
Write-Host "[3/4] Moving frontend files..." -ForegroundColor Green
$movedFiles = 0
foreach ($file in $frontendFiles) {
    if (Test-Path $file) {
        try {
            Move-Item -Path $file -Destination "frontend\" -Force -ErrorAction Stop
            Write-Host "  ✓ Moved: $file" -ForegroundColor Gray
            $movedFiles++
        } catch {
            Write-Host "  ✗ Failed: $file - $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  - Skipped: $file (not found)" -ForegroundColor DarkGray
    }
}

# Verify structure
Write-Host "[4/4] Verifying structure..." -ForegroundColor Green
$frontendExists = Test-Path "frontend"
$backendExists = Test-Path "backend"
$srcExists = Test-Path "frontend\src"
$packageExists = Test-Path "frontend\package.json"

Write-Host ""
Write-Host "=== RESTRUCTURE SUMMARY ===" -ForegroundColor Cyan
Write-Host "  Folders moved: $movedFolders" -ForegroundColor Yellow
Write-Host "  Files moved: $movedFiles" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ✓ frontend/ exists: $frontendExists" -ForegroundColor $(if($frontendExists){"Green"}else{"Red"})
Write-Host "  ✓ backend/ exists: $backendExists" -ForegroundColor $(if($backendExists){"Green"}else{"Red"})
Write-Host "  ✓ frontend/src/ exists: $srcExists" -ForegroundColor $(if($srcExists){"Green"}else{"Red"})
Write-Host "  ✓ frontend/package.json exists: $packageExists" -ForegroundColor $(if($packageExists){"Green"}else{"Red"})
Write-Host ""

if ($frontendExists -and $backendExists -and $srcExists -and $packageExists) {
    Write-Host "✅ RESTRUCTURE SUCCESSFUL!" -ForegroundColor Green
} else {
    Write-Host "⚠️ RESTRUCTURE INCOMPLETE - Please verify manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review 2-CONFIGURATION_SETUP.md" -ForegroundColor White
Write-Host "  2. Configure .env files in frontend/ and backend/" -ForegroundColor White
Write-Host "  3. Test local development (npm run dev && php artisan serve)" -ForegroundColor White
```

**Run the script:**

```powershell
cd d:\worksites\canvastack\projects\stencil
.\restructure-project.ps1
```

---

### **STEP 3: Verify Structure**

```powershell
# Check frontend folder
Get-ChildItem frontend -Name

# Should show:
# src, public, node_modules, package.json, vite.config.ts, index.html, etc.

# Check backend folder (unchanged)
Get-ChildItem backend -Name

# Should show:
# app, routes, database, public, artisan, composer.json, etc.
```

**Expected Frontend Structure:**

```
frontend/
├── .vite/
├── .vscode/
├── bin/
├── coverage/
├── dev-dist/
├── dist/
├── k6/
├── node_modules/
├── public/
├── scripts/
├── src/
│   ├── api/
│   ├── components/
│   ├── contexts/
│   ├── core/
│   ├── features/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── stores/
│   ├── themes/
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── ...
├── test-results/
├── .chromatic
├── .env
├── .env.development
├── .env.example
├── .env.local
├── .env.production
├── .lighthouserc.json
├── bun.lockb
├── CHANGELOG.md
├── chromatic.config.json
├── components.json
├── Dockerfile
├── eslint.config.js
├── index.html
├── nginx-default.conf
├── nginx-security.conf
├── nginx.conf
├── package-lock.json
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── README.md
├── repo.md
├── tailwind.config.ts
├── tsconfig-active.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

### **STEP 4: Update Root .gitignore**

Update the existing `.gitignore` in project root to handle both frontend and backend build artifacts with the new structure:

```gitignore
# Frontend
frontend/node_modules/
frontend/dist/
frontend/.vite/
frontend/dev-dist/
frontend/coverage/
frontend/test-results/
frontend/.env.local

# Backend
backend/vendor/
backend/node_modules/
backend/storage/logs/
backend/storage/framework/cache/
backend/storage/framework/sessions/
backend/storage/framework/views/
backend/bootstrap/cache/*.php
backend/.env
backend/.phpunit.result.cache

# Shared
.DS_Store
Thumbs.db
*.log
*.tmp
```

---

### **STEP 5: Create Shared Documentation Symlinks (Optional)**

If you want to share docs/ and openapi/ between frontend and backend:

**Option A: Keep in Root (Recommended)**

```
stencil/
├── docs/          # Shared documentation
├── openapi/       # Shared API specs
├── frontend/
└── backend/
```

**Option B: Create Symlinks**

```powershell
# Windows requires admin privileges for symlinks
# Run PowerShell as Administrator

cd d:\worksites\canvastack\projects\stencil\frontend
New-Item -ItemType SymbolicLink -Path "docs" -Target "..\docs"
New-Item -ItemType SymbolicLink -Path "openapi" -Target "..\openapi"

cd ..\backend
New-Item -ItemType SymbolicLink -Path "docs" -Target "..\docs"
New-Item -ItemType SymbolicLink -Path "openapi" -Target "..\openapi"
```

**Recommendation**: Keep docs/ and openapi/ in root for simplicity.

---

### **STEP 6: Update Path References**

**No changes needed if:**
- Frontend uses relative paths (`import '@/components/...'`)
- Backend uses Laravel's path helpers
- Documentation uses relative links

**If issues arise**, check:
- `vite.config.ts` alias paths
- TypeScript `tsconfig.json` paths
- Import statements in React components

---

## ✅ **VERIFICATION CHECKLIST**

### **Structure Verification**

- [ ] `frontend/` folder exists
- [ ] `frontend/src/` exists with all React components
- [ ] `frontend/public/` exists with assets
- [ ] `frontend/node_modules/` exists (or will be reinstalled)
- [ ] `frontend/package.json` exists
- [ ] `frontend/vite.config.ts` exists
- [ ] `frontend/index.html` exists
- [ ] `backend/` folder exists unchanged
- [ ] `backend/app/` exists with Laravel code
- [ ] `backend/public/` exists with index.php
- [ ] `docs/` and `openapi/` accessible (root or symlinks)

### **File Count Verification**

```powershell
# Count files in frontend
(Get-ChildItem -Path frontend -Recurse -File | Measure-Object).Count

# Count files in backend
(Get-ChildItem -Path backend -Recurse -File | Measure-Object).Count

# Total should match or be close to original project file count
```

### **Dependency Verification**

```powershell
# Frontend dependencies
cd frontend
Test-Path package.json  # Should be True
Test-Path node_modules  # Should be True (or reinstall)

# Backend dependencies
cd ..\backend
Test-Path composer.json  # Should be True
Test-Path vendor        # Should be True (or reinstall)
```

---

## 🔧 **POST-RESTRUCTURE SETUP**

### **1. Reinstall Dependencies (If Needed)**

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
composer install
```

### **2. Environment Files**

**Frontend: `frontend/.env.development`**
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_PLATFORM_API_BASE_URL=http://localhost:8000/api/v1/platform
VITE_TENANT_API_BASE_URL=http://localhost:8000/api/v1/tenant
```

**Backend: `backend/.env`**
```env
FRONTEND_URL=http://localhost:5173
SANCTUM_STATEFUL_DOMAINS=localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

*See `2-CONFIGURATION_SETUP.md` for complete configuration.*

### **3. Git Commit**

```bash
cd d:\worksites\canvastack\projects\stencil

git add .
git commit -m "Restructure: Separate frontend and backend into dedicated folders

- Moved all React/Vite files to frontend/
- Backend remains in backend/ (unchanged)
- Updated .gitignore for new structure
- Ready for configuration setup (see 2-CONFIGURATION_SETUP.md)"

git tag -a "restructure-v1.0" -m "Project restructure complete"
```

---

## 🐛 **TROUBLESHOOTING**

### **Issue: "Move-Item: Cannot find path"**

**Cause**: File/folder doesn't exist in source location.

**Solution**: Check if file was already moved or doesn't exist.

```powershell
# List all items in current directory
Get-ChildItem -Name

# Search for specific item
Get-ChildItem -Path . -Filter "item-name" -Recurse
```

---

### **Issue: "Access Denied" when moving node_modules**

**Cause**: Files in use or permission issues.

**Solution**:
1. Stop all running processes (Vite, VS Code)
2. Close IDE
3. Run PowerShell as Administrator
4. Try again

Alternative:
```powershell
# Delete and reinstall node_modules
Remove-Item -Path node_modules -Recurse -Force
cd frontend
npm install
```

---

### **Issue: Git shows massive changes**

**Cause**: File moves are tracked as delete + add.

**Solution**:
```bash
# Git should detect renames automatically
git status

# If not, enable rename detection
git config diff.renames true

# Commit with rename detection
git add -A
git commit -m "Restructure: Move frontend files to frontend/ folder"
```

---

### **Issue: Import paths broken**

**Cause**: Relative import paths may have changed.

**Solution**: Update `vite.config.ts` and `tsconfig.json` to ensure alias paths are correct:

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),  // Still correct
    },
  },
})
```

No changes needed if all imports use `@/` prefix.

---

## 📊 **SUCCESS METRICS**

### **Immediate Success Indicators**

- [ ] ✅ Frontend folder created successfully
- [ ] ✅ All frontend files moved (0 files left in root)
- [ ] ✅ Backend folder unchanged
- [ ] ✅ No file conflicts or errors
- [ ] ✅ Git repository structure updated
- [ ] ✅ Dependencies intact or reinstalled

### **Next Steps Success**

After configuration (Day 1 afternoon):
- [ ] Frontend dev server starts: `cd frontend && npm run dev`
- [ ] Backend server starts: `cd backend && php artisan serve`
- [ ] API integration works
- [ ] Authentication flows work
- [ ] No console errors

---

## 🎯 **NEXT ACTIONS**

1. ✅ Complete this restructure guide
2. ➡️ Proceed to **`2-CONFIGURATION_SETUP.md`**
3. ⏭️ Configure environment variables
4. ⏭️ Test local development
5. ⏭️ Prepare for deployment

---

## 📞 **NEED HELP?**

- **Documentation**: See `5-TROUBLESHOOTING.md` for common issues
- **Rollback**: Restore from backup ZIP created in pre-requisites
- **Git Rollback**: `git checkout pre-restructure` tag

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-12-22  
**Next Document**: [2-CONFIGURATION_SETUP.md](./2-CONFIGURATION_SETUP.md)
