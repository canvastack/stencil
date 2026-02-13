import { test, expect, Page } from '@playwright/test';

/**
 * End-to-End Workflow Test: Complete Vendor Onboarding to First Quote Response
 * 
 * This test verifies the complete vendor portal workflow from initial onboarding
 * through to responding to the first quote. It covers:
 * 
 * 1. Admin onboards a new vendor (enables portal access)
 * 2. Vendor receives welcome email with credentials
 * 3. Vendor logs in for the first time
 * 4. Vendor completes profile setup
 * 5. Admin sends a quote to the vendor
 * 6. Vendor receives quote notification
 * 7. Vendor views and responds to the quote
 * 8. Admin receives response notification
 * 
 * Requirements: 2.1, 2.2, 2.3, 17.1-17.8, 1.1-1.5, 4.1-4.9, 6.1-6.15
 */

// Test data
const testVendor = {
  companyName: 'Test Vendor Company',
  email: 'vendor@testcompany.com',
  phone: '+1234567890',
  contactPerson: 'John Doe',
  address: '123 Test Street, Test City, TC 12345',
};

const testAdmin = {
  email: 'admin@ptcex.com',
  password: 'Admin123!',
};

const testQuote = {
  quoteNumber: 'Q-2026-001',
  orderNumber: 'ORD-2026-001',
  customerName: 'Test Customer',
  productName: 'Custom Etching Plate',
  amount: 1500000,
  expiresInDays: 7,
};

/**
 * Helper function to login as admin
 */
async function loginAsAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.fill('input[name="email"]', testAdmin.email);
  await page.fill('input[name="password"]', testAdmin.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin/dashboard');
}

/**
 * Helper function to login as vendor
 */
async function loginAsVendor(page: Page, email: string, password: string) {
  await page.goto('/vendor/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/vendor/dashboard');
}

/**
 * Helper function to logout
 */
async function logout(page: Page) {
  await page.click('button[aria-label="Logout"]');
  await page.waitForURL(/\/(admin|vendor)\/login/);
}

test.describe('Complete Vendor Onboarding to First Quote Response', () => {
  test.setTimeout(120000); // 2 minutes for complete workflow

  test('should complete full vendor onboarding and quote response workflow', async ({ page, context }) => {
    // ============================================================
    // STEP 1: Admin creates and onboards a new vendor
    // ============================================================
    
    await test.step('Admin logs in', async () => {
      await loginAsAdmin(page);
      await expect(page).toHaveURL('/admin/dashboard');
    });

    await test.step('Admin navigates to vendor management', async () => {
      await page.click('a[href="/admin/vendors"]');
      await page.waitForURL('/admin/vendors');
      await expect(page.locator('h1')).toContainText('Vendors');
    });

    await test.step('Admin creates a new vendor', async () => {
      await page.click('button:has-text("Add Vendor")');
      await page.fill('input[name="company_name"]', testVendor.companyName);
      await page.fill('input[name="email"]', testVendor.email);
      await page.fill('input[name="phone"]', testVendor.phone);
      await page.fill('input[name="contact_person"]', testVendor.contactPerson);
      await page.fill('textarea[name="address"]', testVendor.address);
      await page.click('button[type="submit"]');
      
      // Wait for success message
      await expect(page.locator('.toast-success, .alert-success')).toBeVisible();
    });

    let temporaryPassword: string;

    await test.step('Admin enables portal access for vendor', async () => {
      // Find the vendor in the list
      await page.click(`tr:has-text("${testVendor.companyName}")`);
      
      // Click "Enable Portal Access" button
      await page.click('button:has-text("Enable Portal Access")');
      
      // Confirm the action
      await page.click('button:has-text("Confirm")');
      
      // Wait for success message and capture temporary password
      const successMessage = page.locator('.toast-success, .alert-success');
      await expect(successMessage).toBeVisible();
      
      // Extract temporary password from success message
      const messageText = await successMessage.textContent();
      const passwordMatch = messageText?.match(/Password: ([A-Za-z0-9!@#$%^&*]+)/);
      temporaryPassword = passwordMatch ? passwordMatch[1] : 'TempPass123!';
      
      console.log('Temporary password:', temporaryPassword);
    });

    await test.step('Admin verifies vendor portal status', async () => {
      // Check that portal access is enabled
      await expect(page.locator('text=Portal Access: Enabled')).toBeVisible();
      await expect(page.locator('text=Onboarding Status: In Progress')).toBeVisible();
    });

    await test.step('Admin logs out', async () => {
      await logout(page);
    });

    // ============================================================
    // STEP 2: Vendor logs in for the first time
    // ============================================================

    await test.step('Vendor logs in with temporary password', async () => {
      await loginAsVendor(page, testVendor.email, temporaryPassword);
      await expect(page).toHaveURL('/vendor/dashboard');
    });

    await test.step('Vendor sees welcome message', async () => {
      await expect(page.locator('h1')).toContainText('Welcome');
      await expect(page.locator('text=Complete your profile')).toBeVisible();
    });

    // ============================================================
    // STEP 3: Vendor completes profile setup
    // ============================================================

    await test.step('Vendor navigates to profile page', async () => {
      await page.click('a[href="/vendor/profile"]');
      await page.waitForURL('/vendor/profile');
    });

    await test.step('Vendor updates profile information', async () => {
      // Verify read-only company name
      const companyNameInput = page.locator('input[name="company_name"]');
      await expect(companyNameInput).toBeDisabled();
      
      // Update contact information
      await page.fill('input[name="phone"]', '+1234567890');
      await page.fill('input[name="contact_person"]', 'John Doe');
      await page.fill('textarea[name="address"]', '123 Updated Street, Test City, TC 12345');
      
      // Save changes
      await page.click('button:has-text("Save Changes")');
      
      // Wait for success message
      await expect(page.locator('.toast-success, .alert-success')).toContainText('Profile updated');
    });

    await test.step('Vendor changes password', async () => {
      await page.click('a[href="/vendor/settings"]');
      await page.waitForURL('/vendor/settings');
      
      await page.fill('input[name="current_password"]', temporaryPassword);
      await page.fill('input[name="new_password"]', 'NewSecurePass123!');
      await page.fill('input[name="confirm_password"]', 'NewSecurePass123!');
      
      await page.click('button:has-text("Change Password")');
      
      // Wait for success message
      await expect(page.locator('.toast-success, .alert-success')).toContainText('Password changed');
    });

    await test.step('Vendor logs out', async () => {
      await logout(page);
    });

    // ============================================================
    // STEP 4: Admin sends a quote to the vendor
    // ============================================================

    await test.step('Admin logs in again', async () => {
      await loginAsAdmin(page);
    });

    await test.step('Admin creates a new quote', async () => {
      await page.click('a[href="/admin/quotes"]');
      await page.waitForURL('/admin/quotes');
      
      await page.click('button:has-text("Create Quote")');
      
      // Fill quote form
      await page.fill('input[name="quote_number"]', testQuote.quoteNumber);
      await page.fill('input[name="order_number"]', testQuote.orderNumber);
      await page.selectOption('select[name="vendor_id"]', { label: testVendor.companyName });
      await page.fill('input[name="customer_name"]', testQuote.customerName);
      await page.fill('input[name="product_name"]', testQuote.productName);
      await page.fill('input[name="amount"]', testQuote.amount.toString());
      await page.fill('input[name="expires_in_days"]', testQuote.expiresInDays.toString());
      
      await page.click('button[type="submit"]');
      
      // Wait for success message
      await expect(page.locator('.toast-success, .alert-success')).toBeVisible();
    });

    await test.step('Admin sends quote to vendor', async () => {
      // Find the quote in the list
      await page.click(`tr:has-text("${testQuote.quoteNumber}")`);
      
      // Click "Send to Vendor" button
      await page.click('button:has-text("Send to Vendor")');
      
      // Confirm the action
      await page.click('button:has-text("Confirm")');
      
      // Wait for success message
      await expect(page.locator('.toast-success, .alert-success')).toContainText('Quote sent');
      
      // Verify quote status changed to "Sent"
      await expect(page.locator('text=Status: Sent')).toBeVisible();
    });

    await test.step('Admin logs out', async () => {
      await logout(page);
    });

    // ============================================================
    // STEP 5: Vendor logs in and views the quote
    // ============================================================

    await test.step('Vendor logs in with new password', async () => {
      await loginAsVendor(page, testVendor.email, 'NewSecurePass123!');
    });

    await test.step('Vendor sees quote notification', async () => {
      // Check for notification badge
      const notificationBadge = page.locator('[aria-label="Notifications"] .badge');
      await expect(notificationBadge).toBeVisible();
      await expect(notificationBadge).toContainText('1');
    });

    await test.step('Vendor navigates to quotes page', async () => {
      await page.click('a[href="/vendor/quotes"]');
      await page.waitForURL('/vendor/quotes');
      
      // Verify quote is visible
      await expect(page.locator(`text=${testQuote.quoteNumber}`)).toBeVisible();
      await expect(page.locator('text=Status: Sent')).toBeVisible();
    });

    await test.step('Vendor views quote details', async () => {
      await page.click(`tr:has-text("${testQuote.quoteNumber}")`);
      await page.waitForURL(/\/vendor\/quotes\/[a-f0-9-]+/);
      
      // Verify quote details are displayed
      await expect(page.locator('h1')).toContainText(testQuote.quoteNumber);
      await expect(page.locator(`text=${testQuote.customerName}`)).toBeVisible();
      await expect(page.locator(`text=${testQuote.productName}`)).toBeVisible();
      await expect(page.locator(`text=Rp ${testQuote.amount.toLocaleString()}`)).toBeVisible();
    });

    // ============================================================
    // STEP 6: Vendor responds to the quote
    // ============================================================

    await test.step('Vendor accepts the quote', async () => {
      // Click "Accept Quote" button
      await page.click('button:has-text("Accept Quote")');
      
      // Fill acceptance form
      await page.fill('input[name="estimated_delivery_days"]', '14');
      await page.fill('textarea[name="notes"]', 'We can deliver this within 2 weeks. Thank you for your business!');
      
      // Submit acceptance
      await page.click('button:has-text("Submit Acceptance")');
      
      // Wait for success message
      await expect(page.locator('.toast-success, .alert-success')).toContainText('Quote accepted');
      
      // Verify quote status changed to "Accepted"
      await expect(page.locator('text=Status: Accepted')).toBeVisible();
      
      // Verify response buttons are disabled
      await expect(page.locator('button:has-text("Accept Quote")')).toBeDisabled();
      await expect(page.locator('button:has-text("Reject Quote")')).toBeDisabled();
      await expect(page.locator('button:has-text("Counter Offer")')).toBeDisabled();
    });

    await test.step('Vendor logs out', async () => {
      await logout(page);
    });

    // ============================================================
    // STEP 7: Admin receives response notification
    // ============================================================

    await test.step('Admin logs in to check response', async () => {
      await loginAsAdmin(page);
    });

    await test.step('Admin sees response notification', async () => {
      // Check for notification badge
      const notificationBadge = page.locator('[aria-label="Notifications"] .badge');
      await expect(notificationBadge).toBeVisible();
      
      // Click notification bell
      await page.click('[aria-label="Notifications"]');
      
      // Verify notification content
      await expect(page.locator('.notification-item')).toContainText(testVendor.companyName);
      await expect(page.locator('.notification-item')).toContainText('accepted');
      await expect(page.locator('.notification-item')).toContainText(testQuote.quoteNumber);
    });

    await test.step('Admin views quote with vendor response', async () => {
      // Click on notification to navigate to quote
      await page.click(`.notification-item:has-text("${testQuote.quoteNumber}")`);
      await page.waitForURL(/\/admin\/quotes\/[a-f0-9-]+/);
      
      // Verify quote status
      await expect(page.locator('text=Status: Accepted')).toBeVisible();
      
      // Verify response details
      await expect(page.locator('text=Estimated Delivery: 14 days')).toBeVisible();
      await expect(page.locator('text=We can deliver this within 2 weeks')).toBeVisible();
      
      // Verify responded timestamp
      await expect(page.locator('text=Responded At:')).toBeVisible();
    });

    await test.step('Admin verifies audit log', async () => {
      // Navigate to vendor detail page
      await page.click('a[href="/admin/vendors"]');
      await page.click(`tr:has-text("${testVendor.companyName}")`);
      
      // Click on "Audit Log" tab
      await page.click('button:has-text("Audit Log")');
      
      // Verify audit log entries
      await expect(page.locator('text=Vendor Login')).toBeVisible();
      await expect(page.locator('text=Profile Updated')).toBeVisible();
      await expect(page.locator('text=Password Changed')).toBeVisible();
      await expect(page.locator('text=Quote Accepted')).toBeVisible();
    });

    // ============================================================
    // WORKFLOW COMPLETE
    // ============================================================

    console.log('✅ Complete vendor onboarding to first quote response workflow test passed!');
  });
});

