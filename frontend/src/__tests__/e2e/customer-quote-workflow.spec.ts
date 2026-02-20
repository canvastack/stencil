import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Customer Quote Workflow
 * 
 * Tests the complete customer quote workflow from admin perspective:
 * - Admin creates customer quote from vendor quote
 * - Admin sends quote to customer
 * - Admin reviews pending approvals
 * - Admin approves/rejects quotes
 * - Admin generates documents
 * 
 * Related: .kiro/specs/customer-quote-workflow/requirements.md
 */

// Test data
const TEST_TENANT = {
  domain: 'test-tenant.localhost',
  email: 'admin@test-tenant.com',
  password: 'password123',
};

// Helper functions
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', TEST_TENANT.email);
  await page.fill('input[name="password"]', TEST_TENANT.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin/dashboard');
}

test.describe('Customer Quote Workflow - Admin', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await loginAsAdmin(page);
  });

  test('Admin creates and sends customer quote', async ({ page }) => {
    // Navigate to orders list
    await page.goto('/admin/orders');
    await expect(page.locator('h1')).toContainText('Orders');

    // Find an order in customer_quote stage with accepted vendor quote
    await page.click('button:has-text("Filter")');
    await page.selectOption('select[name="status"]', 'customer_quote');
    await page.click('button:has-text("Apply")');

    // Click on first order
    const firstOrder = page.locator('table tbody tr').first();
    await firstOrder.click();
    await page.waitForURL(/\/admin\/orders\/.+/);

    // Verify order details loaded
    await expect(page.locator('h1')).toContainText('Order Details');

    // Click "Create Customer Quote" button
    await page.click('button:has-text("Create Customer Quote")');

    // Fill quote form
    await page.fill('input[name="title"]', 'Customer Quotation - Test Product');
    await page.fill('input[name="profit_percentage"]', '20');
    await page.fill('input[name="handling_fee"]', '50000');
    await page.fill('input[name="shipping_cost"]', '30000');
    await page.fill('input[name="insurance"]', '20000');
    await page.fill('input[name="tax_rate"]', '11');
    await page.fill('textarea[name="payment_terms"]', 'DP 50% + Balance 50%');
    await page.fill('input[name="delivery_timeline"]', '7-14 working days');
    await page.fill('textarea[name="terms_conditions"]', 'Standard terms and conditions apply');

    // Set valid until date (7 days from now)
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);
    await page.fill('input[name="valid_until"]', validUntil.toISOString().split('T')[0]);

    // Submit form
    await page.click('button:has-text("Create Quote")');

    // Verify success message
    await expect(page.locator('.toast-success, .alert-success')).toContainText('Quote created successfully');

    // Verify quote appears in order details
    await expect(page.locator('text=Customer Quote')).toBeVisible();
    await expect(page.locator('text=Draft')).toBeVisible();

    // Send quote to customer
    await page.click('button:has-text("Send to Customer")');
    await page.click('button:has-text("Confirm")'); // Confirmation dialog

    // Verify quote sent
    await expect(page.locator('.toast-success')).toContainText('Quote sent successfully');
    await expect(page.locator('text=Sent')).toBeVisible();

    // Verify quote number format (CQ-YYYYMM-NNNN)
    const quoteNumber = await page.locator('[data-testid="quote-number"]').textContent();
    expect(quoteNumber || '').toMatch(/^CQ-\d{6}-\d{4}$/);
  });

  test('Admin views pending approvals', async ({ page }) => {
    // Navigate to pending approvals page
    await page.goto('/admin/approvals/pending');
    await expect(page.locator('h1')).toContainText('Pending Approvals');

    // Verify table headers
    await expect(page.locator('th:has-text("Quote Number")')).toBeVisible();
    await expect(page.locator('th:has-text("Customer")')).toBeVisible();
    await expect(page.locator('th:has-text("Amount")')).toBeVisible();
    await expect(page.locator('th:has-text("Reason")')).toBeVisible();
    await expect(page.locator('th:has-text("Actions")')).toBeVisible();

    // Check if there are pending quotes
    const pendingCount = await page.locator('table tbody tr').count();
    
    if (pendingCount > 0) {
      // Verify first pending quote has required information
      const firstRow = page.locator('table tbody tr').first();
      await expect(firstRow.locator('td').nth(0)).not.toBeEmpty(); // Quote number
      await expect(firstRow.locator('td').nth(1)).not.toBeEmpty(); // Customer
      await expect(firstRow.locator('td').nth(2)).toContainText('Rp'); // Amount
      await expect(firstRow.locator('td').nth(3)).not.toBeEmpty(); // Reason
      
      // Verify action buttons
      await expect(firstRow.locator('button:has-text("Approve")')).toBeVisible();
      await expect(firstRow.locator('button:has-text("Reject")')).toBeVisible();
    }
  });

  test('Admin approves pending quote', async ({ page }) => {
    // Navigate to pending approvals
    await page.goto('/admin/approvals/pending');

    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 5000 });

    const pendingCount = await page.locator('table tbody tr').count();
    
    if (pendingCount === 0) {
      test.skip();
      return;
    }

    // Click approve on first pending quote
    const firstRow = page.locator('table tbody tr').first();
    const quoteNumber = await firstRow.locator('td').first().textContent();
    
    await firstRow.locator('button:has-text("Approve")').click();

    // Fill approval form
    await page.fill('textarea[name="approval_notes"]', 'Approved after verification of customer trust score');
    await page.click('button:has-text("Confirm Approval")');

    // Verify success message
    await expect(page.locator('.toast-success')).toContainText('Quote approved successfully');

    // Verify quote removed from pending list
    await page.waitForTimeout(1000); // Wait for list to refresh
    const newCount = await page.locator('table tbody tr').count();
    expect(newCount).toBe(pendingCount - 1);

    // Navigate to quote detail to verify status
    await page.goto('/admin/customer-quotes');
    await page.fill('input[placeholder*="Search"]', quoteNumber || '');
    await page.click(`text=${quoteNumber}`);
    
    // Verify quote status is accepted
    await expect(page.locator('[data-testid="quote-status"]')).toContainText('Accepted');
    await expect(page.locator('text=Approved after verification')).toBeVisible();
  });

  test('Admin rejects pending quote', async ({ page }) => {
    // Navigate to pending approvals
    await page.goto('/admin/approvals/pending');

    await page.waitForSelector('table tbody tr', { timeout: 5000 });
    const pendingCount = await page.locator('table tbody tr').count();
    
    if (pendingCount === 0) {
      test.skip();
      return;
    }

    // Click reject on first pending quote
    const firstRow = page.locator('table tbody tr').first();
    const quoteNumber = await firstRow.locator('td').first().textContent();
    
    await firstRow.locator('button:has-text("Reject")').click();

    // Fill rejection form
    await page.fill('textarea[name="rejection_reason"]', 'Customer has insufficient payment history and order value exceeds acceptable risk threshold');
    await page.click('button:has-text("Confirm Rejection")');

    // Verify success message
    await expect(page.locator('.toast-success')).toContainText('Quote rejected successfully');

    // Verify quote removed from pending list
    await page.waitForTimeout(1000);
    const newCount = await page.locator('table tbody tr').count();
    expect(newCount).toBe(pendingCount - 1);

    // Navigate to quote detail to verify status
    await page.goto('/admin/customer-quotes');
    await page.fill('input[placeholder*="Search"]', quoteNumber || '');
    await page.click(`text=${quoteNumber}`);
    
    // Verify quote status is rejected
    await expect(page.locator('[data-testid="quote-status"]')).toContainText('Rejected');
    await expect(page.locator('text=insufficient payment history')).toBeVisible();
  });

  test('Admin generates quotation document', async ({ page }) => {
    // Navigate to customer quotes list
    await page.goto('/admin/customer-quotes');

    // Filter for accepted quotes
    await page.click('button:has-text("Filter")');
    await page.selectOption('select[name="status"]', 'accepted');
    await page.click('button:has-text("Apply")');

    await page.waitForSelector('table tbody tr', { timeout: 5000 });
    const quoteCount = await page.locator('table tbody tr').count();
    
    if (quoteCount === 0) {
      test.skip();
      return;
    }

    // Click on first accepted quote
    await page.locator('table tbody tr').first().click();
    await page.waitForURL(/\/admin\/customer-quotes\/.+/);

    // Click generate document button
    await page.click('button:has-text("Generate Document")');

    // Select document type
    await page.selectOption('select[name="document_type"]', 'quotation');
    await page.click('button:has-text("Generate")');

    // Verify success message
    await expect(page.locator('.toast-success')).toContainText('Document generated successfully');

    // Verify document appears in documents list
    await expect(page.locator('text=Quotation')).toBeVisible();
    await expect(page.locator('[data-testid="document-status"]')).toContainText('Generated');

    // Verify download button is available
    await expect(page.locator('button:has-text("Download")')).toBeVisible();

    // Test download (don't actually download, just verify link)
    const downloadButton = page.locator('button:has-text("Download")').first();
    await expect(downloadButton).toBeEnabled();
  });

  test('Admin views negotiation history', async ({ page }) => {
    // Navigate to customer quotes
    await page.goto('/admin/customer-quotes');

    // Filter for countered quotes
    await page.click('button:has-text("Filter")');
    await page.selectOption('select[name="status"]', 'countered');
    await page.click('button:has-text("Apply")');

    await page.waitForSelector('table tbody tr', { timeout: 5000 });
    const quoteCount = await page.locator('table tbody tr').count();
    
    if (quoteCount === 0) {
      test.skip();
      return;
    }

    // Click on first countered quote
    await page.locator('table tbody tr').first().click();
    await page.waitForURL(/\/admin\/customer-quotes\/.+/);

    // Click negotiation history tab
    await page.click('button:has-text("Negotiation History")');

    // Verify history entries
    await expect(page.locator('[data-testid="negotiation-history"]')).toBeVisible();
    
    // Verify history contains required information
    const historyEntries = page.locator('[data-testid="history-entry"]');
    const entryCount = await historyEntries.count();
    
    if (entryCount > 0) {
      const firstEntry = historyEntries.first();
      await expect(firstEntry.locator('text=Round')).toBeVisible();
      await expect(firstEntry.locator('text=Rp')).toBeVisible(); // Amount
      await expect(firstEntry.locator('[data-testid="history-timestamp"]')).toBeVisible();
    }
  });

  test('Admin responds to counter offer', async ({ page }) => {
    // Navigate to customer quotes
    await page.goto('/admin/customer-quotes');

    // Filter for countered quotes
    await page.click('button:has-text("Filter")');
    await page.selectOption('select[name="status"]', 'countered');
    await page.click('button:has-text("Apply")');

    await page.waitForSelector('table tbody tr', { timeout: 5000 });
    const quoteCount = await page.locator('table tbody tr').count();
    
    if (quoteCount === 0) {
      test.skip();
      return;
    }

    // Click on first countered quote
    await page.locator('table tbody tr').first().click();
    await page.waitForURL(/\/admin\/customer-quotes\/.+/);

    // Verify counter offer details
    await expect(page.locator('text=Counter Offer')).toBeVisible();
    await expect(page.locator('[data-testid="counter-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="counter-notes"]')).toBeVisible();

    // Test accepting counter offer
    await page.click('button:has-text("Accept Counter Offer")');
    await page.fill('textarea[name="notes"]', 'Counter offer accepted - price is reasonable');
    await page.click('button:has-text("Confirm")');

    // Verify success
    await expect(page.locator('.toast-success')).toContainText('Counter offer accepted');
    await expect(page.locator('[data-testid="quote-status"]')).toContainText('Accepted');
  });

  test('Admin configures approval settings', async ({ page }) => {
    // Navigate to approval settings
    await page.goto('/admin/settings/approvals');
    await expect(page.locator('h1')).toContainText('Approval Settings');

    // Verify form fields
    await expect(page.locator('input[name="auto_approval_enabled"]')).toBeVisible();
    await expect(page.locator('input[name="auto_approval_threshold"]')).toBeVisible();
    await expect(page.locator('input[name="require_email_verification"]')).toBeVisible();
    await expect(page.locator('input[name="min_successful_orders"]')).toBeVisible();
    await expect(page.locator('input[name="min_payment_success_rate"]')).toBeVisible();
    await expect(page.locator('input[name="max_negotiation_rounds"]')).toBeVisible();

    // Update settings
    await page.check('input[name="auto_approval_enabled"]');
    await page.fill('input[name="auto_approval_threshold"]', '10000000'); // 10 million
    await page.check('input[name="require_email_verification"]');
    await page.fill('input[name="min_successful_orders"]', '3');
    await page.fill('input[name="min_payment_success_rate"]', '80');
    await page.fill('input[name="max_negotiation_rounds"]', '3');

    // Save settings
    await page.click('button:has-text("Save Settings")');

    // Verify success
    await expect(page.locator('.toast-success')).toContainText('Settings updated successfully');

    // Reload page and verify settings persisted
    await page.reload();
    await expect(page.locator('input[name="auto_approval_enabled"]')).toBeChecked();
    await expect(page.locator('input[name="auto_approval_threshold"]')).toHaveValue('10000000');
  });
});
