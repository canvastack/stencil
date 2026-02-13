# Vendor Portal Load Test - Quick Start

## 🚀 Quick Start (5 minutes)

### Step 1: Install k6
```bash
# Windows (Chocolatey)
choco install k6

# Windows (winget)
winget install k6

# Verify
k6 version
```

### Step 2: Seed Test Data
```bash
cd backend
php artisan db:seed --class=VendorPortalLoadTestSeeder
```

This creates:
- 5 test vendors (vendor1@test.com - vendor5@test.com)
- Password: `Vendor123!`
- 10,000+ quotes
- 1,000+ messages

### Step 3: Run Load Test
```bash
cd ..
k6 run k6/load-tests/vendor-portal-load-test.js
```

### Step 4: View Results
- Console: Real-time metrics
- HTML Report: `k6/results/vendor-portal-{timestamp}.html`
- JSON Report: `k6/results/vendor-portal-{timestamp}.json`

---

## 📊 What Gets Tested

### Scenario 1: 100 Concurrent Logins (4 min)
- Tests authentication system
- Validates token generation
- Checks rate limiting

### Scenario 2: 500 Concurrent Quote Requests (13 min)
- Tests database performance
- Validates pagination
- Checks filtering and search

### Scenario 3: 150 Mixed Operations (17 min)
- Dashboard visits
- Quote details
- Quote responses
- Messages
- File uploads
- Profile views

**Total Duration:** ~27 minutes

---

## 🎯 Performance Targets

| Operation | Target (p95) |
|-----------|--------------|
| Login | < 1000ms |
| Quote List | < 300ms |
| Quote Detail | < 200ms |
| Quote Response | < 500ms |
| Messages | < 300ms |
| File Upload | < 2000ms |
| Error Rate | < 1% |

---

## 🔧 Custom Run

### With Environment Variables
```bash
k6 run \
  -e API_BASE_URL=http://localhost:8000 \
  -e TENANT_DOMAIN=localhost \
  k6/load-tests/vendor-portal-load-test.js
```

### Save Results
```bash
k6 run \
  --out json=k6/results/my-test.json \
  k6/load-tests/vendor-portal-load-test.js
```

### Production Environment
```bash
k6 run \
  -e API_BASE_URL=https://api.yourdomain.com \
  -e TENANT_DOMAIN=yourdomain.com \
  k6/load-tests/vendor-portal-load-test.js
```

---

## 📈 Understanding Results

### ✅ Green (Healthy)
- Error rate < 1%
- All metrics within targets
- No failed requests

### ⚠️ Yellow (Warning)
- Error rate 1-5%
- Some metrics above targets
- Occasional failures

### ❌ Red (Critical)
- Error rate > 5%
- Multiple metrics failing
- Frequent failures

---

## 🐛 Troubleshooting

### High Error Rate
1. Check backend logs: `tail -f backend/storage/logs/laravel.log`
2. Check database connections
3. Verify test data exists

### Slow Response Times
1. Check database indexes
2. Review slow query log
3. Monitor server resources

### Authentication Failures
1. Verify test vendors exist
2. Check password: `Vendor123!`
3. Verify Sanctum configuration

---

## 📚 Full Documentation

For detailed information, see:
- `VENDOR_PORTAL_LOAD_TEST_GUIDE.md` - Complete guide
- `vendor-portal-load-test.js` - Test script with comments

---

## 💡 Tips

1. **Before Testing:**
   - Ensure backend is running
   - Clear Laravel cache: `php artisan cache:clear`
   - Monitor server resources

2. **During Testing:**
   - Watch backend logs
   - Monitor database connections
   - Check server CPU/memory

3. **After Testing:**
   - Review HTML report
   - Identify bottlenecks
   - Document findings

---

## 🎓 Test Credentials

**Vendors:**
- vendor1@test.com / Vendor123!
- vendor2@test.com / Vendor123!
- vendor3@test.com / Vendor123!
- vendor4@test.com / Vendor123!
- vendor5@test.com / Vendor123!

---

**Need Help?** Check `VENDOR_PORTAL_LOAD_TEST_GUIDE.md` for detailed documentation.
