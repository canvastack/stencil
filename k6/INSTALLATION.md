# k6 Installation Guide for Windows

## Prerequisites

You need to install k6 before running the load tests.

## Installation Methods

### Method 1: Using Chocolatey (Recommended)

If you have Chocolatey installed:

```powershell
choco install k6
```

### Method 2: Using winget

If you have winget (Windows Package Manager):

```powershell
winget install k6
```

### Method 3: Manual Installation

1. Download k6 from: https://github.com/grafana/k6/releases
2. Download the Windows executable (k6-v0.xx.x-windows-amd64.zip)
3. Extract the ZIP file
4. Add the k6.exe location to your PATH environment variable

## Verify Installation

After installation, verify k6 is working:

```powershell
k6 version
```

You should see output like:
```
k6 v0.48.0 (go1.21.4, windows/amd64)
```

## Next Steps

Once k6 is installed, you can:

1. **Seed test data:**
   ```bash
   cd backend
   php artisan db:seed --class=VendorPortalLoadTestSeeder
   ```

2. **Run the load test:**
   ```bash
   cd ..
   k6 run k6/load-tests/vendor-portal-load-test.js
   ```

3. **Or use the batch file:**
   ```bash
   k6\run-load-test.bat
   ```

## Troubleshooting

### "k6 is not recognized"

This means k6 is not in your PATH. Solutions:

1. **Restart your terminal** after installation
2. **Add k6 to PATH manually:**
   - Open System Properties → Environment Variables
   - Add the k6 installation directory to PATH
   - Restart terminal

### Installation Fails

1. **Run as Administrator** - Some installations require admin rights
2. **Check internet connection** - Package managers need internet access
3. **Try alternative method** - If one method fails, try another

## Support

For more help:
- k6 Documentation: https://k6.io/docs/
- k6 Installation Guide: https://k6.io/docs/get-started/installation/

---

**After installation, see `QUICK_START.md` for running the load test.**
