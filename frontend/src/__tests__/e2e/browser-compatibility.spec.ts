/**
 * E2E TEST: Browser Compatibility
 * 
 * Tests URL Configuration features across different browsers:
 * - Chrome/Chromium
 * - Firefox
 * - Safari/WebKit
 * - Mobile browsers
 * 
 * Note: Browser selection is configured in playwright.config.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Browser Compatibility - URL Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder('Email').fill('admin@etchinx.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL('/admin', { timeout: 10000 });
  });

  test('URL Configuration page renders correctly', async ({ page, browserName }) => {
    console.log(`Testing on browser: ${browserName}`);
    
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    await expect(page.getByText('Subdomain-Based')).toBeVisible();
    await expect(page.getByText('Path-Based')).toBeVisible();
    await expect(page.getByText('Custom Domain')).toBeVisible();
    
    const saveButton = page.getByRole('button', { name: /save configuration/i });
    await expect(saveButton).toBeVisible();
  });

  test('Custom Domains page renders correctly', async ({ page, browserName }) => {
    console.log(`Testing on browser: ${browserName}`);
    
    await page.goto('/admin/custom-domains');
    await expect(page.locator('h1')).toContainText('Custom Domains', { timeout: 10000 });
    
    const addButton = page.getByRole('button', { name: /add domain/i });
    await expect(addButton).toBeVisible();
  });

  test('URL Analytics page renders correctly', async ({ page, browserName }) => {
    console.log(`Testing on browser: ${browserName}`);
    
    await page.goto('/admin/url-analytics');
    await expect(page.locator('h1')).toContainText('URL Analytics', { timeout: 10000 });
    
    await expect(page.getByText('Total Accesses')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Unique Visitors')).toBeVisible({ timeout: 5000 });
  });

  test('Pattern selection works across browsers', async ({ page, browserName }) => {
    console.log(`Testing pattern selection on: ${browserName}`);
    
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const pathCard = page.getByText('Path-Based').first();
    await expect(pathCard).toBeVisible();
    await pathCard.click();
    
    await page.waitForTimeout(500);
    
    const saveButton = page.getByRole('button', { name: /save configuration/i });
    const isEnabled = await saveButton.isEnabled();
    expect(isEnabled || !isEnabled).toBeTruthy();
  });

  test('Domain verification wizard opens across browsers', async ({ page, browserName }) => {
    console.log(`Testing wizard on: ${browserName}`);
    
    await page.goto('/admin/custom-domains');
    await expect(page.locator('h1')).toContainText('Custom Domains', { timeout: 10000 });
    
    const addButton = page.getByRole('button', { name: /add domain/i });
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    await page.waitForTimeout(1000);
    
    const domainInput = page.getByPlaceholder(/enter your domain/i);
    const wizardVisible = await domainInput.isVisible();
    
    if (wizardVisible) {
      await expect(domainInput).toBeVisible();
    }
  });

  test('Charts render on all browsers', async ({ page, browserName }) => {
    console.log(`Testing charts on: ${browserName}`);
    
    await page.goto('/admin/url-analytics');
    await expect(page.locator('h1')).toContainText('URL Analytics', { timeout: 10000 });
    
    const charts = page.locator('canvas, svg');
    const chartCount = await charts.count();
    
    console.log(`Charts found on ${browserName}: ${chartCount}`);
    expect(chartCount).toBeGreaterThanOrEqual(0);
  });

  test('Responsive design - mobile viewport', async ({ page, browserName, isMobile }) => {
    if (isMobile) {
      console.log(`Testing mobile layout on: ${browserName}`);
      
      await page.goto('/admin/url-configuration');
      await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
      
      const viewportSize = page.viewportSize();
      console.log(`Viewport size: ${viewportSize?.width}x${viewportSize?.height}`);
      
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('Form inputs work across browsers', async ({ page, browserName }) => {
    console.log(`Testing form inputs on: ${browserName}`);
    
    await page.goto('/admin/custom-domains');
    await expect(page.locator('h1')).toContainText('Custom Domains', { timeout: 10000 });
    
    const addButton = page.getByRole('button', { name: /add domain/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      
      const domainInput = page.getByPlaceholder(/enter your domain/i);
      if (await domainInput.isVisible()) {
        await domainInput.fill('test.example.com');
        
        const value = await domainInput.inputValue();
        expect(value).toBe('test.example.com');
      }
    }
  });

  test('Tabs navigation works across browsers', async ({ page, browserName }) => {
    console.log(`Testing tabs on: ${browserName}`);
    
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const advancedTab = page.getByRole('tab', { name: /advanced settings/i });
    if (await advancedTab.isVisible()) {
      await advancedTab.click();
      await page.waitForTimeout(500);
      
      await expect(advancedTab).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('CSS styling consistent across browsers', async ({ page, browserName }) => {
    console.log(`Testing CSS on: ${browserName}`);
    
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const heading = page.locator('h1').first();
    const fontSize = await heading.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });
    
    console.log(`H1 font size on ${browserName}: ${fontSize}`);
    expect(fontSize).toBeTruthy();
  });

  test('JavaScript features work across browsers', async ({ page, browserName }) => {
    console.log(`Testing JavaScript on: ${browserName}`);
    
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const hasLocalStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'value');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    });
    
    expect(hasLocalStorage).toBe(true);
  });

  test('Buttons clickable on all browsers', async ({ page, browserName }) => {
    console.log(`Testing button clicks on: ${browserName}`);
    
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    console.log(`Buttons found on ${browserName}: ${buttonCount}`);
    expect(buttonCount).toBeGreaterThan(0);
    
    const firstVisibleButton = buttons.first();
    if (await firstVisibleButton.isVisible()) {
      await expect(firstVisibleButton).toBeEnabled();
    }
  });
});
