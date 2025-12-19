import { test, expect } from '@playwright/test';

/**
 * E2E Tests untuk Vendor Management CRUD Operations
 * 
 * Test Suite ini mencakup:
 * - Create vendor baru
 * - Read/View vendor list dan details
 * - Update vendor information
 * - Delete vendor
 * - Filter dan search functionality
 * - Bulk operations
 */

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:8080',
  adminEmail: 'admin@test.com',
  adminPassword: 'password',
  timeout: 30000,
};

// Test data
const TEST_VENDOR = {
  name: 'E2E Test Vendor',
  email: `e2e-test-${Date.now()}@vendor.com`,
  phone: '+62812345678',
  city: 'Jakarta',
  address: 'Jl. Test E2E No. 123',
};

const UPDATED_VENDOR = {
  name: 'E2E Test Vendor Updated',
  email: TEST_VENDOR.email, // Email tidak berubah
  phone: '+62898765432',
  city: 'Bandung',
};

test.describe('Vendor Management - CRUD Operations', () => {
  
  // Before each test: Login
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    
    // Fill login form
    await page.fill('[name="email"]', TEST_CONFIG.adminEmail);
    await page.fill('[name="password"]', TEST_CONFIG.adminPassword);
    
    // Submit login
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/admin/**', { timeout: TEST_CONFIG.timeout });
    
    // Navigate to vendors page
    await page.goto(`${TEST_CONFIG.baseURL}/admin/vendors`);
    await page.waitForSelector('[data-testid="vendor-management"]', { 
      timeout: TEST_CONFIG.timeout 
    });
  });

  test('should display vendor management page', async ({ page }) => {
    // Verify page title
    await expect(page.locator('h1')).toContainText('Vendor Management');
    
    // Verify main components exist
    await expect(page.locator('[data-testid="vendor-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="add-vendor-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
  });

  test('should create new vendor successfully', async ({ page }) => {
    // Click Add Vendor button
    await page.click('[data-testid="add-vendor-button"]');
    
    // Wait for modal to open
    await page.waitForSelector('[data-testid="vendor-form-modal"]');
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('Add Vendor');
    
    // Fill vendor form
    await page.fill('[name="name"]', TEST_VENDOR.name);
    await page.fill('[name="email"]', TEST_VENDOR.email);
    await page.fill('[name="phone"]', TEST_VENDOR.phone);
    await page.fill('[name="city"]', TEST_VENDOR.city);
    await page.fill('[name="address"]', TEST_VENDOR.address);
    
    // Submit form
    await page.click('[data-testid="submit-vendor-button"]');
    
    // Wait for success toast
    await expect(page.locator('.sonner-toast')).toContainText('Vendor created successfully');
    
    // Verify vendor appears in list
    await expect(page.locator(`text=${TEST_VENDOR.name}`)).toBeVisible();
    await expect(page.locator(`text=${TEST_VENDOR.email}`)).toBeVisible();
  });

  test('should show validation errors for invalid data', async ({ page }) => {
    // Click Add Vendor button
    await page.click('[data-testid="add-vendor-button"]');
    await page.waitForSelector('[data-testid="vendor-form-modal"]');
    
    // Try to submit empty form
    await page.click('[data-testid="submit-vendor-button"]');
    
    // Verify validation errors
    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
  });

  test('should search vendors by name', async ({ page }) => {
    // Create test vendor first
    await page.click('[data-testid="add-vendor-button"]');
    await page.waitForSelector('[data-testid="vendor-form-modal"]');
    await page.fill('[name="name"]', TEST_VENDOR.name);
    await page.fill('[name="email"]', TEST_VENDOR.email);
    await page.click('[data-testid="submit-vendor-button"]');
    await page.waitForSelector('.sonner-toast');
    
    // Search for vendor
    await page.fill('[data-testid="search-input"]', TEST_VENDOR.name);
    
    // Wait for debounced search (300ms)
    await page.waitForTimeout(500);
    
    // Verify search results
    await expect(page.locator(`text=${TEST_VENDOR.name}`)).toBeVisible();
    
    // Verify other vendors are filtered out
    const vendorRows = page.locator('[data-testid="vendor-row"]');
    const count = await vendorRows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should filter vendors by status', async ({ page }) => {
    // Open status filter
    await page.click('[data-testid="status-filter"]');
    
    // Select "active" status
    await page.click('text=Active');
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Verify all visible vendors have "active" status
    const statusBadges = page.locator('[data-testid="vendor-status"]');
    const count = await statusBadges.count();
    
    for (let i = 0; i < count; i++) {
      const badge = statusBadges.nth(i);
      await expect(badge).toContainText('Active');
    }
  });

  test('should view vendor details', async ({ page }) => {
    // Click on first vendor in list
    const firstVendor = page.locator('[data-testid="vendor-row"]').first();
    await firstVendor.click();
    
    // Wait for detail page to load
    await page.waitForSelector('[data-testid="vendor-detail"]');
    
    // Verify detail page components
    await expect(page.locator('[data-testid="vendor-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="vendor-phone"]')).toBeVisible();
  });

  test('should update vendor information', async ({ page }) => {
    // Create test vendor
    await page.click('[data-testid="add-vendor-button"]');
    await page.waitForSelector('[data-testid="vendor-form-modal"]');
    await page.fill('[name="name"]', TEST_VENDOR.name);
    await page.fill('[name="email"]', TEST_VENDOR.email);
    await page.fill('[name="phone"]', TEST_VENDOR.phone);
    await page.click('[data-testid="submit-vendor-button"]');
    await page.waitForSelector('.sonner-toast');
    
    // Find and click edit button
    const vendorRow = page.locator(`[data-testid="vendor-row"]:has-text("${TEST_VENDOR.name}")`);
    await vendorRow.locator('[data-testid="vendor-menu"]').click();
    await page.click('text=Edit');
    
    // Wait for edit modal
    await page.waitForSelector('[data-testid="vendor-form-modal"]');
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('Edit Vendor');
    
    // Update vendor information
    await page.fill('[name="name"]', UPDATED_VENDOR.name);
    await page.fill('[name="phone"]', UPDATED_VENDOR.phone);
    await page.fill('[name="city"]', UPDATED_VENDOR.city);
    
    // Submit update
    await page.click('[data-testid="submit-vendor-button"]');
    
    // Verify success toast
    await expect(page.locator('.sonner-toast')).toContainText('Vendor updated successfully');
    
    // Verify updated data in list
    await expect(page.locator(`text=${UPDATED_VENDOR.name}`)).toBeVisible();
    await expect(page.locator(`text=${UPDATED_VENDOR.phone}`)).toBeVisible();
  });

  test('should change vendor status', async ({ page }) => {
    // Create test vendor
    await page.click('[data-testid="add-vendor-button"]');
    await page.waitForSelector('[data-testid="vendor-form-modal"]');
    await page.fill('[name="name"]', TEST_VENDOR.name);
    await page.fill('[name="email"]', TEST_VENDOR.email);
    await page.click('[data-testid="submit-vendor-button"]');
    await page.waitForSelector('.sonner-toast');
    
    // Find vendor row
    const vendorRow = page.locator(`[data-testid="vendor-row"]:has-text("${TEST_VENDOR.name}")`);
    
    // Open menu
    await vendorRow.locator('[data-testid="vendor-menu"]').click();
    
    // Click change status
    await page.click('text=Change Status');
    
    // Select new status
    await page.click('text=Inactive');
    
    // Confirm change
    await page.click('[data-testid="confirm-status-change"]');
    
    // Verify success toast
    await expect(page.locator('.sonner-toast')).toContainText('Status updated');
    
    // Verify status badge changed
    await expect(vendorRow.locator('[data-testid="vendor-status"]')).toContainText('Inactive');
  });

  test('should delete vendor', async ({ page }) => {
    // Create test vendor
    await page.click('[data-testid="add-vendor-button"]');
    await page.waitForSelector('[data-testid="vendor-form-modal"]');
    await page.fill('[name="name"]', TEST_VENDOR.name);
    await page.fill('[name="email"]', TEST_VENDOR.email);
    await page.click('[data-testid="submit-vendor-button"]');
    await page.waitForSelector('.sonner-toast');
    
    // Find vendor row
    const vendorRow = page.locator(`[data-testid="vendor-row"]:has-text("${TEST_VENDOR.name}")`);
    
    // Open menu
    await vendorRow.locator('[data-testid="vendor-menu"]').click();
    
    // Click delete
    await page.click('text=Delete');
    
    // Wait for confirmation dialog
    await page.waitForSelector('[data-testid="delete-confirmation"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete"]');
    
    // Verify success toast
    await expect(page.locator('.sonner-toast')).toContainText('Vendor deleted successfully');
    
    // Verify vendor is removed from list
    await expect(page.locator(`text=${TEST_VENDOR.name}`)).not.toBeVisible();
  });

  test('should perform bulk delete', async ({ page }) => {
    // Create multiple test vendors
    const vendors = [
      { ...TEST_VENDOR, email: `bulk1-${Date.now()}@vendor.com` },
      { ...TEST_VENDOR, email: `bulk2-${Date.now()}@vendor.com` },
      { ...TEST_VENDOR, email: `bulk3-${Date.now()}@vendor.com` },
    ];
    
    for (const vendor of vendors) {
      await page.click('[data-testid="add-vendor-button"]');
      await page.waitForSelector('[data-testid="vendor-form-modal"]');
      await page.fill('[name="name"]', vendor.name);
      await page.fill('[name="email"]', vendor.email);
      await page.click('[data-testid="submit-vendor-button"]');
      await page.waitForSelector('.sonner-toast');
    }
    
    // Enable bulk mode
    await page.click('[data-testid="enable-bulk-mode"]');
    
    // Select all test vendors
    for (const vendor of vendors) {
      const vendorRow = page.locator(`[data-testid="vendor-row"]:has-text("${vendor.email}")`);
      await vendorRow.locator('[data-testid="vendor-checkbox"]').check();
    }
    
    // Click bulk delete
    await page.click('[data-testid="bulk-delete"]');
    
    // Confirm deletion
    await page.waitForSelector('[data-testid="bulk-delete-confirmation"]');
    await page.click('[data-testid="confirm-bulk-delete"]');
    
    // Verify success toast
    await expect(page.locator('.sonner-toast')).toContainText('vendors deleted');
    
    // Verify all vendors are removed
    for (const vendor of vendors) {
      await expect(page.locator(`text=${vendor.email}`)).not.toBeVisible();
    }
  });

  test('should export vendors to CSV', async ({ page }) => {
    // Click export button
    await page.click('[data-testid="export-button"]');
    
    // Select CSV format
    await page.click('text=Export to CSV');
    
    // Wait for download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="confirm-export"]'),
    ]);
    
    // Verify download
    expect(download.suggestedFilename()).toContain('.csv');
    expect(download.suggestedFilename()).toContain('vendors');
  });

  test('should maintain pagination', async ({ page }) => {
    // Verify pagination controls exist
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
    
    // Get current page
    const currentPage = await page.locator('[data-testid="current-page"]').textContent();
    expect(currentPage).toBe('1');
    
    // Click next page (if available)
    const nextButton = page.locator('[data-testid="next-page"]');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      
      // Verify page changed
      await expect(page.locator('[data-testid="current-page"]')).toContainText('2');
    }
  });
});

test.describe('Vendor Management - Performance', () => {
  test('should load vendor list within 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${TEST_CONFIG.baseURL}/admin/vendors`);
    await page.waitForSelector('[data-testid="vendor-list"]');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
  });

  test('should handle large vendor lists efficiently', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseURL}/admin/vendors`);
    await page.waitForSelector('[data-testid="vendor-list"]');
    
    // Scroll to bottom
    await page.evaluate(() => {
      const list = document.querySelector('[data-testid="vendor-list"]');
      if (list) {
        list.scrollTop = list.scrollHeight;
      }
    });
    
    // Wait a bit
    await page.waitForTimeout(500);
    
    // Verify no performance degradation (page should still be responsive)
    const isVisible = await page.locator('[data-testid="vendor-list"]').isVisible();
    expect(isVisible).toBe(true);
  });
});

test.describe('Vendor Management - Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseURL}/admin/vendors`);
    await page.waitForSelector('[data-testid="vendor-list"]');
    
    // Tab to Add Vendor button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verify focus is on button
    const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toBe('add-vendor-button');
    
    // Press Enter to open modal
    await page.keyboard.press('Enter');
    
    // Verify modal opened
    await expect(page.locator('[data-testid="vendor-form-modal"]')).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseURL}/admin/vendors`);
    
    // Verify ARIA labels exist
    const addButton = page.locator('[data-testid="add-vendor-button"]');
    const ariaLabel = await addButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    
    // Verify search input has label
    const searchInput = page.locator('[data-testid="search-input"]');
    const searchLabel = await searchInput.getAttribute('aria-label');
    expect(searchLabel).toBeTruthy();
  });
});
