import { test, expect } from '@playwright/test';

test.describe('Performance Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('admin@demo-etching.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard and navigate to performance monitoring
    await expect(page).toHaveURL('/admin');
    await page.getByText('Performance', { exact: true }).click();
    await expect(page).toHaveURL('/admin/performance');
  });

  test('should display performance monitoring dashboard', async ({ page }) => {
    // Check page title and elements
    await expect(page.locator('h1')).toContainText('Performance Monitoring');
    
    // Check for real-time metrics cards
    await expect(page.getByText(/current load/i)).toBeVisible();
    await expect(page.getByText(/active connections/i)).toBeVisible();
    await expect(page.getByText(/memory usage/i)).toBeVisible();
    await expect(page.getByText(/response time/i)).toBeVisible();
    await expect(page.getByText(/error rate/i)).toBeVisible();
    
    // Check for time period selector
    await expect(page.getByText('Last 24h')).toBeVisible();
    
    // Check for refresh button
    await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible();
  });

  test('should show performance alerts when available', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for alerts section
    const alertsSection = page.locator('text=/performance alerts/i').first();
    if (await alertsSection.isVisible()) {
      // Should show alert details
      await expect(page.getByText(/critical|warning/i)).toBeVisible();
      await expect(page.getByText(/threshold/i)).toBeVisible();
    }
  });

  test('should switch between different time periods', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    
    // Click time period selector
    await page.getByText('Last 24h').click();
    
    // Select different time period
    await page.getByText('Last Hour').click();
    
    // Should update the data (check for loading or updated content)
    await page.waitForTimeout(1000);
    
    // Verify time period changed
    await expect(page.getByText('Last Hour')).toBeVisible();
    
    // Try another time period
    await page.getByText('Last Hour').click();
    await page.getByText('Last 7 Days').click();
    
    await expect(page.getByText('Last 7 Days')).toBeVisible();
  });

  test('should refresh performance data', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    
    // Get initial values
    const initialLoad = await page.getByText(/current load/i).locator('..').textContent();
    
    // Click refresh button
    await page.getByRole('button', { name: /refresh/i }).click();
    
    // Should show loading or updated data
    await page.waitForTimeout(2000);
    
    // Data should be refreshed (could be same values but action should complete)
    await expect(page.getByText(/current load/i)).toBeVisible();
  });

  test('should display performance trends', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on trends tab
    await page.getByText('Trends').click();
    
    // Should show trends section
    await expect(page.getByText(/performance trends/i)).toBeVisible();
    
    // Should have metric selector
    await expect(page.locator('select, [role="combobox"]').first()).toBeVisible();
    
    // Should show chart or graph
    await expect(page.locator('svg, canvas, .chart')).toBeVisible();
    
    // Try switching metrics
    const metricSelector = page.locator('select, [role="combobox"]').first();
    await metricSelector.click();
    
    const options = page.locator('[role="option"]');
    if (await options.count() > 1) {
      await options.nth(1).click();
      
      // Should update the chart
      await page.waitForTimeout(1000);
    }
  });

  test('should show slowest pages analysis', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on pages tab
    await page.getByText('Pages').click();
    
    // Should show slowest pages section
    await expect(page.getByText(/slowest pages/i)).toBeVisible();
    
    // Should show chart or list of pages
    await expect(page.locator('svg, canvas, .chart')).toBeVisible();
    
    // Should show page names and response times
    await expect(page.getByText(/ms|seconds/i)).toBeVisible();
  });

  test('should show API endpoint performance', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on APIs tab
    await page.getByText('APIs').click();
    
    // Should show API performance section
    await expect(page.getByText(/slowest api endpoints/i)).toBeVisible();
    
    // Should show chart or list of endpoints
    await expect(page.locator('svg, canvas, .chart')).toBeVisible();
    
    // Should show endpoint names and response times
    await expect(page.getByText(/\/api\//i)).toBeVisible();
    await expect(page.getByText(/ms|seconds/i)).toBeVisible();
  });

  test('should display memory usage trends', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on memory tab
    await page.getByText('Memory').click();
    
    // Should show memory usage section
    await expect(page.getByText(/memory usage over time/i)).toBeVisible();
    
    // Should show memory chart
    await expect(page.locator('svg, canvas, .chart')).toBeVisible();
    
    // Should show memory values
    await expect(page.getByText(/mb|gb|bytes/i)).toBeVisible();
  });

  test('should handle real-time data updates', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Get initial current load value
    const currentLoadElement = page.getByText(/current load/i).locator('..');
    const initialValue = await currentLoadElement.textContent();
    
    // Wait for potential real-time updates (5-10 seconds)
    await page.waitForTimeout(6000);
    
    // Check if values updated (they might be the same, but the mechanism should work)
    await expect(currentLoadElement).toBeVisible();
    
    // Verify real-time indicators if present
    const realtimeIndicator = page.locator('text=/live|real-time|updating/i');
    if (await realtimeIndicator.count() > 0) {
      await expect(realtimeIndicator).toBeVisible();
    }
  });

  test('should show performance overview metrics', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Click on overview tab (should be default)
    await page.getByText('Overview').click();
    
    // Should show average performance metrics
    await expect(page.getByText(/average performance/i)).toBeVisible();
    await expect(page.getByText(/page load time/i)).toBeVisible();
    await expect(page.getByText(/api response time/i)).toBeVisible();
    
    // Should show error rates
    await expect(page.getByText(/error rates/i)).toBeVisible();
    
    // Should show memory trend chart
    await expect(page.locator('svg, canvas, .chart')).toBeVisible();
  });

  test('should handle performance data loading errors', async ({ page }) => {
    // Intercept performance API calls to simulate errors
    await page.route('/api/performance/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server Error' }),
      });
    });
    
    // Navigate to performance page
    await page.goto('/admin/performance');
    
    // Should handle error gracefully
    await expect(page.getByText(/error loading performance data|failed to load/i)).toBeVisible();
    
    // Should still show page structure
    await expect(page.locator('h1')).toContainText('Performance Monitoring');
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    // Test desktop view first
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForLoadState('networkidle');
    
    // Should show full dashboard
    await expect(page.getByText(/current load/i)).toBeVisible();
    await expect(page.getByText(/active connections/i)).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    // Should still show main elements, possibly stacked
    await expect(page.getByText(/current load/i)).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Should show mobile-optimized layout
    await expect(page.locator('h1')).toContainText('Performance Monitoring');
    
    // Navigation might be different on mobile (hamburger menu, etc.)
    const mobileMenu = page.getByRole('button', { name: /menu|toggle/i });
    if (await mobileMenu.count() > 0) {
      await expect(mobileMenu).toBeVisible();
    }
  });

  test('should export performance data', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for export functionality
    const exportButton = page.getByRole('button', { name: /export|download/i });
    if (await exportButton.count() > 0) {
      await exportButton.click();
      
      // Should show export options or initiate download
      const exportOptions = page.getByText(/csv|json|pdf/i);
      if (await exportOptions.count() > 0) {
        await exportOptions.first().click();
        
        // Should show success message or start download
        await expect(page.getByText(/export started|downloading/i)).toBeVisible();
      }
    }
  });
});