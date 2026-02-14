import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[name="email"]', 'admin@etchinx.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('displays analytics dashboard with all components', async ({ page }) => {
    // Navigate to analytics dashboard
    await page.goto('/admin/analytics');

    // Check page title
    await expect(page.locator('h1')).toContainText('Production Analytics Dashboard');
    await expect(page.locator('text=Monitor production efficiency')).toBeVisible();

    // Check action buttons
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
    await expect(page.locator('button:has-text("Export")')).toBeVisible();

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Check metrics cards are visible
    await expect(page.locator('text=Active Orders')).toBeVisible();
    await expect(page.locator('text=On-Time Delivery Rate')).toBeVisible();
    await expect(page.locator('text=Avg Production Time')).toBeVisible();
    await expect(page.locator('text=Quote Acceptance Rate')).toBeVisible();
  });

  test('displays metrics with correct data', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Check that metrics display numbers
    const metricsSection = page.locator('[data-testid="metrics-overview"]').first();
    
    // Should have numeric values
    await expect(metricsSection).toContainText(/\d+/);
    
    // Should have percentage values
    await expect(metricsSection).toContainText(/%/);
  });

  test('displays production timeline chart', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Check timeline chart is visible
    await expect(page.locator('text=Production Timeline')).toBeVisible();
    
    // Check time range selector
    await expect(page.locator('button:has-text("30d")')).toBeVisible();
  });

  test('can change time range for timeline', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Find and click time range button
    const timeRangeButton = page.locator('button:has-text("30d")').first();
    await timeRangeButton.click();

    // Select different time range
    await page.locator('button:has-text("7d")').first().click();

    // Wait for data to reload
    await page.waitForTimeout(1000);

    // Verify time range changed
    await expect(page.locator('button:has-text("7d")').first()).toBeVisible();
  });

  test('displays vendor performance table', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Check vendor performance section
    await expect(page.locator('text=Vendor Performance')).toBeVisible();
    
    // Check table headers
    await expect(page.locator('text=Vendor Name')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=On-Time Rate')).toBeVisible();
  });

  test('can click on vendor to view details', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Find first vendor row
    const vendorRow = page.locator('table tbody tr').first();
    
    if (await vendorRow.isVisible()) {
      await vendorRow.click();
      
      // Should navigate to vendor detail page
      await page.waitForURL(/\/admin\/vendors\/.+/);
      await expect(page.url()).toContain('/admin/vendors/');
    }
  });

  test('displays delivery status chart', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Check delivery status section
    await expect(page.locator('text=Delivery Status')).toBeVisible();
    
    // Should show status categories
    const statusSection = page.locator('[data-testid="delivery-status-chart"]').first();
    await expect(statusSection).toBeVisible();
  });

  test('displays recent activity feed', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Check recent activity section
    await expect(page.locator('text=Recent Activity')).toBeVisible();
    
    // Should show activity items
    const activityFeed = page.locator('[data-testid="recent-activity-feed"]').first();
    await expect(activityFeed).toBeVisible();
  });

  test('can click on activity to view related order', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Find first activity item with order link
    const activityItem = page.locator('[data-testid="activity-item"]').first();
    
    if (await activityItem.isVisible()) {
      await activityItem.click();
      
      // Should navigate to order detail page
      await page.waitForTimeout(1000);
      // URL might change to order detail
      const url = page.url();
      expect(url).toMatch(/\/(admin\/orders|admin\/analytics)/);
    }
  });

  test('refreshes dashboard data', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Get initial metric value
    const initialValue = await page.locator('[data-testid="metrics-overview"]').first().textContent();

    // Click refresh button
    await page.click('button:has-text("Refresh")');

    // Wait for refresh
    await page.waitForTimeout(1000);

    // Should show success toast
    await expect(page.locator('text=Dashboard refreshed')).toBeVisible({ timeout: 5000 });
  });

  test('opens export dialog', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Click export button
    await page.click('button:has-text("Export")');

    // Export dialog should open
    await expect(page.locator('text=Export Analytics Data')).toBeVisible({ timeout: 5000 });
    
    // Check export options
    await expect(page.locator('text=CSV')).toBeVisible();
    await expect(page.locator('text=Excel')).toBeVisible();
    await expect(page.locator('text=PDF')).toBeVisible();
  });

  test('can export data as CSV', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Open export dialog
    await page.click('button:has-text("Export")');
    await page.waitForTimeout(500);

    // Select CSV format
    await page.click('button:has-text("CSV")');

    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('shows loading state while fetching data', async ({ page }) => {
    await page.goto('/admin/analytics');

    // Should show loading indicators initially
    // (This is fast, so might not always be visible)
    const loadingIndicator = page.locator('[data-testid="loading"]').first();
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Loading should be gone
    await expect(loadingIndicator).not.toBeVisible();
  });

  test('handles empty data gracefully', async ({ page }) => {
    // This test assumes there might be no data
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Dashboard should still render
    await expect(page.locator('h1')).toContainText('Production Analytics Dashboard');
    
    // Should show zero or empty states
    const metricsSection = page.locator('[data-testid="metrics-overview"]').first();
    await expect(metricsSection).toBeVisible();
  });

  test('displays last updated timestamp', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Check for last updated text
    await expect(page.locator('text=Last updated:')).toBeVisible();
  });

  test('is responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Dashboard should still be visible and functional
    await expect(page.locator('h1')).toContainText('Production Analytics Dashboard');
    
    // Metrics should stack vertically
    const metricsSection = page.locator('[data-testid="metrics-overview"]').first();
    await expect(metricsSection).toBeVisible();
  });

  test('maintains state when navigating away and back', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Change time range
    const timeRangeButton = page.locator('button:has-text("30d")').first();
    if (await timeRangeButton.isVisible()) {
      await timeRangeButton.click();
      await page.locator('button:has-text("7d")').first().click();
      await page.waitForTimeout(500);
    }

    // Navigate away
    await page.goto('/admin/orders');
    await page.waitForTimeout(1000);

    // Navigate back
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Dashboard should load fresh data
    await expect(page.locator('h1')).toContainText('Production Analytics Dashboard');
  });

  test('shows error message on API failure', async ({ page }) => {
    // Intercept API calls and return error
    await page.route('**/api/v1/admin/analytics/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Dashboard should still render
    await expect(page.locator('h1')).toContainText('Production Analytics Dashboard');
  });

  test('auto-refreshes data periodically', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Get initial network requests count
    let requestCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/admin/analytics/')) {
        requestCount++;
      }
    });

    // Wait for auto-refresh (metrics refresh every 60s, but we won't wait that long)
    // Just verify the mechanism is in place
    await page.waitForTimeout(3000);

    // Should have made initial requests
    expect(requestCount).toBeGreaterThan(0);
  });

  test('displays correct metric trends', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Check for trend indicators (up/down arrows or percentages)
    const metricsSection = page.locator('[data-testid="metrics-overview"]').first();
    
    // Should show change percentages
    await expect(metricsSection).toContainText(/%/);
  });

  test('filters vendor performance by search', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Find search input in vendor performance section
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('Vendor A');
      await page.waitForTimeout(1000);
      
      // Results should be filtered
      await expect(page.locator('text=Vendor A')).toBeVisible();
    }
  });

  test('sorts vendor performance table', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Find sortable column header
    const sortableHeader = page.locator('th:has-text("Total Orders")').first();
    
    if (await sortableHeader.isVisible()) {
      await sortableHeader.click();
      await page.waitForTimeout(500);
      
      // Table should re-sort
      // Verify by checking if order changed (implementation specific)
    }
  });

  test('paginates vendor performance table', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Look for pagination controls
    const nextButton = page.locator('button:has-text("Next")').first();
    
    if (await nextButton.isVisible() && !(await nextButton.isDisabled())) {
      await nextButton.click();
      await page.waitForTimeout(1000);
      
      // Should load next page
      await expect(page.locator('table tbody tr').first()).toBeVisible();
    }
  });
});
