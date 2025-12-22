# K6 Load Testing

Comprehensive load testing suite untuk CanvaStencil API menggunakan Grafana k6.

## 📋 Prerequisites

### Install k6

**Windows (via Chocolatey):**
```bash
choco install k6
```

**Windows (via winget):**
```bash
winget install k6
```

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Verify Installation

```bash
k6 version
```

---

## 🚀 Running Load Tests

### 1. Product Catalog Load Test

**Basic run:**
```bash
k6 run k6/load-tests/product-catalog-load-test.js
```

**With environment variables:**
```bash
k6 run \
  -e API_BASE_URL=http://localhost:8000 \
  -e AUTH_TOKEN=your-auth-token \
  -e TENANT_ID=your-tenant-uuid \
  k6/load-tests/product-catalog-load-test.js
```

**With custom thresholds:**
```bash
k6 run \
  --vus 100 \
  --duration 10m \
  k6/load-tests/product-catalog-load-test.js
```

**Save results to JSON:**
```bash
k6 run \
  --out json=results/product-catalog-$(date +%Y%m%d-%H%M%S).json \
  k6/load-tests/product-catalog-load-test.js
```

---

## 📊 Test Scenarios

### Product Catalog Load Test

**Duration:** ~19 minutes  
**Max VUs:** 200  
**Stages:**

1. **Warm-up** (30s): 0 → 10 users
2. **Normal Load** (7min): 10 → 50 users → sustained
3. **Peak Load** (7min): 50 → 100 users → sustained
4. **Spike Test** (3min): 100 → 200 users → sustained
5. **Cool Down** (2min): 200 → 0 users

**Operations Tested:**
- ✅ Fetch products list (100% of users)
- ✅ Search products (100% of users)
- ✅ Filter products (100% of users)
- ✅ Get product details (30% of users)
- ✅ Create product (5% of users)
- ✅ Update product (3% of users)

**Performance Targets:**
- Request Duration (p95): < 500ms
- Product Fetch (p95): < 200ms
- Product Create (p95): < 1000ms
- Error Rate: < 1%
- HTTP Failure Rate: < 1%

---

## 📈 Understanding Results

### Key Metrics

**1. http_req_duration**
- Target: p95 < 500ms
- Measures: Total request duration including DNS lookup, connection, TLS handshake, sending, waiting, receiving

**2. http_req_failed**
- Target: < 1%
- Measures: Percentage of failed HTTP requests

**3. errors**
- Target: < 1%
- Measures: Custom error rate from failed checks

**4. product_fetch_duration**
- Target: p95 < 200ms
- Measures: Time to fetch product list

**5. product_create_duration**
- Target: p95 < 1000ms
- Measures: Time to create a new product

### Sample Output

```
scenarios: (100.00%) 1 scenario, 200 max VUs, 19m30s max duration

     ✓ fetch products - status is 200
     ✓ fetch products - response time < 200ms
     ✓ fetch products - has data array
     ✓ fetch products - has pagination

     checks.........................: 98.75% ✓ 45231  ✗ 573
     data_received..................: 125 MB  110 kB/s
     data_sent......................: 15 MB   13 kB/s
     errors.........................: 0.42%  ✓ 192   ✗ 45612
     http_req_blocked...............: avg=1.25ms   p(95)=3.47ms
     http_req_connecting............: avg=1.12ms   p(95)=3.12ms
   ✓ http_req_duration..............: avg=145.32ms p(95)=435.21ms
     http_req_failed................: 0.28%  ✓ 128   ✗ 45676
     http_reqs......................: 45804  40.35/s
     product_create_duration........: avg=678.45ms p(95)=945.32ms
   ✓ product_fetch_duration.........: avg=125.67ms p(95)=189.43ms
     vus............................: 3      min=3   max=200
     vus_max........................: 200    min=200 max=200
```

### Status Indicators

| Indicator | Meaning |
|-----------|---------|
| ✓ | Check passed (threshold met) |
| ✗ | Check failed (threshold not met) |
| % | Percentage of success/failure |

---

## 🎯 Best Practices

### 1. Before Running Tests

- ✅ Ensure backend is running and healthy
- ✅ Have valid authentication token
- ✅ Know your tenant UUID
- ✅ Verify database has seed data
- ✅ Monitor server resources (CPU, memory)

### 2. During Tests

- ✅ Monitor server logs for errors
- ✅ Watch database connections
- ✅ Check API response times
- ✅ Monitor server resource usage
- ✅ Use k6 Cloud for distributed testing (optional)

### 3. After Tests

- ✅ Analyze results for bottlenecks
- ✅ Check error logs
- ✅ Review database query performance
- ✅ Identify slow endpoints
- ✅ Document findings

---

## 🔧 Customizing Tests

### Modify Load Pattern

Edit the `stages` in test file:

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 20 },  // Ramp up to 20 users in 1min
    { duration: '3m', target: 20 },  // Stay at 20 users for 3min
    { duration: '1m', target: 0 },   // Ramp down to 0 users
  ],
};
```

### Add Custom Metrics

```javascript
import { Trend } from 'k6/metrics';

const myMetric = new Trend('my_custom_metric');

export default function() {
  const start = Date.now();
  // ... your code ...
  myMetric.add(Date.now() - start);
}
```

### Change Thresholds

```javascript
export const options = {
  thresholds: {
    http_req_duration: ['p(95)<300'],  // Stricter: 300ms instead of 500ms
    errors: ['rate<0.005'],             // Stricter: 0.5% instead of 1%
  },
};
```

---

## 📊 Advanced Features

### 1. Cloud Testing (k6 Cloud)

```bash
k6 cloud k6/load-tests/product-catalog-load-test.js
```

**Benefits:**
- Distributed load from multiple locations
- Real-time metrics dashboard
- Result comparison
- Team collaboration

### 2. InfluxDB + Grafana Integration

**Send metrics to InfluxDB:**
```bash
k6 run \
  --out influxdb=http://localhost:8086/k6 \
  k6/load-tests/product-catalog-load-test.js
```

**Setup Grafana dashboard** untuk visualize metrics in real-time.

### 3. CI/CD Integration

**GitHub Actions example:**

```yaml
name: Load Testing

on:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM

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
      
      - name: Run load tests
        run: |
          k6 run \
            -e API_BASE_URL=${{ secrets.API_BASE_URL }} \
            -e AUTH_TOKEN=${{ secrets.AUTH_TOKEN }} \
            -e TENANT_ID=${{ secrets.TENANT_ID }} \
            k6/load-tests/product-catalog-load-test.js
```

---

## 🐛 Troubleshooting

### Issue: "dial tcp: lookup failed"

**Solution:** Verify API_BASE_URL is correct and backend is running.

```bash
curl http://localhost:8000/api/health
```

### Issue: "401 Unauthorized"

**Solution:** Get a fresh auth token.

```bash
# Login to get token
curl -X POST http://localhost:8000/api/v1/tenant/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@etchinx.com",
    "password": "DemoAdmin2024!"
  }'
```

### Issue: High error rate

**Possible causes:**
- Backend overloaded
- Database connection pool exhausted
- Slow database queries
- Memory issues

**Solution:** Review backend logs and database performance.

---

## 📚 Additional Resources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- [Performance Testing Best Practices](https://k6.io/docs/testing-guides/best-practices/)
- [Grafana k6 Cloud](https://k6.io/cloud/)

---

**Last Updated:** December 22, 2025  
**Maintainer:** AI Development Team  
**Status:** ✅ Ready for use
