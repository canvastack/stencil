/**
 * Playwright Test Fixtures for Vendor Portal E2E Testing
 * 
 * This file provides custom fixtures for vendor portal E2E tests including:
 * - Authenticated vendor user context
 * - Test data helpers
 * - Common page objects
 * - API mocking utilities
 * 
 * @see https://playwright.dev/docs/test-fixtures
 */

import { test as base, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Test credentials for vendor portal
 * These should match the credentials from VendorPortalApiTestSeeder
 */
export const TEST_CREDENTIALS = {
  vendor: {
    email: 'active-vendor@test.com',
    password: 'Test@VendorP4ss2026!',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Admin@Test123!',
  },
};

/**
 * Test URLs for vendor portal
 */
export const TEST_URLS = {
  vendorLogin: '/vendor/login',
  vendorDashboard: '/vendor/dashboard',
  vendorQuotes: '/vendor/quotes',
  vendorProfile: '/vendor/profile',
  vendorSettings: '/vendor/settings',
  vendorForgotPassword: '/vendor/forgot-password',
  vendorResetPassword: '/vendor/reset-password',
};

/**
 * Extended test fixtures
 */
type VendorPortalFixtures = {
  /**
   * Authenticated vendor page
   * Automatically logs in as a vendor before each test
   */
  authenticatedVendorPage: Page;
  
  /**
   * Authenticated vendor context
   * Provides a browser context with vendor authentication
   */
  authenticatedVendorContext: BrowserContext;
  
  /**
   * Helper to login as vendor
   */
  loginAsVendor: (page: Page, email?: string, password?: string) => Promise<void>;
  
  /**
   * Helper to logout
   */
  logout: (page: Page) => Promise<void>;
  
  /**
   * Helper to clear authentication
   */
  clearAuth: (page: Page) => Promise<void>;
  
  /**
   * Helper to wait for navigation
   */
  waitForNavigation: (page: Page, url: string | RegExp) => Promise<void>;
  
  /**
   * Helper to take screenshot with custom name
   */
  takeScreenshot: (page: Page, name: string) => Promise<void>;
};

/**
 * Extend base test with custom fixtures
 */
export const test = base.extend<VendorPortalFixtures>({
  /**
   * Login as vendor helper
   */
  loginAsVendor: async ({ page }, use) => {
    const login = async (
      targetPage: Page,
      email: string = TEST_CREDENTIALS.vendor.email,
      password: string = TEST_CREDENTIALS.vendor.password
    ) => {
      // Navigate to login page
      await targetPage.goto(TEST_URLS.vendorLogin, { waitUntil: 'domcontentloaded' });
      
      // Wait for login form
      await targetPage.waitForSelector('input[type="email"]', { timeout: 10000 });
      
      // Fill credentials
      await targetPage.getByPlaceholder(/email/i).fill(email);
      await targetPage.getByPlaceholder(/password/i).fill(password);
      
      // Submit form
      await targetPage.getByRole('button', { name: /sign.*in|login/i }).click();
      
      // Wait for redirect to dashboard
      await targetPage.waitForURL(/\/vendor\/dashboard/, { timeout: 10000 });
      
      // Wait for dashboard to load
      await targetPage.waitForSelector('h1, h2', { timeout: 5000 });
    };
    
    await use(login);
  },
  
  /**
   * Logout helper
   */
  logout: async ({ page }, use) => {
    const logoutFn = async (targetPage: Page) => {
      // Try to find user menu button
      const userMenuButton = targetPage.getByRole('button', { name: /user.*menu|account|profile/i });
      
      if (await userMenuButton.isVisible().catch(() => false)) {
        await userMenuButton.click();
        await targetPage.waitForTimeout(500);
      }
      
      // Click logout
      const logoutButton = targetPage.getByRole('button', { name: /logout|sign.*out/i }).or(
        targetPage.getByRole('link', { name: /logout|sign.*out/i })
      );
      
      await logoutButton.click();
      
      // Wait for redirect to login
      await targetPage.waitForURL(/\/vendor\/login/, { timeout: 5000 });
    };
    
    await use(logoutFn);
  },
  
  /**
   * Clear authentication helper
   */
  clearAuth: async ({ page }, use) => {
    const clear = async (targetPage: Page) => {
      // Navigate to a simple page first
      await targetPage.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Clear storage
      await targetPage.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          // Ignore errors
        }
      });
      
      // Clear cookies
      await targetPage.context().clearCookies();
    };
    
    await use(clear);
  },
  
  /**
   * Wait for navigation helper
   */
  waitForNavigation: async ({ page }, use) => {
    const wait = async (targetPage: Page, url: string | RegExp) => {
      await targetPage.waitForURL(url, { timeout: 10000 });
    };
    
    await use(wait);
  },
  
  /**
   * Take screenshot helper
   */
  takeScreenshot: async ({ page }, use) => {
    const screenshot = async (targetPage: Page, name: string) => {
      await targetPage.screenshot({
        path: `test-results/screenshots/${name}.png`,
        fullPage: true,
      });
    };
    
    await use(screenshot);
  },
  
  /**
   * Authenticated vendor context
   * Creates a browser context with vendor authentication
   */
  authenticatedVendorContext: async ({ browser, loginAsVendor }, use) => {
    // Create new context
    const context = await browser.newContext();
    
    // Create page in context
    const page = await context.newPage();
    
    // Login as vendor
    await loginAsVendor(page);
    
    // Use the authenticated context
    await use(context);
    
    // Cleanup
    await page.close();
    await context.close();
  },
  
  /**
   * Authenticated vendor page
   * Provides a page that is already logged in as a vendor
   */
  authenticatedVendorPage: async ({ page, loginAsVendor }, use) => {
    // Login before test
    await loginAsVendor(page);
    
    // Use the authenticated page
    await use(page);
    
    // No cleanup needed - page will be closed by Playwright
  },
});

/**
 * Export expect for convenience
 */
export { expect };

/**
 * Common test data generators
 */
export const testData = {
  /**
   * Generate random email
   */
  randomEmail: () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`,
  
  /**
   * Generate random phone
   */
  randomPhone: () => `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
  
  /**
   * Generate random company name
   */
  randomCompanyName: () => `Test Company ${Date.now()}`,
  
  /**
   * Generate random quote number
   */
  randomQuoteNumber: () => `Q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  
  /**
   * Generate random order number
   */
  randomOrderNumber: () => `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
};

/**
 * Common assertions
 */
export const assertions = {
  /**
   * Assert page has vendor navigation
   */
  hasVendorNavigation: async (page: Page) => {
    await expect(page.getByRole('navigation')).toBeVisible();
  },
  
  /**
   * Assert page is vendor dashboard
   */
  isVendorDashboard: async (page: Page) => {
    await expect(page).toHaveURL(/\/vendor\/dashboard/);
    await expect(page.locator('h1, h2')).toContainText(/dashboard/i);
  },
  
  /**
   * Assert page is vendor login
   */
  isVendorLogin: async (page: Page) => {
    await expect(page).toHaveURL(/\/vendor\/login/);
    await expect(page.locator('h1, h2')).toContainText(/vendor.*login|sign.*in/i);
  },
  
  /**
   * Assert user is authenticated
   */
  isAuthenticated: async (page: Page) => {
    const userMenuButton = page.getByRole('button', { name: /user.*menu|account|profile/i });
    const logoutButton = page.getByRole('button', { name: /logout|sign.*out/i });
    await expect(userMenuButton.or(logoutButton)).toBeVisible();
  },
  
  /**
   * Assert error message is visible
   */
  hasErrorMessage: async (page: Page, message?: string | RegExp) => {
    const errorLocator = page.getByRole('alert').or(
      page.getByText(/error|failed|invalid/i)
    );
    
    await expect(errorLocator).toBeVisible();
    
    if (message) {
      await expect(errorLocator).toContainText(message);
    }
  },
  
  /**
   * Assert success message is visible
   */
  hasSuccessMessage: async (page: Page, message?: string | RegExp) => {
    const successLocator = page.getByRole('status').or(
      page.getByText(/success|saved|updated|sent/i)
    );
    
    await expect(successLocator).toBeVisible();
    
    if (message) {
      await expect(successLocator).toContainText(message);
    }
  },
};

/**
 * Common page interactions
 */
export const interactions = {
  /**
   * Fill form field by label
   */
  fillField: async (page: Page, label: string | RegExp, value: string) => {
    await page.getByLabel(label).fill(value);
  },
  
  /**
   * Click button by name
   */
  clickButton: async (page: Page, name: string | RegExp) => {
    await page.getByRole('button', { name }).click();
  },
  
  /**
   * Click link by name
   */
  clickLink: async (page: Page, name: string | RegExp) => {
    await page.getByRole('link', { name }).click();
  },
  
  /**
   * Select option from dropdown
   */
  selectOption: async (page: Page, label: string | RegExp, value: string) => {
    await page.getByLabel(label).selectOption(value);
  },
  
  /**
   * Upload file
   */
  uploadFile: async (page: Page, selector: string, filePath: string) => {
    await page.setInputFiles(selector, filePath);
  },
  
  /**
   * Wait for loading to complete
   */
  waitForLoading: async (page: Page) => {
    // Wait for any loading indicators to disappear
    await page.waitForSelector('[data-loading="true"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
    await page.waitForSelector('.loading', { state: 'hidden', timeout: 5000 }).catch(() => {});
    await page.waitForSelector('[role="progressbar"]', { state: 'hidden', timeout: 5000 }).catch(() => {});
  },
};

/**
 * API mocking utilities
 */
export const apiMocks = {
  /**
   * Mock successful login response
   */
  mockLoginSuccess: async (page: Page) => {
    await page.route('**/api/v1/vendor/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            token: 'mock-token-123',
            user: {
              id: '123',
              email: TEST_CREDENTIALS.vendor.email,
              name: 'Test Vendor',
            },
          },
        }),
      });
    });
  },
  
  /**
   * Mock login failure response
   */
  mockLoginFailure: async (page: Page) => {
    await page.route('**/api/v1/vendor/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Invalid credentials',
        }),
      });
    });
  },
  
  /**
   * Mock quotes list response
   */
  mockQuotesList: async (page: Page, quotes: any[] = []) => {
    await page.route('**/api/v1/vendor/quotes*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: quotes,
          meta: {
            total: quotes.length,
            per_page: 20,
            current_page: 1,
          },
        }),
      });
    });
  },
};
