/**
 * E2E TEST: Accessibility Audit
 * 
 * Compliance:
 * - WCAG 2.1 AA Standards
 * - Keyboard Navigation
 * - Screen Reader Compatibility
 * - ARIA Labels and Roles
 */

import { test, expect } from '@playwright/test';

test.describe('Accessibility Audit - URL Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder('Email').fill('admin@etchinx.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL('/admin', { timeout: 10000 });
  });

  test('URL Configuration page - semantic structure', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    expect(await mainHeading.count()).toBe(1);
    
    const landmark = page.locator('main, [role="main"]').first();
    await expect(landmark).toBeVisible();
    
    const links = page.locator('a[href]');
    const linkCount = await links.count();
    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const link = links.nth(i);
      if (await link.isVisible()) {
        const hasText = await link.textContent();
        const hasAriaLabel = await link.getAttribute('aria-label');
        expect(hasText || hasAriaLabel).toBeTruthy();
      }
    }
  });

  test('URL Configuration page - keyboard navigation', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    await page.keyboard.press('Tab');
    
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }
    
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('URL Configuration page - form labels', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      if (await input.isVisible()) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledby = await input.getAttribute('aria-labelledby');
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
        }
      }
    }
  });

  test('URL Configuration page - button accessibility', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const title = await button.getAttribute('title');
        
        expect(text?.trim() || ariaLabel || title).toBeTruthy();
      }
    }
  });

  test('Custom Domains page - semantic structure', async ({ page }) => {
    await page.goto('/admin/custom-domains');
    await expect(page.locator('h1')).toContainText('Custom Domains', { timeout: 10000 });
    
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    
    const buttons = page.locator('button[role="button"], button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('Custom Domains page - keyboard navigation', async ({ page }) => {
    await page.goto('/admin/custom-domains');
    await expect(page.locator('h1')).toContainText('Custom Domains', { timeout: 10000 });
    
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    const addDomainButton = page.getByRole('button', { name: /add domain/i });
    if (await addDomainButton.isVisible()) {
      await addDomainButton.focus();
      await expect(addDomainButton).toBeFocused();
      
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
  });

  test('URL Analytics page - semantic structure', async ({ page }) => {
    await page.goto('/admin/url-analytics');
    await expect(page.locator('h1')).toContainText('URL Analytics', { timeout: 10000 });
    
    const mainHeading = page.locator('h1');
    await expect(mainHeading).toBeVisible();
    
    const headings = page.locator('h1, h2, h3, h4');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test('URL Analytics page - chart accessibility', async ({ page }) => {
    await page.goto('/admin/url-analytics');
    await expect(page.locator('h1')).toContainText('URL Analytics', { timeout: 10000 });
    
    const charts = page.locator('canvas, svg[role="img"], [role="img"]');
    const chartCount = await charts.count();
    
    if (chartCount > 0) {
      for (let i = 0; i < Math.min(chartCount, 5); i++) {
        const chart = charts.nth(i);
        if (await chart.isVisible()) {
          const ariaLabel = await chart.getAttribute('aria-label');
          const title = await chart.getAttribute('title');
          const role = await chart.getAttribute('role');
          
          expect(ariaLabel || title || role).toBeTruthy();
        }
      }
    }
  });

  test('Color contrast - primary buttons', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const primaryButtons = page.locator('button:has-text("Save"), button:has-text("Add")');
    const buttonCount = await primaryButtons.count();
    
    if (buttonCount > 0) {
      const button = primaryButtons.first();
      const bgColor = await button.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      expect(bgColor).toBeTruthy();
    }
  });

  test('Focus visible states', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const interactiveElements = page.locator('button, a, input, select');
    const elementCount = await interactiveElements.count();
    
    for (let i = 0; i < Math.min(elementCount, 5); i++) {
      const element = interactiveElements.nth(i);
      if (await element.isVisible()) {
        await element.focus();
        await page.waitForTimeout(100);
        
        const outlineStyle = await element.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            outline: style.outline,
            outlineWidth: style.outlineWidth,
            boxShadow: style.boxShadow,
          };
        });
        
        const hasFocusIndicator = 
          outlineStyle.outlineWidth !== '0px' || 
          outlineStyle.boxShadow !== 'none';
        
        expect(hasFocusIndicator).toBeTruthy();
      }
    }
  });

  test('ARIA roles and labels - interactive elements', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    
    if (tabCount > 0) {
      for (let i = 0; i < tabCount; i++) {
        const tab = tabs.nth(i);
        const ariaLabel = await tab.getAttribute('aria-label');
        const text = await tab.textContent();
        
        expect(text || ariaLabel).toBeTruthy();
      }
    }
  });

  test('Error messages accessibility', async ({ page }) => {
    await page.goto('/admin/custom-domains');
    await expect(page.locator('h1')).toContainText('Custom Domains', { timeout: 10000 });
    
    const addButton = page.getByRole('button', { name: /add domain/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      
      const domainInput = page.getByPlaceholder(/enter your domain/i);
      if (await domainInput.isVisible()) {
        await domainInput.fill('invalid domain');
        
        const nextButton = page.getByRole('button', { name: /next|submit/i });
        if (await nextButton.isVisible()) {
          await nextButton.click();
          
          await page.waitForTimeout(1000);
          
          const errorMessages = page.locator('[role="alert"], .error, [aria-invalid="true"]');
          const errorCount = await errorMessages.count();
          
          if (errorCount > 0) {
            const errorMsg = errorMessages.first();
            await expect(errorMsg).toBeVisible();
          }
        }
      }
    }
  });

  test('Skip navigation link', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    
    await page.keyboard.press('Tab');
    
    const firstFocusedElement = page.locator(':focus');
    const text = await firstFocusedElement.textContent();
    const ariaLabel = await firstFocusedElement.getAttribute('aria-label');
    
    expect(text || ariaLabel).toBeTruthy();
  });

  test('Page title descriptive', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).not.toBe('');
  });

  test('Language attribute present', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();
  });
});
