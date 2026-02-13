import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Vendor Portal Quote Management
 * 
 * Tests the complete quote management workflow for vendors including:
 * - View quote list and filter by status
 * - View quote detail with all information
 * - Accept quote workflow with delivery estimate
 * - Reject quote workflow with rejection reason
 * - Counter offer workflow with new amount
 * - Message thread interaction with vendors
 * 
 * Test Credentials (from VendorPortalApiTestSeeder):
 * - Email: active-vendor@test.com
 * - Password: Test@VendorP4ss2026!
 * 
 * Test Data:
 * - Multiple quotes in various statuses (sent, pending_response, accepted, rejected, countered, expired)
 * - Quote messages with admin and vendor messages
 * - Vendor performance metrics
 */

test.describe('Vendor Quote Management', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear any existing session
    await context.clearCookies();
    
    // Navigate to a page first before clearing storage
    await page.goto('/vendor/login');
    
    // Clear storage
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        // Ignore errors if storage is not accessible
      }
    });
    
    // Login as active vendor
    await page.getByPlaceholder(/email/i).fill('active-vendor@test.com');
    await page.getByPlaceholder(/password/i).fill('Test@VendorP4ss2026!');
    await page.getByRole('button', { name: /sign.*in|login/i }).click();
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/vendor\/dashboard/, { timeout: 10000 });
  });

  test('should view quote list and filter by status', async ({ page }) => {
    // Navigate to quotes page
    await page.goto('/vendor/quotes');
    
    // Verify quotes page loaded
    await expect(page).toHaveURL(/\/vendor\/quotes/);
    await expect(page.locator('h1, h2')).toContainText(/quotes|quote.*list/i);
    
    // Verify quote list is visible
    const quoteList = page.locator('[data-testid="quote-list"], .quote-list, [class*="quote"]').first();
    await expect(quoteList).toBeVisible({ timeout: 5000 });
    
    // Verify at least one quote card is visible
    const quoteCards = page.locator('[data-testid="quote-card"], .quote-card, [class*="quote-card"]');
    await expect(quoteCards.first()).toBeVisible({ timeout: 5000 });
    
    // Test status filter - look for filter buttons or dropdown
    const filterButtons = page.locator('button').filter({ hasText: /all|sent|pending|accepted|rejected|countered|expired/i });
    const filterDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /status|filter/i });
    
    if (await filterButtons.count() > 0) {
      // Button-based filters
      const sentButton = page.getByRole('button', { name: /sent/i });
      if (await sentButton.isVisible()) {
        await sentButton.click();
        await page.waitForTimeout(1000); // Wait for filter to apply
        
        // Verify filtered results
        const filteredCards = page.locator('[data-testid="quote-card"], .quote-card');
        if (await filteredCards.count() > 0) {
          // Check that visible quotes have "sent" status
          const statusBadges = page.locator('[data-testid="quote-status"], .quote-status, [class*="status"]');
          await expect(statusBadges.first()).toBeVisible();
        }
      }
      
      // Reset filter to "All"
      const allButton = page.getByRole('button', { name: /all/i });
      if (await allButton.isVisible()) {
        await allButton.click();
        await page.waitForTimeout(500);
      }
    } else if (await filterDropdown.count() > 0) {
      // Dropdown-based filters
      await filterDropdown.first().click();
      await page.getByRole('option', { name: /sent/i }).click();
      await page.waitForTimeout(1000);
    }
    
    // Test search functionality if available
    const searchInput = page.getByPlaceholder(/search|quote.*number|order.*number/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('QTE');
      await page.waitForTimeout(1000);
      
      // Verify search results
      await expect(quoteCards.first()).toBeVisible();
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
    
    // Verify pagination if available
    const paginationNext = page.getByRole('button', { name: /next|›|»/i });
    const paginationPrev = page.getByRole('button', { name: /previous|‹|«/i });
    
    if (await paginationNext.isVisible()) {
      // Pagination exists
      await expect(paginationNext.or(paginationPrev)).toBeVisible();
    }
  });

  test('should view quote detail with all information', async ({ page }) => {
    // Navigate to quotes page
    await page.goto('/vendor/quotes');
    
    // Wait for quotes to load
    await page.waitForTimeout(2000);
    
    // Click on first quote card
    const firstQuote = page.locator('[data-testid="quote-card"], .quote-card, [class*="quote-card"]').first();
    await expect(firstQuote).toBeVisible({ timeout: 5000 });
    
    // Click the quote card or "View Details" button
    const viewButton = firstQuote.getByRole('button', { name: /view.*details|view|details/i });
    const quoteLink = firstQuote.getByRole('link');
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
    } else if (await quoteLink.isVisible()) {
      await quoteLink.click();
    } else {
      await firstQuote.click();
    }
    
    // Wait for quote detail page to load
    await expect(page).toHaveURL(/\/vendor\/quotes\/[a-f0-9-]+/, { timeout: 5000 });
    
    // Verify quote detail sections are visible
    await expect(page.locator('h1, h2')).toContainText(/quote.*detail|quote.*#/i);
    
    // Verify quote information is displayed
    const quoteInfo = page.locator('[data-testid="quote-info"], .quote-info, [class*="quote-info"]');
    await expect(quoteInfo.or(page.locator('text=/quote.*number|order.*number/i'))).toBeVisible();
    
    // Verify customer information section
    const customerSection = page.locator('text=/customer|client/i');
    await expect(customerSection).toBeVisible();
    
    // Verify product/order details section
    const productSection = page.locator('text=/product|item|order.*details/i');
    await expect(productSection).toBeVisible();
    
    // Verify pricing information
    const pricingSection = page.locator('text=/price|amount|total/i');
    await expect(pricingSection).toBeVisible();
    
    // Verify timeline information
    const timelineSection = page.locator('text=/created|sent|expires|timeline/i');
    await expect(timelineSection).toBeVisible();
    
    // Verify status badge is visible
    const statusBadge = page.locator('[data-testid="quote-status"], .quote-status, [class*="status-badge"]');
    await expect(statusBadge).toBeVisible();
  });

  test('should accept quote with delivery estimate', async ({ page }) => {
    // Navigate to quotes page
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    // Find a quote with "sent" or "pending_response" status
    const sentQuote = page.locator('[data-testid="quote-card"]').filter({ hasText: /sent|pending/i }).first();
    
    if (await sentQuote.isVisible()) {
      // Click to view details
      const viewButton = sentQuote.getByRole('button', { name: /view.*details|view|details/i });
      const quoteLink = sentQuote.getByRole('link');
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else if (await quoteLink.isVisible()) {
        await quoteLink.click();
      } else {
        await sentQuote.click();
      }
      
      // Wait for detail page
      await expect(page).toHaveURL(/\/vendor\/quotes\/[a-f0-9-]+/, { timeout: 5000 });
      
      // Click Accept button
      const acceptButton = page.getByRole('button', { name: /accept.*quote|accept/i });
      await expect(acceptButton).toBeVisible({ timeout: 5000 });
      await acceptButton.click();
      
      // Wait for accept modal/form to appear
      await page.waitForTimeout(1000);
      
      // Fill in delivery estimate
      const deliveryInput = page.getByLabel(/delivery.*days|estimated.*delivery|delivery.*estimate/i)
        .or(page.getByPlaceholder(/delivery.*days|days/i));
      await expect(deliveryInput).toBeVisible({ timeout: 3000 });
      await deliveryInput.fill('14');
      
      // Fill in optional notes if field exists
      const notesInput = page.getByLabel(/notes|comments|remarks/i)
        .or(page.getByPlaceholder(/notes|comments/i));
      if (await notesInput.isVisible()) {
        await notesInput.fill('We can deliver within 14 days as requested.');
      }
      
      // Submit acceptance
      const submitButton = page.getByRole('button', { name: /confirm|submit|accept.*quote/i }).last();
      await submitButton.click();
      
      // Wait for success message or redirect
      const successMessage = page.getByText(/success|accepted|quote.*accepted/i);
      await expect(successMessage).toBeVisible({ timeout: 5000 });
      
      // Verify status changed to "accepted"
      await page.waitForTimeout(1000);
      const statusBadge = page.locator('[data-testid="quote-status"], .quote-status, [class*="status"]');
      await expect(statusBadge).toContainText(/accepted/i, { timeout: 3000 });
    } else {
      // No sent quotes available, skip test
      test.skip();
    }
  });

  test('should reject quote with rejection reason', async ({ page }) => {
    // Navigate to quotes page
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    // Find a quote with "sent" or "pending_response" status
    const sentQuote = page.locator('[data-testid="quote-card"]').filter({ hasText: /sent|pending/i }).first();
    
    if (await sentQuote.isVisible()) {
      // Click to view details
      const viewButton = sentQuote.getByRole('button', { name: /view.*details|view|details/i });
      const quoteLink = sentQuote.getByRole('link');
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else if (await quoteLink.isVisible()) {
        await quoteLink.click();
      } else {
        await sentQuote.click();
      }
      
      // Wait for detail page
      await expect(page).toHaveURL(/\/vendor\/quotes\/[a-f0-9-]+/, { timeout: 5000 });
      
      // Click Reject button
      const rejectButton = page.getByRole('button', { name: /reject.*quote|reject|decline/i });
      await expect(rejectButton).toBeVisible({ timeout: 5000 });
      await rejectButton.click();
      
      // Wait for reject modal/form to appear
      await page.waitForTimeout(1000);
      
      // Fill in rejection reason (required)
      const reasonInput = page.getByLabel(/reason|rejection.*reason|why.*reject/i)
        .or(page.getByPlaceholder(/reason|why/i));
      await expect(reasonInput).toBeVisible({ timeout: 3000 });
      await reasonInput.fill('Unable to meet the specifications within the required timeline.');
      
      // Submit rejection
      const submitButton = page.getByRole('button', { name: /confirm|submit|reject.*quote/i }).last();
      await submitButton.click();
      
      // Wait for success message or redirect
      const successMessage = page.getByText(/success|rejected|quote.*rejected/i);
      await expect(successMessage).toBeVisible({ timeout: 5000 });
      
      // Verify status changed to "rejected"
      await page.waitForTimeout(1000);
      const statusBadge = page.locator('[data-testid="quote-status"], .quote-status, [class*="status"]');
      await expect(statusBadge).toContainText(/rejected/i, { timeout: 3000 });
    } else {
      // No sent quotes available, skip test
      test.skip();
    }
  });

  test('should submit counter offer with new amount', async ({ page }) => {
    // Navigate to quotes page
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    // Find a quote with "sent" or "pending_response" status
    const sentQuote = page.locator('[data-testid="quote-card"]').filter({ hasText: /sent|pending/i }).first();
    
    if (await sentQuote.isVisible()) {
      // Click to view details
      const viewButton = sentQuote.getByRole('button', { name: /view.*details|view|details/i });
      const quoteLink = sentQuote.getByRole('link');
      
      if (await viewButton.isVisible()) {
        await viewButton.click();
      } else if (await quoteLink.isVisible()) {
        await quoteLink.click();
      } else {
        await sentQuote.click();
      }
      
      // Wait for detail page
      await expect(page).toHaveURL(/\/vendor\/quotes\/[a-f0-9-]+/, { timeout: 5000 });
      
      // Click Counter Offer button
      const counterButton = page.getByRole('button', { name: /counter.*offer|counter|negotiate/i });
      await expect(counterButton).toBeVisible({ timeout: 5000 });
      await counterButton.click();
      
      // Wait for counter offer modal/form to appear
      await page.waitForTimeout(1000);
      
      // Fill in counter offer amount (required)
      const amountInput = page.getByLabel(/amount|counter.*amount|offer.*amount|price/i)
        .or(page.getByPlaceholder(/amount|price/i));
      await expect(amountInput).toBeVisible({ timeout: 3000 });
      await amountInput.fill('250000');
      
      // Fill in optional notes if field exists
      const notesInput = page.getByLabel(/notes|comments|remarks/i)
        .or(page.getByPlaceholder(/notes|comments/i));
      if (await notesInput.isVisible()) {
        await notesInput.fill('We can offer this price with standard materials.');
      }
      
      // Submit counter offer
      const submitButton = page.getByRole('button', { name: /confirm|submit|counter.*offer/i }).last();
      await submitButton.click();
      
      // Wait for success message or redirect
      const successMessage = page.getByText(/success|counter.*offer|offer.*submitted/i);
      await expect(successMessage).toBeVisible({ timeout: 5000 });
      
      // Verify status changed to "countered"
      await page.waitForTimeout(1000);
      const statusBadge = page.locator('[data-testid="quote-status"], .quote-status, [class*="status"]');
      await expect(statusBadge).toContainText(/counter/i, { timeout: 3000 });
    } else {
      // No sent quotes available, skip test
      test.skip();
    }
  });

  test('should interact with message thread', async ({ page }) => {
    // Navigate to quotes page
    await page.goto('/vendor/quotes');
    await page.waitForTimeout(2000);
    
    // Click on first quote to view details
    const firstQuote = page.locator('[data-testid="quote-card"], .quote-card, [class*="quote-card"]').first();
    await expect(firstQuote).toBeVisible({ timeout: 5000 });
    
    const viewButton = firstQuote.getByRole('button', { name: /view.*details|view|details/i });
    const quoteLink = firstQuote.getByRole('link');
    
    if (await viewButton.isVisible()) {
      await viewButton.click();
    } else if (await quoteLink.isVisible()) {
      await quoteLink.click();
    } else {
      await firstQuote.click();
    }
    
    // Wait for detail page
    await expect(page).toHaveURL(/\/vendor\/quotes\/[a-f0-9-]+/, { timeout: 5000 });
    
    // Look for message thread section
    const messageSection = page.locator('[data-testid="message-thread"], .message-thread, [class*="message"]')
      .or(page.locator('text=/messages|message.*thread|conversation/i'));
    
    // Scroll to message section if needed
    if (await messageSection.isVisible()) {
      await messageSection.scrollIntoViewIfNeeded();
    }
    
    // Verify message thread is visible
    await expect(messageSection).toBeVisible({ timeout: 5000 });
    
    // Check if there are existing messages
    const existingMessages = page.locator('[data-testid="message"], .message-item, [class*="message-item"]');
    const messageCount = await existingMessages.count();
    
    if (messageCount > 0) {
      // Verify at least one message is visible
      await expect(existingMessages.first()).toBeVisible();
      
      // Verify message has sender and content
      const firstMessage = existingMessages.first();
      await expect(firstMessage).toContainText(/.+/); // Has some text content
    }
    
    // Find message input field
    const messageInput = page.getByPlaceholder(/message|type.*message|write.*message/i)
      .or(page.getByLabel(/message|your.*message/i))
      .or(page.locator('textarea[name="message"]'));
    
    if (await messageInput.isVisible()) {
      // Type a test message
      await messageInput.fill('This is a test message from the vendor regarding the quote specifications.');
      
      // Find and click send button
      const sendButton = page.getByRole('button', { name: /send|submit|post/i }).last();
      await expect(sendButton).toBeVisible();
      await sendButton.click();
      
      // Wait for message to be sent
      await page.waitForTimeout(2000);
      
      // Verify new message appears in the thread
      const newMessageCount = await existingMessages.count();
      expect(newMessageCount).toBeGreaterThanOrEqual(messageCount);
      
      // Verify the sent message is visible
      const sentMessage = page.getByText(/test message from the vendor/i);
      await expect(sentMessage).toBeVisible({ timeout: 3000 });
      
      // Verify message input is cleared after sending
      await expect(messageInput).toHaveValue('');
    }
    
    // Test file attachment if available
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // File upload functionality exists
      await expect(fileInput).toBeVisible();
    }
  });
});
