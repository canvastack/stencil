/**
 * Product Catalog Load Test
 * Tests API performance under various load conditions
 * 
 * Run: k6 run k6/load-tests/product-catalog-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const productFetchDuration = new Trend('product_fetch_duration');
const productCreateDuration = new Trend('product_create_duration');

// Test configuration
export const options = {
  stages: [
    // Warm-up
    { duration: '30s', target: 10 },  // Ramp up to 10 users in 30s
    
    // Normal load
    { duration: '2m', target: 50 },   // Ramp up to 50 users in 2min
    { duration: '5m', target: 50 },   // Stay at 50 users for 5min
    
    // Peak load
    { duration: '2m', target: 100 },  // Ramp up to 100 users in 2min
    { duration: '5m', target: 100 },  // Stay at 100 users for 5min
    
    // Spike test
    { duration: '1m', target: 200 },  // Spike to 200 users in 1min
    { duration: '2m', target: 200 },  // Stay at 200 users for 2min
    
    // Cool down
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  
  thresholds: {
    // HTTP request duration (95% of requests must complete below 500ms)
    http_req_duration: ['p(95)<500'],
    
    // Error rate must be below 1%
    errors: ['rate<0.01'],
    
    // Product fetch must be fast
    product_fetch_duration: ['p(95)<200'],
    
    // Product create can be slower but reasonable
    product_create_duration: ['p(95)<1000'],
    
    // HTTP request failure rate
    http_req_failed: ['rate<0.01'],
  },
};

// Base configuration
const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
const TENANT_ID = __ENV.TENANT_ID || '';

// Test data
const testProduct = {
  name: `Load Test Product ${Date.now()}`,
  sku: `LOAD-${Date.now()}`,
  description: 'Product created during load testing',
  price: 150000,
  currency: 'IDR',
  stock_quantity: 100,
  status: 'published',
  tenant_id: TENANT_ID,
};

/**
 * Setup function - runs once before all VUs
 */
export function setup() {
  console.log('🚀 Starting Product Catalog Load Test');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`👥 Max VUs: 200`);
  console.log(`⏱️  Total Duration: ~19 minutes`);
  
  return {
    baseUrl: BASE_URL,
    authToken: AUTH_TOKEN,
    tenantId: TENANT_ID,
  };
}

/**
 * Main test function - runs for each VU
 */
export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.authToken}`,
    'X-Tenant-ID': data.tenantId,
    'Accept': 'application/json',
  };

  // Test 1: Fetch products list (most common operation)
  testFetchProducts(data.baseUrl, headers);
  
  sleep(1); // Wait 1 second between requests
  
  // Test 2: Search products
  testSearchProducts(data.baseUrl, headers);
  
  sleep(1);
  
  // Test 3: Filter products
  testFilterProducts(data.baseUrl, headers);
  
  sleep(1);
  
  // Test 4: Get product details (randomly)
  if (Math.random() < 0.3) { // 30% of users
    testGetProductDetails(data.baseUrl, headers);
    sleep(1);
  }
  
  // Test 5: Create product (rarely)
  if (Math.random() < 0.05) { // 5% of users
    testCreateProduct(data.baseUrl, headers);
    sleep(2);
  }
  
  // Test 6: Update product (rarely)
  if (Math.random() < 0.03) { // 3% of users
    testUpdateProduct(data.baseUrl, headers);
    sleep(1);
  }
}

/**
 * Test: Fetch products list
 */
function testFetchProducts(baseUrl, headers) {
  const startTime = Date.now();
  
  const response = http.get(`${baseUrl}/api/v1/tenant/products?page=1&per_page=20`, {
    headers,
    tags: { name: 'FetchProducts' },
  });
  
  const duration = Date.now() - startTime;
  productFetchDuration.add(duration);
  
  const success = check(response, {
    'fetch products - status is 200': (r) => r.status === 200,
    'fetch products - response time < 200ms': (r) => r.timings.duration < 200,
    'fetch products - has data array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data);
      } catch (e) {
        return false;
      }
    },
    'fetch products - has pagination': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.current_page !== undefined && body.total !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  errorRate.add(!success);
}

/**
 * Test: Search products
 */
function testSearchProducts(baseUrl, headers) {
  const searchTerms = ['brass', 'pine', 'plate', 'stand', 'etching'];
  const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  const response = http.get(
    `${baseUrl}/api/v1/tenant/products?page=1&per_page=20&search=${randomTerm}`,
    {
      headers,
      tags: { name: 'SearchProducts' },
    }
  );
  
  const success = check(response, {
    'search products - status is 200': (r) => r.status === 200,
    'search products - response time < 300ms': (r) => r.timings.duration < 300,
    'search products - has data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  errorRate.add(!success);
}

/**
 * Test: Filter products
 */
function testFilterProducts(baseUrl, headers) {
  const statuses = ['published', 'draft'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  const response = http.get(
    `${baseUrl}/api/v1/tenant/products?page=1&per_page=20&status=${randomStatus}`,
    {
      headers,
      tags: { name: 'FilterProducts' },
    }
  );
  
  const success = check(response, {
    'filter products - status is 200': (r) => r.status === 200,
    'filter products - response time < 250ms': (r) => r.timings.duration < 250,
  });
  
  errorRate.add(!success);
}

/**
 * Test: Get product details
 */
function testGetProductDetails(baseUrl, headers) {
  // In real scenario, we would get a real product UUID
  // For now, we'll just test the endpoint response
  const response = http.get(`${baseUrl}/api/v1/tenant/products/test-uuid`, {
    headers,
    tags: { name: 'GetProductDetails' },
  });
  
  // Accept both 200 (found) and 404 (not found) as valid responses
  const success = check(response, {
    'get product - valid response': (r) => r.status === 200 || r.status === 404,
    'get product - response time < 150ms': (r) => r.timings.duration < 150,
  });
  
  errorRate.add(!success);
}

/**
 * Test: Create product
 */
function testCreateProduct(baseUrl, headers) {
  const startTime = Date.now();
  
  const payload = {
    ...testProduct,
    name: `Load Test Product ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sku: `LOAD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
  };
  
  const response = http.post(`${baseUrl}/api/v1/tenant/products`, JSON.stringify(payload), {
    headers,
    tags: { name: 'CreateProduct' },
  });
  
  const duration = Date.now() - startTime;
  productCreateDuration.add(duration);
  
  const success = check(response, {
    'create product - status is 201': (r) => r.status === 201,
    'create product - response time < 1000ms': (r) => r.timings.duration < 1000,
    'create product - has UUID': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.uuid !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  errorRate.add(!success);
}

/**
 * Test: Update product
 */
function testUpdateProduct(baseUrl, headers) {
  const payload = {
    price: 175000,
    stock_quantity: 75,
  };
  
  const response = http.patch(
    `${baseUrl}/api/v1/tenant/products/test-uuid`,
    JSON.stringify(payload),
    {
      headers,
      tags: { name: 'UpdateProduct' },
    }
  );
  
  // Accept both 200 (updated) and 404 (not found) as valid responses
  const success = check(response, {
    'update product - valid response': (r) => r.status === 200 || r.status === 404,
    'update product - response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
}

/**
 * Teardown function - runs once after all VUs
 */
export function teardown(data) {
  console.log('✅ Product Catalog Load Test Completed');
  console.log('📊 Check the summary for detailed metrics');
}

/**
 * Handle summary - custom summary output
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'summary.json': JSON.stringify(data),
    'summary.html': htmlReport(data),
  };
}

// Helper function for text summary
function textSummary(data, options) {
  let summary = '\n';
  summary += '═══════════════════════════════════════════════════════════\n';
  summary += '  Product Catalog Load Test - Summary Report\n';
  summary += '═══════════════════════════════════════════════════════════\n\n';
  
  summary += `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `Failed Requests: ${data.metrics.http_req_failed.values.passes}\n`;
  summary += `Error Rate: ${(data.metrics.errors.values.rate * 100).toFixed(2)}%\n\n`;
  
  summary += `Request Duration (p95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `Product Fetch (p95): ${data.metrics.product_fetch_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `Product Create (p95): ${data.metrics.product_create_duration.values['p(95)'].toFixed(2)}ms\n\n`;
  
  summary += `Virtual Users (max): ${data.metrics.vus_max.values.max}\n`;
  summary += `Test Duration: ${data.state.testRunDurationMs / 1000}s\n\n`;
  
  return summary;
}

// Helper function for HTML report
function htmlReport(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>k6 Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .success { color: green; }
    .warning { color: orange; }
    .error { color: red; }
  </style>
</head>
<body>
  <h1>Product Catalog Load Test Report</h1>
  <p><strong>Test Date:</strong> ${new Date().toISOString()}</p>
  
  <h2>Summary Metrics</h2>
  <table>
    <tr><th>Metric</th><th>Value</th><th>Status</th></tr>
    <tr>
      <td>Total Requests</td>
      <td>${data.metrics.http_reqs.values.count}</td>
      <td class="success">✓</td>
    </tr>
    <tr>
      <td>Error Rate</td>
      <td>${(data.metrics.errors.values.rate * 100).toFixed(2)}%</td>
      <td class="${data.metrics.errors.values.rate < 0.01 ? 'success' : 'error'}">
        ${data.metrics.errors.values.rate < 0.01 ? '✓' : '✗'}
      </td>
    </tr>
    <tr>
      <td>Request Duration (p95)</td>
      <td>${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms</td>
      <td class="${data.metrics.http_req_duration.values['p(95)'] < 500 ? 'success' : 'error'}">
        ${data.metrics.http_req_duration.values['p(95)'] < 500 ? '✓' : '✗'}
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
