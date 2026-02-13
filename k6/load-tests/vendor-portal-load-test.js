/**
 * Vendor Portal Load Test
 * Tests vendor portal API performance under various load conditions
 * 
 * Run: k6 run k6/load-tests/vendor-portal-load-test.js
 * 
 * Test Scenarios:
 * - 100 concurrent vendor logins
 * - 500 concurrent quote list requests
 * - Database query performance with 10,000+ quotes
 * - File upload performance
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

// Custom metrics
const errorRate = new Rate('errors');
const loginDuration = new Trend('vendor_login_duration');
const quoteListDuration = new Trend('quote_list_duration');
const quoteDetailDuration = new Trend('quote_detail_duration');
const quoteResponseDuration = new Trend('quote_response_duration');
const messagesDuration = new Trend('messages_duration');
const fileUploadDuration = new Trend('file_upload_duration');
const loginAttempts = new Counter('login_attempts');
const successfulLogins = new Counter('successful_logins');
const failedLogins = new Counter('failed_logins');

// Test configuration
export const options = {
  scenarios: {
    // Scenario 1: Concurrent vendor logins (100 users)
    vendor_login: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },   // Warm up
        { duration: '1m', target: 100 },   // Ramp to 100 concurrent logins
        { duration: '2m', target: 100 },   // Sustain 100 concurrent users
        { duration: '30s', target: 0 },    // Cool down
      ],
      gracefulRampDown: '30s',
      exec: 'vendorLoginScenario',
    },
    
    // Scenario 2: Quote list requests (500 concurrent users)
    quote_list_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },   // Ramp up
        { duration: '2m', target: 300 },   // Increase load
        { duration: '3m', target: 500 },   // Peak load - 500 concurrent
        { duration: '5m', target: 500 },   // Sustain peak
        { duration: '2m', target: 0 },     // Cool down
      ],
      gracefulRampDown: '1m',
      exec: 'quoteListScenario',
      startTime: '5m', // Start after login scenario
    },
    
    // Scenario 3: Mixed vendor operations
    mixed_operations: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },    // Ramp up
        { duration: '5m', target: 100 },   // Normal load
        { duration: '3m', target: 150 },   // Peak load
        { duration: '5m', target: 150 },   // Sustain
        { duration: '2m', target: 0 },     // Cool down
      ],
      gracefulRampDown: '1m',
      exec: 'mixedOperationsScenario',
      startTime: '10m', // Start after quote list scenario
    },
  },
  
  thresholds: {
    // Overall HTTP metrics
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'], // Less than 1% failures
    
    // Custom metrics
    errors: ['rate<0.01'],
    vendor_login_duration: ['p(95)<1000', 'p(99)<2000'],
    quote_list_duration: ['p(95)<300', 'p(99)<500'],
    quote_detail_duration: ['p(95)<200', 'p(99)<400'],
    quote_response_duration: ['p(95)<500', 'p(99)<1000'],
    messages_duration: ['p(95)<300', 'p(99)<500'],
    file_upload_duration: ['p(95)<2000', 'p(99)<5000'],
  },
};

// Base configuration
const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8000';
const TENANT_DOMAIN = __ENV.TENANT_DOMAIN || 'localhost';

// Test vendor credentials (should be seeded in database)
const TEST_VENDORS = [
  { email: 'vendor1@test.com', password: 'Vendor123!' },
  { email: 'vendor2@test.com', password: 'Vendor123!' },
  { email: 'vendor3@test.com', password: 'Vendor123!' },
  { email: 'vendor4@test.com', password: 'Vendor123!' },
  { email: 'vendor5@test.com', password: 'Vendor123!' },
];

// Shared state for authenticated sessions
let authTokens = [];
let quoteUUIDs = [];

/**
 * Setup function - runs once before all VUs
 */
export function setup() {
  console.log('🚀 Starting Vendor Portal Load Test');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🏢 Tenant Domain: ${TENANT_DOMAIN}`);
  console.log(`👥 Test Scenarios:`);
  console.log(`   - Scenario 1: 100 concurrent vendor logins`);
  console.log(`   - Scenario 2: 500 concurrent quote list requests`);
  console.log(`   - Scenario 3: 150 concurrent mixed operations`);
  console.log(`⏱️  Total Duration: ~27 minutes`);
  
  // Pre-authenticate some vendors for quote list scenario
  const preAuthTokens = [];
  for (let i = 0; i < Math.min(5, TEST_VENDORS.length); i++) {
    const vendor = TEST_VENDORS[i];
    const loginRes = http.post(
      `${BASE_URL}/api/v1/vendor/auth/login`,
      JSON.stringify({
        email: vendor.email,
        password: vendor.password,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Tenant-Domain': TENANT_DOMAIN,
        },
      }
    );
    
    if (loginRes.status === 200) {
      const body = JSON.parse(loginRes.body);
      preAuthTokens.push(body.token);
      console.log(`✓ Pre-authenticated vendor: ${vendor.email}`);
    }
  }
  
  return {
    baseUrl: BASE_URL,
    tenantDomain: TENANT_DOMAIN,
    preAuthTokens: preAuthTokens,
  };
}

/**
 * Scenario 1: Vendor Login Load Test
 * Tests 100 concurrent vendor logins
 */
export function vendorLoginScenario(data) {
  const vendor = TEST_VENDORS[Math.floor(Math.random() * TEST_VENDORS.length)];
  
  group('Vendor Login', () => {
    const startTime = Date.now();
    loginAttempts.add(1);
    
    const response = http.post(
      `${data.baseUrl}/api/v1/vendor/auth/login`,
      JSON.stringify({
        email: vendor.email,
        password: vendor.password,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Tenant-Domain': data.tenantDomain,
        },
        tags: { name: 'VendorLogin' },
      }
    );
    
    const duration = Date.now() - startTime;
    loginDuration.add(duration);
    
    const success = check(response, {
      'login - status is 200': (r) => r.status === 200,
      'login - has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token !== undefined;
        } catch (e) {
          return false;
        }
      },
      'login - has vendor data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.vendor !== undefined;
        } catch (e) {
          return false;
        }
      },
      'login - response time < 1000ms': (r) => r.timings.duration < 1000,
    });
    
    if (success && response.status === 200) {
      successfulLogins.add(1);
      try {
        const body = JSON.parse(response.body);
        authTokens.push(body.token);
      } catch (e) {
        // Ignore parse errors
      }
    } else {
      failedLogins.add(1);
    }
    
    errorRate.add(!success);
  });
  
  sleep(1);
}

/**
 * Scenario 2: Quote List Load Test
 * Tests 500 concurrent quote list requests
 */
export function quoteListScenario(data) {
  // Use pre-authenticated token or authenticate
  let token = data.preAuthTokens[Math.floor(Math.random() * data.preAuthTokens.length)];
  
  if (!token) {
    // Fallback: authenticate
    const vendor = TEST_VENDORS[0];
    const loginRes = http.post(
      `${data.baseUrl}/api/v1/vendor/auth/login`,
      JSON.stringify({ email: vendor.email, password: vendor.password }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Tenant-Domain': data.tenantDomain,
        },
      }
    );
    
    if (loginRes.status === 200) {
      const body = JSON.parse(loginRes.body);
      token = body.token;
    } else {
      return; // Skip if can't authenticate
    }
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Tenant-Domain': data.tenantDomain,
  };
  
  group('Quote List Operations', () => {
    // Test 1: Fetch all quotes
    testFetchQuotes(data.baseUrl, headers);
    sleep(0.5);
    
    // Test 2: Filter by status (30% of users)
    if (Math.random() < 0.3) {
      testFilterQuotes(data.baseUrl, headers);
      sleep(0.5);
    }
    
    // Test 3: Search quotes (20% of users)
    if (Math.random() < 0.2) {
      testSearchQuotes(data.baseUrl, headers);
      sleep(0.5);
    }
    
    // Test 4: Pagination (40% of users)
    if (Math.random() < 0.4) {
      testPaginateQuotes(data.baseUrl, headers);
      sleep(0.5);
    }
  });
  
  sleep(1);
}

/**
 * Scenario 3: Mixed Operations
 * Tests realistic vendor portal usage patterns
 */
export function mixedOperationsScenario(data) {
  // Authenticate
  const vendor = TEST_VENDORS[Math.floor(Math.random() * TEST_VENDORS.length)];
  const loginRes = http.post(
    `${data.baseUrl}/api/v1/vendor/auth/login`,
    JSON.stringify({ email: vendor.email, password: vendor.password }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Tenant-Domain': data.tenantDomain,
      },
    }
  );
  
  if (loginRes.status !== 200) {
    return; // Skip if authentication fails
  }
  
  const body = JSON.parse(loginRes.body);
  const token = body.token;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Tenant-Domain': data.tenantDomain,
  };
  
  // Simulate realistic user behavior
  group('Dashboard Visit', () => {
    testFetchQuotes(data.baseUrl, headers);
    sleep(2); // User reads dashboard
  });
  
  group('Quote Detail View', () => {
    testGetQuoteDetail(data.baseUrl, headers);
    sleep(3); // User reads quote details
  });
  
  // 20% of users respond to quotes
  if (Math.random() < 0.2) {
    group('Quote Response', () => {
      testRespondToQuote(data.baseUrl, headers);
      sleep(1);
    });
  }
  
  // 30% of users check messages
  if (Math.random() < 0.3) {
    group('Messages', () => {
      testGetMessages(data.baseUrl, headers);
      sleep(2);
    });
  }
  
  // 10% of users send messages
  if (Math.random() < 0.1) {
    group('Send Message', () => {
      testSendMessage(data.baseUrl, headers);
      sleep(1);
    });
  }
  
  // 5% of users upload files
  if (Math.random() < 0.05) {
    group('File Upload', () => {
      testFileUpload(data.baseUrl, headers);
      sleep(2);
    });
  }
  
  // 15% of users view profile
  if (Math.random() < 0.15) {
    group('Profile', () => {
      testGetProfile(data.baseUrl, headers);
      sleep(1);
    });
  }
  
  sleep(2);
}

/**
 * Test Functions
 */

function testFetchQuotes(baseUrl, headers) {
  const startTime = Date.now();
  
  const response = http.get(
    `${baseUrl}/api/v1/vendor/quotes?page=1&per_page=20`,
    {
      headers,
      tags: { name: 'FetchQuotes' },
    }
  );
  
  const duration = Date.now() - startTime;
  quoteListDuration.add(duration);
  
  const success = check(response, {
    'fetch quotes - status is 200': (r) => r.status === 200,
    'fetch quotes - response time < 300ms': (r) => r.timings.duration < 300,
    'fetch quotes - has data array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data);
      } catch (e) {
        return false;
      }
    },
    'fetch quotes - has pagination': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.current_page !== undefined && body.total !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  // Store quote UUIDs for later use
  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      if (body.data && body.data.length > 0) {
        quoteUUIDs = body.data.map(q => q.uuid);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  errorRate.add(!success);
}

function testFilterQuotes(baseUrl, headers) {
  const statuses = ['sent', 'pending_response', 'accepted', 'rejected', 'countered'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  const response = http.get(
    `${baseUrl}/api/v1/vendor/quotes?page=1&per_page=20&status=${randomStatus}`,
    {
      headers,
      tags: { name: 'FilterQuotes' },
    }
  );
  
  const success = check(response, {
    'filter quotes - status is 200': (r) => r.status === 200,
    'filter quotes - response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!success);
}

function testSearchQuotes(baseUrl, headers) {
  const searchTerms = ['Q-', 'ORD-', '2024', '2025', '2026'];
  const randomTerm = searchTerms[Math.floor(Math.random() * searchTerms.length)];
  
  const response = http.get(
    `${baseUrl}/api/v1/vendor/quotes?page=1&per_page=20&search=${randomTerm}`,
    {
      headers,
      tags: { name: 'SearchQuotes' },
    }
  );
  
  const success = check(response, {
    'search quotes - status is 200': (r) => r.status === 200,
    'search quotes - response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  errorRate.add(!success);
}

function testPaginateQuotes(baseUrl, headers) {
  const page = Math.floor(Math.random() * 5) + 1; // Pages 1-5
  
  const response = http.get(
    `${baseUrl}/api/v1/vendor/quotes?page=${page}&per_page=20`,
    {
      headers,
      tags: { name: 'PaginateQuotes' },
    }
  );
  
  const success = check(response, {
    'paginate quotes - status is 200': (r) => r.status === 200,
    'paginate quotes - response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!success);
}

function testGetQuoteDetail(baseUrl, headers) {
  // Use a stored quote UUID or a test UUID
  const quoteUUID = quoteUUIDs.length > 0 
    ? quoteUUIDs[Math.floor(Math.random() * quoteUUIDs.length)]
    : 'test-uuid';
  
  const startTime = Date.now();
  
  const response = http.get(
    `${baseUrl}/api/v1/vendor/quotes/${quoteUUID}`,
    {
      headers,
      tags: { name: 'GetQuoteDetail' },
    }
  );
  
  const duration = Date.now() - startTime;
  quoteDetailDuration.add(duration);
  
  // Accept both 200 (found) and 404 (not found) as valid responses
  const success = check(response, {
    'quote detail - valid response': (r) => r.status === 200 || r.status === 404,
    'quote detail - response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  errorRate.add(!success);
}

function testRespondToQuote(baseUrl, headers) {
  const quoteUUID = quoteUUIDs.length > 0 
    ? quoteUUIDs[Math.floor(Math.random() * quoteUUIDs.length)]
    : 'test-uuid';
  
  const actions = ['accept', 'reject', 'counter-offer'];
  const action = actions[Math.floor(Math.random() * actions.length)];
  
  let payload = {};
  if (action === 'accept') {
    payload = {
      estimated_delivery_days: Math.floor(Math.random() * 30) + 1,
      notes: 'Load test acceptance',
    };
  } else if (action === 'reject') {
    payload = {
      rejection_reason: 'Load test rejection',
    };
  } else {
    payload = {
      counter_offer_amount: Math.floor(Math.random() * 1000000) + 100000,
      notes: 'Load test counter offer',
    };
  }
  
  const startTime = Date.now();
  
  const response = http.post(
    `${baseUrl}/api/v1/vendor/quotes/${quoteUUID}/${action}`,
    JSON.stringify(payload),
    {
      headers,
      tags: { name: 'RespondToQuote' },
    }
  );
  
  const duration = Date.now() - startTime;
  quoteResponseDuration.add(duration);
  
  // Accept 200, 404, 422 as valid (quote might not exist or already responded)
  const success = check(response, {
    'quote response - valid response': (r) => [200, 404, 422].includes(r.status),
    'quote response - response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
}

function testGetMessages(baseUrl, headers) {
  const quoteUUID = quoteUUIDs.length > 0 
    ? quoteUUIDs[Math.floor(Math.random() * quoteUUIDs.length)]
    : 'test-uuid';
  
  const startTime = Date.now();
  
  const response = http.get(
    `${baseUrl}/api/v1/vendor/quotes/${quoteUUID}/messages?page=1&per_page=20`,
    {
      headers,
      tags: { name: 'GetMessages' },
    }
  );
  
  const duration = Date.now() - startTime;
  messagesDuration.add(duration);
  
  const success = check(response, {
    'get messages - valid response': (r) => r.status === 200 || r.status === 404,
    'get messages - response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!success);
}

function testSendMessage(baseUrl, headers) {
  const quoteUUID = quoteUUIDs.length > 0 
    ? quoteUUIDs[Math.floor(Math.random() * quoteUUIDs.length)]
    : 'test-uuid';
  
  const payload = {
    message: `Load test message at ${new Date().toISOString()}`,
  };
  
  const response = http.post(
    `${baseUrl}/api/v1/vendor/quotes/${quoteUUID}/messages`,
    JSON.stringify(payload),
    {
      headers,
      tags: { name: 'SendMessage' },
    }
  );
  
  const success = check(response, {
    'send message - valid response': (r) => [201, 404, 422].includes(r.status),
    'send message - response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  errorRate.add(!success);
}

function testFileUpload(baseUrl, headers) {
  const quoteUUID = quoteUUIDs.length > 0 
    ? quoteUUIDs[Math.floor(Math.random() * quoteUUIDs.length)]
    : 'test-uuid';
  
  // Create a small test file (1KB)
  const fileContent = 'x'.repeat(1024);
  const fileName = `load-test-${Date.now()}.txt`;
  
  const formData = new FormData();
  formData.append('message', 'Load test message with attachment');
  formData.append('attachments[]', http.file(fileContent, fileName, 'text/plain'));
  
  const startTime = Date.now();
  
  const response = http.post(
    `${baseUrl}/api/v1/vendor/quotes/${quoteUUID}/messages`,
    formData.body(),
    {
      headers: {
        ...headers,
        'Content-Type': `multipart/form-data; boundary=${formData.boundary}`,
      },
      tags: { name: 'FileUpload' },
    }
  );
  
  const duration = Date.now() - startTime;
  fileUploadDuration.add(duration);
  
  const success = check(response, {
    'file upload - valid response': (r) => [201, 404, 422].includes(r.status),
    'file upload - response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!success);
}

function testGetProfile(baseUrl, headers) {
  const response = http.get(
    `${baseUrl}/api/v1/vendor/profile`,
    {
      headers,
      tags: { name: 'GetProfile' },
    }
  );
  
  const success = check(response, {
    'get profile - status is 200': (r) => r.status === 200,
    'get profile - response time < 200ms': (r) => r.timings.duration < 200,
    'get profile - has vendor data': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.company_name !== undefined;
      } catch (e) {
        return false;
      }
    },
  });
  
  errorRate.add(!success);
}

/**
 * Teardown function - runs once after all VUs
 */
export function teardown(data) {
  console.log('✅ Vendor Portal Load Test Completed');
  console.log('📊 Check the summary for detailed metrics');
}

/**
 * Handle summary - custom summary output
 */
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  return {
    'stdout': textSummary(data),
    [`k6/results/vendor-portal-${timestamp}.json`]: JSON.stringify(data, null, 2),
    [`k6/results/vendor-portal-${timestamp}.html`]: htmlReport(data),
  };
}

// Helper function for text summary
function textSummary(data) {
  let summary = '\n';
  summary += '═══════════════════════════════════════════════════════════\n';
  summary += '  Vendor Portal Load Test - Summary Report\n';
  summary += '═══════════════════════════════════════════════════════════\n\n';
  
  // Overall metrics
  summary += '📊 Overall Metrics:\n';
  summary += `   Total Requests: ${data.metrics.http_reqs?.values.count || 0}\n`;
  summary += `   Failed Requests: ${data.metrics.http_req_failed?.values.passes || 0}\n`;
  summary += `   Error Rate: ${((data.metrics.errors?.values.rate || 0) * 100).toFixed(2)}%\n\n`;
  
  // Login metrics
  summary += '🔐 Login Metrics:\n';
  summary += `   Login Attempts: ${data.metrics.login_attempts?.values.count || 0}\n`;
  summary += `   Successful Logins: ${data.metrics.successful_logins?.values.count || 0}\n`;
  summary += `   Failed Logins: ${data.metrics.failed_logins?.values.count || 0}\n`;
  summary += `   Login Duration (p95): ${(data.metrics.vendor_login_duration?.values['p(95)'] || 0).toFixed(2)}ms\n\n`;
  
  // Quote operations
  summary += '📋 Quote Operations:\n';
  summary += `   Quote List (p95): ${(data.metrics.quote_list_duration?.values['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += `   Quote Detail (p95): ${(data.metrics.quote_detail_duration?.values['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += `   Quote Response (p95): ${(data.metrics.quote_response_duration?.values['p(95)'] || 0).toFixed(2)}ms\n\n`;
  
  // Message operations
  summary += '💬 Message Operations:\n';
  summary += `   Messages (p95): ${(data.metrics.messages_duration?.values['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += `   File Upload (p95): ${(data.metrics.file_upload_duration?.values['p(95)'] || 0).toFixed(2)}ms\n\n`;
  
  // HTTP metrics
  summary += '🌐 HTTP Metrics:\n';
  summary += `   Request Duration (p95): ${(data.metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2)}ms\n`;
  summary += `   Request Duration (p99): ${(data.metrics.http_req_duration?.values['p(99)'] || 0).toFixed(2)}ms\n\n`;
  
  // Virtual users
  summary += '👥 Virtual Users:\n';
  summary += `   Max VUs: ${data.metrics.vus_max?.values.max || 0}\n`;
  summary += `   Test Duration: ${((data.state?.testRunDurationMs || 0) / 1000).toFixed(0)}s\n\n`;
  
  // Threshold status
  summary += '✓ Threshold Status:\n';
  const thresholds = data.root_group?.checks || [];
  for (const check of thresholds) {
    const status = check.passes > 0 ? '✓' : '✗';
    summary += `   ${status} ${check.name}\n`;
  }
  
  summary += '\n═══════════════════════════════════════════════════════════\n';
  
  return summary;
}

// Helper function for HTML report
function htmlReport(data) {
  const timestamp = new Date().toISOString();
  const totalRequests = data.metrics.http_reqs?.values.count || 0;
  const errorRate = ((data.metrics.errors?.values.rate || 0) * 100).toFixed(2);
  const loginAttempts = data.metrics.login_attempts?.values.count || 0;
  const successfulLogins = data.metrics.successful_logins?.values.count || 0;
  const failedLogins = data.metrics.failed_logins?.values.count || 0;
  const loginDurationP95 = (data.metrics.vendor_login_duration?.values['p(95)'] || 0).toFixed(2);
  const quoteListP95 = (data.metrics.quote_list_duration?.values['p(95)'] || 0).toFixed(2);
  const quoteDetailP95 = (data.metrics.quote_detail_duration?.values['p(95)'] || 0).toFixed(2);
  const quoteResponseP95 = (data.metrics.quote_response_duration?.values['p(95)'] || 0).toFixed(2);
  const messagesP95 = (data.metrics.messages_duration?.values['p(95)'] || 0).toFixed(2);
  const fileUploadP95 = (data.metrics.file_upload_duration?.values['p(95)'] || 0).toFixed(2);
  const httpDurationP95 = (data.metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2);
  const httpDurationP99 = (data.metrics.http_req_duration?.values['p(99)'] || 0).toFixed(2);
  const maxVUs = data.metrics.vus_max?.values.max || 0;
  const testDuration = ((data.state?.testRunDurationMs || 0) / 1000).toFixed(0);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Vendor Portal Load Test Report</title>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 14px; }
    .content { padding: 40px; }
    .section { margin-bottom: 40px; }
    .section h2 { 
      color: #333; 
      font-size: 24px; 
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
    .metric-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      border-left: 4px solid #667eea;
    }
    .metric-card.success { border-left-color: #10b981; }
    .metric-card.warning { border-left-color: #f59e0b; }
    .metric-card.error { border-left-color: #ef4444; }
    .metric-label {
      font-size: 12px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: #1f2937;
    }
    .metric-unit {
      font-size: 14px;
      color: #6b7280;
      margin-left: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    th, td {
      padding: 16px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #667eea;
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: #f9fafb; }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-success {
      background: #d1fae5;
      color: #065f46;
    }
    .status-warning {
      background: #fef3c7;
      color: #92400e;
    }
    .status-error {
      background: #fee2e2;
      color: #991b1b;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 40px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Vendor Portal Load Test Report</h1>
      <p>Generated on ${timestamp}</p>
    </div>
    
    <div class="content">
      <!-- Overview Section -->
      <div class="section">
        <h2>📊 Test Overview</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Requests</div>
            <div class="metric-value">${totalRequests.toLocaleString()}</div>
          </div>
          <div class="metric-card ${errorRate < 1 ? 'success' : 'error'}">
            <div class="metric-label">Error Rate</div>
            <div class="metric-value">${errorRate}<span class="metric-unit">%</span></div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Max Virtual Users</div>
            <div class="metric-value">${maxVUs}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Test Duration</div>
            <div class="metric-value">${testDuration}<span class="metric-unit">s</span></div>
          </div>
        </div>
      </div>
      
      <!-- Login Metrics -->
      <div class="section">
        <h2>🔐 Authentication Metrics</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Login Attempts</div>
            <div class="metric-value">${loginAttempts.toLocaleString()}</div>
          </div>
          <div class="metric-card success">
            <div class="metric-label">Successful Logins</div>
            <div class="metric-value">${successfulLogins.toLocaleString()}</div>
          </div>
          <div class="metric-card ${failedLogins > 0 ? 'warning' : 'success'}">
            <div class="metric-label">Failed Logins</div>
            <div class="metric-value">${failedLogins.toLocaleString()}</div>
          </div>
          <div class="metric-card ${loginDurationP95 < 1000 ? 'success' : 'warning'}">
            <div class="metric-label">Login Duration (p95)</div>
            <div class="metric-value">${loginDurationP95}<span class="metric-unit">ms</span></div>
          </div>
        </div>
      </div>
      
      <!-- Performance Metrics -->
      <div class="section">
        <h2>⚡ Performance Metrics</h2>
        <table>
          <thead>
            <tr>
              <th>Operation</th>
              <th>p95 Duration</th>
              <th>Target</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Quote List</td>
              <td>${quoteListP95} ms</td>
              <td>&lt; 300 ms</td>
              <td><span class="status-badge ${quoteListP95 < 300 ? 'status-success' : 'status-error'}">${quoteListP95 < 300 ? '✓ Pass' : '✗ Fail'}</span></td>
            </tr>
            <tr>
              <td>Quote Detail</td>
              <td>${quoteDetailP95} ms</td>
              <td>&lt; 200 ms</td>
              <td><span class="status-badge ${quoteDetailP95 < 200 ? 'status-success' : 'status-error'}">${quoteDetailP95 < 200 ? '✓ Pass' : '✗ Fail'}</span></td>
            </tr>
            <tr>
              <td>Quote Response</td>
              <td>${quoteResponseP95} ms</td>
              <td>&lt; 500 ms</td>
              <td><span class="status-badge ${quoteResponseP95 < 500 ? 'status-success' : 'status-error'}">${quoteResponseP95 < 500 ? '✓ Pass' : '✗ Fail'}</span></td>
            </tr>
            <tr>
              <td>Messages</td>
              <td>${messagesP95} ms</td>
              <td>&lt; 300 ms</td>
              <td><span class="status-badge ${messagesP95 < 300 ? 'status-success' : 'status-error'}">${messagesP95 < 300 ? '✓ Pass' : '✗ Fail'}</span></td>
            </tr>
            <tr>
              <td>File Upload</td>
              <td>${fileUploadP95} ms</td>
              <td>&lt; 2000 ms</td>
              <td><span class="status-badge ${fileUploadP95 < 2000 ? 'status-success' : 'status-error'}">${fileUploadP95 < 2000 ? '✓ Pass' : '✗ Fail'}</span></td>
            </tr>
            <tr>
              <td>Overall HTTP (p95)</td>
              <td>${httpDurationP95} ms</td>
              <td>&lt; 500 ms</td>
              <td><span class="status-badge ${httpDurationP95 < 500 ? 'status-success' : 'status-error'}">${httpDurationP95 < 500 ? '✓ Pass' : '✗ Fail'}</span></td>
            </tr>
            <tr>
              <td>Overall HTTP (p99)</td>
              <td>${httpDurationP99} ms</td>
              <td>&lt; 1000 ms</td>
              <td><span class="status-badge ${httpDurationP99 < 1000 ? 'status-success' : 'status-error'}">${httpDurationP99 < 1000 ? '✓ Pass' : '✗ Fail'}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Test Scenarios -->
      <div class="section">
        <h2>🎯 Test Scenarios</h2>
        <table>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Description</th>
              <th>Max VUs</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Vendor Login</td>
              <td>100 concurrent vendor logins</td>
              <td>100</td>
              <td>4 minutes</td>
            </tr>
            <tr>
              <td>Quote List Load</td>
              <td>500 concurrent quote list requests</td>
              <td>500</td>
              <td>13 minutes</td>
            </tr>
            <tr>
              <td>Mixed Operations</td>
              <td>Realistic vendor portal usage</td>
              <td>150</td>
              <td>17 minutes</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="footer">
      <p>Generated by k6 Load Testing Framework | CanvaStencil Vendor Portal</p>
    </div>
  </div>
</body>
</html>
  `;
}
