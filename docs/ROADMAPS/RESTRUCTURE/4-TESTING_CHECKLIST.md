# TESTING CHECKLIST
## Comprehensive Testing Procedures

**Version**: 1.0.0  
**Last Updated**: December 22, 2025  
**Estimated Time**: 2-3 hours  
**Difficulty**: 🟡 Medium  

---

## 🎯 **OBJECTIVE**

Verify bahwa semua functionality bekerja dengan baik di local development dan production environment setelah restructure dan deployment.

---

## 📋 **TESTING PHASES**

1. **Local Development Testing** (Post-restructure)
2. **Integration Testing** (Frontend-Backend)
3. **Production Deployment Testing** (Post-deployment)
4. **Performance Testing**
5. **Security Testing**
6. **User Acceptance Testing**

---

## 🖥️ **PHASE 1: LOCAL DEVELOPMENT TESTING**

### **1.1 Environment Setup Verification**

#### **Backend Tests**

```bash
cd backend

# Test: PHP version
php -v
# Expected: PHP 8.1+ or 8.2+

# Test: Laravel installation
php artisan --version
# Expected: Laravel Framework 10.x.x

# Test: Database connection
php artisan db:show
# Expected: Database connection info displayed

# Test: Environment loaded
php artisan env
# Expected: Environment info displayed

# Test: Start server
php artisan serve
# Expected: Server started on http://localhost:8000
```

**Checklist:**
- [ ] PHP version 8.1+ installed
- [ ] Laravel 10 running
- [ ] Database connection successful
- [ ] `.env` file loaded correctly
- [ ] Server starts without errors
- [ ] No deprecation warnings

---

#### **Frontend Tests**

```bash
cd frontend

# Test: Node version
node -v
# Expected: Node 18+ or 20+

# Test: NPM version
npm -v
# Expected: NPM 9+

# Test: Dependencies installed
npm list --depth=0
# Expected: All dependencies listed

# Test: Build configuration
npm run build -- --mode development
# Expected: Build completes without errors

# Test: Start dev server
npm run dev
# Expected: Server started on http://localhost:5173
```

**Checklist:**
- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`node_modules/` exists)
- [ ] `.env.development` file exists and valid
- [ ] Build completes successfully
- [ ] Dev server starts without errors
- [ ] No console warnings

---

### **1.2 API Connectivity Tests**

#### **Test 1: Health Check Endpoint**

**Browser Console (at `http://localhost:5173`):**

```javascript
// Test health endpoint
fetch('http://localhost:8000/api/v1/health')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Health Check:', data)
    // Expected: { status: 'ok', timestamp: '...' }
  })
  .catch(e => console.error('❌ Health Check Failed:', e))
```

**Checklist:**
- [ ] Health endpoint returns 200 OK
- [ ] Response is valid JSON
- [ ] No CORS errors in console

---

#### **Test 2: CSRF Cookie Endpoint**

```javascript
// Test CSRF cookie
fetch('http://localhost:8000/sanctum/csrf-cookie', {
  credentials: 'include'
})
  .then(r => {
    console.log('✅ CSRF Cookie:', r.status, document.cookie)
    // Expected: 204 No Content, Cookie set
  })
  .catch(e => console.error('❌ CSRF Failed:', e))
```

**Checklist:**
- [ ] CSRF endpoint returns 204
- [ ] Cookie `XSRF-TOKEN` set in browser
- [ ] Cookie `laravel_session` set in browser
- [ ] No CORS errors

---

### **1.3 Authentication Flow Tests**

#### **Test 3: Platform Admin Login**

**Steps:**
1. Navigate to `http://localhost:5173/login`
2. Select "Platform Admin" tab
3. Enter credentials:
   - Email: `admin@canvastencil.com`
   - Password: [your password]
4. Click "Login"

**Network Tab Inspection:**
- [ ] Request to `/sanctum/csrf-cookie` successful (204)
- [ ] Request to `/api/v1/platform/auth/login` successful (200)
- [ ] Response contains `access_token`
- [ ] Response contains `user` object with `account_type: 'platform'`
- [ ] No CORS errors
- [ ] Redirect to `/platform/dashboard`

**Browser Console:**
- [ ] No JavaScript errors
- [ ] Token saved to localStorage (`stencil_auth_token`)
- [ ] User saved to localStorage (`stencil_auth_user`)

**UI Verification:**
- [ ] Dashboard loads correctly
- [ ] User menu shows correct name
- [ ] Logout button visible
- [ ] Navigation menu shows platform sections

---

#### **Test 4: Tenant User Login**

**Steps:**
1. Logout from Platform Admin
2. Navigate to `http://localhost:5173/login`
3. Select "Tenant User" tab
4. Enter credentials:
   - Email: `admin@etching.test` (or your tenant admin)
   - Password: [your password]
5. Click "Login"

**Network Tab Inspection:**
- [ ] Request to `/sanctum/csrf-cookie` successful (204)
- [ ] Request to `/api/v1/tenant/auth/login` successful (200)
- [ ] Response contains `access_token`
- [ ] Response contains `user` object with `account_type: 'tenant'`
- [ ] Response contains `tenant` object
- [ ] No CORS errors
- [ ] Redirect to `/admin/dashboard`

**Browser Console:**
- [ ] No JavaScript errors
- [ ] Token saved to localStorage
- [ ] User and tenant info saved

**UI Verification:**
- [ ] Dashboard loads correctly
- [ ] Tenant name displayed
- [ ] User menu shows correct name
- [ ] Navigation menu shows tenant sections (Products, Orders, etc.)

---

#### **Test 5: Session Persistence**

**Steps:**
1. Login as Platform Admin (or Tenant User)
2. Navigate to any protected page (e.g., `/platform/tenants`)
3. Press F5 (refresh page)

**Expected Behavior:**
- [ ] Page reloads without redirect to login
- [ ] User remains authenticated
- [ ] Data still loads correctly
- [ ] No re-authentication required

---

#### **Test 6: Logout**

**Steps:**
1. While logged in, click "Logout" button
2. Observe behavior

**Expected Behavior:**
- [ ] Request to `/api/v1/auth/logout` successful (200)
- [ ] Token removed from localStorage
- [ ] User removed from localStorage
- [ ] Redirect to `/login`
- [ ] Accessing protected routes redirects to login

---

### **1.4 Data Fetching Tests**

#### **Test 7: Fetch Products (Tenant Context)**

**While logged in as Tenant User:**

1. Navigate to `http://localhost:5173/admin/products`

**Network Tab:**
- [ ] Request to `/api/v1/tenant/products` successful (200)
- [ ] Authorization header present (`Bearer [token]`)
- [ ] Response is array of products
- [ ] No CORS errors

**UI Verification:**
- [ ] Product list displays
- [ ] Product images load
- [ ] Pagination works (if applicable)
- [ ] Search/filter works
- [ ] No console errors

---

#### **Test 8: Fetch Tenants (Platform Context)**

**While logged in as Platform Admin:**

1. Navigate to `http://localhost:5173/platform/tenants`

**Network Tab:**
- [ ] Request to `/api/v1/platform/tenants` successful (200)
- [ ] Authorization header present
- [ ] Response is array of tenants
- [ ] No CORS errors

**UI Verification:**
- [ ] Tenant list displays
- [ ] Tenant details correct
- [ ] Actions work (view, edit, etc.)
- [ ] No console errors

---

### **1.5 CRUD Operations Tests**

#### **Test 9: Create Product**

**While logged in as Tenant User:**

1. Navigate to `http://localhost:5173/admin/products`
2. Click "Add Product" button
3. Fill form with test data
4. Click "Save"

**Expected:**
- [ ] Request to `/api/v1/tenant/products` (POST) successful (201)
- [ ] Response contains created product with UUID
- [ ] Success notification displayed
- [ ] Redirect to product list (or detail page)
- [ ] New product appears in list

---

#### **Test 10: Update Product**

1. Click "Edit" on a product
2. Modify some fields
3. Click "Save"

**Expected:**
- [ ] Request to `/api/v1/tenant/products/{uuid}` (PUT/PATCH) successful (200)
- [ ] Response contains updated product
- [ ] Success notification displayed
- [ ] Changes reflected in UI

---

#### **Test 11: Delete Product**

1. Click "Delete" on a product
2. Confirm deletion

**Expected:**
- [ ] Request to `/api/v1/tenant/products/{uuid}` (DELETE) successful (200/204)
- [ ] Success notification displayed
- [ ] Product removed from list
- [ ] No errors

---

## 🔗 **PHASE 2: INTEGRATION TESTING**

### **2.1 Cross-Context Tests**

#### **Test 12: Context Switching**

**Steps:**
1. Login as Platform Admin
2. Navigate to platform pages
3. Logout
4. Login as Tenant User
5. Navigate to tenant pages

**Verify:**
- [ ] No cross-contamination of data
- [ ] Correct API endpoints called for each context
- [ ] UI adapts to context (different menus, etc.)
- [ ] No permission errors
- [ ] Auth state cleared completely between contexts

---

### **2.2 Multi-Tenant Isolation Tests**

#### **Test 13: Tenant Data Isolation**

**Setup:**
- Create 2 test tenants: Tenant A, Tenant B
- Add products to each tenant

**Steps:**
1. Login as Tenant A admin
2. View products list
3. Logout
4. Login as Tenant B admin
5. View products list

**Verify:**
- [ ] Tenant A only sees their own products
- [ ] Tenant B only sees their own products
- [ ] No data leakage between tenants
- [ ] UUIDs are different between tenants

---

## 🚀 **PHASE 3: PRODUCTION TESTING**

### **3.1 Production Environment Tests**

**After deployment to production:**

#### **Test 14: HTTPS Enforcement**

```bash
# Test HTTP redirect
curl -I http://etchingxenial.biz.id
# Expected: 301 redirect to https://

curl -I http://api.etchingxenial.biz.id
# Expected: 301 redirect to https://
```

**Checklist:**
- [ ] HTTP redirects to HTTPS automatically
- [ ] SSL certificate valid (no warnings)
- [ ] Certificate not expired
- [ ] Green padlock in browser

---

#### **Test 15: Production API Endpoints**

**Browser Console at `https://etchingxenial.biz.id`:**

```javascript
// Test production health
fetch('https://api.etchingxenial.biz.id/api/v1/health')
  .then(r => r.json())
  .then(data => console.log('✅ Production Health:', data))
  .catch(e => console.error('❌ Production Health Failed:', e))

// Test CSRF
fetch('https://api.etchingxenial.biz.id/sanctum/csrf-cookie', {
  credentials: 'include'
})
  .then(r => console.log('✅ Production CSRF:', r.status))
  .catch(e => console.error('❌ Production CSRF Failed:', e))
```

**Checklist:**
- [ ] Health endpoint accessible
- [ ] CSRF endpoint accessible
- [ ] No CORS errors
- [ ] SSL certificate valid
- [ ] Cookies set with `Secure` flag

---

#### **Test 16: Production Authentication**

**Same as local tests (1.3), but on production:**

1. Navigate to `https://etchingxenial.biz.id/login`
2. Test Platform Admin login
3. Test Tenant User login
4. Test session persistence (refresh page)
5. Test logout

**Verify:**
- [ ] All auth flows work identically to local
- [ ] Sessions persist after refresh
- [ ] Cookies set correctly with proper domain
- [ ] No CORS errors

---

### **3.2 Production SPA Routing Tests**

#### **Test 17: Deep Link & Refresh**

**Steps:**
1. Navigate to `https://etchingxenial.biz.id/products/catalog`
2. Press F5 (refresh)
3. Navigate to `https://etchingxenial.biz.id/about`
4. Press F5 (refresh)
5. Try nested routes: `https://etchingxenial.biz.id/admin/products/catalog`
6. Press F5 (refresh)

**Expected:**
- [ ] All routes load correctly on refresh
- [ ] No 404 errors
- [ ] No redirects to index.html visible to user
- [ ] Browser URL stays the same
- [ ] Content loads correctly

---

## ⚡ **PHASE 4: PERFORMANCE TESTING**

### **4.1 Frontend Performance**

#### **Test 18: Lighthouse Audit**

**Steps:**
1. Open Chrome DevTools
2. Navigate to "Lighthouse" tab
3. Select:
   - Mode: Navigation
   - Device: Desktop & Mobile
   - Categories: All
4. Click "Analyze page load"

**Target Scores:**
- [ ] Performance: > 90
- [ ] Accessibility: > 90
- [ ] Best Practices: > 90
- [ ] SEO: > 90

**Key Metrics:**
- [ ] First Contentful Paint (FCP): < 1.8s
- [ ] Largest Contentful Paint (LCP): < 2.5s
- [ ] Time to Interactive (TTI): < 3.8s
- [ ] Total Blocking Time (TBT): < 200ms
- [ ] Cumulative Layout Shift (CLS): < 0.1

---

#### **Test 19: Network Performance**

**Browser DevTools → Network Tab:**

**Test on homepage:**
- [ ] Total page size: < 2MB
- [ ] Number of requests: < 50
- [ ] JavaScript bundle size: < 500KB
- [ ] CSS size: < 100KB
- [ ] Images optimized (WebP/optimized formats)
- [ ] Fonts loaded efficiently

---

### **4.2 API Performance**

#### **Test 20: API Response Times**

**Using Browser Network Tab or Postman:**

Test these endpoints and record response times:

```
GET /api/v1/health
- Target: < 100ms
- [ ] Achieved: ___ms

GET /api/v1/tenant/products
- Target: < 500ms
- [ ] Achieved: ___ms

GET /api/v1/tenant/products/{uuid}
- Target: < 200ms
- [ ] Achieved: ___ms

POST /api/v1/tenant/products
- Target: < 1000ms
- [ ] Achieved: ___ms
```

**Database Query Performance:**

```bash
# Backend: Enable query logging
# Edit .env
DB_LOG_QUERIES=true

# Check slow queries in logs
tail -f storage/logs/laravel.log | grep "Slow query"
```

**Checklist:**
- [ ] No queries taking > 1s
- [ ] N+1 query problems resolved
- [ ] Eager loading used where appropriate
- [ ] Database indexes in place

---

## 🔒 **PHASE 5: SECURITY TESTING**

### **5.1 Security Headers**

#### **Test 21: Security Headers Verification**

**Check headers:**

```bash
# Frontend
curl -I https://etchingxenial.biz.id

# Backend
curl -I https://api.etchingxenial.biz.id
```

**Required Headers:**
- [ ] `Strict-Transport-Security` (HSTS)
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY` or `SAMEORIGIN`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Content-Security-Policy` (if applicable)

---

### **5.2 Authentication Security**

#### **Test 22: Unauthorized Access**

**Steps:**
1. Logout (or open incognito window)
2. Try to access protected routes directly:
   - `https://etchingxenial.biz.id/admin/products`
   - `https://etchingxenial.biz.id/platform/tenants`

**Expected:**
- [ ] Redirected to login page
- [ ] No data displayed
- [ ] No sensitive info in console
- [ ] No API errors exposing data

---

#### **Test 23: CSRF Protection**

**Steps:**
1. Login to application
2. Open browser console
3. Try to make API call WITHOUT CSRF token:

```javascript
fetch('https://api.etchingxenial.biz.id/api/v1/tenant/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test' })
})
  .then(r => console.log(r.status))
  .catch(e => console.error(e))
```

**Expected:**
- [ ] Request fails with 419 (CSRF token mismatch)
- [ ] Request succeeds ONLY after getting CSRF cookie first

---

### **5.3 Input Validation**

#### **Test 24: SQL Injection Attempts**

**Steps:**
1. Try to create product with malicious input:
   - Name: `'; DROP TABLE products; --`
   - Description: `<script>alert('XSS')</script>`

**Expected:**
- [ ] Input sanitized/escaped
- [ ] No SQL errors
- [ ] No script execution
- [ ] Validation errors if appropriate

---

#### **Test 25: XSS Protection**

**Steps:**
1. Create product with HTML/JS in fields
2. View product on public pages

**Expected:**
- [ ] HTML tags escaped
- [ ] Scripts don't execute
- [ ] Content displayed safely

---

## 👥 **PHASE 6: USER ACCEPTANCE TESTING**

### **6.1 Critical User Journeys**

#### **Test 26: Platform Admin Journey**

**Scenario: Manage Tenants**

1. Login as Platform Admin
2. Navigate to Tenants list
3. Create new tenant
4. Edit tenant details
5. View tenant statistics
6. Logout

**Success Criteria:**
- [ ] All steps complete without errors
- [ ] UI intuitive and clear
- [ ] Data persists correctly
- [ ] Performance acceptable (< 3s per action)

---

#### **Test 27: Tenant Admin Journey**

**Scenario: Manage Products**

1. Login as Tenant Admin
2. Navigate to Products
3. Add new product with images
4. Edit product details
5. View product on public page
6. Delete product
7. Logout

**Success Criteria:**
- [ ] All steps complete without errors
- [ ] Image uploads work
- [ ] Changes reflect immediately
- [ ] No data loss

---

### **6.2 Cross-Browser Testing**

#### **Test 28: Browser Compatibility**

**Test on:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

**Test basic flows:**
- Login/Logout
- Navigate between pages
- Create/Edit/Delete operations
- Image uploads
- Forms

**Verify:**
- [ ] No layout issues
- [ ] All features work
- [ ] No console errors
- [ ] Acceptable performance

---

### **6.3 Responsive Design Testing**

#### **Test 29: Mobile Responsiveness**

**Test at breakpoints:**
- [ ] Mobile: 375px (iPhone SE)
- [ ] Mobile: 390px (iPhone 12 Pro)
- [ ] Tablet: 768px (iPad)
- [ ] Tablet: 1024px (iPad Pro)
- [ ] Desktop: 1280px
- [ ] Desktop: 1920px

**Verify:**
- [ ] Layout adapts correctly
- [ ] Navigation menu works (hamburger on mobile)
- [ ] Forms usable on mobile
- [ ] Images scale properly
- [ ] Text readable (not too small)
- [ ] Buttons tappable (min 44x44px)

---

## 📊 **TESTING SUMMARY TEMPLATE**

### **Test Execution Summary**

**Date**: _____________  
**Environment**: [ ] Local  [ ] Production  
**Tester**: _____________

**Results:**

| Phase | Total Tests | Passed | Failed | Blocked | Pass Rate |
|-------|-------------|--------|--------|---------|-----------|
| Phase 1: Local Dev | 11 | ___ | ___ | ___ | ___% |
| Phase 2: Integration | 2 | ___ | ___ | ___ | ___% |
| Phase 3: Production | 4 | ___ | ___ | ___ | ___% |
| Phase 4: Performance | 2 | ___ | ___ | ___ | ___% |
| Phase 5: Security | 5 | ___ | ___ | ___ | ___% |
| Phase 6: UAT | 4 | ___ | ___ | ___ | ___% |
| **TOTAL** | **28** | ___ | ___ | ___ | ___% |

**Critical Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Recommendations:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Sign-off:**
- [ ] All critical tests passed
- [ ] All issues documented
- [ ] Approved for production deployment

---

## 🎯 **SUCCESS CRITERIA**

**Minimum Requirements for Production Go-Live:**

- [ ] **Phase 1**: 100% pass rate (11/11 tests)
- [ ] **Phase 2**: 100% pass rate (2/2 tests)
- [ ] **Phase 3**: 100% pass rate (4/4 tests)
- [ ] **Phase 4**: 80% pass rate (acceptable performance)
- [ ] **Phase 5**: 100% pass rate (5/5 security tests)
- [ ] **Phase 6**: 90% pass rate (3/4 UAT tests minimum)

**Overall**: Minimum 95% pass rate (27/28 tests)

---

## 🔄 **RE-TESTING AFTER FIXES**

If tests fail:

1. Document issue in `5-TROUBLESHOOTING.md`
2. Implement fix
3. Re-run failed test
4. Re-run related tests
5. Update test status
6. Repeat until all pass

---

## 🎉 **TESTING COMPLETE**

When all tests pass:

1. ✅ Complete testing summary
2. ✅ Document any known issues (non-critical)
3. ✅ Get sign-off from stakeholders
4. ✅ Proceed to production deployment
5. ✅ Continue monitoring post-deployment

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-12-22  
**Next Document**: [5-TROUBLESHOOTING.md](./5-TROUBLESHOOTING.md)
