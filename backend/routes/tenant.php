<?php

use Illuminate\Support\Facades\Route;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\DashboardController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\UserController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\CustomerController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\ProductController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\ProductCategoryController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\OrderController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\AnalyticsController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\SettingsController;

/*
|--------------------------------------------------------------------------
| Tenant Routes (Account B)
|--------------------------------------------------------------------------
|
| These routes are for tenant business users. Account B users can manage
| their business data including customers, products, orders, users, etc.
| All data is automatically scoped to their tenant.
|
*/

Route::middleware(['auth:sanctum', 'tenant.context', 'tenant.scoped'])
    ->group(function () {
        
        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('tenant.dashboard.index');
        Route::get('/dashboard/stats', [DashboardController::class, 'stats'])->name('tenant.dashboard.stats');
        Route::get('/dashboard/recent', [DashboardController::class, 'recent'])->name('tenant.dashboard.recent');
        
        // User Management (within tenant)
        Route::prefix('users')->group(function () {
            Route::get('/', [UserController::class, 'index'])->name('tenant.users.index');
            Route::post('/', [UserController::class, 'store'])->name('tenant.users.store');
            Route::get('/{user}', [UserController::class, 'show'])->name('tenant.users.show');
            Route::put('/{user}', [UserController::class, 'update'])->name('tenant.users.update');
            Route::delete('/{user}', [UserController::class, 'destroy'])->name('tenant.users.destroy');
            
            // User Status
            Route::post('/{user}/activate', [UserController::class, 'activate'])->name('tenant.users.activate');
            Route::post('/{user}/suspend', [UserController::class, 'suspend'])->name('tenant.users.suspend');
            
            // Role Management
            Route::get('/{user}/roles', [UserController::class, 'roles'])->name('tenant.users.roles');
            Route::post('/{user}/roles', [UserController::class, 'assignRole'])->name('tenant.users.assign_role');
            Route::delete('/{user}/roles/{role}', [UserController::class, 'removeRole'])->name('tenant.users.remove_role');
        });
        
        // Customer Management
        Route::prefix('customers')->group(function () {
            Route::get('/', [CustomerController::class, 'index'])->name('tenant.customers.index');
            Route::post('/', [CustomerController::class, 'store'])->name('tenant.customers.store');
            Route::get('/{customer}', [CustomerController::class, 'show'])->name('tenant.customers.show');
            Route::put('/{customer}', [CustomerController::class, 'update'])->name('tenant.customers.update');
            Route::delete('/{customer}', [CustomerController::class, 'destroy'])->name('tenant.customers.destroy');
            
            // Customer Actions
            Route::get('/search', [CustomerController::class, 'search'])->name('tenant.customers.search');
            Route::get('/export', [CustomerController::class, 'export'])->name('tenant.customers.export');
            Route::get('/inactive', [CustomerController::class, 'inactive'])->name('tenant.customers.inactive');
            Route::get('/{customer}/orders', [CustomerController::class, 'orders'])->name('tenant.customers.orders');
            
            // Customer Tags
            Route::post('/{customer}/tags', [CustomerController::class, 'addTag'])->name('tenant.customers.add_tag');
            Route::delete('/{customer}/tags/{tag}', [CustomerController::class, 'removeTag'])->name('tenant.customers.remove_tag');
        });
        
        // Product Management
        Route::prefix('products')->group(function () {
            Route::get('/', [ProductController::class, 'index'])->name('tenant.products.index');
            Route::post('/', [ProductController::class, 'store'])->name('tenant.products.store');
            Route::get('/{product}', [ProductController::class, 'show'])->name('tenant.products.show');
            Route::put('/{product}', [ProductController::class, 'update'])->name('tenant.products.update');
            Route::delete('/{product}', [ProductController::class, 'destroy'])->name('tenant.products.destroy');
            
            // Product Actions
            Route::post('/{product}/publish', [ProductController::class, 'publish'])->name('tenant.products.publish');
            Route::post('/{product}/unpublish', [ProductController::class, 'unpublish'])->name('tenant.products.unpublish');
            Route::put('/{product}/stock', [ProductController::class, 'updateStock'])->name('tenant.products.update_stock');
            
            // Product Categories & Tags
            Route::get('/categories', [ProductController::class, 'categories'])->name('tenant.products.categories');
            Route::get('/tags', [ProductController::class, 'tags'])->name('tenant.products.tags');
            
            // Inventory
            Route::get('/inventory/low-stock', [ProductController::class, 'lowStock'])->name('tenant.products.low_stock');
            Route::get('/inventory/out-of-stock', [ProductController::class, 'outOfStock'])->name('tenant.products.out_of_stock');
            Route::get('/search', [ProductController::class, 'search'])->name('tenant.products.search');
        });
        
        // Product Category Management
        Route::prefix('product-categories')->group(function () {
            Route::get('/', [ProductCategoryController::class, 'index'])->name('tenant.product_categories.index');
            Route::post('/', [ProductCategoryController::class, 'store'])->name('tenant.product_categories.store');
            Route::get('/{category}', [ProductCategoryController::class, 'show'])->name('tenant.product_categories.show');
            Route::put('/{category}', [ProductCategoryController::class, 'update'])->name('tenant.product_categories.update');
            Route::delete('/{category}', [ProductCategoryController::class, 'destroy'])->name('tenant.product_categories.destroy');
            
            // Category Hierarchy & Structure
            Route::get('/tree/hierarchy', [ProductCategoryController::class, 'tree'])->name('tenant.product_categories.tree');
            Route::post('/reorder', [ProductCategoryController::class, 'reorder'])->name('tenant.product_categories.reorder');
            
            // Category Products
            Route::get('/{category}/products', [ProductCategoryController::class, 'products'])->name('tenant.product_categories.products');
        });
        
        // Order Management
        Route::prefix('orders')->group(function () {
            Route::get('/', [OrderController::class, 'index'])->name('tenant.orders.index');
            Route::post('/', [OrderController::class, 'store'])->name('tenant.orders.store');
            Route::get('/{order}', [OrderController::class, 'show'])->name('tenant.orders.show');
            Route::put('/{order}', [OrderController::class, 'update'])->name('tenant.orders.update');
            Route::delete('/{order}', [OrderController::class, 'destroy'])->name('tenant.orders.destroy');
            
            // Order Status Management
            Route::put('/{order}/status', [OrderController::class, 'updateStatus'])->name('tenant.orders.update_status');
            Route::post('/{order}/process', [OrderController::class, 'process'])->name('tenant.orders.process');
            Route::post('/{order}/ship', [OrderController::class, 'ship'])->name('tenant.orders.ship');
            Route::post('/{order}/complete', [OrderController::class, 'complete'])->name('tenant.orders.complete');
            Route::post('/{order}/cancel', [OrderController::class, 'cancel'])->name('tenant.orders.cancel');
            Route::post('/{order}/refund', [OrderController::class, 'refund'])->name('tenant.orders.refund');
            
            // Order Filters
            Route::get('/status/{status}', [OrderController::class, 'byStatus'])->name('tenant.orders.by_status');
            Route::get('/customer/{customer}', [OrderController::class, 'byCustomer'])->name('tenant.orders.by_customer');
            Route::get('/recent', [OrderController::class, 'recent'])->name('tenant.orders.recent');
            Route::get('/export', [OrderController::class, 'export'])->name('tenant.orders.export');
        });
        
        // Vendor Management
        Route::prefix('vendors')->group(function () {
            Route::get('/', [VendorController::class, 'index'])->name('tenant.vendors.index');
            Route::post('/', [VendorController::class, 'store'])->name('tenant.vendors.store');
            Route::get('/{vendor}', [VendorController::class, 'show'])->name('tenant.vendors.show');
            Route::put('/{vendor}', [VendorController::class, 'update'])->name('tenant.vendors.update');
            Route::delete('/{vendor}', [VendorController::class, 'destroy'])->name('tenant.vendors.destroy');
            
            // Vendor Actions
            Route::post('/{vendor}/activate', [VendorController::class, 'activate'])->name('tenant.vendors.activate');
            Route::post('/{vendor}/deactivate', [VendorController::class, 'deactivate'])->name('tenant.vendors.deactivate');
            Route::get('/search', [VendorController::class, 'search'])->name('tenant.vendors.search');
        });
        
        // Analytics & Reports
        Route::prefix('analytics')->group(function () {
            Route::get('/overview', [AnalyticsController::class, 'overview'])->name('tenant.analytics.overview');
            Route::get('/sales', [AnalyticsController::class, 'sales'])->name('tenant.analytics.sales');
            Route::get('/customers', [AnalyticsController::class, 'customers'])->name('tenant.analytics.customers');
            Route::get('/products', [AnalyticsController::class, 'products'])->name('tenant.analytics.products');
            Route::get('/inventory', [AnalyticsController::class, 'inventory'])->name('tenant.analytics.inventory');
            
            // Reports
            Route::get('/reports/sales', [AnalyticsController::class, 'salesReport'])->name('tenant.analytics.sales_report');
            Route::get('/reports/customers', [AnalyticsController::class, 'customerReport'])->name('tenant.analytics.customer_report');
            Route::get('/reports/inventory', [AnalyticsController::class, 'inventoryReport'])->name('tenant.analytics.inventory_report');
            
            // Export Reports
            Route::get('/export/sales', [AnalyticsController::class, 'exportSales'])->name('tenant.analytics.export.sales');
            Route::get('/export/customers', [AnalyticsController::class, 'exportCustomers'])->name('tenant.analytics.export.customers');
            Route::get('/export/inventory', [AnalyticsController::class, 'exportInventory'])->name('tenant.analytics.export.inventory');
        });
        
        // Settings & Configuration
        Route::prefix('settings')->group(function () {
            Route::get('/profile', [SettingsController::class, 'profile'])->name('tenant.settings.profile');
            Route::put('/profile', [SettingsController::class, 'updateProfile'])->name('tenant.settings.update_profile');
            
            Route::get('/business', [SettingsController::class, 'business'])->name('tenant.settings.business');
            Route::put('/business', [SettingsController::class, 'updateBusiness'])->name('tenant.settings.update_business');
            
            Route::get('/domain', [SettingsController::class, 'domain'])->name('tenant.settings.domain');
            Route::post('/domain', [SettingsController::class, 'updateDomain'])->name('tenant.settings.update_domain');
            
            Route::get('/subscription', [SettingsController::class, 'subscription'])->name('tenant.settings.subscription');
            Route::get('/billing', [SettingsController::class, 'billing'])->name('tenant.settings.billing');
            
            Route::get('/integrations', [SettingsController::class, 'integrations'])->name('tenant.settings.integrations');
            Route::post('/integrations/{integration}', [SettingsController::class, 'updateIntegration'])->name('tenant.settings.update_integration');
        });
        
        // Platform Interaction (Limited)
        Route::prefix('platform')->group(function () {
            Route::get('/subscription', [SettingsController::class, 'platformSubscription'])->name('tenant.platform.subscription');
            Route::post('/support/ticket', [SettingsController::class, 'createSupportTicket'])->name('tenant.platform.support_ticket');
        });
    });