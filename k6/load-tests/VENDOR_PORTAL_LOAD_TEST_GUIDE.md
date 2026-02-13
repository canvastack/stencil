# Vendor Portal Load Test Guide

## Overview

Comprehensive load testing for the Vendor Portal API to ensure performance under high concurrent load.

## Test Scenarios

### Scenario 1: Concurrent Vendor Logins (100 users)
- **Duration**: 4 minutes
- **Max VUs**: 100
- **Target**: Test authentication system under concurrent login load
- **Stages**:
  - Warm up: 0 → 20 users (30s)
  - Ramp up: 20 → 100 users (1m)
  - Sustain: 100 users (2m)
  - Cool down: 100 → 0 users (30s)

### Scenario 2: Quote List Requests (500 users)
- **Duration**: 13 minutes
- **Max VUs**: 500
- **Target**: Test database query performance with high concurrent reads
- **Stages**:
  - Ramp up: 0 → 100 users (1m)
  - Increase: 100 → 300 users (2m)
  - Peak: 300 → 500 users (3m)
  - Sustain: 500 users (5m)
  - Cool down: 500 → 0 users (2m)

### Scenario 3: Mixed Operations (150 users)
- **Duration**: 17 minutes
- **Max VUs**: 150
- **Target**: Simulate realistic vendor portal usage
- **Operations**:
  - Dashboard visits (100%)
  - Quote detail views (100%)
  - Quote responses (20%)
  - Message checks (30%)
  - Send messages (10%)
  - File uploads (5%)
  - Profile views (15%)

## Prerequisites

### 1. Install k6

**Windows (Chocolatey):**
```bash
choco install k6
```

**Windows (winget):**
```bash
winget install k6
```

**Verify installation:**
```bash
k6 version
```

### 2. Prepare Test Data

**Create test vendors in database:**
```sql
-- Run this in your PostgreSQL database
INSERT INTO vendors (id, uuid, tenant_id, company_name, email, phone, status, 
                     portal_access_enabled, onboarding_status, onboarding_completed_at)
VALUES 
  (gen_random_uuid(), gen_random_uuid(), 'your-tenant-id', 'Test Vendor 1', 
   'vendor1@test.com', '+62123456789', 'active', true, 'completed', NOW()),
  (gen_random_uuid(), gen_random_uuid(), 'your-tenant-id', 'Test Vendor 2', 
   'vendor2@test.com', '+62123456790', 'active', true, 'completed', NOW()),
  (gen_random_uuid(), gen_random_uuid(), 'your-tenant-id', 'Test Vendor 3', 
   'vendor3@test.com', '+62123456791', 'active', true, 'completed', NOW()),
  (gen_random_uuid(), gen_random_uuid(), 'your-tenant-id', 'Test Vendor 4', 
   'vendor4@test.com', '+62123456792', 'active', true, 'completed', NOW'),
  (gen_random_uuid(), gen_random_uuid(), 'your-tenant-id', 'Test Vendor 5', 
   'vendor5@test.com', '+62123456793', 'active', true, 'completed', NOW());

-- Create user accounts for vendors
-- (Use your application's user creation logic with password: Vendor123!)
```

### 3. Seed Quote Data

For testing with 10,000+ quotes, run the database seeder:
```bash
cd backend
php artisan db:seed --class=VendorPortalLoadTestSeeder
```

## Running the Load Test

### Basic Run

```bash
k6 run k6/load-tests/vendor-portal-load-test.js
```

### With Environment Variables

```bash
k6 run \
  -e API_BASE_URL=http://localhost:8000 \
  -e TENANT_DOMAIN=localhost \
  k6/load-tests/vendor-portal-load-test.js
```

### Production Environment

```bash
k6 run \
  -e API_BASE_URL=https://api.yourdomain.com \
  -e TENANT_DOMAIN=yourdomain.com \
  k6/load-tests/vendor-portal-load-test.js
```

### Save Results

```bash
k6 run \
  -e API_BASE_URL=http://localhost:8000 \
  -e TENANT_DOMAIN=localhost \
  --out json=k6/results/vendor-portal-$(date +%Y%m%d-%H%M%S).json \
  k6/load-tests/vendor-portal-load-test.js
```

## Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Login Duration (p95) | < 1000ms | < 2000ms |
| Quote List (p95) | < 300ms | < 500ms |
| Quote Detail (p95) | < 200ms | < 400ms |
| Quote Response (p95) | < 500ms | < 1000ms |
| Messages (p95) | < 300ms | < 500ms |
| File Upload (p95) | < 2000ms | < 5000ms |
| Overall HTTP (p95) | < 500ms | < 1000ms |
| Error Rate | < 1% | < 5% |

## Understanding Results

### Key Metrics

**1. vendor_login_duration**
- Measures: Time to authenticate vendor and generate token
- Target: p95 < 1000ms
- Critical if: p95 > 2000ms

**2. quote_list_duration**
- Measures: Time to fetch paginated quote list
- Target: p95 < 300ms
- Critical if: p95 > 500ms

**3. quote_detail_duration**
- Measures: Time to fetch single quote details
- Target: p95 < 200ms
- Critical if: p95 > 400ms

**4. quote_response_duration**
- Measures: Time to accept/reject/counter quote
- Target: p95 < 500ms
- Critical if: p95 > 1000ms

**5. file_upload_duration**
- Measures: Time to upload file attachment
- Target: p95 < 2000ms
- Critical if: p95 > 5000ms

### Sample Output

```
scenarios: (100.00%) 3 scenarios, 500 max VUs, 27m30s max duration

     ✓ login - status is 200
     ✓ login - has token
     ✓ fetch quotes - status is 200
     ✓ fetch quotes - response time < 300ms

     checks.........................: 98.50% ✓ 125431  ✗ 1892
     data_received..................: 450 MB  280 kB/s
     data_sent......................: 85 MB   53 kB/s
     errors.........................: 0.75%  ✓ 952   ✗ 126371
     http_req_blocked...............: avg=1.45ms   p(95)=4.12ms
     http_req_connecting............: avg=1.28ms   p(95)=3.67ms
   ✓ http_req_duration..............: avg=185.67ms p(95)=445.32ms p(99)=876.54ms
     http_req_failed................: 0.45%  ✓ 571   ✗ 126752
     http_reqs......................: 127323  79.15/s
     login_attempts.................: 10234   6.36/s
     successful_logins..............: 10156   6.31/s
     failed_logins..................: 78      0.05/s
   ✓ vendor_login_duration..........: avg=678.45ms p(95)=945.32ms p(99)=1567.89ms
   ✓ quote_list_duration............: avg=145.23ms p(95)=267.45ms p(99)=423.12ms
   ✓ quote_detail_duration..........: avg=98.67ms  p(95)=178.34ms p(99)=289.56ms
   ✓ quote_response_duration........: avg=234.56ms p(95)=456.78ms p(99)=789.12ms
   ✓ messages_duration..............: avg=156.78ms p(95)=278.90ms p(99)=445.67ms
   ✓ file_upload_duration...........: avg=1234.56ms p(95)=1876.54ms p(99)=3456.78ms
     vus............................: 5      min=5   max=500
     vus_max........................: 500    min=500 max=500
```

## Monitoring During Tests

### Backend Monitoring

```bash
# Monitor Laravel logs
tail -f backend/storage/logs/laravel.log

# Monitor queue workers
php artisan queue:work --verbose

# Monitor database connections
psql -U postgres -d stencil_production -c "SELECT count(*) FROM pg_stat_activity;"
```

### System Monitoring

```bash
# CPU and Memory
htop

# Network
iftop

# Disk I/O
iotop
```

## Troubleshooting

### High Error Rate (> 5%)

**Possible causes:**
- Backend server overloaded
- Database connection pool exhausted
- Slow database queries
- Memory issues

**Solutions:**
1. Check backend logs for errors
2. Increase database connection pool
3. Optimize slow queries
4. Scale backend resources

### Slow Response Times

**Possible causes:**
- Missing database indexes
- N+1 query problems
- Unoptimized queries
- Network latency

**Solutions:**
1. Add database indexes
2. Use eager loading
3. Optimize queries with EXPLAIN
4. Use query caching

### Authentication Failures

**Possible causes:**
- Invalid test credentials
- Rate limiting triggered
- Session/token issues

**Solutions:**
1. Verify test vendor accounts exist
2. Check rate limit configuration
3. Verify Sanctum token generation

## Database Performance Testing

### Testing with 10,000+ Quotes

The load test automatically tests database performance with large datasets:

1. **Quote List Pagination**: Tests fetching quotes with 10,000+ records
2. **Filtering**: Tests status and search filters on large datasets
3. **Sorting**: Tests ordering by various fields
4. **Statistics**: Tests aggregate queries (count, sum, avg)

### Expected Performance

With proper indexes:
- Quote list (20 items): < 100ms
- Filtered quote list: < 150ms
- Search queries: < 200ms
- Statistics queries: < 300ms

## Best Practices

### Before Running

- ✅ Ensure backend is running and healthy
- ✅ Verify database has test data
- ✅ Check database indexes are created
- ✅ Monitor server resources (CPU, memory, disk)
- ✅ Clear Laravel cache: `php artisan cache:clear`

### During Tests

- ✅ Monitor backend logs for errors
- ✅ Watch database connections
- ✅ Check API response times
- ✅ Monitor server resource usage
- ✅ Use separate monitoring tools (Grafana, New Relic)

### After Tests

- ✅ Analyze results for bottlenecks
- ✅ Review error logs
- ✅ Check database query performance
- ✅ Identify slow endpoints
- ✅ Document findings and optimizations

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Vendor Portal Load Testing

on:
  schedule:
    - cron: '0 2 * * 1'  # Run weekly on Monday at 2 AM
  workflow_dispatch:      # Allow manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      
      - name: Run vendor portal load tests
        run: |
          k6 run \
            -e API_BASE_URL=${{ secrets.API_BASE_URL }} \
            -e TENANT_DOMAIN=${{ secrets.TENANT_DOMAIN }} \
            k6/load-tests/vendor-portal-load-test.js
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: k6/results/
```

## Advanced Features

### Cloud Testing (k6 Cloud)

```bash
k6 cloud k6/load-tests/vendor-portal-load-test.js
```

Benefits:
- Distributed load from multiple locations
- Real-time metrics dashboard
- Result comparison
- Team collaboration

### InfluxDB + Grafana Integration

```bash
k6 run \
  --out influxdb=http://localhost:8086/k6 \
  k6/load-tests/vendor-portal-load-test.js
```

Setup Grafana dashboard for real-time visualization.

## Results Interpretation

### Green (Healthy)
- Error rate < 1%
- All p95 metrics within targets
- No failed requests
- Stable response times

### Yellow (Warning)
- Error rate 1-5%
- Some p95 metrics slightly above targets
- Occasional failed requests
- Response time variance

### Red (Critical)
- Error rate > 5%
- Multiple p95 metrics above critical thresholds
- Frequent failed requests
- Unstable response times

## Support

For issues or questions:
- Check backend logs: `backend/storage/logs/laravel.log`
- Review k6 documentation: https://k6.io/docs/
- Contact development team

---

**Last Updated:** February 11, 2026  
**Maintainer:** AI Development Team  
**Status:** ✅ Ready for use
