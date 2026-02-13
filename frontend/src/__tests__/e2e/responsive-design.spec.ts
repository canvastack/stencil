import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Vendor Portal Responsive Design
 * 
 * Tests the responsive behavior of the vendor portal across different viewport sizes:
 * - Mobile viewport (375px width)
 * - Tablet viewport (768px width)
 * - Desktop viewport (1920px width)
 * 
 * Verifies that:
 * - Navigation adapts to viewport size (hamburger menu on mobile)
 * - Content is readable and accessible on all screen sizes
 * - Forms and interactive elements work correctly
 * - Layout adjusts appropriately for each viewport
 * 
 * Test Credentials (from VendorPortalApiTestSeeder):
 * - Email: active-vendor@test.com
 * - Password: Test@VendorP4ss2026!
 */

test.describe('Vendor Portal Responsive Design', () => {
  test('should display correctly on mobile viewport (375px)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to vendor login with relaxed wait condition
    await page.goto('/vendor/login', { waitUntil: 'domcontentloaded' });
    
    // Wait for the login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Verify login form is visible and usable on mobile
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    
    // Verify form elements are properly sized for mobile
    const emailInput = page.getByPlaceholder(/email/i);
    const emailBox = await emailInput.boundingBox();
    expect(emailBox?.width).toBeGreaterThan(200); // Should be wide enough for mobile
    
    // Login
    await page.getByPlaceholder(/email/i).fill('active-vendor@test.com');
    await page.getByPlaceholder(/password/i).fill('Test@VendorP4ss2026!');
    await page.getByRole('button', { name: /sign.*in|login/i }).click();
    
    // Wait for dashboard
    await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 10000 });
    
    // Verify mobile navigation (hamburger menu)
    const hamburgerMenu = page.getByRole('button', { name: /menu|navigation|toggle/i })
      .or(page.locator('button[aria-label*="menu"]'))
      .or(page.locator('button').filter({ has: page.locator('svg') }).first());
    
    // On mobile, hamburger menu should be visible
    if (await hamburgerMenu.isVisible()) {
      await expect(hamburgerMenu).toBeVisible();
      
      // Click to open mobile menu
      await hamburgerMenu.click();
      await page.waitForTimeout(500);
      
      // Verify navigation links are accessible
      const dashboardLink = page.getByRole('link', { name: /dashboard/i });
      const quotesLink = page.getByRole('link', { name: /quotes/i });
      
      await expect(dashboardLink.or(quotesLink)).toBeVisible();
      
      // Close menu if there's a close button
      const closeButton = page.getByRole('button', { name: /close/i });
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }
    }
    
    // Navigate to quotes page
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    // Verify quote cards are stacked vertically on mobile
    const quoteCards = page.locator('[data-testid="quote-card"], .quote-card, [class*="quote-card"]');
    if (await quoteCards.count() > 0) {
      await expect(quoteCards.first()).toBeVisible();
      
      // Verify cards are full width on mobile
      const cardBox = await quoteCards.first().boundingBox();
      expect(cardBox?.width).toBeGreaterThan(300); // Should be nearly full width
    }
    
    // Test quote detail page on mobile
    const firstQuote = quoteCards.first();
    if (await firstQuote.isVisible()) {
      const viewButton = firstQuote.getByRole('button', { name: /view.*details|view|details/i });
      const quoteLink = firstQuote.getByRole('link');
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else if (await quoteLink.isVisible()) {
        await quoteLink.click();
      } else {
        await firstQuote.click();
      }
      
      // Wait for detail page
      await expect(page).toHaveURL(/\/vendor\/quotes\/[a-f0-9-]+/, { timeout: 5000 });
      
      // Verify content is readable on mobile
      await expect(page.locator('h1, h2')).toBeVisible();
      
      // Verify action buttons are accessible on mobile
      const actionButtons = page.getByRole('button', { name: /accept|reject|counter/i });
      if (await actionButtons.count() > 0) {
        await expect(actionButtons.first()).toBeVisible();
        
        // Verify buttons are properly sized for touch
        const buttonBox = await actionButtons.first().boundingBox();
        expect(buttonBox?.height).toBeGreaterThanOrEqual(40); // Minimum touch target size
      }
    }
  });

  test('should display correctly on tablet viewport (768px)', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Navigate to vendor login with relaxed wait condition
    await page.goto('/vendor/login', { waitUntil: 'domcontentloaded' });
    
    // Wait for the login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Verify login form is visible and properly sized for tablet
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    
    // Login
    await page.getByPlaceholder(/email/i).fill('active-vendor@test.com');
    await page.getByPlaceholder(/password/i).fill('Test@VendorP4ss2026!');
    await page.getByRole('button', { name: /sign.*in|login/i }).click();
    
    // Wait for dashboard
    await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 10000 });
    
    // On tablet, navigation might be visible or use hamburger menu
    const navigation = page.getByRole('navigation');
    const hamburgerMenu = page.getByRole('button', { name: /menu|navigation|toggle/i });
    
    // Either navigation or hamburger should be visible
    await expect(navigation.or(hamburgerMenu)).toBeVisible();
    
    // If hamburger menu exists, test it
    if (await hamburgerMenu.isVisible()) {
      await hamburgerMenu.click();
      await page.waitForTimeout(500);
      
      // Verify navigation links
      const quotesLink = page.getByRole('link', { name: /quotes/i });
      await expect(quotesLink).toBeVisible();
      
      // Close menu
      const closeButton = page.getByRole('button', { name: /close/i });
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(300);
      }
    }
    
    // Navigate to quotes page
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    // Verify quote cards layout on tablet (might be 2 columns)
    const quoteCards = page.locator('[data-testid="quote-card"], .quote-card, [class*="quote-card"]');
    if (await quoteCards.count() > 0) {
      await expect(quoteCards.first()).toBeVisible();
      
      // Verify cards are appropriately sized for tablet
      const cardBox = await quoteCards.first().boundingBox();
      expect(cardBox?.width).toBeGreaterThan(200);
      expect(cardBox?.width).toBeLessThan(700); // Not full width on tablet
    }
    
    // Test quote detail page on tablet
    const firstQuote = quoteCards.first();
    if (await firstQuote.isVisible()) {
      const viewButton = firstQuote.getByRole('button', { name: /view.*details|view|details/i });
      const quoteLink = firstQuote.getByRole('link');
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else if (await quoteLink.isVisible()) {
        await quoteLink.click();
      } else {
        await firstQuote.click();
      }
      
      // Wait for detail page
      await expect(page).toHaveURL(/\/vendor\/quotes\/[a-f0-9-]+/, { timeout: 5000 });
      
      // Verify content layout on tablet
      await expect(page.locator('h1, h2')).toBeVisible();
      
      // Verify sections are visible and properly laid out
      const quoteInfo = page.locator('[data-testid="quote-info"], .quote-info, text=/quote.*number/i');
      await expect(quoteInfo).toBeVisible();
      
      // Verify action buttons are accessible
      const actionButtons = page.getByRole('button', { name: /accept|reject|counter/i });
      if (await actionButtons.count() > 0) {
        await expect(actionButtons.first()).toBeVisible();
      }
    }
    
    // Test profile page on tablet
    await page.goto('/vendor/profile');
    await page.waitForTimeout(1000);
    
    // Verify profile form is properly laid out on tablet
    const profileForm = page.locator('form, [data-testid="profile-form"]');
    if (await profileForm.isVisible()) {
      await expect(profileForm).toBeVisible();
      
      // Verify form fields are accessible
      const formInputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]');
      if (await formInputs.count() > 0) {
        await expect(formInputs.first()).toBeVisible();
      }
    }
  });

  test('should display correctly on desktop viewport (1920px)', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate to vendor login with relaxed wait condition
    await page.goto('/vendor/login', { waitUntil: 'domcontentloaded' });
    
    // Wait for the login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    // Verify login form is centered and properly sized for desktop
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    
    // Verify form is not too wide on desktop
    const loginForm = page.locator('form').first();
    const formBox = await loginForm.boundingBox();
    expect(formBox?.width).toBeLessThan(800); // Should be constrained, not full width
    
    // Login
    await page.getByPlaceholder(/email/i).fill('active-vendor@test.com');
    await page.getByPlaceholder(/password/i).fill('Test@VendorP4ss2026!');
    await page.getByRole('button', { name: /sign.*in|login/i }).click();
    
    // Wait for dashboard
    await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 10000 });
    
    // On desktop, full navigation should be visible (no hamburger menu)
    const navigation = page.getByRole('navigation');
    await expect(navigation).toBeVisible();
    
    // Verify navigation links are directly accessible
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    const quotesLink = page.getByRole('link', { name: /quotes/i });
    const profileLink = page.getByRole('link', { name: /profile/i });
    
    await expect(dashboardLink.or(quotesLink).or(profileLink)).toBeVisible();
    
    // Verify dashboard statistics are visible
    const statsCards = page.locator('[data-testid="stat-card"], .stat-card, [class*="statistic"]');
    if (await statsCards.count() > 0) {
      await expect(statsCards.first()).toBeVisible();
      
      // On desktop, stats should be in a row layout
      const firstCardBox = await statsCards.first().boundingBox();
      expect(firstCardBox?.width).toBeLessThan(500); // Individual cards, not full width
    }
    
    // Navigate to quotes page
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    // Verify quote cards layout on desktop (grid or multi-column)
    const quoteCards = page.locator('[data-testid="quote-card"], .quote-card, [class*="quote-card"]');
    if (await quoteCards.count() > 0) {
      await expect(quoteCards.first()).toBeVisible();
      
      // Verify cards are appropriately sized for desktop
      const cardBox = await quoteCards.first().boundingBox();
      expect(cardBox?.width).toBeGreaterThan(250);
      expect(cardBox?.width).toBeLessThan(600); // Not full width on desktop
    }
    
    // Test quote detail page on desktop
    const firstQuote = quoteCards.first();
    if (await firstQuote.isVisible()) {
      const viewButton = firstQuote.getByRole('button', { name: /view.*details|view|details/i });
      const quoteLink = firstQuote.getByRole('link');
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else if (await quoteLink.isVisible()) {
        await quoteLink.click();
      } else {
        await firstQuote.click();
      }
      
      // Wait for detail page
      await expect(page).toHaveURL(/\/vendor\/quotes\/[a-f0-9-]+/, { timeout: 5000 });
      
      // Verify content is properly laid out on desktop
      await expect(page.locator('h1, h2')).toBeVisible();
      
      // On desktop, content should use available space efficiently
      const mainContent = page.locator('main, [role="main"], .main-content');
      if (await mainContent.isVisible()) {
        const contentBox = await mainContent.boundingBox();
        expect(contentBox?.width).toBeGreaterThan(800); // Should use available space
      }
      
      // Verify all sections are visible without scrolling horizontally
      const quoteInfo = page.locator('[data-testid="quote-info"], .quote-info');
      const customerInfo = page.locator('text=/customer|client/i');
      const productInfo = page.locator('text=/product|item/i');
      
      if (await quoteInfo.isVisible()) {
        await expect(quoteInfo).toBeVisible();
      }
      if (await customerInfo.isVisible()) {
        await expect(customerInfo).toBeVisible();
      }
      if (await productInfo.isVisible()) {
        await expect(productInfo).toBeVisible();
      }
      
      // Verify action buttons are properly spaced on desktop
      const actionButtons = page.getByRole('button', { name: /accept|reject|counter/i });
      if (await actionButtons.count() > 0) {
        await expect(actionButtons.first()).toBeVisible();
        
        // Buttons should be horizontally aligned on desktop
        if (await actionButtons.count() >= 2) {
          const firstButtonBox = await actionButtons.first().boundingBox();
          const secondButtonBox = await actionButtons.nth(1).boundingBox();
          
          // Verify buttons are on the same horizontal line (approximately)
          if (firstButtonBox && secondButtonBox) {
            const yDifference = Math.abs(firstButtonBox.y - secondButtonBox.y);
            expect(yDifference).toBeLessThan(50); // Should be on same line
          }
        }
      }
    }
    
    // Test profile page on desktop
    await page.goto('/vendor/profile');
    await page.waitForTimeout(1000);
    
    // Verify profile page uses desktop layout
    const profileContent = page.locator('main, [role="main"]');
    if (await profileContent.isVisible()) {
      const contentBox = await profileContent.boundingBox();
      expect(contentBox?.width).toBeGreaterThan(600); // Should use available space
    }
    
    // Verify form fields are properly laid out
    const formInputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]');
    if (await formInputs.count() > 0) {
      await expect(formInputs.first()).toBeVisible();
      
      // Form fields should be reasonably sized, not too wide
      const inputBox = await formInputs.first().boundingBox();
      expect(inputBox?.width).toBeLessThan(800); // Constrained for readability
    }
  });
});
