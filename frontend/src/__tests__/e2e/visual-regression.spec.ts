import { test, expect } from '@chromatic-com/playwright';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Email').fill('admin@etchinx.com');
    await page.getByPlaceholder('Password').fill('DemoAdmin2024!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/admin');
  });

  test.describe('Dashboard Views', () => {
    test('dashboard overview should match baseline', async ({ page }) => {
      await expect(page).toHaveURL('/admin');
      await expect(page.locator('h1')).toBeVisible();
      await page.waitForLoadState('networkidle');
      
      // Chromatic automatically captures visual snapshot
      await expect(page).toHaveScreenshot('dashboard-overview.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('dashboard with different viewport sizes', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('dashboard-mobile.png', {
        fullPage: true,
        animations: 'disabled',
      });

      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('dashboard-tablet.png', {
        fullPage: true,
        animations: 'disabled',
      });

      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveScreenshot('dashboard-desktop.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Product Catalog Views', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByText('Products', { exact: true }).click();
      await expect(page).toHaveURL('/admin/products');
      await page.waitForLoadState('networkidle');
    });

    test('product list view should match baseline', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Products');
      
      await expect(page).toHaveScreenshot('product-catalog-list.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('product grid view should match baseline', async ({ page }) => {
      const gridViewButton = page.getByRole('button', { name: /grid view/i });
      if (await gridViewButton.isVisible()) {
        await gridViewButton.click();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('product-catalog-grid.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });

    test('product search results should match baseline', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search products/i);
      await searchInput.fill('wood');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('product-catalog-search.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('product filters applied should match baseline', async ({ page }) => {
      const categoryFilter = page.getByText('All Categories');
      if (await categoryFilter.isVisible()) {
        await categoryFilter.click();
        await page.waitForTimeout(300);
        
        const firstCategory = page.getByRole('option').first();
        if (await firstCategory.isVisible()) {
          await firstCategory.click();
          await page.waitForTimeout(500);
          
          await expect(page).toHaveScreenshot('product-catalog-filtered.png', {
            fullPage: true,
            animations: 'disabled',
          });
        }
      }
    });

    test('empty product catalog should match baseline', async ({ page }) => {
      await page.getByPlaceholder(/search products/i).fill('nonexistentproductxyz123');
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('product-catalog-empty.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Product Form Views', () => {
    test('new product form should match baseline', async ({ page }) => {
      await page.getByText('Products', { exact: true }).click();
      await page.getByRole('button', { name: /add product/i }).click();
      await expect(page).toHaveURL('/admin/products/new');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('product-form-new.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('product form with validation errors should match baseline', async ({ page }) => {
      await page.getByText('Products', { exact: true }).click();
      await page.getByRole('button', { name: /add product/i }).click();
      await expect(page).toHaveURL('/admin/products/new');
      
      const submitButton = page.getByRole('button', { name: /save|submit/i });
      await submitButton.click();
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('product-form-validation-errors.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });

  test.describe('Order Management Views', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByText('Orders', { exact: true }).click();
      await expect(page).toHaveURL('/admin/orders');
      await page.waitForLoadState('networkidle');
    });

    test('orders list should match baseline', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Orders');
      
      await expect(page).toHaveScreenshot('orders-list.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('order details modal should match baseline', async ({ page }) => {
      const firstOrderRow = page.locator('[data-testid="order-item"]').first();
      if (await firstOrderRow.isVisible()) {
        await firstOrderRow.click();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('order-details-modal.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Customer Management Views', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByText('Customers', { exact: true }).click();
      await expect(page).toHaveURL('/admin/customers');
      await page.waitForLoadState('networkidle');
    });

    test('customers list should match baseline', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Customers');
      
      await expect(page).toHaveScreenshot('customers-list.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });

    test('customer profile view should match baseline', async ({ page }) => {
      const firstCustomer = page.locator('[data-testid="customer-item"]').first();
      if (await firstCustomer.isVisible()) {
        await firstCustomer.click();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('customer-profile.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Navigation & Layout', () => {
    test('sidebar navigation should match baseline', async ({ page }) => {
      await expect(page.locator('[role="navigation"]')).toBeVisible();
      
      await expect(page).toHaveScreenshot('sidebar-navigation.png', {
        clip: { x: 0, y: 0, width: 300, height: 800 },
        animations: 'disabled',
      });
    });

    test('collapsed sidebar should match baseline', async ({ page }) => {
      const collapseButton = page.getByRole('button', { name: /collapse|toggle sidebar/i });
      if (await collapseButton.isVisible()) {
        await collapseButton.click();
        await page.waitForTimeout(300);
        
        await expect(page).toHaveScreenshot('sidebar-collapsed.png', {
          clip: { x: 0, y: 0, width: 100, height: 800 },
          animations: 'disabled',
        });
      }
    });

    test('user profile menu should match baseline', async ({ page }) => {
      const userAvatar = page.locator('[data-testid="user-avatar"]');
      if (await userAvatar.isVisible()) {
        await userAvatar.click();
        await page.waitForTimeout(300);
        
        await expect(page).toHaveScreenshot('user-profile-menu.png', {
          fullPage: false,
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { name: 'mobile-portrait', width: 375, height: 812 },
      { name: 'mobile-landscape', width: 812, height: 375 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
      { name: 'desktop-hd', width: 1920, height: 1080 },
      { name: 'desktop-4k', width: 3840, height: 2160 },
    ];

    for (const viewport of viewports) {
      test(`product catalog on ${viewport.name} should match baseline`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.getByText('Products', { exact: true }).click();
        await expect(page).toHaveURL('/admin/products');
        await page.waitForLoadState('networkidle');
        
        await expect(page).toHaveScreenshot(`product-catalog-${viewport.name}.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  });

  test.describe('Theme Variants', () => {
    test('light theme should match baseline', async ({ page }) => {
      const themeToggle = page.getByRole('button', { name: /theme|dark mode|light mode/i });
      if (await themeToggle.isVisible()) {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.waitForTimeout(300);
        
        await expect(page).toHaveScreenshot('dashboard-light-theme.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });

    test('dark theme should match baseline', async ({ page }) => {
      const themeToggle = page.getByRole('button', { name: /theme|dark mode|light mode/i });
      if (await themeToggle.isVisible()) {
        await page.emulateMedia({ colorScheme: 'dark' });
        await themeToggle.click();
        await page.waitForTimeout(300);
        
        await expect(page).toHaveScreenshot('dashboard-dark-theme.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Data Table Components', () => {
    test('data table with pagination should match baseline', async ({ page }) => {
      await page.getByText('Products', { exact: true }).click();
      await expect(page).toHaveURL('/admin/products');
      await page.waitForLoadState('networkidle');
      
      const paginationControls = page.locator('[role="navigation"][aria-label*="pagination"]');
      if (await paginationControls.isVisible()) {
        await expect(page).toHaveScreenshot('data-table-pagination.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });

    test('data table with row selection should match baseline', async ({ page }) => {
      await page.getByText('Products', { exact: true }).click();
      await expect(page).toHaveURL('/admin/products');
      
      const selectAllCheckbox = page.locator('input[type="checkbox"]').first();
      if (await selectAllCheckbox.isVisible()) {
        await selectAllCheckbox.click();
        await page.waitForTimeout(300);
        
        await expect(page).toHaveScreenshot('data-table-row-selection.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });

    test('data table with sorting applied should match baseline', async ({ page }) => {
      await page.getByText('Products', { exact: true }).click();
      await expect(page).toHaveURL('/admin/products');
      
      const nameColumnHeader = page.getByRole('columnheader', { name: /name/i });
      if (await nameColumnHeader.isVisible()) {
        await nameColumnHeader.click();
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot('data-table-sorted.png', {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Modal & Dialog Components', () => {
    test('delete confirmation dialog should match baseline', async ({ page }) => {
      await page.getByText('Products', { exact: true }).click();
      await expect(page).toHaveURL('/admin/products');
      
      const deleteButton = page.getByRole('button', { name: /delete/i }).first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(300);
        
        await expect(page).toHaveScreenshot('delete-confirmation-dialog.png', {
          fullPage: false,
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Loading States', () => {
    test('loading skeleton should match baseline', async ({ page }) => {
      const productsLink = page.getByText('Products', { exact: true });
      await productsLink.click();
      
      // Capture immediately to catch loading state
      await expect(page).toHaveScreenshot('loading-skeleton.png', {
        fullPage: true,
        animations: 'disabled',
        timeout: 1000,
      });
    });
  });

  test.describe('Error States', () => {
    test('404 page should match baseline', async ({ page }) => {
      await page.goto('/admin/nonexistent-page-xyz123');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('404-error-page.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });
});
