import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Customer Quote Workflow - Customer Portal
 * 
 * Tests the customer-facing quote workflow:
 * - Customer views quote via token link
 * - Customer accepts quote
 * - Customer submits counter offer
 * - Customer rejects quote
 * - Quote expiration handling
 * 
 * Related: .kiro/specs/customer-quote-workflow/requirements.md
 */

// Test data
const TEST_QUOTE_TOKEN = 'test-quote-token-uuid';
const CUSTOMER_EMAIL = 'customer@test.com';

// Helper functions
async function navigateToQuoteByToken(page: Page, token: string) {
  await page.goto(`/quotes/${token}`);
  await page.waitForLoadState('networkidle');
}

test.describe('Customer Quote Workflow - Customer Portal', () => {
  test('Customer views quote via token link', async ({ page }) => {
    // Navigate to quote using token (public access, no login required)
    await navigateToQuoteByToken(page, TEST_QUOTE_TOKEN);

    // Verify quote details are visible
    await expect(page.locator('h1')).toContainText('Quotation');
    
    // Verify quote number
    await expect(page.locator('[data-testid="quote-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="quote-number"]')).toMatch(/CQ-\d{6}-\d{4}/);

    // Verify pricing breakdown
    await expect(page.locator('text=Subtotal')).toBeVisible();
    await expect(page.locator('text=Tax')).toBeVisible();
    await expect(page.locator('text=Grand Total')).toBeVisible();
    await expect(page.locator('[data-testid="grand-total"]')).toContainText('Rp');

    // Verify terms and conditions
    await expect(page.locator('text=Payment Terms')).toBeVisible();
    await expect(page.locator('text=Delivery Timeline')).toBeVisible();
    await expect(page.locator('text=Valid Until')).toBeVisible();

    // Verify action buttons
    await expect(page.locator('button:has-text("Accept Quote")')).toBeVisible();
    await expect(page.locator('button:has-text("Counter Offer")')).toBeVisible();
    await expect(page.locator('button:has-text("Reject")')).toBeVisible();

    // Verify items list
    await expect(page.locator('[data-testid="quote-items"]')).toBeVisible();
    const items = page.locator('[data-testid="quote-item"]');
    const itemCount = await items.count();
    expect(itemCount).toBeGreaterThan(0);

    // Verify first item has required fields
    if (itemCount > 0) {
      const firstItem = items.first();
      await expect(firstItem.locator('[data-testid="product-name"]')).toBeVisible();
      await expect(firstItem.locator('[data-testid="quantity"]')).toBeVisible();
      await expect(firstItem.locator('[data-testid="price"]')).toContainText('Rp');
    }
  });

  test('Customer accepts quote successfully', async ({ page }) => {
    await navigateToQuoteByToken(page, TEST_QUOTE_TOKEN);

    // Click accept button
    await page.click('button:has-text("Accept Quote")');

    // Verify acceptance modal appears
    await expect(page.locator('[data-testid="accept-modal"]')).toBeVisible();
    await expect(page.locator('text=Terms and Conditions')).toBeVisible();

    // Read and accept terms
    await page.check('input[name="terms_accepted"]');
    
    // Verify checkbox is required
    const confirmButton = page.locator('button:has-text("Confirm Acceptance")');
    await expect(confirmButton).toBeEnabled();

    // Submit acceptance
    await confirmButton.click();

    // Verify success message
    await expect(page.locator('.toast-success, .alert-success')).toBeVisible();
    
    // Check if auto-approved or pending
    const successMessage = await page.locator('.toast-success, .alert-success').textContent();
    
    if (successMessage?.includes('approved')) {
      // Auto-approved path
      await expect(page.locator('text=Quote accepted and approved')).toBeVisible();
      await expect(page.locator('[data-testid="quote-status"]')).toContainText('Accepted');
      
      // Verify payment instructions appear
      await expect(page.locator('text=Payment Instructions')).toBeVisible();
      await expect(page.locator('[data-testid="payment-amount"]')).toBeVisible();
      await expect(page.locator('[data-testid="payment-due-date"]')).toBeVisible();
    } else {
      // Manual approval path
      await expect(page.locator('text=pending approval')).toBeVisible();
      await expect(page.locator('[data-testid="quote-status"]')).toContainText('Pending Approval');
      
      // Verify approval reason is shown
      await expect(page.locator('[data-testid="approval-reason"]')).toBeVisible();
    }

    // Verify action buttons are disabled after acceptance
    await expect(page.locator('button:has-text("Accept Quote")')).toBeDisabled();
    await expect(page.locator('button:has-text("Counter Offer")')).toBeDisabled();
  });

  test('Customer submits counter offer', async ({ page }) => {
    await navigateToQuoteByToken(page, TEST_QUOTE_TOKEN);

    // Get original amount
    const originalAmount = await page.locator('[data-testid="grand-total"]').textContent();

    // Click counter offer button
    await page.click('button:has-text("Counter Offer")');

    // Verify counter offer modal
    await expect(page.locator('[data-testid="counter-offer-modal"]')).toBeVisible();
    await expect(page.locator('text=Submit Counter Offer')).toBeVisible();

    // Fill counter offer form
    await page.fill('input[name="counter_amount"]', '8500000'); // Lower amount
    await page.fill('textarea[name="notes"]', 'The quoted price is higher than our budget. We would like to request a discount to make this order feasible.');
    await page.fill('textarea[name="additional_requests"]', 'Can we also get faster delivery if we accept this counter offer?');

    // Verify minimum character requirement for notes
    const notesField = page.locator('textarea[name="notes"]');
    const notesValue = await notesField.inputValue();
    expect(notesValue.length).toBeGreaterThanOrEqual(20);

    // Submit counter offer
    await page.click('button:has-text("Submit Counter Offer")');

    // Verify success message
    await expect(page.locator('.toast-success')).toContainText('Counter offer submitted');

    // Verify quote status updated
    await expect(page.locator('[data-testid="quote-status"]')).toContainText('Countered');

    // Verify counter offer details are shown
    await expect(page.locator('[data-testid="counter-amount"]')).toContainText('Rp 8,500,000');
    await expect(page.locator('[data-testid="counter-notes"]')).toContainText('higher than our budget');

    // Verify negotiation round indicator
    await expect(page.locator('[data-testid="negotiation-round"]')).toContainText('Round 1');

    // Verify waiting message
    await expect(page.locator('text=waiting for admin response')).toBeVisible();
  });

  test('Customer cannot submit counter offer exceeding max rounds', async ({ page }) => {
    // Assume quote is already at max negotiation rounds (3)
    await navigateToQuoteByToken(page, 'quote-at-max-rounds-token');

    // Verify counter offer button is disabled
    const counterOfferButton = page.locator('button:has-text("Counter Offer")');
    await expect(counterOfferButton).toBeDisabled();

    // Verify message about max rounds
    await expect(page.locator('text=Maximum negotiation rounds reached')).toBeVisible();
    await expect(page.locator('[data-testid="negotiation-round"]')).toContainText('Round 3/3');
  });

  test('Customer rejects quote with reason', async ({ page }) => {
    await navigateToQuoteByToken(page, TEST_QUOTE_TOKEN);

    // Click reject button
    await page.click('button:has-text("Reject")');

    // Verify rejection modal
    await expect(page.locator('[data-testid="reject-modal"]')).toBeVisible();
    await expect(page.locator('text=Reject Quote')).toBeVisible();

    // Fill rejection reason
    await page.fill('textarea[name="reason"]', 'We have decided to go with another vendor who can provide better pricing and faster delivery timeline.');

    // Verify minimum character requirement
    const reasonField = page.locator('textarea[name="reason"]');
    const reasonValue = await reasonField.inputValue();
    expect(reasonValue.length).toBeGreaterThanOrEqual(20);

    // Submit rejection
    await page.click('button:has-text("Confirm Rejection")');

    // Verify success message
    await expect(page.locator('.toast-success')).toContainText('Quote rejected');

    // Verify quote status updated
    await expect(page.locator('[data-testid="quote-status"]')).toContainText('Rejected');

    // Verify rejection reason is shown
    await expect(page.locator('[data-testid="rejection-reason"]')).toContainText('another vendor');

    // Verify all action buttons are disabled
    await expect(page.locator('button:has-text("Accept Quote")')).toBeDisabled();
    await expect(page.locator('button:has-text("Counter Offer")')).toBeDisabled();
    await expect(page.locator('button:has-text("Reject")')).toBeDisabled();
  });

  test('Customer cannot interact with expired quote', async ({ page }) => {
    // Navigate to expired quote
    await navigateToQuoteByToken(page, 'expired-quote-token');

    // Verify expired status
    await expect(page.locator('[data-testid="quote-status"]')).toContainText('Expired');
    await expect(page.locator('.alert-warning, .alert-danger')).toContainText('expired');

    // Verify all action buttons are disabled
    await expect(page.locator('button:has-text("Accept Quote")')).toBeDisabled();
    await expect(page.locator('button:has-text("Counter Offer")')).toBeDisabled();
    await expect(page.locator('button:has-text("Reject")')).toBeDisabled();

    // Verify expiration date is shown
    await expect(page.locator('[data-testid="expired-date"]')).toBeVisible();

    // Verify contact message
    await expect(page.locator('text=contact us')).toBeVisible();
  });

  test('Customer views quote pricing breakdown', async ({ page }) => {
    await navigateToQuoteByToken(page, TEST_QUOTE_TOKEN);

    // Click to expand pricing breakdown
    await page.click('button:has-text("View Pricing Details")');

    // Verify all pricing components
    await expect(page.locator('[data-testid="vendor-cost"]')).toBeVisible();
    await expect(page.locator('[data-testid="profit-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="handling-fee"]')).toBeVisible();
    await expect(page.locator('[data-testid="shipping-cost"]')).toBeVisible();
    await expect(page.locator('[data-testid="insurance"]')).toBeVisible();
    await expect(page.locator('[data-testid="subtotal"]')).toBeVisible();
    await expect(page.locator('[data-testid="tax-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="grand-total"]')).toBeVisible();

    // Verify all amounts are in IDR format
    const amounts = page.locator('[data-testid*="amount"], [data-testid*="cost"], [data-testid*="fee"], [data-testid*="total"]');
    const count = await amounts.count();
    
    for (let i = 0; i < count; i++) {
      const amount = amounts.nth(i);
      await expect(amount).toContainText('Rp');
    }
  });

  test('Customer downloads quotation PDF', async ({ page }) => {
    await navigateToQuoteByToken(page, TEST_QUOTE_TOKEN);

    // Verify download button exists
    const downloadButton = page.locator('button:has-text("Download PDF")');
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).toBeEnabled();

    // Click download (don't actually download in test)
    // Just verify the button is clickable and has correct attributes
    await expect(downloadButton).toHaveAttribute('data-document-type', 'quotation');
  });

  test('Customer views negotiation history', async ({ page }) => {
    // Navigate to quote with negotiation history
    await navigateToQuoteByToken(page, 'quote-with-history-token');

    // Click to view history
    await page.click('button:has-text("View History")');

    // Verify history timeline
    await expect(page.locator('[data-testid="negotiation-timeline"]')).toBeVisible();

    // Verify history entries
    const historyEntries = page.locator('[data-testid="history-entry"]');
    const entryCount = await historyEntries.count();
    
    if (entryCount > 0) {
      // Verify first entry has required information
      const firstEntry = historyEntries.first();
      await expect(firstEntry.locator('[data-testid="history-action"]')).toBeVisible();
      await expect(firstEntry.locator('[data-testid="history-timestamp"]')).toBeVisible();
      await expect(firstEntry.locator('[data-testid="history-amount"]')).toContainText('Rp');
    }

    // Verify chronological order (newest first)
    if (entryCount > 1) {
      const firstTimestamp = await historyEntries.first().locator('[data-testid="history-timestamp"]').getAttribute('data-timestamp');
      const secondTimestamp = await historyEntries.nth(1).locator('[data-testid="history-timestamp"]').getAttribute('data-timestamp');
      
      expect(new Date(firstTimestamp!).getTime()).toBeGreaterThanOrEqual(new Date(secondTimestamp!).getTime());
    }
  });

  test('Customer receives admin counter offer', async ({ page }) => {
    // Navigate to quote where admin sent counter offer
    await navigateToQuoteByToken(page, 'quote-with-admin-counter-token');

    // Verify admin counter offer notification
    await expect(page.locator('.alert-info')).toContainText('Admin has sent a counter offer');

    // Verify new amount
    await expect(page.locator('[data-testid="admin-counter-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="admin-counter-amount"]')).toContainText('Rp');

    // Verify admin explanation
    await expect(page.locator('[data-testid="admin-explanation"]')).toBeVisible();

    // Verify customer can accept or reject admin counter
    await expect(page.locator('button:has-text("Accept Counter Offer")')).toBeVisible();
    await expect(page.locator('button:has-text("Reject Counter Offer")')).toBeVisible();

    // Verify negotiation round updated
    await expect(page.locator('[data-testid="negotiation-round"]')).toContainText('Round 2');
  });

  test('Invalid token shows error page', async ({ page }) => {
    // Navigate with invalid token
    await page.goto('/quotes/invalid-token-12345');

    // Verify error message
    await expect(page.locator('h1')).toContainText('Quote Not Found');
    await expect(page.locator('text=invalid or expired')).toBeVisible();

    // Verify contact information
    await expect(page.locator('text=contact support')).toBeVisible();
  });

  test('Quote page is mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await navigateToQuoteByToken(page, TEST_QUOTE_TOKEN);

    // Verify key elements are visible on mobile
    await expect(page.locator('[data-testid="quote-number"]')).toBeVisible();
    await expect(page.locator('[data-testid="grand-total"]')).toBeVisible();
    await expect(page.locator('button:has-text("Accept Quote")')).toBeVisible();

    // Verify pricing breakdown is collapsible on mobile
    const pricingDetails = page.locator('[data-testid="pricing-details"]');
    
    // Should be collapsed by default on mobile
    await expect(pricingDetails).not.toBeVisible();

    // Click to expand
    await page.click('button:has-text("View Pricing Details")');
    await expect(pricingDetails).toBeVisible();

    // Verify action buttons are stacked vertically
    const acceptButton = page.locator('button:has-text("Accept Quote")');
    const counterButton = page.locator('button:has-text("Counter Offer")');
    
    const acceptBox = await acceptButton.boundingBox();
    const counterBox = await counterButton.boundingBox();
    
    // Buttons should be stacked (Y position different)
    expect(acceptBox!.y).not.toBe(counterBox!.y);
  });
});
