/**
 * Two-Way Negotiation E2E Tests (Frontend)
 * 
 * Tests all negotiation scenarios from the UI perspective:
 * 1. Happy Path - Vendor accepts immediately
 * 2. Single Counter - Vendor counters, Admin accepts
 * 3. Multiple Rounds - Back and forth negotiation
 * 4. Max Rounds Warning - Final round alerts
 * 5. Rejection Flow - Admin rejects counter
 * 6. Re-negotiation - Vendor submits after rejection
 * 7. Max Rejections - 2 rejection limit
 * 8. Accept Original - Vendor accepts original after rejection
 * 9. Admin Counter - Admin counters vendor offer
 * 10. Final Round Behavior - Round 4 and 5 warnings
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const ADMIN_EMAIL = 'admin@etchinx.com';
const ADMIN_PASSWORD = 'password';
const VENDOR_EMAIL = 'vendor@etchinx.com';
const VENDOR_PASSWORD = 'VendorDemo2024!';
const QUOTE_UUID = 'c94e4f0a-0cf2-4ba1-8bbb-31397dedff34';

// Helper functions
async function loginAsAdmin(page: Page) {
  await page.goto('http://localhost:5173/admin/login');
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/dashboard');
}

async function loginAsVendor(page: Page) {
  await page.goto('http://localhost:5173/vendor/login');
  await page.fill('input[type="email"]', VENDOR_EMAIL);
  await page.fill('input[type="password"]', VENDOR_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/vendor/dashboard');
}

async function navigateToQuote(page: Page, uuid: string, isVendor: boolean = false) {
  const baseUrl = isVendor ? '/vendor/quotes' : '/admin/quotes';
  await page.goto(`http://localhost:5173${baseUrl}/${uuid}`);
  await page.waitForLoadState('networkidle');
}

async function resetQuoteToSent(page: Page, uuid: string) {
  // Call backend reset script via API or direct navigation
  await page.goto(`http://localhost:8000/reset-quote-for-admin-counter.php?uuid=${uuid}`);
  await page.waitForTimeout(1000);
}

test.describe('Two-Way Negotiation E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Reset quote to sent status before each test
    await resetQuoteToSent(page, QUOTE_UUID);
  });

  /**
   * Test Case 1: Happy Path - Vendor accepts quote immediately
   */
  test('Scenario 1: Vendor accepts quote immediately', async ({ page }) => {
    await loginAsVendor(page);
    await navigateToQuote(page, QUOTE_UUID, true);
    
    // Verify quote is in sent status
    await expect(page.locator('text=Sent')).toBeVisible();
    
    // Click Accept Quote button
    await page.click('button:has-text("Accept Quote")');
    
    // Fill acceptance form
    await page.fill('input[name="estimatedDeliveryDays"]', '7');
    await page.fill('textarea[name="notes"]', 'We accept the quote');
    
    // Submit acceptance
    await page.click('button:has-text("Submit Response")');
    
    // Wait for success message
    await expect(page.locator('text=Response submitted successfully')).toBeVisible();
    
    // Verify status changed to accepted
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Accepted')).toBeVisible();
  });

  /**
   * Test Case 2: Vendor counters, Admin accepts
   */
  test('Scenario 2: Vendor counter, Admin accepts', async ({ page, context }) => {
    // Step 1: Vendor submits counter offer
    await loginAsVendor(page);
    await navigateToQuote(page, QUOTE_UUID, true);
    
    await page.click('button:has-text("Counter Offer")');
    
    // Fill counter offer form
    await page.fill('input[name="items.0.counter_unit_price"]', '80000');
    await page.fill('textarea[name="notes"]', 'Can we increase the price?');
    await page.fill('input[name="estimatedDeliveryDays"]', '10');
    
    await page.click('button:has-text("Submit Counter Offer")');
    await expect(page.locator('text=Counter offer submitted')).toBeVisible();
    
    // Step 2: Admin accepts counter offer
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage);
    await navigateToQuote(adminPage, QUOTE_UUID);
    
    // Verify counter offer is displayed
    await expect(adminPage.locator('text=Counter Offer Pending')).toBeVisible();
    await expect(adminPage.locator('text=Rp 80,000')).toBeVisible();
    
    // Click Accept Counter Offer
    await adminPage.click('button:has-text("Accept Counter Offer")');
    
    // Fill customer price
    await adminPage.fill('input[name="customer_price"]', '110000');
    await adminPage.fill('textarea[name="notes"]', 'Accepted with price adjustment');
    
    await adminPage.click('button:has-text("Accept Counter")');
    await expect(adminPage.locator('text=Counter offer accepted')).toBeVisible();
    
    // Verify status
    await adminPage.waitForTimeout(1000);
    await expect(adminPage.locator('text=Accepted')).toBeVisible();
  });

  /**
   * Test Case 3: Multiple rounds of negotiation
   */
  test('Scenario 3: Multiple rounds negotiation (3 rounds)', async ({ page, context }) => {
    // Round 1: Vendor counter
    await loginAsVendor(page);
    await navigateToQuote(page, QUOTE_UUID, true);
    
    await page.click('button:has-text("Counter Offer")');
    await page.fill('input[name="items.0.counter_unit_price"]', '80000');
    await page.click('button:has-text("Submit Counter Offer")');
    await expect(page.locator('text=Counter offer submitted')).toBeVisible();
    
    // Round 2: Admin counter
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage);
    await navigateToQuote(adminPage, QUOTE_UUID);
    
    await adminPage.click('button:has-text("Counter Offer")');
    await adminPage.fill('input[name="items.0.admin_counter_unit_price"]', '77000');
    await adminPage.click('button:has-text("Submit Admin Counter")');
    await expect(adminPage.locator('text=Admin counter offer submitted')).toBeVisible();
    
    // Round 3: Vendor counter again
    await page.reload();
    await expect(page.locator('text=Admin Countered')).toBeVisible();
    await expect(page.locator('text=Rp 77,000')).toBeVisible();
    
    await page.click('button:has-text("Counter Lagi")');
    await page.fill('input[name="items.0.counter_unit_price"]', '78000');
    await page.click('button:has-text("Submit Counter Offer")');
    
    // Admin accepts final counter
    await adminPage.reload();
    await adminPage.click('button:has-text("Accept Counter Offer")');
    await adminPage.fill('input[name="customer_price"]', '105000');
    await adminPage.click('button:has-text("Accept Counter")');
    
    await expect(adminPage.locator('text=Accepted')).toBeVisible();
  });

  /**
   * Test Case 4: Max rounds reached (5 rounds)
   */
  test('Scenario 4: Max rounds reached', async ({ page, context }) => {
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage);
    await loginAsVendor(page);
    
    // Round 1: Vendor counter
    await navigateToQuote(page, QUOTE_UUID, true);
    await page.click('button:has-text("Counter Offer")');
    await page.fill('input[name="items.0.counter_unit_price"]', '80000');
    await page.click('button:has-text("Submit Counter Offer")');
    
    // Round 2: Admin counter
    await navigateToQuote(adminPage, QUOTE_UUID);
    await adminPage.click('button:has-text("Counter Offer")');
    await adminPage.fill('input[name="items.0.admin_counter_unit_price"]', '77000');
    await adminPage.click('button:has-text("Submit Admin Counter")');
    
    // Round 3: Vendor counter
    await page.reload();
    await page.click('button:has-text("Counter Lagi")');
    await page.fill('input[name="items.0.counter_unit_price"]', '78000');
    await page.click('button:has-text("Submit Counter Offer")');
    
    // Round 4: Admin counter (final round warning should appear)
    await adminPage.reload();
    await expect(adminPage.locator('text=Warning: This is the final negotiation round')).toBeVisible();
    
    await adminPage.click('button:has-text("Counter Offer")');
    await adminPage.fill('input[name="items.0.admin_counter_unit_price"]', '77500');
    await adminPage.click('button:has-text("Submit Admin Counter")');
    
    // Round 5: Vendor sees final round warning
    await page.reload();
    await expect(page.locator('text=Peringatan: Ini adalah round terakhir negosiasi')).toBeVisible();
    
    // Vendor tries to counter (should fail or be last round)
    await page.click('button:has-text("Counter Lagi")');
    await page.fill('input[name="items.0.counter_unit_price"]', '78000');
    await page.click('button:has-text("Submit Counter Offer")');
    
    // Should show error or warning
    await expect(page.locator('text=Maximum negotiation rounds reached')).toBeVisible();
  });

  /**
   * Test Case 5: Admin rejects vendor counter offer
   */
  test('Scenario 5: Admin rejects counter offer', async ({ page, context }) => {
    // Vendor counter
    await loginAsVendor(page);
    await navigateToQuote(page, QUOTE_UUID, true);
    
    await page.click('button:has-text("Counter Offer")');
    await page.fill('input[name="items.0.counter_unit_price"]', '85000');
    await page.click('button:has-text("Submit Counter Offer")');
    
    // Admin rejects
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage);
    await navigateToQuote(adminPage, QUOTE_UUID);
    
    await adminPage.click('button:has-text("Reject Counter Offer")');
    await adminPage.fill('textarea[name="rejection_reason"]', 'Price too high, please revise your offer');
    await adminPage.click('button:has-text("Reject Counter")');
    
    await expect(adminPage.locator('text=Counter offer rejected')).toBeVisible();
    
    // Verify rejection notice
    await adminPage.waitForTimeout(1000);
    await expect(adminPage.locator('text=Counter Offer Rejected')).toBeVisible();
    await expect(adminPage.locator('text=1 of 2 rejections')).toBeVisible();
  });

  /**
   * Test Case 6: Re-negotiation after rejection
   */
  test('Scenario 6: Re-negotiation after rejection', async ({ page, context }) => {
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage);
    await loginAsVendor(page);
    
    // Round 1: Vendor counter
    await navigateToQuote(page, QUOTE_UUID, true);
    await page.click('button:has-text("Counter Offer")');
    await page.fill('input[name="items.0.counter_unit_price"]', '85000');
    await page.click('button:has-text("Submit Counter Offer")');
    
    // Admin rejects
    await navigateToQuote(adminPage, QUOTE_UUID);
    await adminPage.click('button:has-text("Reject Counter Offer")');
    await adminPage.fill('textarea[name="rejection_reason"]', 'Price too high');
    await adminPage.click('button:has-text("Reject Counter")');
    
    // Vendor sees rejection and submits revised counter
    await page.reload();
    await expect(page.locator('text=Riwayat Penolakan')).toBeVisible();
    await expect(page.locator('text=Price too high')).toBeVisible();
    await expect(page.locator('text=Anda masih memiliki 1 kesempatan lagi')).toBeVisible();
    
    await page.click('button:has-text("Counter Offer Baru")');
    await page.fill('input[name="items.0.counter_unit_price"]', '78000');
    await page.click('button:has-text("Submit Counter Offer")');
    
    // Admin accepts revised counter
    await adminPage.reload();
    await adminPage.click('button:has-text("Accept Counter Offer")');
    await adminPage.fill('input[name="customer_price"]', '105000');
    await adminPage.click('button:has-text("Accept Counter")');
    
    await expect(adminPage.locator('text=Accepted')).toBeVisible();
  });

  /**
   * Test Case 7: Max rejections reached (2 rejections)
   */
  test('Scenario 7: Max rejections reached', async ({ page, context }) => {
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage);
    await loginAsVendor(page);
    
    // Round 1: Vendor counter
    await navigateToQuote(page, QUOTE_UUID, true);
    await page.click('button:has-text("Counter Offer")');
    await page.fill('input[name="items.0.counter_unit_price"]', '85000');
    await page.click('button:has-text("Submit Counter Offer")');
    
    // Rejection 1
    await navigateToQuote(adminPage, QUOTE_UUID);
    await adminPage.click('button:has-text("Reject Counter Offer")');
    await adminPage.fill('textarea[name="rejection_reason"]', 'Price too high');
    await adminPage.click('button:has-text("Reject Counter")');
    
    // Round 2: Vendor counter again
    await page.reload();
    await page.click('button:has-text("Counter Offer Baru")');
    await page.fill('input[name="items.0.counter_unit_price"]', '82000');
    await page.click('button:has-text("Submit Counter Offer")');
    
    // Rejection 2 (max reached)
    await adminPage.reload();
    await adminPage.click('button:has-text("Reject Counter Offer")');
    await adminPage.fill('textarea[name="rejection_reason"]', 'Still too high, cannot proceed');
    await adminPage.click('button:has-text("Reject Counter")');
    
    // Verify max rejections reached
    await adminPage.waitForTimeout(1000);
    await expect(adminPage.locator('text=Maximum rejections reached')).toBeVisible();
    await expect(adminPage.locator('text=2 of 2 rejections')).toBeVisible();
    
    // Vendor sees max rejections message
    await page.reload();
    await expect(page.locator('text=Maksimal penolakan tercapai')).toBeVisible();
    await expect(page.locator('text=2 dari 2 penolakan')).toBeVisible();
    
    // Counter offer button should be disabled or hidden
    await expect(page.locator('button:has-text("Counter Offer")')).not.toBeVisible();
  });

  /**
   * Test Case 8: Vendor accepts original price after rejection
   */
  test('Scenario 8: Accept original after rejection', async ({ page, context }) => {
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage);
    await loginAsVendor(page);
    
    // Vendor counter
    await navigateToQuote(page, QUOTE_UUID, true);
    await page.click('button:has-text("Counter Offer")');
    await page.fill('input[name="items.0.counter_unit_price"]', '85000');
    await page.click('button:has-text("Submit Counter Offer")');
    
    // Admin rejects
    await navigateToQuote(adminPage, QUOTE_UUID);
    await adminPage.click('button:has-text("Reject Counter Offer")');
    await adminPage.fill('textarea[name="rejection_reason"]', 'Price too high');
    await adminPage.click('button:has-text("Reject Counter")');
    
    // Vendor sees original price card and accepts it
    await page.reload();
    await expect(page.locator('text=Harga Asli PT CEX')).toBeVisible();
    
    await page.click('button:has-text("Terima Harga Asli")');
    await page.fill('input[name="estimatedDeliveryDays"]', '7');
    await page.fill('textarea[name="notes"]', 'Accepting original price');
    await page.click('button:has-text("Submit Response")');
    
    await expect(page.locator('text=Response submitted successfully')).toBeVisible();
    await expect(page.locator('text=Accepted')).toBeVisible();
  });

  /**
   * Test Case 9: Admin counter after vendor counter (two-way)
   */
  test('Scenario 9: Admin counter after vendor counter', async ({ page, context }) => {
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage);
    await loginAsVendor(page);
    
    // Vendor counter
    await navigateToQuote(page, QUOTE_UUID, true);
    await page.click('button:has-text("Counter Offer")');
    await page.fill('input[name="items.0.counter_unit_price"]', '80000');
    await page.click('button:has-text("Submit Counter Offer")');
    
    // Admin counter back
    await navigateToQuote(adminPage, QUOTE_UUID);
    await expect(adminPage.locator('text=Counter Offer Pending')).toBeVisible();
    
    await adminPage.click('button:has-text("Counter Offer")');
    await adminPage.fill('input[name="items.0.admin_counter_unit_price"]', '77000');
    await adminPage.fill('textarea[name="notes"]', 'Admin counter offer');
    await adminPage.click('button:has-text("Submit Admin Counter")');
    
    await expect(adminPage.locator('text=Admin counter offer submitted')).toBeVisible();
    
    // Vendor sees admin counter
    await page.reload();
    await expect(page.locator('text=Admin Countered')).toBeVisible();
    await expect(page.locator('text=Admin Counter Offer')).toBeVisible();
    await expect(page.locator('text=Rp 77,000')).toBeVisible();
    
    // Vendor can counter again
    await page.click('button:has-text("Counter Lagi")');
    await page.fill('input[name="items.0.counter_unit_price"]', '78000');
    await page.click('button:has-text("Submit Counter Offer")');
    
    await expect(page.locator('text=Counter offer submitted')).toBeVisible();
  });

  /**
   * Test Case 10: Final round warning behavior
   */
  test('Scenario 10: Final round warning behavior', async ({ page, context }) => {
    const adminPage = await context.newPage();
    await loginAsAdmin(adminPage);
    await loginAsVendor(page);
    
    // Get to round 4 (final round warning)
    await navigateToQuote(page, QUOTE_UUID, true);
    
    // Round 1: Vendor counter
    await page.click('button:has-text("Counter Offer")');
    await page.fill('input[name="items.0.counter_unit_price"]', '80000');
    await page.click('button:has-text("Submit Counter Offer")');
    
    // Round 2: Admin counter
    await navigateToQuote(adminPage, QUOTE_UUID);
    await adminPage.click('button:has-text("Counter Offer")');
    await adminPage.fill('input[name="items.0.admin_counter_unit_price"]', '77000');
    await adminPage.click('button:has-text("Submit Admin Counter")');
    
    // Round 3: Vendor counter
    await page.reload();
    await page.click('button:has-text("Counter Lagi")');
    await page.fill('input[name="items.0.counter_unit_price"]', '78000');
    await page.click('button:has-text("Submit Counter Offer")');
    
    // Round 4: Admin should see warning
    await adminPage.reload();
    await expect(adminPage.locator('text=Warning: This is the final negotiation round')).toBeVisible();
    await expect(adminPage.locator('text=round 4 of maximum 5')).toBeVisible();
    
    // Admin counters (round 5)
    await adminPage.click('button:has-text("Counter Offer")');
    await adminPage.fill('input[name="items.0.admin_counter_unit_price"]', '77500');
    await adminPage.click('button:has-text("Submit Admin Counter")');
    
    // Vendor should see final round warning
    await page.reload();
    await expect(page.locator('text=Peringatan: Ini adalah round terakhir negosiasi')).toBeVisible();
    await expect(page.locator('text=round 5 dari maksimal 5')).toBeVisible();
    
    // Vendor accepts (wise choice)
    await page.click('button:has-text("Terima Counter Admin")');
    await page.fill('input[name="estimatedDeliveryDays"]', '7');
    await page.click('button:has-text("Submit Response")');
    
    await expect(page.locator('text=Accepted')).toBeVisible();
  });
});
