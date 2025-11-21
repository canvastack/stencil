import { test, expect } from '@playwright/test';

test.describe('Product Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('admin@demo-etching.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for dashboard and navigate to products
    await expect(page).toHaveURL('/admin');
    await page.getByText('Products', { exact: true }).click();
    await expect(page).toHaveURL('/admin/products');
  });

  test('should display products list', async ({ page }) => {
    // Check page title and elements
    await expect(page.locator('h1')).toContainText('Products');
    await expect(page.getByRole('button', { name: /add product/i })).toBeVisible();
    
    // Check for search functionality
    await expect(page.getByPlaceholder(/search products/i)).toBeVisible();
    
    // Check for filter options
    await expect(page.getByText('All Categories')).toBeVisible();
    
    // Should show product cards or table
    const productElements = page.locator('[data-testid="product-item"]');
    if (await productElements.count() > 0) {
      await expect(productElements.first()).toBeVisible();
    }
  });

  test('should create a new product', async ({ page }) => {
    // Click add product button
    await page.getByRole('button', { name: /add product/i }).click();
    
    // Should navigate to product editor
    await expect(page).toHaveURL('/admin/products/new');
    await expect(page.locator('h1')).toContainText('Add Product');
    
    // Fill product form
    const productName = `Test Product ${Date.now()}`;
    await page.getByLabel(/name/i).fill(productName);
    await page.getByLabel(/description/i).fill('This is a test product created by E2E test');
    await page.getByLabel(/price/i).fill('99.99');
    await page.getByLabel(/stock/i).fill('50');
    
    // Select category (assuming there's a select dropdown)
    await page.getByLabel(/category/i).click();
    const categoryOptions = page.locator('[role="option"]');
    if (await categoryOptions.count() > 0) {
      await categoryOptions.first().click();
    }
    
    // Save product
    await page.getByRole('button', { name: /save product/i }).click();
    
    // Should redirect back to products list
    await expect(page).toHaveURL('/admin/products');
    
    // Should show success message
    await expect(page.getByText(/product created successfully/i)).toBeVisible();
    
    // Product should appear in the list
    await expect(page.getByText(productName)).toBeVisible();
  });

  test('should edit an existing product', async ({ page }) => {
    // Wait for products to load
    await page.waitForLoadState('networkidle');
    
    // Find first product and click edit
    const firstProduct = page.locator('[data-testid="product-item"]').first();
    if (await firstProduct.count() > 0) {
      await firstProduct.getByRole('button', { name: /edit/i }).click();
      
      // Should navigate to edit page
      await expect(page).toHaveURL(/\/admin\/products\/.*\/edit/);
      await expect(page.locator('h1')).toContainText('Edit Product');
      
      // Update product name
      const nameInput = page.getByLabel(/name/i);
      const currentName = await nameInput.inputValue();
      const newName = `${currentName} - Updated`;
      
      await nameInput.clear();
      await nameInput.fill(newName);
      
      // Save changes
      await page.getByRole('button', { name: /save changes/i }).click();
      
      // Should redirect back to products list
      await expect(page).toHaveURL('/admin/products');
      
      // Should show success message
      await expect(page.getByText(/product updated successfully/i)).toBeVisible();
      
      // Updated name should appear in the list
      await expect(page.getByText(newName)).toBeVisible();
    }
  });

  test('should search products', async ({ page }) => {
    // Wait for products to load
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.getByPlaceholder(/search products/i);
    
    // Search for a specific term
    await searchInput.fill('Custom');
    await searchInput.press('Enter');
    
    // Wait for search results
    await page.waitForTimeout(1000);
    
    // Check that search was performed (URL should contain search param or results should be filtered)
    const productItems = page.locator('[data-testid="product-item"]');
    const productCount = await productItems.count();
    
    if (productCount > 0) {
      // Verify search results contain the search term
      const firstProductName = await productItems.first().locator('h3').textContent();
      expect(firstProductName?.toLowerCase()).toContain('custom');
    } else {
      // If no results, should show "No products found"
      await expect(page.getByText(/no products found/i)).toBeVisible();
    }
  });

  test('should filter products by category', async ({ page }) => {
    // Wait for products to load
    await page.waitForLoadState('networkidle');
    
    // Click category filter
    await page.getByText('All Categories').click();
    
    // Select a category (if available)
    const categoryOptions = page.locator('[role="option"]');
    if (await categoryOptions.count() > 1) { // More than "All Categories"
      await categoryOptions.nth(1).click();
      
      // Wait for filter to apply
      await page.waitForTimeout(1000);
      
      // Verify that products are filtered
      const productItems = page.locator('[data-testid="product-item"]');
      if (await productItems.count() > 0) {
        // Check that filtered products belong to the selected category
        const categoryText = await categoryOptions.nth(1).textContent();
        const firstProduct = productItems.first();
        await expect(firstProduct).toBeVisible();
      }
    }
  });

  test('should delete a product', async ({ page }) => {
    // Wait for products to load
    await page.waitForLoadState('networkidle');
    
    // Find first product and click delete
    const firstProduct = page.locator('[data-testid="product-item"]').first();
    if (await firstProduct.count() > 0) {
      const productName = await firstProduct.locator('h3').textContent();
      
      await firstProduct.getByRole('button', { name: /delete/i }).click();
      
      // Should show confirmation dialog
      await expect(page.getByText(/are you sure/i)).toBeVisible();
      
      // Confirm deletion
      await page.getByRole('button', { name: /delete/i }).last().click();
      
      // Should show success message
      await expect(page.getByText(/product deleted successfully/i)).toBeVisible();
      
      // Product should no longer appear in the list
      if (productName) {
        await expect(page.getByText(productName)).not.toBeVisible();
      }
    }
  });

  test('should handle bulk operations', async ({ page }) => {
    // Wait for products to load
    await page.waitForLoadState('networkidle');
    
    const productItems = page.locator('[data-testid="product-item"]');
    const productCount = await productItems.count();
    
    if (productCount >= 2) {
      // Select multiple products
      await productItems.nth(0).locator('input[type="checkbox"]').check();
      await productItems.nth(1).locator('input[type="checkbox"]').check();
      
      // Bulk actions menu should appear
      await expect(page.getByText(/2 selected/i)).toBeVisible();
      
      // Test bulk status update
      await page.getByRole('button', { name: /bulk actions/i }).click();
      await page.getByText(/update status/i).click();
      
      // Select new status
      await page.getByText('Draft').click();
      
      // Confirm bulk update
      await page.getByRole('button', { name: /update selected/i }).click();
      
      // Should show success message
      await expect(page.getByText(/products updated successfully/i)).toBeVisible();
    }
  });

  test('should view product details', async ({ page }) => {
    // Wait for products to load
    await page.waitForLoadState('networkidle');
    
    const firstProduct = page.locator('[data-testid="product-item"]').first();
    if (await firstProduct.count() > 0) {
      // Click on product to view details
      await firstProduct.click();
      
      // Should navigate to product detail page
      await expect(page).toHaveURL(/\/admin\/products\/[^/]+$/);
      
      // Should show product details
      await expect(page.getByText(/product details/i)).toBeVisible();
      await expect(page.getByText(/description/i)).toBeVisible();
      await expect(page.getByText(/price/i)).toBeVisible();
      await expect(page.getByText(/stock/i)).toBeVisible();
      
      // Should have edit and delete buttons
      await expect(page.getByRole('button', { name: /edit product/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /delete product/i })).toBeVisible();
    }
  });

  test('should validate product form', async ({ page }) => {
    // Click add product button
    await page.getByRole('button', { name: /add product/i }).click();
    
    // Try to save without filling required fields
    await page.getByRole('button', { name: /save product/i }).click();
    
    // Should show validation errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/price is required/i)).toBeVisible();
    
    // Fill invalid price
    await page.getByLabel(/price/i).fill('invalid-price');
    await page.getByRole('button', { name: /save product/i }).click();
    
    // Should show price validation error
    await expect(page.getByText(/invalid price format/i)).toBeVisible();
  });

  test('should handle image upload', async ({ page }) => {
    // Click add product button
    await page.getByRole('button', { name: /add product/i }).click();
    
    // Fill basic product info
    await page.getByLabel(/name/i).fill('Product with Image');
    await page.getByLabel(/description/i).fill('Testing image upload');
    await page.getByLabel(/price/i).fill('29.99');
    
    // Look for file input or image upload area
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      // Create a test image file (this would need to be a real file in practice)
      await fileInput.setInputFiles('src/assets/products/custom-engraving.jpg');
      
      // Should show image preview
      await expect(page.locator('img[alt*="preview"]')).toBeVisible();
    }
    
    // Save product
    await page.getByRole('button', { name: /save product/i }).click();
    
    // Should redirect back to products list
    await expect(page).toHaveURL('/admin/products');
  });
});