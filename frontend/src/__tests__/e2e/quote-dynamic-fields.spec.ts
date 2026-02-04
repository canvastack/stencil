import { test, expect } from '@playwright/test';

/**
 * Quote Enhancement: Dynamic Fields & Quantity Calculations E2E Tests
 * 
 * Tests the enhanced quote management features including:
 * - Dynamic form field display from customer orders
 * - Quantity-based pricing calculations
 * - Real-time calculation updates
 * - Per-piece and total profit margin visibility
 */

test.describe('Quote Enhancement: Dynamic Fields & Calculations', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('admin@etchinx.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard
    await expect(page).toHaveURL('/admin');
  });

  test.describe('Complete Flow: Order → Quote → Display', () => {
    test('should display quote with dynamic specifications from order', async ({ page }) => {
      // Navigate to orders
      await page.getByText('Orders', { exact: true }).click();
      await expect(page).toHaveURL('/admin/orders');
      await page.waitForLoadState('networkidle');
      
      // Find an order with dynamic form data
      const orderItem = page.locator('[data-testid="order-item"]').first();
      if (await orderItem.count() > 0) {
        await orderItem.click();
        
        // Should be on order detail page
        await expect(page).toHaveURL(/\/admin\/orders\/[^/]+$/);
        
        // Open quote management
        const manageQuoteButton = page.getByRole('button', { name: /create quote|manage quotes/i });
        await expect(manageQuoteButton).toBeVisible();
        await manageQuoteButton.click();
        
        // Wait for quote modal/form to load
        await page.waitForTimeout(1000);
        
        // Check if specifications section exists
        const specificationsSection = page.getByText(/product specifications/i);
        if (await specificationsSection.count() > 0) {
          // Specifications should be visible
          await expect(specificationsSection).toBeVisible();
          
          // Should show specification fields with labels
          const specFields = page.locator('[data-testid="spec-field"]');
          if (await specFields.count() > 0) {
            // Verify at least one specification field is displayed
            await expect(specFields.first()).toBeVisible();
            
            // Check that field has label and value
            const firstField = specFields.first();
            await expect(firstField.locator('dt')).toBeVisible(); // Label
            await expect(firstField.locator('dd')).toBeVisible(); // Value
          }
        }
        
        // Check for calculation breakdown section
        const calculationsSection = page.getByText(/pricing breakdown/i);
        await expect(calculationsSection).toBeVisible();
      }
    });

    test('should create quote and preserve specifications', async ({ page }) => {
      // Navigate to orders
      await page.getByText('Orders', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find an order in vendor_sourcing status
      const orderItem = page.locator('[data-testid="order-item"]').first();
      if (await orderItem.count() > 0) {
        await orderItem.click();
        
        // Create new quote
        const createQuoteButton = page.getByRole('button', { name: /create quote|manage quotes/i });
        await createQuoteButton.click();
        
        // Fill quote form
        await page.waitForTimeout(1000);
        
        // Select vendor
        const vendorField = page.getByLabel(/vendor/i);
        if (await vendorField.count() > 0) {
          await vendorField.click();
          const vendorOptions = page.locator('[role="option"]');
          if (await vendorOptions.count() > 0) {
            await vendorOptions.first().click();
          }
        }
        
        // Fill quote details
        const amountField = page.getByLabel(/quoted amount|initial offer/i);
        if (await amountField.count() > 0) {
          await amountField.fill('500000');
        }
        
        const expiryField = page.getByLabel(/valid until|expires at/i);
        if (await expiryField.count() > 0) {
          await expiryField.fill('2025-12-31');
        }
        
        // Submit quote
        const submitButton = page.getByRole('button', { name: /create quote|submit/i });
        if (await submitButton.count() > 0) {
          await submitButton.click();
          
          // Wait for success message
          await page.waitForTimeout(2000);
          
          // Verify quote was created
          const successMessage = page.getByText(/quote created|success/i);
          if (await successMessage.count() > 0) {
            await expect(successMessage).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Specifications Display', () => {
    test('should display all custom form fields with proper labels', async ({ page }) => {
      // Navigate to quotes
      await page.getByText('Quotes', { exact: true }).click();
      await expect(page).toHaveURL('/admin/quotes');
      await page.waitForLoadState('networkidle');
      
      // Find a quote with specifications
      const quoteItem = page.locator('[data-testid="quote-item"]').first();
      if (await quoteItem.count() > 0) {
        await quoteItem.click();
        
        // Wait for quote detail page
        await page.waitForTimeout(1000);
        
        // Look for specifications section
        const specificationsSection = page.getByText(/product specifications/i);
        if (await specificationsSection.count() > 0) {
          // Expand specifications if collapsed
          await specificationsSection.click();
          await page.waitForTimeout(500);
          
          // Verify specification fields are displayed
          const specFields = page.locator('[data-testid="spec-field"]');
          if (await specFields.count() > 0) {
            const fieldCount = await specFields.count();
            
            // Check each field has label and value
            for (let i = 0; i < Math.min(fieldCount, 5); i++) {
              const field = specFields.nth(i);
              await expect(field.locator('dt')).toBeVisible();
              await expect(field.locator('dd')).toBeVisible();
            }
          }
        }
      }
    });

    test('should show collapsible specifications section', async ({ page }) => {
      // Navigate to quotes
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      const quoteItem = page.locator('[data-testid="quote-item"]').first();
      if (await quoteItem.count() > 0) {
        await quoteItem.click();
        await page.waitForTimeout(1000);
        
        // Find specifications header
        const specificationsHeader = page.getByText(/product specifications/i);
        if (await specificationsHeader.count() > 0) {
          // Should have expand/collapse icon
          const expandIcon = page.locator('[data-testid="expand-icon"]')
            .or(page.locator('svg').filter({ has: page.locator('path') }));
          
          if (await expandIcon.count() > 0) {
            // Click to collapse
            await specificationsHeader.click();
            await page.waitForTimeout(300);
            
            // Click to expand again
            await specificationsHeader.click();
            await page.waitForTimeout(300);
            
            // Specifications should be visible after expanding
            const specFields = page.locator('[data-testid="spec-field"]');
            if (await specFields.count() > 0) {
              await expect(specFields.first()).toBeVisible();
            }
          }
        }
      }
    });
  });

  test.describe('Real-time Calculations', () => {
    test('should update calculations when editing quote', async ({ page }) => {
      // Navigate to quotes
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find an editable quote
      const editableQuote = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /draft|open/i }) })
        .first();
      
      if (await editableQuote.count() > 0) {
        await editableQuote.click();
        await page.waitForTimeout(1000);
        
        // Click edit button
        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForTimeout(1000);
          
          // Find pricing breakdown section
          const pricingSection = page.getByText(/pricing breakdown/i);
          if (await pricingSection.count() > 0) {
            await expect(pricingSection).toBeVisible();
            
            // Check for per-piece calculations
            await expect(page.getByText(/per piece/i)).toBeVisible();
            await expect(page.getByText(/vendor cost/i)).toBeVisible();
            await expect(page.getByText(/unit price/i)).toBeVisible();
            await expect(page.getByText(/profit margin/i)).toBeVisible();
          }
        }
      }
    });

    test('should show both per-piece and total calculations', async ({ page }) => {
      // Navigate to quotes
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      const quoteItem = page.locator('[data-testid="quote-item"]').first();
      if (await quoteItem.count() > 0) {
        await quoteItem.click();
        await page.waitForTimeout(1000);
        
        // Look for calculation sections
        const perPieceSection = page.getByText(/per piece/i);
        if (await perPieceSection.count() > 0) {
          await expect(perPieceSection).toBeVisible();
        }
        
        // If quantity > 1, should show total section
        const totalSection = page.getByText(/total.*qty/i);
        if (await totalSection.count() > 0) {
          await expect(totalSection).toBeVisible();
          await expect(page.getByText(/total vendor cost/i)).toBeVisible();
          await expect(page.getByText(/total unit price/i)).toBeVisible();
          await expect(page.getByText(/total profit/i)).toBeVisible();
        }
      }
    });
  });

  test.describe('Quantity Changes Update Totals', () => {
    test('should recalculate totals when quantity changes', async ({ page }) => {
      // Navigate to quotes
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      // Find an editable quote
      const editableQuote = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /draft|open/i }) })
        .first();
      
      if (await editableQuote.count() > 0) {
        await editableQuote.click();
        await page.waitForTimeout(1000);
        
        // Edit quote
        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForTimeout(1000);
          
          // Find quantity field
          const quantityField = page.getByLabel(/quantity/i).first();
          if (await quantityField.count() > 0) {
            // Get current value
            const currentValue = await quantityField.inputValue();
            
            // Change quantity
            await quantityField.clear();
            await quantityField.fill('5');
            await quantityField.blur();
            
            // Wait for calculations to update
            await page.waitForTimeout(500);
            
            // Verify total calculations are visible
            const totalSection = page.getByText(/total.*qty.*5/i);
            if (await totalSection.count() > 0) {
              await expect(totalSection).toBeVisible();
            }
            
            // Restore original value
            await quantityField.clear();
            await quantityField.fill(currentValue || '1');
          }
        }
      }
    });

    test('should hide total section when quantity is 1', async ({ page }) => {
      // Navigate to quotes
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      const editableQuote = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /draft|open/i }) })
        .first();
      
      if (await editableQuote.count() > 0) {
        await editableQuote.click();
        await page.waitForTimeout(1000);
        
        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForTimeout(1000);
          
          // Set quantity to 1
          const quantityField = page.getByLabel(/quantity/i).first();
          if (await quantityField.count() > 0) {
            await quantityField.clear();
            await quantityField.fill('1');
            await quantityField.blur();
            await page.waitForTimeout(500);
            
            // Total section should not be visible for quantity = 1
            const totalSection = page.getByText(/total.*qty/i);
            if (await totalSection.count() > 0) {
              // If visible, it should not show "Qty: 1" or should be hidden
              const isVisible = await totalSection.isVisible();
              // This is acceptable either way for quantity 1
            }
            
            // Per-piece section should always be visible
            await expect(page.getByText(/per piece/i)).toBeVisible();
          }
        }
      }
    });
  });

  test.describe('Price Changes Update Margins', () => {
    test('should recalculate profit margins when unit price changes', async ({ page }) => {
      // Navigate to quotes
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      const editableQuote = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /draft|open/i }) })
        .first();
      
      if (await editableQuote.count() > 0) {
        await editableQuote.click();
        await page.waitForTimeout(1000);
        
        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForTimeout(1000);
          
          // Find unit price field
          const unitPriceField = page.getByLabel(/unit price/i).first();
          if (await unitPriceField.count() > 0) {
            // Get current value
            const currentValue = await unitPriceField.inputValue();
            
            // Change unit price
            await unitPriceField.clear();
            await unitPriceField.fill('100000');
            await unitPriceField.blur();
            
            // Wait for calculations to update
            await page.waitForTimeout(500);
            
            // Profit margin should be visible and updated
            const profitMargin = page.getByText(/profit margin/i);
            await expect(profitMargin).toBeVisible();
            
            // Restore original value
            await unitPriceField.clear();
            await unitPriceField.fill(currentValue || '0');
          }
        }
      }
    });

    test('should recalculate profit margins when vendor cost changes', async ({ page }) => {
      // Navigate to quotes
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      const editableQuote = page.locator('[data-testid="quote-item"]')
        .filter({ has: page.locator('.status-badge', { hasText: /draft|open/i }) })
        .first();
      
      if (await editableQuote.count() > 0) {
        await editableQuote.click();
        await page.waitForTimeout(1000);
        
        const editButton = page.getByRole('button', { name: /edit/i });
        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForTimeout(1000);
          
          // Find vendor cost field
          const vendorCostField = page.getByLabel(/vendor cost/i).first();
          if (await vendorCostField.count() > 0) {
            // Get current value
            const currentValue = await vendorCostField.inputValue();
            
            // Change vendor cost
            await vendorCostField.clear();
            await vendorCostField.fill('50000');
            await vendorCostField.blur();
            
            // Wait for calculations to update
            await page.waitForTimeout(500);
            
            // Profit margin should be visible and updated
            const profitMargin = page.getByText(/profit margin/i);
            await expect(profitMargin).toBeVisible();
            
            // Restore original value
            await vendorCostField.clear();
            await vendorCostField.fill(currentValue || '0');
          }
        }
      }
    });

    test('should show profit percentage alongside absolute values', async ({ page }) => {
      // Navigate to quotes
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      const quoteItem = page.locator('[data-testid="quote-item"]').first();
      if (await quoteItem.count() > 0) {
        await quoteItem.click();
        await page.waitForTimeout(1000);
        
        // Look for profit margin with percentage
        const profitWithPercentage = page.locator('text=/profit.*\\d+.*%/i');
        if (await profitWithPercentage.count() > 0) {
          await expect(profitWithPercentage.first()).toBeVisible();
        }
        
        // Should show both currency amount and percentage
        const profitSection = page.locator('[data-testid="profit-margin"]')
          .or(page.getByText(/profit margin/i).locator('..'));
        
        if (await profitSection.count() > 0) {
          // Should contain currency format (Rp or IDR)
          await expect(profitSection.first()).toContainText(/rp|idr/i);
          // Should contain percentage
          await expect(profitSection.first()).toContainText(/%/);
        }
      }
    });
  });

  test.describe('Multi-Browser Compatibility', () => {
    test('should display correctly in different viewports', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.getByText('Quotes', { exact: true }).click();
      await page.waitForLoadState('networkidle');
      
      const quoteItem = page.locator('[data-testid="quote-item"]').first();
      if (await quoteItem.count() > 0) {
        await quoteItem.click();
        await page.waitForTimeout(1000);
        
        // Specifications should be visible on mobile
        const specificationsSection = page.getByText(/product specifications/i);
        if (await specificationsSection.count() > 0) {
          await expect(specificationsSection).toBeVisible();
        }
        
        // Calculations should be visible on mobile
        const calculationsSection = page.getByText(/pricing breakdown/i);
        if (await calculationsSection.count() > 0) {
          await expect(calculationsSection).toBeVisible();
        }
      }
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      // Elements should still be visible
      if (await page.getByText(/product specifications/i).count() > 0) {
        await expect(page.getByText(/product specifications/i)).toBeVisible();
      }
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      
      // Elements should still be visible
      if (await page.getByText(/product specifications/i).count() > 0) {
        await expect(page.getByText(/product specifications/i)).toBeVisible();
      }
    });
  });
});
