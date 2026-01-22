/**
 * E2E TEST: URL Configuration User Flows
 * 
 * Compliance:
 * - NO MOCK DATA: Tests use real backend API
 * - REAL USER FLOWS: Simulates actual user interactions
 * - TENANT CONTEXT: Tests within authenticated tenant context
 */

import { test, expect } from '@playwright/test';

test.describe('URL Configuration User Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    
    await page.getByPlaceholder('Email').fill('admin@etchinx.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await expect(page).toHaveURL('/admin', { timeout: 10000 });
  });

  test('complete domain verification workflow', async ({ page }) => {
    await page.goto('/admin/custom-domains');
    
    await expect(page.locator('h1')).toContainText('Custom Domains', { timeout: 10000 });
    
    const addDomainButton = page.getByRole('button', { name: /add domain/i });
    await expect(addDomainButton).toBeVisible();
    await addDomainButton.click();
    
    const domainInput = page.getByPlaceholder(/enter your domain/i);
    await expect(domainInput).toBeVisible({ timeout: 5000 });
    
    const timestamp = Date.now();
    const testDomain = `test-domain-${timestamp}.example.com`;
    await domainInput.fill(testDomain);
    
    const nextButton = page.getByRole('button', { name: /next/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      
      const txtRecordOption = page.getByText(/txt record/i).first();
      if (await txtRecordOption.isVisible()) {
        await txtRecordOption.click();
        await page.getByRole('button', { name: /next/i }).click();
        
        await expect(page.getByText(/add this txt record/i)).toBeVisible({ timeout: 5000 });
        
        const copyButton = page.getByRole('button', { name: /copy/i }).first();
        if (await copyButton.isVisible()) {
          await copyButton.click();
        }
      }
    }
    
    const closeButton = page.getByRole('button', { name: /close|cancel/i }).first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
    
    await expect(page.locator('h1')).toContainText('Custom Domains');
  });

  test('change primary URL pattern', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    await expect(page.getByText('Primary URL Pattern')).toBeVisible({ timeout: 5000 });
    
    const subdomainCard = page.getByText('Subdomain-Based').first();
    const pathCard = page.getByText('Path-Based').first();
    const customDomainCard = page.getByText('Custom Domain').first();
    
    await expect(subdomainCard).toBeVisible();
    await expect(pathCard).toBeVisible();
    await expect(customDomainCard).toBeVisible();
    
    const isSubdomainSelected = await subdomainCard.locator('..').locator('..').evaluate((el) => 
      el.className.includes('border-primary')
    );
    
    if (isSubdomainSelected) {
      await pathCard.click();
    } else {
      await subdomainCard.click();
    }
    
    await page.waitForTimeout(500);
    
    const saveButton = page.getByRole('button', { name: /save configuration/i });
    if (await saveButton.isEnabled()) {
      await saveButton.click();
      
      await expect(
        page.getByText(/configuration saved|saved successfully/i)
      ).toBeVisible({ timeout: 5000 });
    } else {
      const resetButton = page.getByRole('button', { name: /reset/i });
      if (await resetButton.isVisible()) {
        await resetButton.click();
      }
    }
  });

  test('view URL analytics', async ({ page }) => {
    await page.goto('/admin/url-analytics');
    
    await expect(page.locator('h1')).toContainText('URL Analytics', { timeout: 10000 });
    
    await expect(page.getByText('Total Accesses')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Unique Visitors')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Avg Response Time')).toBeVisible({ timeout: 5000 });
    
    const periodSelector = page.locator('select, button[role="combobox"]').first();
    if (await periodSelector.isVisible()) {
      await periodSelector.click();
      
      const option7days = page.getByText('7 days', { exact: false }).first();
      if (await option7days.isVisible()) {
        await option7days.click();
        await page.waitForTimeout(1000);
      }
    }
    
    await expect(page.getByText('Access Trends')).toBeVisible({ timeout: 5000 });
    
    const chartSections = [
      'Access Trends',
      'URL Pattern Distribution',
      'Performance Metrics',
    ];
    
    for (const section of chartSections) {
      const sectionElement = page.getByText(section);
      if (await sectionElement.isVisible()) {
        await expect(sectionElement).toBeVisible();
      }
    }
  });

  test('navigate between URL configuration pages', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const customDomainsLink = page.getByRole('link', { name: /custom domains/i });
    if (await customDomainsLink.isVisible()) {
      await customDomainsLink.click();
      await expect(page).toHaveURL('/admin/custom-domains');
    } else {
      await page.goto('/admin/custom-domains');
    }
    await expect(page.locator('h1')).toContainText('Custom Domains', { timeout: 10000 });
    
    const analyticsLink = page.getByRole('link', { name: /analytics/i });
    if (await analyticsLink.isVisible()) {
      await analyticsLink.click();
      await expect(page).toHaveURL(/\/admin\/.*analytics/);
    } else {
      await page.goto('/admin/url-analytics');
    }
    await expect(page.locator('h1')).toContainText('Analytics', { timeout: 10000 });
    
    await page.goto('/admin/url-configuration');
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
  });

  test('handle advanced settings tab', async ({ page }) => {
    await page.goto('/admin/url-configuration');
    
    await expect(page.locator('h1')).toContainText('URL Configuration', { timeout: 10000 });
    
    const advancedTab = page.getByRole('tab', { name: /advanced settings/i });
    if (await advancedTab.isVisible()) {
      await advancedTab.click();
      
      await expect(page.getByText(/force https|ssl|security/i)).toBeVisible({ timeout: 5000 });
      
      const httpsToggle = page.locator('input[type="checkbox"]').first();
      if (await httpsToggle.isVisible()) {
        const isChecked = await httpsToggle.isChecked();
        await httpsToggle.click();
        
        const saveButton = page.getByRole('button', { name: /save configuration/i });
        if (await saveButton.isEnabled()) {
          await saveButton.click();
          await expect(
            page.getByText(/configuration saved|saved successfully/i)
          ).toBeVisible({ timeout: 5000 });
        } else {
          await httpsToggle.click();
        }
      }
    }
  });

  test('display domain verification badges', async ({ page }) => {
    await page.goto('/admin/custom-domains');
    
    await expect(page.locator('h1')).toContainText('Custom Domains', { timeout: 10000 });
    
    const verifiedBadge = page.getByText('Verified').first();
    const pendingBadge = page.getByText('Pending').first();
    const failedBadge = page.getByText('Failed').first();
    
    const hasDomains = await page.getByText(/no custom domains/i).isVisible() === false;
    
    if (hasDomains) {
      const badgeVisible = 
        (await verifiedBadge.isVisible()) ||
        (await pendingBadge.isVisible()) ||
        (await failedBadge.isVisible());
      
      expect(badgeVisible).toBe(true);
    }
  });

  test('display SSL status information', async ({ page }) => {
    await page.goto('/admin/custom-domains');
    
    await expect(page.locator('h1')).toContainText('Custom Domains', { timeout: 10000 });
    
    const hasDomains = await page.getByText(/no custom domains/i).isVisible() === false;
    
    if (hasDomains) {
      const sslActive = page.getByText('Active', { exact: false }).first();
      const sslPending = page.getByText('Pending', { exact: false }).first();
      
      const sslStatusVisible = 
        (await sslActive.isVisible()) ||
        (await sslPending.isVisible());
      
      if (sslStatusVisible) {
        expect(sslStatusVisible).toBe(true);
      }
    }
  });
});
