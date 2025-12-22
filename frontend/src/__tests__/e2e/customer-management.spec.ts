import { test, expect } from '@playwright/test';

test.describe('Customer Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('admin@etchinx.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard and navigate to customers
    await expect(page).toHaveURL('/admin');
    await page.getByText('Customers', { exact: true }).click();
    await expect(page).toHaveURL('/admin/customers');
  });

  test('should display customers list', async ({ page }) => {
    // Check page title and elements
    await expect(page.locator('h1')).toContainText('Customers');
    await expect(page.getByRole('button', { name: /add customer/i })).toBeVisible();
    
    // Check for search and filter functionality
    await expect(page.getByPlaceholder(/search customers/i)).toBeVisible();
    
    // Should show customer cards or table
    const customerElements = page.locator('[data-testid="customer-item"]');
    if (await customerElements.count() > 0) {
      await expect(customerElements.first()).toBeVisible();
    }
  });

  test('should create a new customer', async ({ page }) => {
    // Click add customer button
    await page.getByRole('button', { name: /add customer/i }).click();
    
    // Should show create customer modal or navigate to form
    await expect(page.getByText(/new customer/i)).toBeVisible();
    
    // Fill customer form
    const timestamp = Date.now();
    const customerName = `Test Customer ${timestamp}`;
    const customerEmail = `customer${timestamp}@example.com`;
    
    await page.getByLabel(/name/i).fill(customerName);
    await page.getByLabel(/email/i).fill(customerEmail);
    await page.getByLabel(/phone/i).fill('+1-555-0123');
    await page.getByLabel(/company/i).fill('Test Company Ltd');
    
    // Fill address
    await page.getByLabel(/address/i).fill('123 Test Street');
    await page.getByLabel(/city/i).fill('Test City');
    await page.getByLabel(/state/i).fill('CA');
    await page.getByLabel(/zip code/i).fill('12345');
    await page.getByLabel(/country/i).fill('USA');
    
    // Create the customer
    await page.getByRole('button', { name: /create customer/i }).click();
    
    // Should show success message
    await expect(page.getByText(/customer created successfully/i)).toBeVisible();
    
    // Customer should appear in the list
    await expect(page.getByText(customerName)).toBeVisible();
    await expect(page.getByText(customerEmail)).toBeVisible();
  });

  test('should edit an existing customer', async ({ page }) => {
    // Wait for customers to load
    await page.waitForLoadState('networkidle');
    
    const firstCustomer = page.locator('[data-testid="customer-item"]').first();
    if (await firstCustomer.count() > 0) {
      // Click edit button
      await firstCustomer.getByRole('button', { name: /edit/i }).click();
      
      // Should show edit customer form
      await expect(page.getByText(/edit customer/i)).toBeVisible();
      
      // Update customer name
      const nameInput = page.getByLabel(/name/i);
      const currentName = await nameInput.inputValue();
      const newName = `${currentName} - Updated`;
      
      await nameInput.clear();
      await nameInput.fill(newName);
      
      // Update phone number
      await page.getByLabel(/phone/i).clear();
      await page.getByLabel(/phone/i).fill('+1-555-9999');
      
      // Save changes
      await page.getByRole('button', { name: /save changes/i }).click();
      
      // Should show success message
      await expect(page.getByText(/customer updated successfully/i)).toBeVisible();
      
      // Updated information should appear in the list
      await expect(page.getByText(newName)).toBeVisible();
      await expect(page.getByText('+1-555-9999')).toBeVisible();
    }
  });

  test('should view customer details', async ({ page }) => {
    // Wait for customers to load
    await page.waitForLoadState('networkidle');
    
    const firstCustomer = page.locator('[data-testid="customer-item"]').first();
    if (await firstCustomer.count() > 0) {
      // Click on customer name or view button
      await firstCustomer.locator('h3').click();
      
      // Should navigate to customer detail page
      await expect(page).toHaveURL(/\/admin\/customers\/[^/]+$/);
      
      // Should show customer details
      await expect(page.getByText(/customer details/i)).toBeVisible();
      await expect(page.getByText(/contact information/i)).toBeVisible();
      await expect(page.getByText(/order history/i)).toBeVisible();
      
      // Should have edit and delete buttons
      await expect(page.getByRole('button', { name: /edit customer/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /delete customer/i })).toBeVisible();
    }
  });

  test('should search customers', async ({ page }) => {
    // Wait for customers to load
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.getByPlaceholder(/search customers/i);
    
    // Search for a specific name or email
    await searchInput.fill('John');
    await searchInput.press('Enter');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check that search was performed
    const customerItems = page.locator('[data-testid="customer-item"]');
    const customerCount = await customerItems.count();
    
    if (customerCount > 0) {
      // Verify search results contain the search term
      const firstCustomerName = await customerItems.first().locator('h3').textContent();
      expect(firstCustomerName?.toLowerCase()).toContain('john');
    } else {
      // If no results, should show "No customers found"
      await expect(page.getByText(/no customers found/i)).toBeVisible();
    }
  });

  test('should filter customers by status', async ({ page }) => {
    // Wait for customers to load
    await page.waitForLoadState('networkidle');
    
    // Look for status filter
    const statusFilter = page.getByText('All Statuses');
    if (await statusFilter.count() > 0) {
      await statusFilter.click();
      
      // Select active customers
      const statusOptions = page.locator('[role="option"]');
      await statusOptions.filter({ hasText: 'Active' }).click();
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Verify that customers are filtered
      const customerItems = page.locator('[data-testid="customer-item"]');
      const customerCount = await customerItems.count();
      
      if (customerCount > 0) {
        // Check that filtered customers have active status
        const firstCustomerStatus = await customerItems.first().locator('.status-badge').textContent();
        expect(firstCustomerStatus?.toLowerCase()).toContain('active');
      }
    }
  });

  test('should view customer order history', async ({ page }) => {
    // Wait for customers to load
    await page.waitForLoadState('networkidle');
    
    const firstCustomer = page.locator('[data-testid="customer-item"]').first();
    if (await firstCustomer.count() > 0) {
      // Click to view customer details
      await firstCustomer.locator('h3').click();
      
      // Should be on customer detail page
      await expect(page).toHaveURL(/\/admin\/customers\/[^/]+$/);
      
      // Click on order history tab
      await page.getByText('Order History').click();
      
      // Should show order history
      await expect(page.getByText(/order history/i)).toBeVisible();
      
      // Check for orders or "no orders" message
      const orderItems = page.locator('[data-testid="order-item"]');
      if (await orderItems.count() > 0) {
        await expect(orderItems.first()).toBeVisible();
      } else {
        await expect(page.getByText(/no orders found/i)).toBeVisible();
      }
    }
  });

  test('should activate/deactivate customer', async ({ page }) => {
    // Wait for customers to load
    await page.waitForLoadState('networkidle');
    
    const firstCustomer = page.locator('[data-testid="customer-item"]').first();
    if (await firstCustomer.count() > 0) {
      // Check current status
      const statusBadge = firstCustomer.locator('.status-badge');
      const currentStatus = await statusBadge.textContent();
      
      // Click to view customer details
      await firstCustomer.locator('h3').click();
      
      // Toggle status
      if (currentStatus?.toLowerCase().includes('active')) {
        await page.getByRole('button', { name: /deactivate/i }).click();
        
        // Confirm deactivation
        await expect(page.getByText(/are you sure/i)).toBeVisible();
        await page.getByRole('button', { name: /deactivate/i }).click();
        
        // Should show success message
        await expect(page.getByText(/customer deactivated/i)).toBeVisible();
        await expect(page.getByText('Inactive')).toBeVisible();
      } else {
        await page.getByRole('button', { name: /activate/i }).click();
        
        // Should show success message
        await expect(page.getByText(/customer activated/i)).toBeVisible();
        await expect(page.getByText('Active')).toBeVisible();
      }
    }
  });

  test('should delete a customer', async ({ page }) => {
    // Wait for customers to load
    await page.waitForLoadState('networkidle');
    
    const firstCustomer = page.locator('[data-testid="customer-item"]').first();
    if (await firstCustomer.count() > 0) {
      const customerName = await firstCustomer.locator('h3').textContent();
      
      // Click to view customer details
      await firstCustomer.locator('h3').click();
      
      // Delete the customer
      await page.getByRole('button', { name: /delete customer/i }).click();
      
      // Should show confirmation dialog
      await expect(page.getByText(/are you sure/i)).toBeVisible();
      await expect(page.getByText(/this action cannot be undone/i)).toBeVisible();
      
      // Confirm deletion
      await page.getByRole('button', { name: /delete/i }).last().click();
      
      // Should redirect back to customers list
      await expect(page).toHaveURL('/admin/customers');
      
      // Should show success message
      await expect(page.getByText(/customer deleted successfully/i)).toBeVisible();
      
      // Customer should no longer appear in the list
      if (customerName) {
        await expect(page.getByText(customerName)).not.toBeVisible();
      }
    }
  });

  test('should handle bulk customer operations', async ({ page }) => {
    // Wait for customers to load
    await page.waitForLoadState('networkidle');
    
    const customerItems = page.locator('[data-testid="customer-item"]');
    const customerCount = await customerItems.count();
    
    if (customerCount >= 2) {
      // Select multiple customers
      await customerItems.nth(0).locator('input[type="checkbox"]').check();
      await customerItems.nth(1).locator('input[type="checkbox"]').check();
      
      // Bulk actions menu should appear
      await expect(page.getByText(/2 selected/i)).toBeVisible();
      
      // Test bulk activation
      await page.getByRole('button', { name: /bulk actions/i }).click();
      await page.getByText(/activate selected/i).click();
      
      // Confirm bulk activation
      await page.getByRole('button', { name: /activate/i }).click();
      
      // Should show success message
      await expect(page.getByText(/customers updated successfully/i)).toBeVisible();
    }
  });

  test('should export customer data', async ({ page }) => {
    // Look for export functionality
    const exportButton = page.getByRole('button', { name: /export/i });
    if (await exportButton.count() > 0) {
      await exportButton.click();
      
      // Select export format
      await page.getByText('CSV').click();
      
      // Should initiate download or show success message
      await expect(page.getByText(/export started/i).or(page.getByText(/downloading/i))).toBeVisible();
    }
  });

  test('should validate customer form', async ({ page }) => {
    // Click add customer button
    await page.getByRole('button', { name: /add customer/i }).click();
    
    // Try to save without filling required fields
    await page.getByRole('button', { name: /create customer/i }).click();
    
    // Should show validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
    
    // Fill invalid email
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByRole('button', { name: /create customer/i }).click();
    
    // Should show email validation error
    await expect(page.getByText(/invalid email format/i)).toBeVisible();
    
    // Fill invalid phone number
    await page.getByLabel(/email/i).clear();
    await page.getByLabel(/email/i).fill('valid@email.com');
    await page.getByLabel(/phone/i).fill('invalid-phone');
    await page.getByRole('button', { name: /create customer/i }).click();
    
    // Should show phone validation error
    await expect(page.getByText(/invalid phone format/i)).toBeVisible();
  });

  test('should show customer analytics', async ({ page }) => {
    // Wait for customers to load
    await page.waitForLoadState('networkidle');
    
    const firstCustomer = page.locator('[data-testid="customer-item"]').first();
    if (await firstCustomer.count() > 0) {
      // Click to view customer details
      await firstCustomer.locator('h3').click();
      
      // Click on analytics tab if available
      const analyticsTab = page.getByText('Analytics');
      if (await analyticsTab.count() > 0) {
        await analyticsTab.click();
        
        // Should show customer analytics
        await expect(page.getByText(/customer analytics/i)).toBeVisible();
        await expect(page.getByText(/total orders/i)).toBeVisible();
        await expect(page.getByText(/total spent/i)).toBeVisible();
        await expect(page.getByText(/average order value/i)).toBeVisible();
      }
    }
  });
});