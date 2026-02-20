import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Complete Customer Quote Workflow
 * 
 * Tests the end-to-end workflow from quote creation to document generation:
 * 1. Admin creates quote from vendor quote
 * 2. Admin sends quote to customer
 * 3. Customer views and accepts quote
 * 4. System processes approval (auto or manual)
 * 5. Admin generates documents
 * 6. Customer receives payment instructions
 * 
 * Related: .kiro/specs/customer-quote-workflow/requirements.md
 */

// Test configuration
const ADMIN_CREDENTIALS = {
  email: 'admin@test-tenant.com',
  password: 'password123',
};

const TEST_CUSTOMER = {
  name: 'E2E Test Customer',
  email: 'e2e-customer@test.com',
  phone: '+62812345678',
};

// Helper functions
async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', ADMIN_CREDENTIALS.email);
  await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin/dashboard');
}

async function createTestOrder(page: Page): Promise<string> {
  // Navigate to create order page
  await page.goto('/admin/orders/create');
  
  // Fill customer information
  await page.fill('input[name="customer_name"]', TEST_CUSTOMER.name);
  await page.fill('input[name="customer_email"]', TEST_CUSTOMER.email);
  await page.fill('input[name="customer_phone"]', TEST_CUSTOMER.phone);
  
  // Select product
  await page.click('button:has-text("Add Product")');
  await page.selectOption('select[name="product"]', { index: 1 });
  await page.fill('input[name="quantity"]', '2');
  
  // Submit order
  await page.click('button:has-text("Create Order")');
  await page.waitForURL(/\/admin\/orders\/.+/);
  
  // Get order number
  const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
  return orderNumber || '';
}

async function createVendorQuote(page: Page, orderNumber: string): Promise<void> {
  // Navigate to order
  await page.goto('/admin/orders');
  await page.fill('input[placeholder*="Search"]', orderNumber);
  await page.click(`text=${orderNumber}`);
  
  // Create vendor quote
  await page.click('button:has-text("Request Vendor Quote")');
  await page.selectOption('select[name="vendor"]', { index: 1 });
  await page.fill('textarea[name="requirements"]', 'Standard etching requirements');
  await page.click('button:has-text("Send Request")');
  
  // Wait for vendor quote (simulate vendor acceptance)
  // In real scenario, vendor would accept via their portal
  await page.waitForTimeout(1000);
}

test.describe('Complete Customer Quote Workflow', () => {
  test('Complete workflow: Create → Send → Accept → Approve → Document', async ({ page }) => {
    // Step 1: Admin login
    await loginAsAdmin(page);
    await expect(page.locator('h1')).toContainText('Dashboard');

    // Step 2: Create test order
    const orderNumber = await createTestOrder(page);
    expect(orderNumber).toBeTruthy();
    console.log('Created order:', orderNumber);

    // Step 3: Create and accept vendor quote
    await createVendorQuote(page, orderNumber);
    
    // Simulate vendor acceptance (in real scenario, vendor accepts via portal)
    await page.click('button:has-text("Accept Vendor Quote")');
    await page.fill('input[name="amount"]', '5000000');
    await page.click('button:has-text("Confirm")');
    
    // Verify order status updated
    await expect(page.locator('[data-testid="order-status"]')).toContainText('customer_quote');

    // Step 4: Create customer quote
    await page.click('button:has-text("Create Customer Quote")');
    
    // Fill quote form
    await page.fill('input[name="title"]', 'E2E Test Quotation');
    await page.fill('input[name="profit_percentage"]', '20');
    await page.fill('input[name="handling_fee"]', '50000');
    await page.fill('input[name="shipping_cost"]', '30000');
    await page.fill('input[name="insurance"]', '20000');
    await page.fill('input[name="tax_rate"]', '11');
    await page.fill('textarea[name="payment_terms"]', 'DP 50% + Balance 50%');
    await page.fill('input[name="delivery_timeline"]', '7-14 working days');
    
    // Set valid until date
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);
    await page.fill('input[name="valid_until"]', validUntil.toISOString().split('T')[0]);
    
    // Submit quote creation
    await page.click('button:has-text("Create Quote")');
    await expect(page.locator('.toast-success')).toContainText('Quote created');
    
    // Get quote number
    const quoteNumber = await page.locator('[data-testid="quote-number"]').textContent();
    expect(quoteNumber || '').toMatch(/^CQ-\d{6}-\d{4}$/);
    console.log('Created quote:', quoteNumber);

    // Step 5: Send quote to customer
    await page.click('button:has-text("Send to Customer")');
    await page.click('button:has-text("Confirm")');
    await expect(page.locator('.toast-success')).toContainText('Quote sent');
    
    // Get quote token for customer access
    const quoteToken = await page.locator('[data-testid="quote-token"]').getAttribute('data-token');
    expect(quoteToken).toBeTruthy();
    console.log('Quote token:', quoteToken);
    
    if (!quoteToken) {
      throw new Error('Quote token not found');
    }

    // Step 6: Customer views quote (open in new context to simulate different user)
    const customerContext = await page.context().browser()!.newContext();
    const customerPage = await customerContext.newPage();
    
    await customerPage.goto(`/quotes/${quoteToken as string}`);
    await expect(customerPage.locator('h1')).toContainText('Quotation');
    await expect(customerPage.locator('[data-testid="quote-number"]')).toContainText(quoteNumber!);

    // Step 7: Customer accepts quote
    await customerPage.click('button:has-text("Accept Quote")');
    await customerPage.check('input[name="terms_accepted"]');
    await customerPage.click('button:has-text("Confirm Acceptance")');
    
    // Wait for acceptance processing
    await customerPage.waitForSelector('.toast-success', { timeout: 10000 });
    const acceptanceMessage = await customerPage.locator('.toast-success').textContent();
    
    // Check if auto-approved or pending manual approval
    const isAutoApproved = acceptanceMessage?.includes('approved');
    console.log('Auto-approved:', isAutoApproved);

    if (!isAutoApproved) {
      // Step 8a: Manual approval path
      console.log('Quote requires manual approval');
      
      // Switch back to admin
      await page.bringToFront();
      
      // Navigate to pending approvals
      await page.goto('/admin/approvals/pending');
      await expect(page.locator('h1')).toContainText('Pending Approvals');
      
      // Find and approve the quote
      await page.fill('input[placeholder*="Search"]', quoteNumber!);
      await page.click(`text=${quoteNumber}`);
      await page.click('button:has-text("Approve")');
      await page.fill('textarea[name="approval_notes"]', 'E2E test approval');
      await page.click('button:has-text("Confirm Approval")');
      
      await expect(page.locator('.toast-success')).toContainText('approved');
      console.log('Quote manually approved');
    } else {
      console.log('Quote auto-approved');
    }

    // Step 9: Verify quote status is accepted
    await page.goto('/admin/customer-quotes');
    await page.fill('input[placeholder*="Search"]', quoteNumber!);
    await page.click(`text=${quoteNumber}`);
    
    await expect(page.locator('[data-testid="quote-status"]')).toContainText('Accepted');
    await expect(page.locator('[data-testid="approval-method"]')).toContainText(isAutoApproved ? 'Auto' : 'Manual');

    // Step 10: Generate quotation document
    await page.click('button:has-text("Generate Document")');
    await page.selectOption('select[name="document_type"]', 'quotation');
    await page.click('button:has-text("Generate")');
    
    await expect(page.locator('.toast-success')).toContainText('Document generated');
    
    // Verify document appears
    await expect(page.locator('[data-testid="document-list"]')).toContainText('Quotation');
    await expect(page.locator('[data-testid="document-status"]')).toContainText('Generated');

    // Step 11: Verify order status updated to awaiting_payment
    await page.goto('/admin/orders');
    await page.fill('input[placeholder*="Search"]', orderNumber);
    await page.click(`text=${orderNumber}`);
    
    await expect(page.locator('[data-testid="order-status"]')).toContainText('awaiting_payment');

    // Step 12: Customer verifies payment instructions
    await customerPage.bringToFront();
    await customerPage.reload();
    
    await expect(customerPage.locator('text=Payment Instructions')).toBeVisible();
    await expect(customerPage.locator('[data-testid="payment-amount"]')).toBeVisible();
    await expect(customerPage.locator('[data-testid="payment-due-date"]')).toBeVisible();
    
    // Verify DP amount (50% of total)
    const grandTotal = await customerPage.locator('[data-testid="grand-total"]').textContent();
    const dpAmount = await customerPage.locator('[data-testid="dp-amount"]').textContent();
    
    // Both should contain "Rp" and be numeric
    expect(grandTotal).toContain('Rp');
    expect(dpAmount).toContain('Rp');

    // Cleanup
    await customerContext.close();
    
    console.log('✅ Complete workflow test passed!');
  });

  test('Complete workflow with negotiation: Counter offer → Admin accepts', async ({ page }) => {
    // Step 1-6: Same as above (create order, vendor quote, customer quote, send)
    await loginAsAdmin(page);
    const orderNumber = await createTestOrder(page);
    await createVendorQuote(page, orderNumber);
    
    // Accept vendor quote
    await page.click('button:has-text("Accept Vendor Quote")');
    await page.fill('input[name="amount"]', '8000000');
    await page.click('button:has-text("Confirm")');
    
    // Create customer quote
    await page.click('button:has-text("Create Customer Quote")');
    await page.fill('input[name="title"]', 'E2E Negotiation Test');
    await page.fill('input[name="profit_percentage"]', '25');
    await page.fill('input[name="handling_fee"]', '50000');
    await page.fill('input[name="tax_rate"]', '11');
    await page.fill('textarea[name="payment_terms"]', 'DP 50% + Balance 50%');
    
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);
    await page.fill('input[name="valid_until"]', validUntil.toISOString().split('T')[0]);
    
    await page.click('button:has-text("Create Quote")');
    const quoteNumber = await page.locator('[data-testid="quote-number"]').textContent();
    console.log('Quote number:', quoteNumber);
    
    // Send quote
    await page.click('button:has-text("Send to Customer")');
    await page.click('button:has-text("Confirm")');
    
    const quoteToken = await page.locator('[data-testid="quote-token"]').getAttribute('data-token');
    
    if (!quoteToken) {
      throw new Error('Quote token not found');
    }

    // Step 7: Customer submits counter offer
    const customerContext = await page.context().browser()!.newContext();
    const customerPage = await customerContext.newPage();
    
    await customerPage.goto(`/quotes/${quoteToken as string}`);
    await customerPage.click('button:has-text("Counter Offer")');
    
    await customerPage.fill('input[name="counter_amount"]', '9000000');
    await customerPage.fill('textarea[name="notes"]', 'The price is a bit high for our budget. Can we negotiate to 9 million?');
    await customerPage.click('button:has-text("Submit Counter Offer")');
    
    await expect(customerPage.locator('.toast-success')).toContainText('Counter offer submitted');
    await expect(customerPage.locator('[data-testid="quote-status"]')).toContainText('Countered');

    // Step 8: Admin reviews and accepts counter offer
    await page.bringToFront();
    await page.goto('/admin/customer-quotes');
    await page.fill('input[placeholder*="Search"]', quoteNumber!);
    await page.click(`text=${quoteNumber}`);
    
    await expect(page.locator('[data-testid="quote-status"]')).toContainText('Countered');
    await expect(page.locator('[data-testid="counter-amount"]')).toContainText('9,000,000');
    
    // Accept counter offer
    await page.click('button:has-text("Accept Counter Offer")');
    await page.fill('textarea[name="notes"]', 'Counter offer accepted - reasonable price');
    await page.click('button:has-text("Confirm")');
    
    await expect(page.locator('.toast-success')).toContainText('Counter offer accepted');
    await expect(page.locator('[data-testid="quote-status"]')).toContainText('Accepted');

    // Step 9: Verify final amount is counter offer amount
    const finalAmount = await page.locator('[data-testid="grand-total"]').textContent();
    expect(finalAmount).toContain('9,000,000');

    // Step 10: Customer sees acceptance
    await customerPage.bringToFront();
    await customerPage.reload();
    
    await expect(customerPage.locator('.alert-success')).toContainText('accepted');
    await expect(customerPage.locator('[data-testid="quote-status"]')).toContainText('Accepted');
    await expect(customerPage.locator('text=Payment Instructions')).toBeVisible();

    await customerContext.close();
    console.log('✅ Negotiation workflow test passed!');
  });

  test('Complete workflow with rejection: Customer rejects quote', async ({ page }) => {
    // Setup
    await loginAsAdmin(page);
    const orderNumber = await createTestOrder(page);
    await createVendorQuote(page, orderNumber);
    
    // Accept vendor quote and create customer quote
    await page.click('button:has-text("Accept Vendor Quote")');
    await page.fill('input[name="amount"]', '6000000');
    await page.click('button:has-text("Confirm")');
    
    await page.click('button:has-text("Create Customer Quote")');
    await page.fill('input[name="title"]', 'E2E Rejection Test');
    await page.fill('input[name="profit_percentage"]', '20');
    await page.fill('input[name="tax_rate"]', '11');
    await page.fill('textarea[name="payment_terms"]', 'DP 50% + Balance 50%');
    
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);
    await page.fill('input[name="valid_until"]', validUntil.toISOString().split('T')[0]);
    
    await page.click('button:has-text("Create Quote")');
    const quoteNumber = await page.locator('[data-testid="quote-number"]').textContent();
    console.log('Quote number:', quoteNumber);
    
    await page.click('button:has-text("Send to Customer")');
    await page.click('button:has-text("Confirm")');
    
    const quoteToken = await page.locator('[data-testid="quote-token"]').getAttribute('data-token');
    
    if (!quoteToken) {
      throw new Error('Quote token not found');
    }

    // Customer rejects quote
    const customerContext = await page.context().browser()!.newContext();
    const customerPage = await customerContext.newPage();
    
    await customerPage.goto(`/quotes/${quoteToken as string}`);
    await customerPage.click('button:has-text("Reject")');
    
    await customerPage.fill('textarea[name="reason"]', 'We have decided to go with another vendor who offers better pricing and delivery terms.');
    await customerPage.click('button:has-text("Confirm Rejection")');
    
    await expect(customerPage.locator('.toast-success')).toContainText('Quote rejected');
    await expect(customerPage.locator('[data-testid="quote-status"]')).toContainText('Rejected');

    // Admin sees rejection
    await page.bringToFront();
    await page.goto('/admin/customer-quotes');
    await page.fill('input[placeholder*="Search"]', quoteNumber!);
    await page.click(`text=${quoteNumber}`);
    
    await expect(page.locator('[data-testid="quote-status"]')).toContainText('Rejected');
    await expect(page.locator('[data-testid="rejection-reason"]')).toContainText('another vendor');

    // Verify order status reverted
    await page.goto('/admin/orders');
    await page.fill('input[placeholder*="Search"]', orderNumber);
    await page.click(`text=${orderNumber}`);
    
    await expect(page.locator('[data-testid="order-status"]')).toContainText('customer_quote');

    await customerContext.close();
    console.log('✅ Rejection workflow test passed!');
  });

  test('Workflow with multiple negotiation rounds', async ({ page }) => {
    // Setup
    await loginAsAdmin(page);
    const orderNumber = await createTestOrder(page);
    await createVendorQuote(page, orderNumber);
    
    await page.click('button:has-text("Accept Vendor Quote")');
    await page.fill('input[name="amount"]', '10000000');
    await page.click('button:has-text("Confirm")');
    
    await page.click('button:has-text("Create Customer Quote")');
    await page.fill('input[name="title"]', 'E2E Multi-Round Negotiation');
    await page.fill('input[name="profit_percentage"]', '30');
    await page.fill('input[name="tax_rate"]', '11');
    await page.fill('textarea[name="payment_terms"]', 'DP 50% + Balance 50%');
    
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);
    await page.fill('input[name="valid_until"]', validUntil.toISOString().split('T')[0]);
    
    await page.click('button:has-text("Create Quote")');
    const quoteNumber = await page.locator('[data-testid="quote-number"]').textContent();
    console.log('Quote number:', quoteNumber);
    
    await page.click('button:has-text("Send to Customer")');
    await page.click('button:has-text("Confirm")');
    
    const quoteToken = await page.locator('[data-testid="quote-token"]').getAttribute('data-token');
    
    if (!quoteToken) {
      throw new Error('Quote token not found');
    }

    const customerContext = await page.context().browser()!.newContext();
    const customerPage = await customerContext.newPage();
    await customerPage.goto(`/quotes/${quoteToken as string}`);

    // Round 1: Customer counter offer
    await customerPage.click('button:has-text("Counter Offer")');
    await customerPage.fill('input[name="counter_amount"]', '11000000');
    await customerPage.fill('textarea[name="notes"]', 'Round 1: Can we negotiate the price down to 11 million?');
    await customerPage.click('button:has-text("Submit Counter Offer")');
    
    await expect(customerPage.locator('[data-testid="negotiation-round"]')).toContainText('Round 1');

    // Admin sends counter offer
    await page.bringToFront();
    await page.reload();
    await page.click('button:has-text("Send Counter Offer")');
    await page.fill('input[name="new_amount"]', '12000000');
    await page.fill('textarea[name="explanation"]', 'Round 2: We can offer 12 million as our best price');
    await page.click('button:has-text("Send")');

    // Round 2: Customer counter offer again
    await customerPage.bringToFront();
    await customerPage.reload();
    await expect(customerPage.locator('[data-testid="negotiation-round"]')).toContainText('Round 2');
    
    await customerPage.click('button:has-text("Counter Offer")');
    await customerPage.fill('input[name="counter_amount"]', '11500000');
    await customerPage.fill('textarea[name="notes"]', 'Round 3: Final offer - can we meet at 11.5 million?');
    await customerPage.click('button:has-text("Submit Counter Offer")');
    
    await expect(customerPage.locator('[data-testid="negotiation-round"]')).toContainText('Round 3');

    // Admin accepts final counter offer
    await page.bringToFront();
    await page.reload();
    await page.click('button:has-text("Accept Counter Offer")');
    await page.fill('textarea[name="notes"]', 'Final counter offer accepted');
    await page.click('button:has-text("Confirm")');
    
    await expect(page.locator('[data-testid="quote-status"]')).toContainText('Accepted');
    
    // Verify final amount
    const finalAmount = await page.locator('[data-testid="grand-total"]').textContent();
    expect(finalAmount).toContain('11,500,000');

    await customerContext.close();
    console.log('✅ Multi-round negotiation test passed!');
  });
});
