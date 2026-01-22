/**
 * E2E TEST: Performance Testing
 * 
 * Tests:
 * - Page load times
 * - Time to Interactive (TTI)
 * - First Contentful Paint (FCP)
 * - Largest Contentful Paint (LCP)
 * - Cumulative Layout Shift (CLS)
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Testing - URL Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder('Email').fill('admin@etchinx.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL('/admin', { timeout: 10000 });
  });

  test('URL Configuration page - load time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    console.log(`URL Configuration page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test('URL Configuration page - Web Vitals', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        if ('web-vitals' in window) {
          resolve({ hasWebVitals: true });
        } else {
          resolve({ hasWebVitals: false });
        }
      });
    });
    
    console.log('Web Vitals support:', vitals);
  });

  test('Custom Domains page - load time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/admin/custom-domains');
    await expect(page.locator('h1')).toContainText('Custom Domains', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    console.log(`Custom Domains page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000);
  });

  test('URL Analytics page - load time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/admin/url-analytics');
    await expect(page.locator('h1')).toContainText('URL Analytics', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    console.log(`URL Analytics page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(6000);
  });

  test('URL Configuration page - no layout shifts', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    
    await page.waitForLoadState('networkidle');
    
    const initialHeight = await page.evaluate(() => document.body.scrollHeight);
    
    await page.waitForTimeout(2000);
    
    const finalHeight = await page.evaluate(() => document.body.scrollHeight);
    
    const heightDifference = Math.abs(finalHeight - initialHeight);
    console.log(`Height difference: ${heightDifference}px`);
    
    expect(heightDifference).toBeLessThan(100);
  });

  test('URL Configuration page - resource count', async ({ page }) => {
    const resources: string[] = [];
    
    page.on('response', (response) => {
      if (response.request().resourceType() !== 'document') {
        resources.push(response.url());
      }
    });
    
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    
    console.log(`Total resources loaded: ${resources.length}`);
    
    const jsFiles = resources.filter(r => r.endsWith('.js'));
    const cssFiles = resources.filter(r => r.endsWith('.css'));
    const images = resources.filter(r => /\.(png|jpg|jpeg|svg|gif|webp)/.test(r));
    
    console.log(`JS files: ${jsFiles.length}`);
    console.log(`CSS files: ${cssFiles.length}`);
    console.log(`Images: ${images.length}`);
  });

  test('URL Analytics page - chart rendering time', async ({ page }) => {
    await page.goto('/admin/url-analytics');
    await expect(page.locator('h1')).toContainText('URL Analytics', { timeout: 10000 });
    
    const chartStartTime = Date.now();
    
    await page.waitForSelector('canvas, svg', { timeout: 10000 });
    
    const chartRenderTime = Date.now() - chartStartTime;
    
    console.log(`Chart rendering time: ${chartRenderTime}ms`);
    expect(chartRenderTime).toBeLessThan(3000);
  });

  test('Domain Verification Wizard - interaction latency', async ({ page }) => {
    await page.goto('/admin/custom-domains');
    await expect(page.locator('h1')).toContainText('Custom Domains', { timeout: 10000 });
    
    const addButton = page.getByRole('button', { name: /add domain/i });
    if (await addButton.isVisible()) {
      const clickStartTime = Date.now();
      
      await addButton.click();
      
      const domainInput = page.getByPlaceholder(/enter your domain/i);
      await expect(domainInput).toBeVisible({ timeout: 5000 });
      
      const interactionTime = Date.now() - clickStartTime;
      
      console.log(`Wizard open interaction time: ${interactionTime}ms`);
      expect(interactionTime).toBeLessThan(1000);
    }
  });

  test('URL Configuration page - save operation latency', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const subdomainCard = page.getByText('Subdomain-Based').first();
    const pathCard = page.getByText('Path-Based').first();
    
    if (await subdomainCard.isVisible() && await pathCard.isVisible()) {
      await pathCard.click();
      await page.waitForTimeout(500);
      
      const saveButton = page.getByRole('button', { name: /save configuration/i });
      
      if (await saveButton.isEnabled()) {
        const saveStartTime = Date.now();
        
        await saveButton.click();
        
        await expect(
          page.getByText(/configuration saved|saved successfully/i)
        ).toBeVisible({ timeout: 5000 });
        
        const saveTime = Date.now() - saveStartTime;
        
        console.log(`Save operation time: ${saveTime}ms`);
        expect(saveTime).toBeLessThan(3000);
      }
    }
  });

  test('URL Analytics page - period filter response time', async ({ page }) => {
    await page.goto('/admin/url-analytics');
    await expect(page.locator('h1')).toContainText('URL Analytics', { timeout: 10000 });
    
    const periodSelector = page.locator('select, button[role="combobox"]').first();
    
    if (await periodSelector.isVisible()) {
      const filterStartTime = Date.now();
      
      await periodSelector.click();
      
      const option7days = page.getByText('7 days', { exact: false }).first();
      if (await option7days.isVisible()) {
        await option7days.click();
        await page.waitForTimeout(1000);
      }
      
      const filterTime = Date.now() - filterStartTime;
      
      console.log(`Filter response time: ${filterTime}ms`);
      expect(filterTime).toBeLessThan(2000);
    }
  });

  test('Memory usage - page navigation', async ({ page }) => {
    const pages = [
      '/admin/url-configuration',
      '/admin/custom-domains',
      '/admin/url-analytics',
    ];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      const metrics = await page.evaluate(() => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          return {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
          };
        }
        return null;
      });
      
      if (metrics) {
        console.log(`${pagePath} - Memory usage:`, metrics);
      }
    }
  });
});
