import { test, expect } from '@playwright/test';

test.describe('Order Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('admin@etchinx.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard and navigate to orders
    await expect(page).toHaveURL('/admin');
    await page.getByText('Orders', { exact: true }).click();
    await expect(page).toHaveURL('/admin/orders');
  });

  test('should display orders list', async ({ page }) => {
    // Check page title and elements
    await expect(page.locator('h1')).toContainText('Orders');
    await expect(page.getByRole('button', { name: /create order/i })).toBeVisible();
    
    // Check for search and filter functionality
    await expect(page.getByPlaceholder(/search orders/i)).toBeVisible();
    await expect(page.getByText('All Statuses')).toBeVisible();
    
    // Should show order cards or table
    const orderElements = page.locator('[data-testid="order-item"]');
    if (await orderElements.count() > 0) {
      await expect(orderElements.first()).toBeVisible();
    }
  });

  test('should create a new order', async ({ page }) => {
    // Click create order button
    await page.getByRole('button', { name: /create order/i }).click();
    
    // Should show create order modal or navigate to form
    await expect(page.getByText(/new order/i)).toBeVisible();
    
    // Fill customer information
    await page.getByLabel(/customer/i).click();
    const customerOptions = page.locator('[role="option"]');
    if (await customerOptions.count() > 0) {
      await customerOptions.first().click();
    }
    
    // Add products to order
    await page.getByRole('button', { name: /add product/i }).click();
    
    // Select a product
    await page.getByLabel(/product/i).click();
    const productOptions = page.locator('[role="option"]');
    if (await productOptions.count() > 0) {
      await productOptions.first().click();
    }
    
    // Set quantity
    await page.getByLabel(/quantity/i).fill('2');
    
    // Add product to order
    await page.getByRole('button', { name: /add to order/i }).click();
    
    // Should show product in order summary
    await expect(page.getByText(/order total/i)).toBeVisible();
    
    // Create the order
    await page.getByRole('button', { name: /create order/i }).click();
    
    // Should show success message and redirect
    await expect(page.getByText(/order created successfully/i)).toBeVisible();
    
    // Should be back on orders list or order detail page
    await expect(page).toHaveURL(/\/admin\/orders/);
  });

  test('should view order details', async ({ page }) => {
    // Wait for orders to load
    await page.waitForLoadState('networkidle');
    
    const firstOrder = page.locator('[data-testid="order-item"]').first();
    if (await firstOrder.count() > 0) {
      // Click on order to view details
      await firstOrder.click();
      
      // Should navigate to order detail page
      await expect(page).toHaveURL(/\/admin\/orders\/[^/]+$/);
      
      // Should show order details
      await expect(page.getByText(/order details/i)).toBeVisible();
      await expect(page.getByText(/customer information/i)).toBeVisible();
      await expect(page.getByText(/order items/i)).toBeVisible();
      await expect(page.getByText(/order total/i)).toBeVisible();
      
      // Should show status and actions
      await expect(page.getByText(/status/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /update status/i })).toBeVisible();
    }
  });

  test('should update order status', async ({ page }) => {
    // Wait for orders to load
    await page.waitForLoadState('networkidle');
    
    const firstOrder = page.locator('[data-testid="order-item"]').first();
    if (await firstOrder.count() > 0) {
      // Get current status
      const currentStatus = await firstOrder.locator('.status-badge').textContent();
      
      // Click to view order details
      await firstOrder.click();
      
      // Update status
      await page.getByRole('button', { name: /update status/i }).click();
      
      // Select new status
      const statusOptions = page.locator('[role="option"]');
      await statusOptions.filter({ hasText: 'Processing' }).click();
      
      // Add status update notes
      await page.getByLabel(/notes/i).fill('Status updated by E2E test');
      
      // Confirm status update
      await page.getByRole('button', { name: /update/i }).click();
      
      // Should show success message
      await expect(page.getByText(/status updated successfully/i)).toBeVisible();
      
      // Status should be updated in the UI
      await expect(page.getByText('Processing')).toBeVisible();
    }
  });

  test('should search orders', async ({ page }) => {
    // Wait for orders to load
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.getByPlaceholder(/search orders/i);
    
    // Search for a specific order ID or customer name
    await searchInput.fill('John');
    await searchInput.press('Enter');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check that search was performed
    const orderItems = page.locator('[data-testid="order-item"]');
    const orderCount = await orderItems.count();
    
    if (orderCount > 0) {
      // Verify search results contain the search term
      const firstOrderCustomer = await orderItems.first().locator('.customer-name').textContent();
      expect(firstOrderCustomer?.toLowerCase()).toContain('john');
    } else {
      // If no results, should show "No orders found"
      await expect(page.getByText(/no orders found/i)).toBeVisible();
    }
  });

  test('should filter orders by status', async ({ page }) => {
    // Wait for orders to load
    await page.waitForLoadState('networkidle');
    
    // Click status filter
    await page.getByText('All Statuses').click();
    
    // Select a specific status
    const statusOptions = page.locator('[role="option"]');
    if (await statusOptions.count() > 1) {
      await statusOptions.filter({ hasText: 'Pending' }).click();
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Verify that orders are filtered by status
      const orderItems = page.locator('[data-testid="order-item"]');
      const orderCount = await orderItems.count();
      
      if (orderCount > 0) {
        // Check that filtered orders have the selected status
        const firstOrderStatus = await orderItems.first().locator('.status-badge').textContent();
        expect(firstOrderStatus?.toLowerCase()).toContain('pending');
      }
    }
  });

  test('should cancel an order', async ({ page }) => {
    // Wait for orders to load
    await page.waitForLoadState('networkidle');
    
    // Find a pending order to cancel
    const pendingOrder = page.locator('[data-testid="order-item"]')
      .filter({ has: page.locator('.status-badge', { hasText: 'Pending' }) })
      .first();
    
    if (await pendingOrder.count() > 0) {
      // Click to view order details
      await pendingOrder.click();
      
      // Cancel the order
      await page.getByRole('button', { name: /cancel order/i }).click();
      
      // Confirm cancellation
      await expect(page.getByText(/are you sure/i)).toBeVisible();
      await page.getByLabel(/cancellation reason/i).fill('Customer requested cancellation');
      await page.getByRole('button', { name: /confirm cancellation/i }).click();
      
      // Should show success message
      await expect(page.getByText(/order cancelled successfully/i)).toBeVisible();
      
      // Status should be updated to cancelled
      await expect(page.getByText('Cancelled')).toBeVisible();
    }
  });

  test('should process payment for an order', async ({ page }) => {
    // Wait for orders to load
    await page.waitForLoadState('networkidle');
    
    // Find an order that needs payment
    const unpaidOrder = page.locator('[data-testid="order-item"]')
      .filter({ has: page.locator('.payment-status', { hasText: 'Unpaid' }) })
      .first();
    
    if (await unpaidOrder.count() > 0) {
      // Click to view order details
      await unpaidOrder.click();
      
      // Process payment
      await page.getByRole('button', { name: /process payment/i }).click();
      
      // Fill payment details
      await page.getByLabel(/amount/i).fill('299.99');
      await page.getByLabel(/payment method/i).click();
      await page.getByText('Credit Card').click();
      await page.getByLabel(/transaction id/i).fill(`txn_${Date.now()}`);
      
      // Process the payment
      await page.getByRole('button', { name: /process payment/i }).click();
      
      // Should show success message
      await expect(page.getByText(/payment processed successfully/i)).toBeVisible();
      
      // Payment status should be updated
      await expect(page.getByText('Paid')).toBeVisible();
    }
  });

  test('should generate invoice for an order', async ({ page }) => {
    // Wait for orders to load
    await page.waitForLoadState('networkidle');
    
    const firstOrder = page.locator('[data-testid="order-item"]').first();
    if (await firstOrder.count() > 0) {
      // Click to view order details
      await firstOrder.click();
      
      // Generate invoice
      await page.getByRole('button', { name: /generate invoice/i }).click();
      
      // Should show invoice generation success or download
      await expect(page.getByText(/invoice generated/i).or(page.getByText(/downloading/i))).toBeVisible();
    }
  });

  test('should update shipping information', async ({ page }) => {
    // Wait for orders to load
    await page.waitForLoadState('networkidle');
    
    // Find a shipped order
    const shippedOrder = page.locator('[data-testid="order-item"]')
      .filter({ has: page.locator('.status-badge', { hasText: 'Shipped' }) })
      .first();
    
    if (await shippedOrder.count() > 0) {
      // Click to view order details
      await shippedOrder.click();
      
      // Update shipping info
      await page.getByRole('button', { name: /update shipping/i }).click();
      
      // Fill shipping details
      await page.getByLabel(/carrier/i).click();
      await page.getByText('FedEx').click();
      await page.getByLabel(/tracking number/i).fill('1234567890');
      await page.getByLabel(/estimated delivery/i).fill('2024-12-31');
      
      // Save shipping info
      await page.getByRole('button', { name: /save shipping info/i }).click();
      
      // Should show success message
      await expect(page.getByText(/shipping info updated/i)).toBeVisible();
      
      // Tracking number should be visible
      await expect(page.getByText('1234567890')).toBeVisible();
    }
  });

  test('should handle order notifications', async ({ page }) => {
    // Wait for orders to load
    await page.waitForLoadState('networkidle');
    
    const firstOrder = page.locator('[data-testid="order-item"]').first();
    if (await firstOrder.count() > 0) {
      // Click to view order details
      await firstOrder.click();
      
      // Send notification to customer
      await page.getByRole('button', { name: /notify customer/i }).click();
      
      // Select notification type
      await page.getByLabel(/notification type/i).click();
      await page.getByText('Status Update').click();
      
      // Customize message
      await page.getByLabel(/message/i).fill('Your order status has been updated.');
      
      // Send notification
      await page.getByRole('button', { name: /send notification/i }).click();
      
      // Should show success message
      await expect(page.getByText(/notification sent successfully/i)).toBeVisible();
    }
  });

  test('should export orders data', async ({ page }) => {
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
});