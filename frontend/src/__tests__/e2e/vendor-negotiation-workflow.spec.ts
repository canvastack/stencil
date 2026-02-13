import { test, expect, Page } from '@playwright/test';

/**
 * End-to-End Workflow Test: Multi-Round Quote Negotiation
 * 
 * This test verifies the complete multi-round negotiation workflow between
 * admin and vendor. It covers:
 * 
 * 1. Admin sends initial quote to vendor
 * 2. Vendor submits counter offer
 * 3. Admin reviews counter offer and sends revised quote
 * 4. Vendor accepts revised quote
 * 5. Both parties receive notifications at each step
 * 6. Audit trail is maintained throughout
 * 
 * Requirements: 6.8-6.15, 18.3-18.5, 16.1-16.4
 */

// Test data
const testVendor = {
  email: 'negotiation-vendor@testcompany.com',
  password: 'VendorPass123!',
  companyName: 'Negotiation Test Vendor',
};

const testAdmin = {
  email: 'admin@ptcex.com',
  password: 'Admin123!',
};

const testQuote = {
  quoteNumber: 'Q-2026-NEGO-001',
  orderNumber: 'ORD-2026-NEGO-001',
  customerName: 'Negotiation Customer',
  productName: 'Premium Etching Plate',
  initialAmount: 2000000, // Rp 2,000,000
  counterAmount: 1750000, // Rp 1,750,000 (12.5% discount)
  finalAmount: 1850000,   // Rp 1,850,000 (7.5% discount)
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
async function loginAsVendor(page: Page) {
  await page.goto('/vendor/login');
  await page.fill('input[name="email"]', testVendor.email);
  await page.fill('input[name="password"]', testVendor.password);
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

test.describe('Multi-Round Quote Negotiation Workflow', () => {
  test.setTimeout(180000); // 3 minutes for complete negotiation workflow

  test('should complete multi-round negotiation with counter offers', async ({ page }) => {
    // ============================================================
    // ROUND 1: Admin sends initial quote
    // ============================================================

    await test.step('Admin logs in and creates initial quote', async () => {
      await loginAsAdmin(page);
      
      await page.click('a[href="/admin/quotes"]');
      await page.waitForURL('/admin/quotes');
      
      await page.click('button:has-text("Create Quote")');
      
      // Fill quote form with initial amount
      await page.fill('input[name="quote_number"]', testQuote.quoteNumber);
      await page.fill('input[name="order_number"]', testQuote.orderNumber);
      await page.selectOption('select[name="vendor_id"]', { label: testVendor.companyName });
      await page.fill('input[name="customer_name"]', testQuote.customerName);
      await page.fill('input[name="product_name"]', testQuote.productName);
      await page.fill('input[name="amount"]', testQuote.initialAmount.toString());
      await page.fill('input[name="expires_in_days"]', '14');
      await page.fill('textarea[name="notes"]', 'Initial quote for premium etching plate');
      
      await page.click('button[type="submit"]');
      await expect(page.locator('.toast-success')).toBeVisible();
    });

    await test.step('Admin sends quote to vendor', async () => {
      await page.click(`tr:has-text("${testQuote.quoteNumber}")`);
      await page.click('button:has-text("Send to Vendor")');
      await page.click('button:has-text("Confirm")');
      
      await expect(page.locator('.toast-success')).toContainText('Quote sent');
      await expect(page.locator('text=Status: Sent')).toBeVisible();
      await expect(page.locator(`text=Rp ${testQuote.initialAmount.toLocaleString()}`)).toBeVisible();
    });

    await test.step('Admin logs out', async () => {
      await logout(page);
    });

    // ============================================================
    // ROUND 2: Vendor submits counter offer
    // ============================================================

    await test.step('Vendor logs in and views quote', async () => {
      await loginAsVendor(page);
      
      await page.click('a[href="/vendor/quotes"]');
      await page.waitForURL('/vendor/quotes');
      
      await expect(page.locator(`text=${testQuote.quoteNumber}`)).toBeVisible();
      await page.click(`tr:has-text("${testQuote.quoteNumber}")`);
      await page.waitForURL(/\/vendor\/quotes\/[a-f0-9-]+/);
    });

    await test.step('Vendor reviews initial quote amount', async () => {
      await expect(page.locator('h1')).toContainText(testQuote.quoteNumber);
      await expect(page.locator(`text=Rp ${testQuote.initialAmount.toLocaleString()}`)).toBeVisible();
      await expect(page.locator('text=Status: Sent')).toBeVisible();
    });

    await test.step('Vendor submits counter offer', async () => {
      await page.click('button:has-text("Counter Offer")');
      
      // Fill counter offer form
      await page.fill('input[name="counter_amount"]', testQuote.counterAmount.toString());
      await page.fill('textarea[name="notes"]', 
        `We can offer a competitive price of Rp ${testQuote.counterAmount.toLocaleString()} ` +
        `(12.5% discount from initial quote). This reflects our current material costs and production capacity.`
      );
      
      await page.click('button:has-text("Submit Counter Offer")');
      
      await expect(page.locator('.toast-success')).toContainText('Counter offer submitted');
      await expect(page.locator('text=Status: Countered')).toBeVisible();
      await expect(page.locator(`text=Rp ${testQuote.counterAmount.toLocaleString()}`)).toBeVisible();
    });

    await test.step('Vendor verifies counter offer details', async () => {
      // Verify response is recorded
      await expect(page.locator('text=Response Type: Counter Offer')).toBeVisible();
      await expect(page.locator('text=Responded At:')).toBeVisible();
      
      // Verify response buttons are disabled
      await expect(page.locator('button:has-text("Accept Quote")')).toBeDisabled();
      await expect(page.locator('button:has-text("Reject Quote")')).toBeDisabled();
      await expect(page.locator('button:has-text("Counter Offer")')).toBeDisabled();
    });

    await test.step('Vendor logs out', async () => {
      await logout(page);
    });

    // ============================================================
    // ROUND 3: Admin reviews counter offer and sends revised quote
    // ============================================================

    await test.step('Admin logs in and sees counter offer notification', async () => {
      await loginAsAdmin(page);
      
      // Check notification
      const notificationBadge = page.locator('[aria-label="Notifications"] .badge');
      await expect(notificationBadge).toBeVisible();
      
      await page.click('[aria-label="Notifications"]');
      await expect(page.locator('.notification-item')).toContainText('counter offer');
      await expect(page.locator('.notification-item')).toContainText(testQuote.quoteNumber);
    });

    await test.step('Admin reviews counter offer details', async () => {
      await page.click(`.notification-item:has-text("${testQuote.quoteNumber}")`);
      await page.waitForURL(/\/admin\/quotes\/[a-f0-9-]+/);
      
      // Verify counter offer details
      await expect(page.locator('text=Status: Countered')).toBeVisible();
      await expect(page.locator(`text=Counter Offer: Rp ${testQuote.counterAmount.toLocaleString()}`)).toBeVisible();
      await expect(page.locator('text=12.5% discount')).toBeVisible();
    });

    await test.step('Admin sends revised quote with final amount', async () => {
      // Click "Revise Quote" button
      await page.click('button:has-text("Revise Quote")');
      
      // Update quote amount to final negotiated price
      await page.fill('input[name="amount"]', testQuote.finalAmount.toString());
      await page.fill('textarea[name="notes"]', 
        `We can meet you at Rp ${testQuote.finalAmount.toLocaleString()} ` +
        `(7.5% discount). This is our best offer considering the project requirements.`
      );
      
      await page.click('button:has-text("Send Revised Quote")');
      
      await expect(page.locator('.toast-success')).toContainText('Revised quote sent');
      await expect(page.locator('text=Status: Sent')).toBeVisible();
      await expect(page.locator(`text=Rp ${testQuote.finalAmount.toLocaleString()}`)).toBeVisible();
      await expect(page.locator('text=Round: 2')).toBeVisible();
    });

    await test.step('Admin verifies negotiation history', async () => {
      // Click "History" tab
      await page.click('button:has-text("History")');
      
      // Verify all rounds are recorded
      await expect(page.locator('text=Round 1: Initial Quote')).toBeVisible();
      await expect(page.locator(`text=Rp ${testQuote.initialAmount.toLocaleString()}`)).toBeVisible();
      
      await expect(page.locator('text=Round 1: Counter Offer')).toBeVisible();
      await expect(page.locator(`text=Rp ${testQuote.counterAmount.toLocaleString()}`)).toBeVisible();
      
      await expect(page.locator('text=Round 2: Revised Quote')).toBeVisible();
      await expect(page.locator(`text=Rp ${testQuote.finalAmount.toLocaleString()}`)).toBeVisible();
    });

    await test.step('Admin logs out', async () => {
      await logout(page);
    });

    // ============================================================
    // ROUND 4: Vendor accepts revised quote
    // ============================================================

    await test.step('Vendor logs in and sees revised quote notification', async () => {
      await loginAsVendor(page);
      
      // Check notification
      const notificationBadge = page.locator('[aria-label="Notifications"] .badge');
      await expect(notificationBadge).toBeVisible();
      
      await page.click('[aria-label="Notifications"]');
      await expect(page.locator('.notification-item')).toContainText('revised quote');
      await expect(page.locator('.notification-item')).toContainText(testQuote.quoteNumber);
    });

    await test.step('Vendor reviews revised quote', async () => {
      await page.click(`.notification-item:has-text("${testQuote.quoteNumber}")`);
      await page.waitForURL(/\/vendor\/quotes\/[a-f0-9-]+/);
      
      // Verify revised quote details
      await expect(page.locator('text=Status: Sent')).toBeVisible();
      await expect(page.locator(`text=Rp ${testQuote.finalAmount.toLocaleString()}`)).toBeVisible();
      await expect(page.locator('text=Round: 2')).toBeVisible();
      await expect(page.locator('text=7.5% discount')).toBeVisible();
    });

    await test.step('Vendor accepts revised quote', async () => {
      await page.click('button:has-text("Accept Quote")');
      
      // Fill acceptance form
      await page.fill('input[name="estimated_delivery_days"]', '21');
      await page.fill('textarea[name="notes"]', 
        `Thank you for the revised offer. We accept Rp ${testQuote.finalAmount.toLocaleString()} ` +
        `and can deliver within 3 weeks.`
      );
      
      await page.click('button:has-text("Submit Acceptance")');
      
      await expect(page.locator('.toast-success')).toContainText('Quote accepted');
      await expect(page.locator('text=Status: Accepted')).toBeVisible();
    });

    await test.step('Vendor verifies final quote details', async () => {
      // Verify final accepted amount
      await expect(page.locator(`text=Final Amount: Rp ${testQuote.finalAmount.toLocaleString()}`)).toBeVisible();
      await expect(page.locator('text=Estimated Delivery: 21 days')).toBeVisible();
      await expect(page.locator('text=Response Type: Accept')).toBeVisible();
      
      // Verify negotiation summary
      await page.click('button:has-text("Negotiation Summary")');
      await expect(page.locator(`text=Initial Quote: Rp ${testQuote.initialAmount.toLocaleString()}`)).toBeVisible();
      await expect(page.locator(`text=Counter Offer: Rp ${testQuote.counterAmount.toLocaleString()}`)).toBeVisible();
      await expect(page.locator(`text=Final Accepted: Rp ${testQuote.finalAmount.toLocaleString()}`)).toBeVisible();
      
      const discount = ((testQuote.initialAmount - testQuote.finalAmount) / testQuote.initialAmount * 100).toFixed(1);
      await expect(page.locator(`text=Total Discount: ${discount}%`)).toBeVisible();
    });

    await test.step('Vendor logs out', async () => {
      await logout(page);
    });

    // ============================================================
    // VERIFICATION: Admin sees final acceptance
    // ============================================================

    await test.step('Admin logs in and sees acceptance notification', async () => {
      await loginAsAdmin(page);
      
      await page.click('[aria-label="Notifications"]');
      await expect(page.locator('.notification-item')).toContainText('accepted');
      await expect(page.locator('.notification-item')).toContainText(testQuote.quoteNumber);
    });

    await test.step('Admin verifies complete negotiation workflow', async () => {
      await page.click(`.notification-item:has-text("${testQuote.quoteNumber}")`);
      await page.waitForURL(/\/admin\/quotes\/[a-f0-9-]+/);
      
      // Verify final status
      await expect(page.locator('text=Status: Accepted')).toBeVisible();
      await expect(page.locator(`text=Final Amount: Rp ${testQuote.finalAmount.toLocaleString()}`)).toBeVisible();
      
      // Verify complete audit trail
      await page.click('button:has-text("Audit Trail")');
      
      const auditEntries = [
        'Quote Created',
        'Quote Sent to Vendor',
        'Vendor Submitted Counter Offer',
        'Admin Sent Revised Quote',
        'Vendor Accepted Quote',
      ];
      
      for (const entry of auditEntries) {
        await expect(page.locator(`text=${entry}`)).toBeVisible();
      }
    });

    await test.step('Admin verifies negotiation metrics', async () => {
      // Check negotiation statistics
      await page.click('button:has-text("Statistics")');
      
      await expect(page.locator('text=Total Rounds: 2')).toBeVisible();
      await expect(page.locator('text=Negotiation Duration:')).toBeVisible();
      await expect(page.locator('text=Final Discount: 7.5%')).toBeVisible();
      await expect(page.locator('text=Outcome: Accepted')).toBeVisible();
    });

    // ============================================================
    // WORKFLOW COMPLETE
    // ============================================================

    console.log('✅ Multi-round negotiation workflow test passed!');
    console.log(`   Initial: Rp ${testQuote.initialAmount.toLocaleString()}`);
    console.log(`   Counter: Rp ${testQuote.counterAmount.toLocaleString()}`);
    console.log(`   Final:   Rp ${testQuote.finalAmount.toLocaleString()}`);
  });
});

