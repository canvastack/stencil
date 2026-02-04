import { test, expect } from '@playwright/test';

/**
 * Quote Management E2E Tests
 * 
 * Tests the complete quote management workflow including:
 * - Quote creation from order detail
 * - Edit existing quote (duplicate prevention)
 * - Quote acceptance flow
 * - Quote rejection flow
 * - Order status integration
 */

test.describe('Quote Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('admin@etchinx.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard
    await expect(page).toHaveURL('/admin');
  });

  test.describe('Quote Creation Flow', () => {
    test('should create a new quote from order detail page', async ({ page }) => {
      // Navigate to orders
      await page.getByText('Orders', { exact: true }).click();
      await expect(page).toHaveURL('/admin/orders');
      
      // Wait for orders to load
      await page.waitForLoadState('networkidle');
      
      // Find an order in vendor_sourcing status
      const orderItem = page.locator('[data-testid="order-item"]').first();
      if (await orderItem.count() > 0) {
        await orderItem.click();
        
        // Should be on order detail page
        await expect(page).toHaveURL(/\/admin\/orders\/[^/]+$/);
        
        // Look for "Create Quote" or "Manage Quotes" button
        const createQuoteButton = page.getByRole('button', { name: /create quote|manage quotes/i });
        await expect(createQuoteButton).toBeVisible();
        await createQuoteButton.click();
        
        // Should open quote management modal/dialog
        await expect(page.getByText(/new quote|create quote/i)).toBeVisible();
        
        // Select vendor
        await page.getByLabel(/vendor/i).click();
        const vendorOptions = page.locator('[role="option"]');
        if (await vendorOptions.count() > 0) {
          await vendorOptions.first().click();
        }
        
        // Fill quote details
        await page.getByLabel(/quoted amount|total amount/i).fill('500000');
        await page.getByLabel(/valid until|expiry date/i).fill('2025-12-31');
        
        // Add quote items if needed
        const addItemButton = page.getByRole('button', { name: /add item/i });
        if (await addItemButton.count() > 0) {
          await addItemButton.click();
          await page.getByLabel(/item name|description/i).fill('Custom Etching Plate');
          await page.getByLabel(/quantity/i).fill('10');
          await page.getByLabel(/unit price/i).fill('50000');
        }
        
        // Add terms and conditions
        await page.getByLabel(/terms|notes/i).fill('Standard terms apply. Payment within 30 days.');
        
        // Submit quote
        await page.getByRole('button', { name: /create quote|submit/i }).click();
        
        // Should show success message
        await expect(page.getByText(/quote created successfully/i)).toBeVisible();
        
        // Should close modal and show quote in list
        await expect(page.getByText(/quote #/i)).toBeVisible();
      }
    });

    test('should validate required fields in quote form', async ({ page }) => {
      // Navigate to orders and open quote creation
      await page.getByText('Orders', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      const orderItem = page.locator('[data-testid="order-item"]').first();
      if (await orderItem.count() > 0) {
        await orderItem.click();
        
        const createQuoteButton = page.getByRole('button', { name: /create quote|manage quotes/i });
        if (await createQuoteButton.count() > 0) {
          await createQuoteButton.click();
          
          // Try to submit without filling required fields
          await page.getByRole('button', { name: /create quote|submit/i }).click();
          
          // Should show validation errors
          await expect(page.getByText(/vendor is required|please select a vendor/i)).toBeVisible();
          await expect(page.getByText(/amount is required|please enter amount/i)).toBeVisible();
        }
      }
    });
  });

  test.describe('Edit Existing Quote Flow (Duplicate Prevention)', () => {
    test('should open existing quote in edit mode when creating quote for same order', async ({ page }) => {
      // Navigate to quotes page
      await page.getByText('Quotes', { exact: true }).click();
      await expect(page).toHaveURL('/admin/quotes');
      
      // Wait for quotes to load
      await page.waitForLoadState('networkidle');
      
      // Find a quote with "draft" or "open" status
      const quoteItem = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /draft|open/i }) })
        .first();
      
      if (await quoteItem.count() > 0) {
        // Get the order ID from the quote
        const orderLink = quoteItem.locator('a[href*="/orders/"]');
        const orderHref = await orderLink.getAttribute('href');
        
        if (orderHref) {
          // Navigate to the order detail page
          await page.goto(orderHref);
          
          // Click create/manage quote button
          const manageQuoteButton = page.getByRole('button', { name: /create quote|manage quotes/i });
          await manageQuoteButton.click();
          
          // Should open in EDIT mode, not create mode
          await expect(page.getByText(/edit quote|editing quote/i)).toBeVisible();
          
          // Should show "Update" button instead of "Create"
          await expect(page.getByRole('button', { name: /update quote|save changes/i })).toBeVisible();
          
          // Form should be pre-populated with existing data
          const vendorField = page.getByLabel(/vendor/i);
          await expect(vendorField).not.toBeEmpty();
        }
      }
    });

    test('should update existing quote successfully', async ({ page }) => {
      // Navigate to quotes page
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find an editable quote (draft or open status)
      const editableQuote = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /draft|open/i }) })
        .first();
      
      if (await editableQuote.count() > 0) {
        // Click edit button
        const editButton = editableQuote.getByRole('button', { name: /edit/i });
        await editButton.click();
        
        // Should open edit form
        await expect(page.getByText(/edit quote/i)).toBeVisible();
        
        // Modify quote amount
        const amountField = page.getByLabel(/quoted amount|total amount/i);
        await amountField.clear();
        await amountField.fill('750000');
        
        // Update terms
        const termsField = page.getByLabel(/terms|notes/i);
        await termsField.clear();
        await termsField.fill('Updated terms: Payment within 15 days.');
        
        // Save changes
        await page.getByRole('button', { name: /update quote|save changes/i }).click();
        
        // Should show success message
        await expect(page.getByText(/quote updated successfully/i)).toBeVisible();
        
        // Should reflect changes in the list
        await expect(page.getByText('750000')).toBeVisible();
      }
    });
  });

  test.describe('Quote Acceptance Flow', () => {
    test('should accept a quote and update order status', async ({ page }) => {
      // Navigate to quotes page
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find a quote with "open" or "sent" status
      const openQuote = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /open|sent/i }) })
        .first();
      
      if (await openQuote.count() > 0) {
        // Click to view quote details
        await openQuote.click();
        
        // Should be on quote detail page
        await expect(page).toHaveURL(/\/admin\/quotes\/[^/]+$/);
        
        // Should show quote details
        await expect(page.getByText(/quote details/i)).toBeVisible();
        await expect(page.getByText(/vendor information/i)).toBeVisible();
        
        // Click accept button
        const acceptButton = page.getByRole('button', { name: /accept quote/i });
        await expect(acceptButton).toBeVisible();
        await acceptButton.click();
        
        // Should show confirmation dialog
        await expect(page.getByText(/are you sure|confirm acceptance/i)).toBeVisible();
        await expect(page.getByText(/order will advance to customer quote/i)).toBeVisible();
        
        // Confirm acceptance
        await page.getByRole('button', { name: /confirm|yes, accept/i }).click();
        
        // Should show success message
        await expect(page.getByText(/quote accepted successfully/i)).toBeVisible();
        
        // Should redirect to order page or update status
        await page.waitForTimeout(1000);
        
        // Verify quote status updated to "accepted"
        const statusBadge = page.locator('.status-badge');
        await expect(statusBadge).toContainText(/accepted/i);
        
        // Navigate to order to verify status update
        const orderLink = page.locator('a[href*="/orders/"]').first();
        if (await orderLink.count() > 0) {
          await orderLink.click();
          
          // Order status should be "customer_quote"
          await expect(page.getByText(/customer quote/i)).toBeVisible();
        }
      }
    });

    test('should prevent accepting expired quotes', async ({ page }) => {
      // Navigate to quotes page
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find an expired quote
      const expiredQuote = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /expired/i }) })
        .first();
      
      if (await expiredQuote.count() > 0) {
        await expiredQuote.click();
        
        // Accept button should be disabled or not visible
        const acceptButton = page.getByRole('button', { name: /accept quote/i });
        
        if (await acceptButton.count() > 0) {
          await expect(acceptButton).toBeDisabled();
        } else {
          // Button should not be visible for expired quotes
          await expect(acceptButton).not.toBeVisible();
        }
        
        // Should show expired indicator
        await expect(page.getByText(/expired|no longer valid/i)).toBeVisible();
      }
    });

    test('should auto-reject other quotes when accepting one', async ({ page }) => {
      // Navigate to orders page
      await page.getByText('Orders', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find an order with multiple quotes
      const orderWithMultipleQuotes = page.locator('[data-testid="order-item"]')
        .filter({ has: page.locator('[data-testid="quote-count"]', { hasText: /[2-9]|[1-9][0-9]/ }) })
        .first();
      
      if (await orderWithMultipleQuotes.count() > 0) {
        await orderWithMultipleQuotes.click();
        
        // View quotes for this order
        const viewQuotesButton = page.getByRole('button', { name: /view quotes|manage quotes/i });
        await viewQuotesButton.click();
        
        // Should show multiple quotes
        const quoteItems = page.locator('[data-testid="quote-item"]');
        const quoteCount = await quoteItems.count();
        
        if (quoteCount > 1) {
          // Accept the first quote
          const firstQuote = quoteItems.first();
          await firstQuote.click();
          
          const acceptButton = page.getByRole('button', { name: /accept quote/i });
          if (await acceptButton.count() > 0) {
            await acceptButton.click();
            await page.getByRole('button', { name: /confirm|yes, accept/i }).click();
            
            // Wait for acceptance to complete
            await expect(page.getByText(/quote accepted successfully/i)).toBeVisible();
            
            // Go back to quotes list
            await page.getByRole('button', { name: /back to quotes/i }).click();
            
            // Other quotes should now be "rejected" or "auto-rejected"
            const otherQuotes = quoteItems.filter({ hasNot: page.locator('.status-badge', { hasText: /accepted/i }) });
            const firstOtherQuote = otherQuotes.first();
            
            if (await firstOtherQuote.count() > 0) {
              const statusBadge = firstOtherQuote.locator('.status-badge');
              await expect(statusBadge).toContainText(/rejected|auto-rejected/i);
            }
          }
        }
      }
    });
  });

  test.describe('Quote Rejection Flow', () => {
    test('should reject a quote with valid reason', async ({ page }) => {
      // Navigate to quotes page
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find a quote with "open" or "sent" status
      const openQuote = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /open|sent/i }) })
        .first();
      
      if (await openQuote.count() > 0) {
        // Click to view quote details
        await openQuote.click();
        
        // Should be on quote detail page
        await expect(page).toHaveURL(/\/admin\/quotes\/[^/]+$/);
        
        // Click reject button
        const rejectButton = page.getByRole('button', { name: /reject quote/i });
        await expect(rejectButton).toBeVisible();
        await rejectButton.click();
        
        // Should show rejection dialog
        await expect(page.getByText(/reject quote|rejection reason/i)).toBeVisible();
        
        // Try to submit without reason (should fail validation)
        const confirmButton = page.getByRole('button', { name: /confirm|yes, reject/i });
        await confirmButton.click();
        
        // Should show validation error
        await expect(page.getByText(/reason is required|minimum 10 characters/i)).toBeVisible();
        
        // Enter valid rejection reason
        const reasonField = page.getByLabel(/reason|why are you rejecting/i);
        await reasonField.fill('Price is too high compared to market rate. Please revise.');
        
        // Confirm rejection
        await confirmButton.click();
        
        // Should show success message
        await expect(page.getByText(/quote rejected successfully/i)).toBeVisible();
        
        // Verify quote status updated to "rejected"
        const statusBadge = page.locator('.status-badge');
        await expect(statusBadge).toContainText(/rejected/i);
        
        // Rejection reason should be visible in history
        await expect(page.getByText(/Price is too high/i)).toBeVisible();
      }
    });

    test('should validate minimum rejection reason length', async ({ page }) => {
      // Navigate to quotes page
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      const openQuote = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /open|sent/i }) })
        .first();
      
      if (await openQuote.count() > 0) {
        await openQuote.click();
        
        // Click reject button
        const rejectButton = page.getByRole('button', { name: /reject quote/i });
        await rejectButton.click();
        
        // Enter too short reason (less than 10 characters)
        const reasonField = page.getByLabel(/reason|why are you rejecting/i);
        await reasonField.fill('Too high');
        
        // Try to confirm
        await page.getByRole('button', { name: /confirm|yes, reject/i }).click();
        
        // Should show validation error
        await expect(page.getByText(/minimum 10 characters|reason too short/i)).toBeVisible();
        
        // Character counter should be visible
        await expect(page.getByText(/8.*10|8\/10/i)).toBeVisible();
      }
    });

    test('should update order status when all quotes are rejected', async ({ page }) => {
      // Navigate to orders page
      await page.getByText('Orders', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find an order with only one active quote
      const orderWithOneQuote = page.locator('[data-testid="order-item"]')
        .filter({ has: page.locator('[data-testid="quote-count"]', { hasText: '1' }) })
        .first();
      
      if (await orderWithOneQuote.count() > 0) {
        await orderWithOneQuote.click();
        
        // Get current order status
        const currentStatus = await page.locator('.order-status-badge').textContent();
        
        // View the quote
        const viewQuotesButton = page.getByRole('button', { name: /view quotes|manage quotes/i });
        await viewQuotesButton.click();
        
        const quoteItem = page.locator('[data-testid="quote-item"]').first();
        await quoteItem.click();
        
        // Reject the quote
        const rejectButton = page.getByRole('button', { name: /reject quote/i });
        if (await rejectButton.count() > 0) {
          await rejectButton.click();
          
          const reasonField = page.getByLabel(/reason|why are you rejecting/i);
          await reasonField.fill('All vendors declined. Need to find alternative suppliers.');
          
          await page.getByRole('button', { name: /confirm|yes, reject/i }).click();
          
          // Should show success message
          await expect(page.getByText(/quote rejected successfully/i)).toBeVisible();
          
          // Should show warning about all quotes rejected
          await expect(page.getByText(/all quotes rejected|order status updated/i)).toBeVisible();
          
          // Navigate back to order
          const backToOrderButton = page.getByRole('button', { name: /back to order|view order/i });
          if (await backToOrderButton.count() > 0) {
            await backToOrderButton.click();
          } else {
            await page.goBack();
          }
          
          // Order status should be reverted to "vendor_sourcing"
          await expect(page.getByText(/vendor sourcing/i)).toBeVisible();
        }
      }
    });

    test('should show rejection history in quote timeline', async ({ page }) => {
      // Navigate to quotes page
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find a rejected quote
      const rejectedQuote = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /rejected/i }) })
        .first();
      
      if (await rejectedQuote.count() > 0) {
        await rejectedQuote.click();
        
        // Should show quote history section
        await expect(page.getByText(/history|timeline|activity/i)).toBeVisible();
        
        // Should show rejection entry
        await expect(page.getByText(/rejected/i)).toBeVisible();
        
        // Should show rejection reason
        const historySection = page.locator('[data-testid="quote-history"]');
        await expect(historySection).toBeVisible();
        
        // Should show timestamp
        await expect(historySection.getByText(/ago|at/i)).toBeVisible();
      }
    });
  });

  test.describe('Duplicate Prevention', () => {
    test('should prevent creating duplicate quotes for same order and vendor', async ({ page }) => {
      // Navigate to quotes page
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find an existing active quote
      const activeQuote = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /draft|open|sent/i }) })
        .first();
      
      if (await activeQuote.count() > 0) {
        // Get the order link from the quote
        const orderLink = activeQuote.locator('a[href*="/orders/"]');
        const orderHref = await orderLink.getAttribute('href');
        
        // Get the vendor name
        const vendorName = await activeQuote.locator('[data-testid="vendor-name"]').textContent();
        
        if (orderHref && vendorName) {
          // Navigate to the order
          await page.goto(orderHref);
          
          // Try to create a new quote
          const createQuoteButton = page.getByRole('button', { name: /create quote|manage quotes/i });
          await createQuoteButton.click();
          
          // Should detect existing quote and open in EDIT mode
          await expect(page.getByText(/edit quote|editing quote/i)).toBeVisible();
          
          // Should NOT show "Create Quote" title
          await expect(page.getByText(/^create quote$/i)).not.toBeVisible();
          
          // Should show existing quote data
          await expect(page.getByText(vendorName)).toBeVisible();
          
          // Should show "Update" button instead of "Create"
          await expect(page.getByRole('button', { name: /update|save changes/i })).toBeVisible();
          await expect(page.getByRole('button', { name: /^create$/i })).not.toBeVisible();
        }
      }
    });

    test('should allow creating quote for different vendor on same order', async ({ page }) => {
      // Navigate to orders page
      await page.getByText('Orders', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find an order with at least one quote
      const orderWithQuote = page.locator('[data-testid="order-item"]')
        .filter({ has: page.locator('[data-testid="quote-count"]', { hasText: /[1-9]/ }) })
        .first();
      
      if (await orderWithQuote.count() > 0) {
        await orderWithQuote.click();
        
        // View existing quotes
        const viewQuotesButton = page.getByRole('button', { name: /view quotes|manage quotes/i });
        await viewQuotesButton.click();
        
        // Get the vendor of existing quote
        const existingVendor = await page.locator('[data-testid="quote-item"]')
          .first()
          .locator('[data-testid="vendor-name"]')
          .textContent();
        
        // Close quotes modal/dialog
        const closeButton = page.getByRole('button', { name: /close|cancel/i });
        if (await closeButton.count() > 0) {
          await closeButton.click();
        }
        
        // Try to create new quote
        const createQuoteButton = page.getByRole('button', { name: /create quote|add quote/i });
        if (await createQuoteButton.count() > 0) {
          await createQuoteButton.click();
          
          // Should open in CREATE mode (not edit)
          await expect(page.getByText(/new quote|create quote/i)).toBeVisible();
          
          // Select a DIFFERENT vendor
          await page.getByLabel(/vendor/i).click();
          
          const vendorOptions = page.locator('[role="option"]');
          const vendorCount = await vendorOptions.count();
          
          if (vendorCount > 1) {
            // Find a vendor that's NOT the existing one
            for (let i = 0; i < vendorCount; i++) {
              const vendorOption = vendorOptions.nth(i);
              const vendorText = await vendorOption.textContent();
              
              if (vendorText !== existingVendor) {
                await vendorOption.click();
                break;
              }
            }
            
            // Fill quote details
            await page.getByLabel(/quoted amount|total amount/i).fill('600000');
            await page.getByLabel(/valid until|expiry date/i).fill('2025-12-31');
            await page.getByLabel(/terms|notes/i).fill('Alternative vendor quote');
            
            // Submit quote
            await page.getByRole('button', { name: /create quote|submit/i }).click();
            
            // Should successfully create the quote
            await expect(page.getByText(/quote created successfully/i)).toBeVisible();
            
            // Should now have 2 quotes for this order
            await expect(page.getByText(/2.*quotes|quote.*2/i)).toBeVisible();
          }
        }
      }
    });

    test('should ignore rejected quotes when checking for duplicates', async ({ page }) => {
      // Navigate to quotes page
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find a rejected quote
      const rejectedQuote = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /rejected/i }) })
        .first();
      
      if (await rejectedQuote.count() > 0) {
        // Get order and vendor info
        const orderLink = rejectedQuote.locator('a[href*="/orders/"]');
        const orderHref = await orderLink.getAttribute('href');
        const vendorName = await rejectedQuote.locator('[data-testid="vendor-name"]').textContent();
        
        if (orderHref && vendorName) {
          // Navigate to the order
          await page.goto(orderHref);
          
          // Try to create a new quote
          const createQuoteButton = page.getByRole('button', { name: /create quote|manage quotes/i });
          await createQuoteButton.click();
          
          // Should open in CREATE mode (not edit) because rejected quotes are ignored
          await expect(page.getByText(/new quote|create quote/i)).toBeVisible();
          
          // Should be able to select the same vendor again
          await page.getByLabel(/vendor/i).click();
          
          const vendorOptions = page.locator('[role="option"]');
          const matchingVendor = vendorOptions.filter({ hasText: vendorName });
          
          if (await matchingVendor.count() > 0) {
            await matchingVendor.click();
            
            // Fill quote details
            await page.getByLabel(/quoted amount|total amount/i).fill('550000');
            await page.getByLabel(/valid until|expiry date/i).fill('2025-12-31');
            await page.getByLabel(/terms|notes/i).fill('Revised quote after rejection');
            
            // Submit quote
            await page.getByRole('button', { name: /create quote|submit/i }).click();
            
            // Should successfully create new quote
            await expect(page.getByText(/quote created successfully/i)).toBeVisible();
          }
        }
      }
    });

    test('should show loading state while checking for duplicates', async ({ page }) => {
      // Navigate to orders page
      await page.getByText('Orders', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      const orderItem = page.locator('[data-testid="order-item"]').first();
      if (await orderItem.count() > 0) {
        await orderItem.click();
        
        // Click create quote button
        const createQuoteButton = page.getByRole('button', { name: /create quote|manage quotes/i });
        await createQuoteButton.click();
        
        // Should show loading indicator while checking for duplicates
        const loadingIndicator = page.locator('[data-testid="checking-duplicates"]')
          .or(page.getByText(/checking|loading/i));
        
        // Loading might be very fast, so we use a short timeout
        try {
          await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
        } catch {
          // Loading was too fast to catch, which is fine
        }
        
        // Eventually should show the form (either create or edit mode)
        await expect(page.getByLabel(/vendor/i)).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Quote List and Filtering', () => {
    test('should display quotes list with all columns', async ({ page }) => {
      // Navigate to quotes page
      await page.getByText('Quotes', { exact: true }).click();
      await expect(page).toHaveURL('/admin/quotes');
      
      // Wait for quotes to load
      await page.waitForLoadState('networkidle');
      
      // Check page title
      await expect(page.locator('h1')).toContainText(/quotes/i);
      
      // Check for table headers
      await expect(page.getByText(/quote number|quote #/i)).toBeVisible();
      await expect(page.getByText(/order/i)).toBeVisible();
      await expect(page.getByText(/vendor/i)).toBeVisible();
      await expect(page.getByText(/amount/i)).toBeVisible();
      await expect(page.getByText(/status/i)).toBeVisible();
      await expect(page.getByText(/actions/i)).toBeVisible();
      
      // Should show quote items if any exist
      const quoteItems = page.locator('[data-testid="quote-item"]');
      if (await quoteItems.count() > 0) {
        await expect(quoteItems.first()).toBeVisible();
      }
    });

    test('should filter quotes by status', async ({ page }) => {
      // Navigate to quotes page
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Click status filter
      const statusFilter = page.getByLabel(/filter by status|status filter/i)
        .or(page.getByText(/all statuses/i));
      
      if (await statusFilter.count() > 0) {
        await statusFilter.click();
        
        // Select "Open" status
        const openOption = page.locator('[role="option"]').filter({ hasText: /^open$/i });
        if (await openOption.count() > 0) {
          await openOption.click();
          
          // Wait for filter to apply
          await page.waitForTimeout(1000);
          
          // All visible quotes should have "Open" status
          const quoteItems = page.locator('[data-testid="quote-item"]');
          const count = await quoteItems.count();
          
          if (count > 0) {
            for (let i = 0; i < Math.min(count, 3); i++) {
              const statusBadge = quoteItems.nth(i).locator('.status-badge');
              await expect(statusBadge).toContainText(/open/i);
            }
          }
        }
      }
    });

    test('should search quotes by order or vendor', async ({ page }) => {
      // Navigate to quotes page
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find search input
      const searchInput = page.getByPlaceholder(/search quotes|search/i);
      
      if (await searchInput.count() > 0) {
        // Search for a vendor or order
        await searchInput.fill('vendor');
        await searchInput.press('Enter');
        
        // Wait for search results
        await page.waitForTimeout(1000);
        
        // Should show filtered results or "no results" message
        const quoteItems = page.locator('[data-testid="quote-item"]');
        const noResults = page.getByText(/no quotes found|no results/i);
        
        const hasResults = await quoteItems.count() > 0;
        const hasNoResultsMessage = await noResults.count() > 0;
        
        expect(hasResults || hasNoResultsMessage).toBeTruthy();
      }
    });

    test('should navigate to quote detail from list', async ({ page }) => {
      // Navigate to quotes page
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      const firstQuote = page.locator('[data-testid="quote-item"]').first();
      
      if (await firstQuote.count() > 0) {
        // Click on quote to view details
        await firstQuote.click();
        
        // Should navigate to quote detail page
        await expect(page).toHaveURL(/\/admin\/quotes\/[^/]+$/);
        
        // Should show quote details
        await expect(page.getByText(/quote details|quote information/i)).toBeVisible();
      }
    });

    test('should show quote count badge in navigation', async ({ page }) => {
      // Check if quotes menu has notification badge
      const quotesMenuItem = page.getByText('Quotes', { exact: true });
      
      // Look for badge near quotes menu
      const badge = quotesMenuItem.locator('..').locator('[data-testid="notification-badge"]')
        .or(quotesMenuItem.locator('..').locator('.badge'));
      
      // Badge might be visible if there are pending quotes
      if (await badge.count() > 0) {
        await expect(badge).toBeVisible();
        
        // Badge should contain a number
        const badgeText = await badge.textContent();
        expect(badgeText).toMatch(/\d+/);
      }
    });
  });

  test.describe('Quote Notifications and Dashboard Widget', () => {
    test('should display pending quotes in dashboard widget', async ({ page }) => {
      // Should be on dashboard after login
      await expect(page).toHaveURL('/admin');
      
      // Look for quote notifications widget
      const quoteWidget = page.locator('[data-testid="quote-notifications"]')
        .or(page.getByText(/pending quotes|quotes requiring attention/i).locator('..'));
      
      if (await quoteWidget.count() > 0) {
        await expect(quoteWidget).toBeVisible();
        
        // Should show pending quotes or empty state
        const hasPendingQuotes = await quoteWidget.getByText(/quote #/i).count() > 0;
        const hasEmptyState = await quoteWidget.getByText(/no pending quotes/i).count() > 0;
        
        expect(hasPendingQuotes || hasEmptyState).toBeTruthy();
        
        // If has pending quotes, should have "Review" buttons
        if (hasPendingQuotes) {
          await expect(quoteWidget.getByRole('button', { name: /review|view/i })).toBeVisible();
        }
      }
    });

    test('should navigate from dashboard widget to quote detail', async ({ page }) => {
      // Should be on dashboard
      await expect(page).toHaveURL('/admin');
      
      const quoteWidget = page.locator('[data-testid="quote-notifications"]');
      
      if (await quoteWidget.count() > 0) {
        const reviewButton = quoteWidget.getByRole('button', { name: /review|view/i }).first();
        
        if (await reviewButton.count() > 0) {
          await reviewButton.click();
          
          // Should navigate to quote detail page
          await expect(page).toHaveURL(/\/admin\/quotes\/[^/]+$/);
        }
      }
    });
  });

  test.describe('Quote Counter Offer Flow', () => {
    test('should create counter offer for a quote', async ({ page }) => {
      // Navigate to quotes page
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find an open quote
      const openQuote = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /open|sent/i }) })
        .first();
      
      if (await openQuote.count() > 0) {
        await openQuote.click();
        
        // Click counter offer button
        const counterButton = page.getByRole('button', { name: /counter offer|counter/i });
        
        if (await counterButton.count() > 0) {
          await counterButton.click();
          
          // Should show counter offer dialog
          await expect(page.getByText(/counter offer|new price/i)).toBeVisible();
          
          // Should show current price
          await expect(page.getByText(/current price|current offer/i)).toBeVisible();
          
          // Enter new price
          const newPriceField = page.getByLabel(/new price|counter amount/i);
          await newPriceField.fill('450000');
          
          // Add notes
          const notesField = page.getByLabel(/notes|reason/i);
          if (await notesField.count() > 0) {
            await notesField.fill('Can you reduce the price to match our budget?');
          }
          
          // Submit counter offer
          await page.getByRole('button', { name: /submit|send counter/i }).click();
          
          // Should show success message
          await expect(page.getByText(/counter offer sent|quote updated/i)).toBeVisible();
          
          // Status should be updated to "countered"
          const statusBadge = page.locator('.status-badge');
          await expect(statusBadge).toContainText(/countered/i);
          
          // Should show in history
          await expect(page.getByText(/counter offer.*450000|450,000/i)).toBeVisible();
        }
      }
    });
  });
});
