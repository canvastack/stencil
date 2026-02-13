import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Vendor Portal Mobile Responsiveness
 * 
 * Tests mobile responsiveness across different devices and browsers:
 * - iOS Safari (iPhone 12, 13, 14)
 * - Android Chrome (Samsung, Pixel)
 * - Tablet devices (iPad, Android tablets)
 * - Touch target verification (min 44x44px)
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7
 * 
 * Test Credentials (from VendorPortalApiTestSeeder):
 * - Email: active-vendor@test.com
 * - Password: Test@VendorP4ss2026!
 */

// Helper function to verify touch target size
async function verifyTouchTarget(element: any, minSize: number = 44) {
  const box = await element.boundingBox();
  if (box) {
    expect(box.width).toBeGreaterThanOrEqual(minSize);
    expect(box.height).toBeGreaterThanOrEqual(minSize);
  }
}

// Helper function to login
async function loginAsVendor(page: any) {
  await page.goto('/vendor/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  
  await page.getByPlaceholder(/email/i).fill('active-vendor@test.com');
  await page.getByPlaceholder(/password/i).fill('Test@VendorP4ss2026!');
  await page.getByRole('button', { name: /sign.*in|login/i }).click();
  
  await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 10000 });
}

test.describe('Mobile Responsiveness - iOS Safari', () => {
  test('should display correctly on iPhone 12 (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsVendor(page);
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    const navigationButtons = page.getByRole('button', { name: /menu|navigation|toggle/i });
    if (await navigationButtons.count() > 0) {
      await verifyTouchTarget(navigationButtons.first());
    }
    
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    const quoteCards = page.locator('[data-testid="quote-card"], .quote-card, [class*="quote-card"]');
    if (await quoteCards.count() > 0) {
      await expect(quoteCards.first()).toBeVisible();
      const cardBox = await quoteCards.first().boundingBox();
      expect(cardBox?.width).toBeGreaterThan(300);
    }
  });

  test('should handle touch interactions on iPhone 13 (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsVendor(page);
    
    const hamburgerMenu = page.getByRole('button', { name: /menu|navigation|toggle/i })
      .or(page.locator('button[aria-label*="menu"]'));
    
    if (await hamburgerMenu.isVisible()) {
      await hamburgerMenu.tap();
      await page.waitForTimeout(500);
      
      const quotesLink = page.getByRole('link', { name: /quotes/i });
      await expect(quotesLink).toBeVisible();
      await verifyTouchTarget(quotesLink);
    }
  });

  test('should display forms correctly on iPhone 14 (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsVendor(page);
    
    await page.goto('/vendor/profile');
    await page.waitForTimeout(1000);
    
    const formInputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]');
    if (await formInputs.count() > 0) {
      const inputBox = await formInputs.first().boundingBox();
      expect(inputBox?.width).toBeGreaterThan(200);
      expect(inputBox?.height).toBeGreaterThanOrEqual(40);
    }
    
    const submitButton = page.getByRole('button', { name: /save|update/i });
    if (await submitButton.isVisible()) {
      await verifyTouchTarget(submitButton);
    }
  });
});

test.describe('Mobile Responsiveness - Android Chrome', () => {
  test('should display correctly on Samsung Galaxy (360x740)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await loginAsVendor(page);
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    const quoteCards = page.locator('[data-testid="quote-card"], .quote-card, [class*="quote-card"]');
    if (await quoteCards.count() > 0) {
      await expect(quoteCards.first()).toBeVisible();
    }
  });

  test('should verify touch targets on Samsung Galaxy', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await loginAsVendor(page);
    
    const buttons = page.getByRole('button');
    const visibleButtons = [];
    
    for (let i = 0; i < await buttons.count(); i++) {
      if (await buttons.nth(i).isVisible()) {
        visibleButtons.push(buttons.nth(i));
      }
    }
    
    for (let i = 0; i < Math.min(visibleButtons.length, 3); i++) {
      await verifyTouchTarget(visibleButtons[i]);
    }
  });

  test('should display correctly on Google Pixel (393x851)', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await loginAsVendor(page);
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    const quoteCards = page.locator('[data-testid="quote-card"], .quote-card, [class*="quote-card"]');
    if (await quoteCards.count() > 0) {
      await expect(quoteCards.first()).toBeVisible();
      const cardBox = await quoteCards.first().boundingBox();
      expect(cardBox?.width).toBeGreaterThan(250);
    }
  });

  test('should verify form interactions on Google Pixel', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 851 });
    await loginAsVendor(page);
    
    await page.goto('/vendor/profile');
    await page.waitForTimeout(1000);
    
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible();
      await emailInput.tap();
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');
    }
  });
});

test.describe('Tablet Responsiveness - iPad', () => {
  test('should display correctly on iPad Pro (1024x1366)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 1366 });
    await loginAsVendor(page);
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    const statsCards = page.locator('[data-testid="stat-card"], .stat-card, [class*="statistic"]');
    if (await statsCards.count() > 0) {
      await expect(statsCards.first()).toBeVisible();
      const cardBox = await statsCards.first().boundingBox();
      expect(cardBox?.width).toBeGreaterThan(150);
      expect(cardBox?.width).toBeLessThan(500);
    }
    
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    const quoteCards = page.locator('[data-testid="quote-card"], .quote-card, [class*="quote-card"]');
    if (await quoteCards.count() > 0) {
      await expect(quoteCards.first()).toBeVisible();
      const cardBox = await quoteCards.first().boundingBox();
      expect(cardBox?.width).toBeGreaterThan(200);
      expect(cardBox?.width).toBeLessThan(700);
    }
  });

  test('should verify touch targets on iPad Pro', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 1366 });
    await loginAsVendor(page);
    
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    const allButtons = page.getByRole('button');
    const buttonCount = await allButtons.count();
    
    if (buttonCount > 0) {
      for (let i = 0; i < Math.min(buttonCount, 10); i++) {
        if (await allButtons.nth(i).isVisible()) {
          await verifyTouchTarget(allButtons.nth(i));
        }
      }
    }
  });

  test('should display correctly on iPad Mini (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginAsVendor(page);
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    const quoteCards = page.locator('[data-testid="quote-card"], .quote-card, [class*="quote-card"]');
    if (await quoteCards.count() > 0) {
      await expect(quoteCards.first()).toBeVisible();
    }
  });

  test('should verify navigation on iPad Mini', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginAsVendor(page);
    
    const navigation = page.getByRole('navigation');
    const hamburgerMenu = page.getByRole('button', { name: /menu|navigation|toggle/i });
    
    await expect(navigation.or(hamburgerMenu)).toBeVisible();
    
    if (await hamburgerMenu.isVisible()) {
      await verifyTouchTarget(hamburgerMenu);
      await hamburgerMenu.tap();
      await page.waitForTimeout(500);
      
      const quotesLink = page.getByRole('link', { name: /quotes/i });
      if (await quotesLink.isVisible()) {
        await verifyTouchTarget(quotesLink);
      }
    }
  });
});

test.describe('Tablet Responsiveness - Android', () => {
  test('should display correctly on Galaxy Tab (800x1280)', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 1280 });
    await loginAsVendor(page);
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    const quoteCards = page.locator('[data-testid="quote-card"], .quote-card, [class*="quote-card"]');
    if (await quoteCards.count() > 0) {
      await expect(quoteCards.first()).toBeVisible();
      const cardBox = await quoteCards.first().boundingBox();
      expect(cardBox?.width).toBeGreaterThan(200);
      expect(cardBox?.width).toBeLessThan(700);
    }
  });

  test('should verify all touch targets on Galaxy Tab', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 1280 });
    await loginAsVendor(page);
    
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    const buttons = page.getByRole('button');
    const visibleButtons = [];
    
    for (let i = 0; i < await buttons.count(); i++) {
      if (await buttons.nth(i).isVisible()) {
        visibleButtons.push(buttons.nth(i));
      }
    }
    
    for (let i = 0; i < Math.min(visibleButtons.length, 5); i++) {
      await verifyTouchTarget(visibleButtons[i]);
    }
  });

  test('should handle profile page on Galaxy Tab', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 1280 });
    await loginAsVendor(page);
    
    await page.goto('/vendor/profile');
    await page.waitForTimeout(1000);
    
    const formInputs = page.locator('input[type="text"], input[type="email"], input[type="tel"]');
    if (await formInputs.count() > 0) {
      await expect(formInputs.first()).toBeVisible();
      
      for (let i = 0; i < await formInputs.count(); i++) {
        const inputBox = await formInputs.nth(i).boundingBox();
        if (inputBox) {
          expect(inputBox.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
    
    const submitButton = page.getByRole('button', { name: /save|update/i });
    if (await submitButton.isVisible()) {
      await verifyTouchTarget(submitButton);
    }
  });
});

test.describe('Touch Target Verification - Comprehensive', () => {
  test('should verify all buttons meet 44x44px minimum touch target on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsVendor(page);
    
    const dashboardButtons = page.getByRole('button');
    for (let i = 0; i < await dashboardButtons.count(); i++) {
      if (await dashboardButtons.nth(i).isVisible()) {
        await verifyTouchTarget(dashboardButtons.nth(i), 44);
      }
    }
    
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    const quoteButtons = page.getByRole('button');
    for (let i = 0; i < await quoteButtons.count(); i++) {
      if (await quoteButtons.nth(i).isVisible()) {
        await verifyTouchTarget(quoteButtons.nth(i), 44);
      }
    }
  });

  test('should verify all links meet 44x44px minimum touch target on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsVendor(page);
    
    const links = page.getByRole('link');
    for (let i = 0; i < await links.count(); i++) {
      if (await links.nth(i).isVisible()) {
        await verifyTouchTarget(links.nth(i), 44);
      }
    }
  });

  test('should verify form inputs meet minimum height for touch on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsVendor(page);
    
    await page.goto('/vendor/profile');
    await page.waitForTimeout(1000);
    
    const inputs = page.locator('input, textarea, select');
    for (let i = 0; i < await inputs.count(); i++) {
      if (await inputs.nth(i).isVisible()) {
        const box = await inputs.nth(i).boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    }
  });

  test('should verify quote detail page touch targets on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsVendor(page);
    
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    const quoteCards = page.locator('[data-testid="quote-card"], .quote-card, [class*="quote-card"]');
    if (await quoteCards.count() > 0) {
      await quoteCards.first().click();
      await expect(page).toHaveURL(/\/vendor\/quotes\/[a-f0-9-]+/, { timeout: 5000 });
      
      const actionButtons = page.getByRole('button', { name: /accept|reject|counter/i });
      if (await actionButtons.count() > 0) {
        for (let i = 0; i < await actionButtons.count(); i++) {
          await verifyTouchTarget(actionButtons.nth(i), 44);
        }
      }
    }
  });
});
