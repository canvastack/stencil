# Feature Flags System - Testing Guide

> **Comprehensive testing guide for Feature Flags, Deployment Metrics, and Public Status Pages**  
> **Created:** December 22, 2025  
> **Status:** Implementation Complete - Ready for Testing

---

## 📋 Overview

This guide provides step-by-step instructions for testing the newly implemented Feature Flag System, Deployment Metrics Monitor, Status Page, and Announcements Page.

---

## 🎯 Prerequisites

Before testing, ensure you have:

1. **Backend API Endpoints** (Optional - system works with graceful degradation):
   - `POST /api/v1/platform/feature-flags/check`
   - `POST /api/v1/platform/feature-flags/all`
   - `PUT /api/v1/platform/feature-flags/{flag}`
   - `GET /api/v1/platform/analytics/deployment-metrics`
   - `POST /api/v1/tenant/feature-flags/check`
   - `POST /api/v1/tenant/feature-flags/all`

2. **Test Accounts**:
   - **Platform Admin**: `platform@example.com` / password
   - **Tenant User**: `vendor@lasertama.com` / password

3. **Environment Variables** (`.env`):
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_SENTRY_DSN=your-sentry-dsn (optional)
   ```

---

## 🧪 Test Plan

### **Test 1: Platform Admin - Feature Flags Management**

#### **Access Control Test**
1. **Login as Platform Admin**:
   - Go to `http://localhost:5173/platform/login`
   - Email: `platform@example.com`
   - Password: (your platform admin password)

2. **Navigate to Feature Flags**:
   - URL: `http://localhost:5173/platform/system/feature-flags`
   - ✅ Verify page loads successfully
   - ✅ Verify stats cards display: Total Flags, Performance, Features, UX & Technical

3. **View Feature Flags List**:
   - ✅ Verify all 16 feature flags are displayed
   - ✅ Verify each flag shows:
     - Name and description
     - Status badge (ENABLED/DISABLED)
     - Category badge
     - Target audience
     - Rollout percentage
     - Required permissions
     - Dependencies (if any)

4. **Search and Filter**:
   - ✅ Search for "Virtual Scrolling"
   - ✅ Filter by category: "Performance"
   - ✅ Filter by status: "Enabled" / "Disabled"
   - ✅ Verify results update correctly

5. **Toggle Feature Flag**:
   - ✅ Toggle "Virtual Scrolling" ON
   - ✅ Verify success toast appears
   - ✅ Verify badge changes to "ENABLED"
   - ✅ Toggle "Virtual Scrolling" OFF
   - ✅ Verify success toast appears
   - ✅ Verify badge changes to "DISABLED"

6. **Update Rollout Percentage**:
   - ✅ Drag slider to 50%
   - ✅ Verify percentage updates
   - ✅ Verify success toast appears

7. **Rollback Feature Flag**:
   - ✅ Enable a feature flag
   - ✅ Click "Rollback" button
   - ✅ Verify confirmation dialog appears
   - ✅ Click "Rollback" in dialog
   - ✅ Verify flag is disabled
   - ✅ Verify rollout percentage reset to 0%

8. **Refresh Data**:
   - ✅ Click "Refresh" button
   - ✅ Verify data reloads from backend

---

### **Test 2: Platform Admin - Unauthorized Access**

1. **Login as Tenant User**:
   - Go to `http://localhost:5173/admin/login`
   - Email: `vendor@lasertama.com`
   - Password: (your tenant password)

2. **Attempt to Access Feature Flags**:
   - Try to navigate to `http://localhost:5173/platform/system/feature-flags`
   - ✅ Verify access is denied
   - ✅ Verify redirect to appropriate page
   - ✅ Verify error message appears

---

### **Test 3: Public Status Page**

1. **Access Without Authentication**:
   - Go to `http://localhost:5173/status`
   - ✅ Verify page loads without login
   - ✅ Verify "All Systems Operational" status (or appropriate status)

2. **Verify System Components**:
   - ✅ API Service status
   - ✅ Database status
   - ✅ File Storage status
   - ✅ Product Catalog status

3. **Verify Ongoing Deployment Section**:
   - ✅ Deployment name displayed
   - ✅ Current phase shown (e.g., "Week 5/8 - 50% Rollout")
   - ✅ Progress bar shows 62.5%
   - ✅ Start date and estimated completion displayed
   - ✅ Impact statement shown

4. **Verify Performance Metrics**:
   - ✅ Page Load Time displayed
   - ✅ Error Rate displayed
   - ✅ API Latency (P95) displayed
   - ✅ Uptime percentage displayed
   - ✅ Target metrics shown below each value

5. **Refresh Status**:
   - ✅ Click "Refresh" button
   - ✅ Verify "Last updated" timestamp changes
   - ✅ Verify metrics reload

6. **Help Links**:
   - ✅ Click "Contact Support" button
   - ✅ Click "Help Center" button
   - ✅ Verify links work correctly

---

### **Test 4: Announcements Page**

1. **Access Without Authentication**:
   - Go to `http://localhost:5173/announcements`
   - ✅ Verify page loads without login

2. **View Announcements**:
   - ✅ Verify "What's New in CanvaStack" title
   - ✅ Verify tab navigation: All Updates, Features, Improvements, Fixes, Announcements

3. **Filter by Category**:
   - ✅ Click "Features" tab
   - ✅ Verify only feature announcements show
   - ✅ Click "Improvements" tab
   - ✅ Verify only improvement announcements show

4. **Verify Announcement Cards**:
   - ✅ Each card shows title
   - ✅ Each card shows date
   - ✅ Each card shows category badge
   - ✅ Each card shows tag (NEW, UPDATED) if applicable
   - ✅ Each card shows summary
   - ✅ Each card shows highlights with checkmarks

5. **Action Buttons**:
   - ✅ Click "Learn More" on first announcement
   - ✅ Verify link works (may go to /help page)

6. **Subscribe Section**:
   - ✅ Verify "Subscribe to Newsletter" section at bottom
   - ✅ Verify "Visit Help Center" button

---

### **Test 5: Feature Flag Hook - Tenant Context**

1. **Login as Tenant User**:
   - Go to `http://localhost:5173/admin/login`
   - Login with tenant credentials

2. **Test useFeatureFlag Hook** (Developer Console Test):
   ```javascript
   // Open browser console on any admin page
   // This simulates checking a feature flag
   
   // Check if virtual scrolling is enabled
   // (This would be done in component code)
   const { isEnabled } = useFeatureFlag(FeatureFlag.VIRTUAL_SCROLLING);
   console.log('Virtual Scrolling enabled:', isEnabled);
   ```

3. **Verify Context Isolation**:
   - ✅ Tenant user cannot modify feature flags
   - ✅ Tenant user can only check flag status
   - ✅ Feature flags respect tenant_id in localStorage

---

### **Test 6: Feature Flag Caching**

1. **Enable a Feature Flag** (as Platform Admin):
   - Enable "Dark Mode V2" flag
   - Verify it's enabled

2. **Check Caching Behavior**:
   - ✅ Close browser tab
   - ✅ Reopen `/platform/system/feature-flags`
   - ✅ Verify "Dark Mode V2" is still enabled
   - ✅ Verify data loads from cache (faster load)

3. **Test Cache Invalidation**:
   - ✅ Modify a flag
   - ✅ Verify cache clears
   - ✅ Verify fresh data fetched from backend

---

### **Test 7: Responsive Design**

1. **Mobile View Test**:
   - ✅ Open Status Page on mobile (or resize browser to 375px width)
   - ✅ Verify layout is responsive
   - ✅ Verify all content readable
   - ✅ Open Announcements Page on mobile
   - ✅ Verify cards stack vertically
   - ✅ Open Feature Flags Management on tablet (768px)
   - ✅ Verify grid layout adjusts

---

### **Test 8: Dark Mode Compatibility**

1. **Toggle Dark Mode**:
   - ✅ Switch to dark theme
   - ✅ Verify Status Page renders correctly
   - ✅ Verify Announcements Page renders correctly
   - ✅ Verify Feature Flags Management renders correctly
   - ✅ Verify all badges have proper contrast

---

### **Test 9: Error Handling**

1. **Backend Unavailable Test**:
   - ✅ Stop backend API server
   - ✅ Try to load Feature Flags Management
   - ✅ Verify default values are used
   - ✅ Verify error message shown (not crash)
   - ✅ Verify graceful degradation

2. **Network Error Test**:
   - ✅ Simulate slow network (Chrome DevTools)
   - ✅ Verify loading states appear
   - ✅ Verify skeleton loaders show

3. **Permission Error Test**:
   - ✅ As tenant user, try to toggle a flag via API
   - ✅ Verify "Unauthorized" error shown
   - ✅ Verify flag state doesn't change

---

### **Test 10: Accessibility**

1. **Keyboard Navigation**:
   - ✅ Navigate Feature Flags page with Tab key
   - ✅ Toggle switch with Enter/Space
   - ✅ Navigate announcements tabs with arrow keys

2. **Screen Reader**:
   - ✅ Use screen reader on Status Page
   - ✅ Verify status announced correctly
   - ✅ Verify all buttons have proper labels

3. **Color Contrast**:
   - ✅ Run Lighthouse accessibility audit
   - ✅ Verify contrast ratios meet WCAG AA standards

---

## 🚨 Known Limitations

1. **Backend API Not Implemented**: 
   - Feature flags work with default values from config
   - Updates won't persist without backend
   - Deployment metrics show placeholder data

2. **Multi-Tenancy**:
   - Feature flags are currently global (not per-tenant)
   - Backend needs to implement tenant-specific flag overrides

3. **Real-time Updates**:
   - No WebSocket support yet
   - Changes require manual refresh

---

## 📊 Success Criteria

All tests must pass with the following criteria:

- ✅ **Routing**: All 3 new pages accessible at correct URLs
- ✅ **Authentication**: Platform-only pages blocked for tenant users
- ✅ **UI/UX**: Responsive, accessible, dark mode compatible
- ✅ **Data Flow**: Hooks fetch data, cache works, updates trigger re-fetch
- ✅ **Error Handling**: Graceful degradation when backend unavailable
- ✅ **Performance**: Pages load in <2 seconds

---

## 🔧 Troubleshooting

### **Issue: Feature Flags page shows empty**
- **Check**: Browser console for errors
- **Check**: Network tab for failed API calls
- **Solution**: Verify VITE_API_BASE_URL is correct

### **Issue: Cannot access /platform/system/feature-flags**
- **Check**: Logged in as platform admin?
- **Check**: account_type in localStorage is 'platform'
- **Solution**: Logout and login again with platform credentials

### **Issue: Status page shows all metrics as 0**
- **Check**: Backend API running?
- **Expected**: This is normal if backend not implemented
- **Solution**: Backend needs to implement metrics endpoints

---

## 📝 Test Report Template

```markdown
## Feature Flags Testing Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Production/Staging/Local]

### Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Platform Admin Access | ✅ / ❌ | |
| Feature Flag Toggle | ✅ / ❌ | |
| Rollout Percentage Update | ✅ / ❌ | |
| Rollback Function | ✅ / ❌ | |
| Status Page Load | ✅ / ❌ | |
| Announcements Page | ✅ / ❌ | |
| Mobile Responsive | ✅ / ❌ | |
| Dark Mode | ✅ / ❌ | |
| Accessibility | ✅ / ❌ | |

### Issues Found

1. [Issue description]
2. [Issue description]

### Recommendations

1. [Recommendation]
2. [Recommendation]
```

---

## ✅ Next Steps

After testing is complete:

1. **Backend Implementation**:
   - Implement feature flags API endpoints
   - Implement deployment metrics collection
   - Add database migrations for `feature_flags` table

2. **Integration**:
   - Integrate feature flags into Product Catalog
   - Enable progressive rollout
   - Set up monitoring dashboards

3. **Documentation**:
   - Update user documentation
   - Create video tutorials
   - Train support team

---

**Testing Complete!** 🎉

All components are ready for integration with the backend and gradual rollout as per the 8-week deployment plan.
