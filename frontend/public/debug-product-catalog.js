// Product Catalog Debug Script
// Usage: Paste this entire file into browser console, or load via:
// var script = document.createElement('script');
// script.src = '/debug-product-catalog.js';
// document.head.appendChild(script);

(function() {
  console.log('%c=== PRODUCT CATALOG DEBUG TOOL ===', 'color: #00ff00; font-size: 16px; font-weight: bold;');
  
  // TEST 1: Check Auth Data
  window.debugCheckAuth = function() {
    console.log('\n%c=== AUTH DATA CHECK ===', 'color: #ffaa00; font-size: 14px; font-weight: bold;');
    
    const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('auth_token');
    const accountType = localStorage.getItem('account_type');
    const tenantId = localStorage.getItem('tenant_id');
    const userId = localStorage.getItem('user_id');
    
    console.log('📋 Storage Data:');
    console.table({
      'Account Type': accountType,
      'Has Token': !!token,
      'Token Length': token?.length || 0,
      'Tenant UUID': tenant?.uuid || '❌ MISSING',
      'Tenant Name': tenant?.name || '❌ MISSING',
      'Tenant Slug': tenant?.slug || '❌ MISSING',
      'User ID': user?.id || '❌ MISSING',
      'User Email': user?.email || '❌ MISSING',
      'Tenant ID (direct)': tenantId || '❌ MISSING',
      'User ID (direct)': userId || '❌ MISSING',
    });
    
    console.log('\n📦 Raw Objects:');
    console.log('Tenant Object:', tenant);
    console.log('User Object:', user);
    console.log('Token (first 50 chars):', token?.substring(0, 50) + '...');
    
    // Validation
    const issues = [];
    if (!tenant || !tenant.uuid) issues.push('❌ Tenant missing or no UUID');
    if (!user || !user.id) issues.push('❌ User missing or no ID');
    if (!token) issues.push('❌ Auth token missing');
    if (accountType !== 'tenant') issues.push('❌ Account type not "tenant"');
    
    if (issues.length > 0) {
      console.error('\n❌ ISSUES FOUND:', issues);
      console.log('\n💡 Solution: Run debugFixAuth() to clear and re-login');
      return false;
    }
    
    console.log('\n✅ ALL AUTH DATA VALID');
    return true;
  };
  
  // TEST 2: Direct API Call
  window.debugTestAPI = async function() {
    console.log('\n%c=== API ENDPOINT TEST ===', 'color: #ffaa00; font-size: 14px; font-weight: bold;');
    
    const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
    const token = localStorage.getItem('auth_token');
    
    if (!tenant || !token) {
      console.error('❌ Missing auth data. Run debugCheckAuth() first.');
      return;
    }
    
    const url = 'http://localhost:8000/api/v1/tenant/products?page=1&per_page=12';
    console.log('🌐 Calling:', url);
    console.log('📤 Headers:', {
      'Authorization': `Bearer ${token?.substring(0, 30)}...`,
      'X-Tenant-ID': tenant?.uuid,
      'X-User-Type': 'tenant',
      'X-Tenant-Slug': tenant?.slug,
    });
    
    try {
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant-ID': tenant?.uuid || '',
          'X-User-Type': 'tenant',
          'X-Tenant-Slug': tenant?.slug || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      const endTime = Date.now();
      
      console.log(`\n📥 Response (${endTime - startTime}ms):`);
      console.log('Status:', response.status, response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
        console.log('Data:', data);
      } else {
        const text = await response.text();
        console.log('Response Text:', text);
        data = text;
      }
      
      if (response.ok) {
        const count = data.total || data.data?.length || 0;
        console.log(`\n✅ API SUCCESS! Products count: ${count}`);
        if (count === 0) {
          console.warn('⚠️ No products found. Database might be empty.');
          console.log('💡 Run: php artisan db:seed --class=ProductSeeder');
        } else {
          console.log('Sample product:', data.data?.[0]);
        }
      } else {
        console.error('\n❌ API ERROR:', {
          status: response.status,
          message: data.message || data.error || 'Unknown error',
          errors: data.errors || null
        });
        
        if (response.status === 401) {
          console.log('💡 Solution: Token expired. Run debugFixAuth()');
        } else if (response.status === 403) {
          console.log('💡 Solution: Permission denied. Check user roles/permissions');
        } else if (response.status === 404) {
          console.log('💡 Solution: Endpoint not found. Check backend routes');
        }
      }
      
      return data;
    } catch (error) {
      console.error('\n❌ NETWORK ERROR:', error);
      console.log('💡 Possible causes:');
      console.log('  - Backend not running (check http://localhost:8000)');
      console.log('  - CORS issues');
      console.log('  - Network firewall blocking request');
      return null;
    }
  };
  
  // TEST 3: Check Backend Status
  window.debugCheckBackend = async function() {
    console.log('\n%c=== BACKEND STATUS CHECK ===', 'color: #ffaa00; font-size: 14px; font-weight: bold;');
    
    const endpoints = [
      'http://localhost:8000',
      'http://localhost:8000/api/v1',
      'http://localhost:8000/api/v1/health',
    ];
    
    for (const url of endpoints) {
      try {
        console.log(`\nChecking: ${url}`);
        const response = await fetch(url, { method: 'GET' });
        console.log(`  ✅ Status: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.log(`  ❌ Failed:`, error.message);
      }
    }
  };
  
  // TEST 4: Check React Query Cache
  window.debugCheckReactQuery = function() {
    console.log('\n%c=== REACT QUERY STATE ===', 'color: #ffaa00; font-size: 14px; font-weight: bold;');
    
    // Access React Query DevTools if available
    const queryClient = window.__REACT_QUERY_CLIENT__;
    if (queryClient) {
      const queries = queryClient.getQueryCache().getAll();
      console.log('Total queries:', queries.length);
      
      const productQueries = queries.filter(q => 
        q.queryKey.some(key => typeof key === 'string' && key.includes('product'))
      );
      
      console.log('Product queries:', productQueries.length);
      productQueries.forEach(q => {
        console.log({
          key: q.queryKey,
          state: q.state.status,
          error: q.state.error?.message,
          data: q.state.data
        });
      });
    } else {
      console.log('⚠️ React Query client not exposed on window');
      console.log('Add this to your QueryClientProvider:');
      console.log('  useEffect(() => { window.__REACT_QUERY_CLIENT__ = queryClient; }, []);');
    }
  };
  
  // FIX: Clear auth and redirect to login
  window.debugFixAuth = function() {
    console.log('\n%c=== FIXING AUTH ===', 'color: #ff0000; font-size: 14px; font-weight: bold;');
    console.log('Clearing all auth data...');
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('tenant');
    localStorage.removeItem('user');
    localStorage.removeItem('accountType');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('user_id');
    localStorage.removeItem('permissions');
    localStorage.removeItem('roles');
    
    console.log('✅ Auth cleared');
    console.log('Redirecting to login...');
    
    setTimeout(() => {
      window.location.href = '/tenant/login';
    }, 1000);
  };
  
  // RUN ALL TESTS
  window.debugRunAll = async function() {
    console.clear();
    console.log('%c=== RUNNING ALL DEBUG TESTS ===', 'color: #00ff00; font-size: 16px; font-weight: bold;');
    
    console.log('\n1️⃣ Checking auth data...');
    const authOK = debugCheckAuth();
    
    if (!authOK) {
      console.log('\n❌ Auth check failed. Fix auth before continuing.');
      console.log('Run: debugFixAuth()');
      return;
    }
    
    console.log('\n2️⃣ Checking backend status...');
    await debugCheckBackend();
    
    console.log('\n3️⃣ Testing products API...');
    await debugTestAPI();
    
    console.log('\n4️⃣ Checking React Query state...');
    debugCheckReactQuery();
    
    console.log('\n%c=== DEBUG COMPLETE ===', 'color: #00ff00; font-size: 16px; font-weight: bold;');
    console.log('\nAvailable commands:');
    console.log('  debugCheckAuth()     - Check authentication data');
    console.log('  debugTestAPI()       - Test products API endpoint');
    console.log('  debugCheckBackend()  - Check backend server status');
    console.log('  debugCheckReactQuery() - Check React Query cache');
    console.log('  debugFixAuth()       - Clear auth and re-login');
    console.log('  debugRunAll()        - Run all tests');
  };
  
  // Auto-run on load
  console.log('\n✅ Debug tools loaded!');
  console.log('\nRun: %cdebugRunAll()%c to start debugging', 'color: #00ff00; font-weight: bold;', 'color: inherit;');
  console.log('\nOr run individual tests:');
  console.log('  • debugCheckAuth()');
  console.log('  • debugTestAPI()');
  console.log('  • debugCheckBackend()');
  console.log('  • debugFixAuth()');
})();
