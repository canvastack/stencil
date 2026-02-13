import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Vendor Portal Authentication Flow
 * 
 * Tests the complete authentication workflow for vendors including:
 * - Login flow with valid/invalid credentials
 * - Password reset flow
 * - Logout flow
 * 
 * Test Credentials (from VendorPortalApiTestSeeder):
 * - Email: active-vendor@test.com
 * - Password: Test@VendorP4ss2026!
 */

test.describe('Vendor Authentication Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear any existing session
    await context.clearCookies();
    
    // Clear storage first by navigating to a simple page
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore errors if storage is not accessible
      }
    });
    
    // Now navigate to vendor login with relaxed wait condition
    await page.goto('/vendor/login', { waitUntil: 'domcontentloaded' });
    
    // Wait for the login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  });

  test('should complete full vendor login flow', async ({ page }) => {
    // Navigate to vendor login page
    await page.goto('/vendor/login');
    
    // Verify login page elements
    await expect(page.locator('h1, h2')).toContainText(/vendor.*login|sign.*in/i);
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    
    // Fill login form with test credentials
    await page.getByPlaceholder(/email/i).fill('active-vendor@test.com');
    await page.getByPlaceholder(/password/i).fill('Test@VendorP4ss2026!');
    
    // Submit form
    await page.getByRole('button', { name: /sign.*in|login/i }).click();
    
    // Should redirect to vendor dashboard after successful login
    await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 10000 });
    
    // Verify dashboard elements are visible
    await expect(page.locator('h1, h2')).toContainText(/dashboard/i);
    
    // Verify vendor navigation is present
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Verify user can access protected routes
    await page.goto('/vendor/quotes');
    await expect(page).toHaveURL(/\/vendor\/quotes/);
    
    // Verify user menu or logout button is visible
    const userMenuButton = page.getByRole('button', { name: /user.*menu|account|profile/i });
    const logoutButton = page.getByRole('button', { name: /logout|sign.*out/i });
    
    await expect(userMenuButton.or(logoutButton)).toBeVisible();
  });

  test('should complete password reset flow', async ({ page }) => {
    await page.goto('/vendor/login');
    
    // Click forgot password link
    const forgotPasswordLink = page.getByRole('link', { name: /forgot.*password/i });
    await expect(forgotPasswordLink).toBeVisible();
    await forgotPasswordLink.click();
    
    // Should navigate to forgot password page
    await expect(page).toHaveURL(/\/vendor\/forgot-password/);
    await expect(page.locator('h1, h2')).toContainText(/forgot.*password|reset.*password/i);
    
    // Enter email
    await page.getByPlaceholder(/email/i).fill('active-vendor@test.com');
    
    // Submit form
    await page.getByRole('button', { name: /send.*reset.*link|reset.*password|submit/i }).click();
    
    // Should show success message
    const successMessage = page.getByText(/reset.*link.*sent|check.*email|password.*reset.*email/i);
    await expect(successMessage).toBeVisible({ timeout: 5000 });
    
    // Verify email field is disabled or form is hidden after submission
    const emailInput = page.getByPlaceholder(/email/i);
    const isDisabled = await emailInput.isDisabled().catch(() => false);
    const isHidden = await emailInput.isHidden().catch(() => false);
    
    expect(isDisabled || isHidden).toBeTruthy();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/vendor/login');
    await page.getByPlaceholder(/email/i).fill('active-vendor@test.com');
    await page.getByPlaceholder(/password/i).fill('Test@VendorP4ss2026!');
    await page.getByRole('button', { name: /sign.*in|login/i }).click();
    
    // Wait for dashboard
    await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 10000 });
    
    // Find and click logout button
    // Try user menu first
    const userMenuButton = page.getByRole('button', { name: /user.*menu|account|profile/i });
    const directLogoutButton = page.getByRole('button', { name: /logout|sign.*out/i });
    
    if (await userMenuButton.isVisible().catch(() => false)) {
      await userMenuButton.click();
      // Wait for menu to open
      await page.waitForTimeout(500);
    }
    
    // Click logout
    const logoutButton = page.getByRole('button', { name: /logout|sign.*out/i }).or(
      page.getByRole('link', { name: /logout|sign.*out/i })
    );
    await logoutButton.click();
    
    // Should redirect to vendor login page
    await expect(page).toHaveURL(/\/vendor\/login/, { timeout: 5000 });
    
    // Verify user cannot access protected routes after logout
    await page.goto('/vendor/dashboard');
    await expect(page).toHaveURL(/\/vendor\/login/);
  });
});
