import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should complete full login flow', async ({ page }) => {
    // Should redirect to login page for unauthenticated users
    await expect(page).toHaveURL(/\/login/);
    
    // Check login page elements
    await expect(page.locator('h1')).toContainText('Sign In');
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    
    // Fill login form
    await page.getByPlaceholder('Email').fill('admin@demo-etching.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check for user menu
    await expect(page.getByRole('button', { name: /user menu/i })).toBeVisible();
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Enter invalid credentials
    await page.getByPlaceholder('Email').fill('invalid@test.com');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
    
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should complete registration flow', async ({ page }) => {
    await page.goto('/register');
    
    // Check registration page elements
    await expect(page.locator('h1')).toContainText('Create Account');
    await expect(page.getByPlaceholder('Full Name')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password')).toBeVisible();
    
    // Fill registration form
    const timestamp = Date.now();
    await page.getByPlaceholder('Full Name').fill('Test User');
    await page.getByPlaceholder('Email').fill(`test${timestamp}@example.com`);
    await page.getByPlaceholder('Password').fill('TestPassword123!');
    await page.getByPlaceholder('Confirm Password').fill('TestPassword123!');
    
    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Should redirect to email verification or dashboard
    await expect(page).not.toHaveURL('/register');
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/login');
    
    // Click forgot password link
    await page.getByText(/forgot password/i).click();
    
    // Should navigate to forgot password page
    await expect(page).toHaveURL('/forgot-password');
    await expect(page.locator('h1')).toContainText('Reset Password');
    
    // Enter email
    await page.getByPlaceholder('Email').fill('admin@demo-etching.com');
    
    // Submit form
    await page.getByRole('button', { name: /send reset link/i }).click();
    
    // Should show success message
    await expect(page.getByText(/reset link sent/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('admin@demo-etching.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard
    await expect(page).toHaveURL('/admin');
    
    // Open user menu and logout
    await page.getByRole('button', { name: /user menu/i }).click();
    await page.getByText(/sign out/i).click();
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should protect admin routes', async ({ page }) => {
    // Try to access admin page without authentication
    await page.goto('/admin/products');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should maintain session on page refresh', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('admin@demo-etching.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard
    await expect(page).toHaveURL('/admin');
    
    // Refresh page
    await page.reload();
    
    // Should still be authenticated
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should handle session expiry gracefully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('admin@demo-etching.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard
    await expect(page).toHaveURL('/admin');
    
    // Simulate token expiry by clearing localStorage
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Try to navigate to another page
    await page.goto('/admin/products');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Should show session expired message
    await expect(page.getByText(/session expired/i)).toBeVisible();
  });
});