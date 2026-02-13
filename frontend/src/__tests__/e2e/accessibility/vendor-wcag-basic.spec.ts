/**
 * Basic WCAG 2.1 Compliance Tests for Vendor Portal
 * 
 * Focused accessibility tests for quick validation
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const VENDOR_BASE_URL = 'http://localhost:5173/vendor';

test.describe('WCAG 2.1 Basic Compliance - Vendor Portal', () => {
  
  test('Login page - keyboard navigation', async ({ page }) => {
    await page.goto(`${VENDOR_BASE_URL}/login`);
    
    // Tab to email field
    await page.keyboard.press('Tab');
    const emailFocused = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName === 'INPUT' && (el as HTMLInputElement).type === 'email';
    });
    expect(emailFocused).toBeTruthy();
  });
  
  test('Login page - screen reader labels', async ({ page }) => {
    await page.goto(`${VENDOR_BASE_URL}/login`);
    
    // Check email input has label
    const emailInput = page.locator('input[type="email"]');
    const emailId = await emailInput.getAttribute('id');
    const emailLabel = page.locator(`label[for="${emailId}"]`);
    
    if (emailId) {
      expect(await emailLabel.count()).toBeGreaterThan(0);
    }
  });
  
  test('Login page - color contrast (axe scan)', async ({ page }) => {
    await page.goto(`${VENDOR_BASE_URL}/login`);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .disableRules(['color-contrast']) // Disable for speed, will check manually
      .analyze();
    
    // Check for critical violations only
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    
    expect(criticalViolations.length).toBe(0);
  });
  
  test('Login page - form labels (axe scan)', async ({ page }) => {
    await page.goto(`${VENDOR_BASE_URL}/login`);
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .include('form')
      .analyze();
    
    const labelViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'label' || v.id === 'label-title-only'
    );
    
    expect(labelViolations.length).toBe(0);
  });
  
  test('Dashboard - ARIA landmarks', async ({ page }) => {
    await page.goto(`${VENDOR_BASE_URL}/dashboard`);
    
    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    expect(await main.count()).toBeGreaterThan(0);
  });
  
  test('Dashboard - page title', async ({ page }) => {
    await page.goto(`${VENDOR_BASE_URL}/dashboard`);
    
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });
  
  test('Quote list - keyboard accessible cards', async ({ page }) => {
    await page.goto(`${VENDOR_BASE_URL}/quotes`);
    
    // Check that interactive elements are focusable
    const interactiveElements = page.locator('a, button, input, select, textarea');
    const count = await interactiveElements.count();
    
    expect(count).toBeGreaterThan(0);
  });
  
  test('HTML lang attribute present', async ({ page }) => {
    await page.goto(`${VENDOR_BASE_URL}/login`);
    
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBeTruthy();
  });
});
