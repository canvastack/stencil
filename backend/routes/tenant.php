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
use App\Infrastructure\Presentation\Http\Controllers\Tenant\InventoryController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\QuoteController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\ActivityController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\NotificationController;
use App\Http\Controllers\Tenant\ContentController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\ProductFormConfigurationController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\ProductFormTemplateController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\MediaController;
use App\Http\Controllers\Api\Tenant\PluginMarketplaceController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\TenantUrlConfigurationController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\CustomDomainController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\UrlAnalyticsController;
use App\Http\Controllers\Api\V1\Admin\BusinessTypeController;

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
            
            // Customer Actions (must come before /{customer})
            Route::get('/stats', [CustomerController::class, 'stats'])->name('tenant.customers.stats');
            Route::get('/search', [CustomerController::class, 'search'])->name('tenant.customers.search');
            Route::get('/export', [CustomerController::class, 'export'])->name('tenant.customers.export');
            Route::get('/inactive', [CustomerController::class, 'inactive'])->name('tenant.customers.inactive');
            Route::get('/new', [CustomerController::class, 'create'])->name('tenant.customers.create');
            Route::get('/credit', [CustomerController::class, 'creditAnalysis'])->name('tenant.customers.credit');
            
            // Customer by ID (catch-all - must come last)
            Route::get('/{customer}', [CustomerController::class, 'show'])->name('tenant.customers.show');
            Route::put('/{customer}', [CustomerController::class, 'update'])->name('tenant.customers.update');
            Route::delete('/{customer}', [CustomerController::class, 'destroy'])->name('tenant.customers.destroy');
            Route::get('/{customer}/orders', [CustomerController::class, 'orders'])->name('tenant.customers.orders');
            Route::get('/{customer}/segment', [CustomerController::class, 'getSegment'])->name('tenant.customers.segment');
            Route::get('/{customer}/payment-history', [CustomerController::class, 'paymentHistory'])->name('tenant.customers.payment_history');
            
            // Customer Tags
            Route::post('/{customer}/tags', [CustomerController::class, 'addTag'])->name('tenant.customers.add_tag');
            Route::delete('/{customer}/tags/{tag}', [CustomerController::class, 'removeTag'])->name('tenant.customers.remove_tag');
        });
        
        // Product Management
        Route::prefix('products')->group(function () {
            Route::get('/', [ProductController::class, 'index'])->name('tenant.products.index');
            Route::post('/', [ProductController::class, 'store'])->name('tenant.products.store');
            
            // Product Actions (must come before /{product})
            Route::get('/categories', [ProductController::class, 'categories'])->name('tenant.products.categories');
            Route::get('/tags', [ProductController::class, 'tags'])->name('tenant.products.tags');
            Route::get('/inventory/low-stock', [ProductController::class, 'lowStock'])->name('tenant.products.low_stock');
            Route::get('/inventory/out-of-stock', [ProductController::class, 'outOfStock'])->name('tenant.products.out_of_stock');
            Route::get('/search', [ProductController::class, 'search'])->name('tenant.products.search');
            
            // Bulk Operations (must come before /{product})
            Route::post('/bulk-update', [ProductController::class, 'bulkUpdate'])->name('tenant.products.bulk_update');
            Route::post('/reorder', [ProductController::class, 'reorder'])->name('tenant.products.reorder');
            
            // Product Variants (must come before /{product})
            Route::get('/{product}/variants', [ProductController::class, 'getVariants'])->name('tenant.products.variants.index');
            Route::post('/{product}/variants', [ProductController::class, 'createVariant'])->name('tenant.products.variants.store');
            Route::get('/{product}/variants/{variant}', [ProductController::class, 'getVariant'])->name('tenant.products.variants.show');
            Route::put('/{product}/variants/{variant}', [ProductController::class, 'updateVariant'])->name('tenant.products.variants.update');
            Route::delete('/{product}/variants/{variant}', [ProductController::class, 'deleteVariant'])->name('tenant.products.variants.destroy');
            
            // Product by slug (must come before /{product})
            Route::get('/slug/{slug}', [ProductController::class, 'showBySlug'])->name('tenant.products.show_by_slug');
            
            // Product by ID (catch-all - must come last)
            Route::get('/{product}', [ProductController::class, 'show'])->name('tenant.products.show');
            Route::put('/{product}', [ProductController::class, 'update'])->name('tenant.products.update');
            Route::delete('/{product}', [ProductController::class, 'destroy'])->name('tenant.products.destroy');
            Route::post('/{product}/publish', [ProductController::class, 'publish'])->name('tenant.products.publish');
            Route::post('/{product}/unpublish', [ProductController::class, 'unpublish'])->name('tenant.products.unpublish');
            Route::put('/{product}/stock', [ProductController::class, 'updateStock'])->name('tenant.products.update_stock');
            Route::post('/{product}/duplicate', [ProductController::class, 'duplicate'])->name('tenant.products.duplicate');
            
            // Product Form Configuration Management (must come before generic /{product})
            Route::get('/{product}/form-configuration', [ProductFormConfigurationController::class, 'show'])->name('tenant.products.form_configuration.show');
            Route::post('/{product}/form-configuration', [ProductFormConfigurationController::class, 'store'])->name('tenant.products.form_configuration.store');
            Route::put('/{product}/form-configuration', [ProductFormConfigurationController::class, 'update'])->name('tenant.products.form_configuration.update');
            Route::delete('/{product}/form-configuration', [ProductFormConfigurationController::class, 'destroy'])->name('tenant.products.form_configuration.destroy');
            Route::post('/{product}/form-configuration/duplicate', [ProductFormConfigurationController::class, 'duplicate'])->name('tenant.products.form_configuration.duplicate');
        });
        
        // Product Form Templates Management
        Route::prefix('form-templates')->group(function () {
            Route::get('/', [ProductFormTemplateController::class, 'index'])->name('tenant.form_templates.index');
            Route::post('/', [ProductFormTemplateController::class, 'store'])->name('tenant.form_templates.store');
            Route::get('/{template}', [ProductFormTemplateController::class, 'show'])->name('tenant.form_templates.show');
            Route::put('/{template}', [ProductFormTemplateController::class, 'update'])->name('tenant.form_templates.update');
            Route::delete('/{template}', [ProductFormTemplateController::class, 'destroy'])->name('tenant.form_templates.destroy');
            Route::post('/{template}/apply', [ProductFormTemplateController::class, 'apply'])->name('tenant.form_templates.apply');
        });
        
        // Product Category Management
        Route::prefix('product-categories')->group(function () {
            Route::get('/', [ProductCategoryController::class, 'index'])->name('tenant.product_categories.index');
            Route::post('/', [ProductCategoryController::class, 'store'])->name('tenant.product_categories.store');
            
            // Category Hierarchy & Structure (must come before /{category})
            Route::get('/tree/hierarchy', [ProductCategoryController::class, 'tree'])->name('tenant.product_categories.tree');
            Route::post('/reorder', [ProductCategoryController::class, 'reorder'])->name('tenant.product_categories.reorder');
            
            // Category by ID (catch-all - must come last)
            Route::get('/{category}', [ProductCategoryController::class, 'show'])->name('tenant.product_categories.show');
            Route::put('/{category}', [ProductCategoryController::class, 'update'])->name('tenant.product_categories.update');
            Route::delete('/{category}', [ProductCategoryController::class, 'destroy'])->name('tenant.product_categories.destroy');
            Route::get('/{category}/products', [ProductCategoryController::class, 'products'])->name('tenant.product_categories.products');
        });
        
        // Business Types Management
        Route::prefix('business-types')->group(function () {
            Route::get('/', [BusinessTypeController::class, 'index'])->name('tenant.business_types.index');
        });
        
        // Inventory Management
        Route::prefix('inventory')->group(function () {
            Route::get('/items', [InventoryController::class, 'index'])->name('tenant.inventory.items.index');
            Route::get('/items/{item}', [InventoryController::class, 'show'])->name('tenant.inventory.items.show');
            Route::get('/locations', [InventoryController::class, 'locations'])->name('tenant.inventory.locations.index');
            Route::post('/locations', [InventoryController::class, 'storeLocation'])->name('tenant.inventory.locations.store');
            Route::put('/locations/{location}', [InventoryController::class, 'updateLocation'])->name('tenant.inventory.locations.update');
            Route::post('/items/{product}/locations/{location}/stock', [InventoryController::class, 'setLocationStock'])->name('tenant.inventory.locations.set_stock');
            Route::post('/items/{product}/locations/{location}/adjust', [InventoryController::class, 'adjustLocationStock'])->name('tenant.inventory.locations.adjust_stock');
            Route::post('/items/{product}/transfer', [InventoryController::class, 'transferStock'])->name('tenant.inventory.items.transfer');
            Route::post('/items/{product}/reserve', [InventoryController::class, 'reserveStock'])->name('tenant.inventory.items.reserve');
            Route::post('/reservations/{reservation}/release', [InventoryController::class, 'releaseReservation'])->name('tenant.inventory.reservations.release');
            Route::get('/reservations', [InventoryController::class, 'reservations'])->name('tenant.inventory.reservations.index');
            Route::get('/reconciliations', [InventoryController::class, 'reconciliations'])->name('tenant.inventory.reconciliations.index');
            Route::post('/reconciliations/run', [InventoryController::class, 'runReconciliation'])->name('tenant.inventory.reconciliations.run');
        });
        
        // Order Management
        Route::prefix('orders')->group(function () {
            Route::get('/', [OrderController::class, 'index'])->name('tenant.orders.index');
            Route::post('/', [OrderController::class, 'store'])->name('tenant.orders.store');
            
            // Order Filters (must come before /{order})
            Route::get('/status/{status}', [OrderController::class, 'byStatus'])->name('tenant.orders.by_status');
            Route::get('/customer/{customer}', [OrderController::class, 'byCustomer'])->name('tenant.orders.by_customer');
            Route::get('/recent', [OrderController::class, 'recent'])->name('tenant.orders.recent');
            Route::get('/export', [OrderController::class, 'export'])->name('tenant.orders.export');
            
            // Order by ID (catch-all - must come last)
            Route::get('/{order}', [OrderController::class, 'show'])->name('tenant.orders.show');
            Route::put('/{order}', [OrderController::class, 'update'])->name('tenant.orders.update');
            Route::delete('/{order}', [OrderController::class, 'destroy'])->name('tenant.orders.destroy');
            Route::put('/{order}/status', [OrderController::class, 'updateStatus'])->name('tenant.orders.update_status');
            Route::post('/{order}/process', [OrderController::class, 'process'])->name('tenant.orders.process');
            Route::post('/{order}/approve', [OrderController::class, 'approve'])->name('tenant.orders.approve');
            Route::post('/{order}/ship', [OrderController::class, 'ship'])->name('tenant.orders.ship');
            Route::post('/{order}/complete', [OrderController::class, 'complete'])->name('tenant.orders.complete');
            Route::post('/{order}/cancel', [OrderController::class, 'cancel'])->name('tenant.orders.cancel');
            Route::post('/{order}/refund', [OrderController::class, 'refund'])->name('tenant.orders.refund');
            
            // Phase 4C: Business Workflow Routes (Hexagonal Architecture)
            Route::post('/{order}/assign-vendor', [OrderController::class, 'assignVendor'])->name('tenant.orders.assign_vendor');
            Route::post('/{order}/negotiate-vendor', [OrderController::class, 'negotiateVendor'])->name('tenant.orders.negotiate_vendor');
            
            Route::get('/{order}/available-transitions', [OrderController::class, 'availableTransitions'])->name('tenant.orders.available_transitions');
            Route::get('/{order}/quotations', [OrderController::class, 'quotations'])->name('tenant.orders.quotations');
        });
        
        // Vendor Management
        Route::prefix('vendors')->group(function () {
            Route::get('/', [VendorController::class, 'index'])->name('tenant.vendors.index');
            Route::post('/', [VendorController::class, 'store'])->name('tenant.vendors.store');
            
            // Vendor Actions (must come before /{vendor})
            Route::get('/search', [VendorController::class, 'search'])->name('tenant.vendors.search');
            Route::get('/export', [VendorController::class, 'export'])->name('tenant.vendors.export');
            
            // Vendor by ID (catch-all - must come last)
            Route::get('/{vendor}', [VendorController::class, 'show'])->name('tenant.vendors.show');
            Route::put('/{vendor}', [VendorController::class, 'update'])->name('tenant.vendors.update');
            Route::delete('/{vendor}', [VendorController::class, 'destroy'])->name('tenant.vendors.destroy');
            Route::post('/{vendor}/activate', [VendorController::class, 'activate'])->name('tenant.vendors.activate');
            Route::post('/{vendor}/deactivate', [VendorController::class, 'deactivate'])->name('tenant.vendors.deactivate');
            
            // Vendor Evaluations
            Route::get('/{vendor}/evaluations', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorEvaluationController::class, 'index'])->name('tenant.vendors.evaluations.index');
            Route::post('/{vendor}/evaluations', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorEvaluationController::class, 'store'])->name('tenant.vendors.evaluations.store');
            
            // Vendor Specializations
            Route::get('/{vendor}/specializations', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorSpecializationController::class, 'index'])->name('tenant.vendors.specializations.index');
            Route::post('/{vendor}/specializations', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorSpecializationController::class, 'store'])->name('tenant.vendors.specializations.store');
            Route::put('/{vendor}/specializations/{specialization}', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorSpecializationController::class, 'update'])->name('tenant.vendors.specializations.update');
            Route::delete('/{vendor}/specializations/{specialization}', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorSpecializationController::class, 'destroy'])->name('tenant.vendors.specializations.destroy');
            
            // Vendor Orders
            Route::get('/{vendor}/orders', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorOrderController::class, 'index'])->name('tenant.vendors.orders.index');
            Route::get('/{vendor}/orders/{order}', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorOrderController::class, 'show'])->name('tenant.vendors.orders.show');
        });
        
        // Vendor Performance Routes
        Route::prefix('vendor-performance')->group(function () {
            Route::get('/metrics', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorPerformanceController::class, 'getMetrics'])->name('tenant.vendor_performance.metrics');
            Route::get('/rankings', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorPerformanceController::class, 'getRankings'])->name('tenant.vendor_performance.rankings');
            Route::get('/delivery-metrics', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorPerformanceController::class, 'getDeliveryMetrics'])->name('tenant.vendor_performance.delivery_metrics');
            Route::get('/quality-metrics', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorPerformanceController::class, 'getQualityMetrics'])->name('tenant.vendor_performance.quality_metrics');
            Route::get('/{vendor}/advanced', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorPerformanceController::class, 'getAdvancedMetrics'])->name('tenant.vendor_performance.advanced');
            Route::get('/{vendor}/trends', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorPerformanceController::class, 'getTrendAnalysis'])->name('tenant.vendor_performance.trends');
        });
        
        // Vendor Sourcing Routes
        Route::prefix('vendor-sourcing')->group(function () {
            Route::get('/', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorSourcingController::class, 'index'])->name('tenant.vendor_sourcing.index');
            Route::post('/', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorSourcingController::class, 'store'])->name('tenant.vendor_sourcing.store');
            Route::get('/quotes', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorSourcingController::class, 'getQuotes'])->name('tenant.vendor_sourcing.quotes');
            Route::post('/{sourcing}/quotes', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorSourcingController::class, 'submitQuote'])->name('tenant.vendor_sourcing.submit_quote');
            Route::post('/{sourcing}/quotes/{quote}/accept', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorSourcingController::class, 'acceptQuote'])->name('tenant.vendor_sourcing.accept_quote');
        });
        
        // Vendor Payments Routes
        Route::prefix('vendor-payments')->group(function () {
            Route::get('/', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorPaymentController::class, 'index'])->name('tenant.vendor_payments.index');
            Route::post('/', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorPaymentController::class, 'store'])->name('tenant.vendor_payments.store');
            Route::get('/stats', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorPaymentController::class, 'getStats'])->name('tenant.vendor_payments.stats');
            Route::post('/{payment}/process', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorPaymentController::class, 'process'])->name('tenant.vendor_payments.process');
            Route::post('/{payment}/disburse', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorPaymentController::class, 'disburse'])->name('tenant.vendor_payments.disburse');
            Route::post('/{payment}/mark-overdue', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorPaymentController::class, 'markOverdue'])->name('tenant.vendor_payments.mark_overdue');
        });
        
        // Vendor Matching and Business Integration Routes
        Route::prefix('orders/{order}')->group(function () {
            Route::get('/vendor-matches', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorMatchingController::class, 'getMatches'])->name('tenant.orders.vendor_matches');
            Route::post('/assign-vendor', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorMatchingController::class, 'assignVendor'])->name('tenant.orders.assign_vendor');
            Route::post('/negotiations', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorNegotiationController::class, 'start'])->name('tenant.orders.start_negotiation');
        });
        
        // Vendor Negotiations Routes
        Route::prefix('vendor-negotiations')->group(function () {
            Route::get('/', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorNegotiationController::class, 'index'])->name('tenant.vendor_negotiations.index');
            Route::post('/', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorNegotiationController::class, 'store'])->name('tenant.vendor_negotiations.store');
            Route::get('/{negotiation}', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorNegotiationController::class, 'show'])->name('tenant.vendor_negotiations.show');
            Route::post('/{negotiation}/counter', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorNegotiationController::class, 'addCounterOffer'])->name('tenant.vendor_negotiations.counter');
            Route::post('/{negotiation}/approve', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorNegotiationController::class, 'approve'])->name('tenant.vendor_negotiations.approve');
            Route::post('/{negotiation}/reject', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorNegotiationController::class, 'reject'])->name('tenant.vendor_negotiations.reject');
        });
        
        // Vendor Financial Management Routes
        Route::prefix('vendor-financial')->group(function () {
            Route::get('/overview', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorFinancialController::class, 'getFinancialOverview'])->name('tenant.vendor_financial.overview');
            Route::get('/cash-flow', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorFinancialController::class, 'getCashFlowAnalysis'])->name('tenant.vendor_financial.cash_flow');
            Route::get('/profitability', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorFinancialController::class, 'getVendorProfitability'])->name('tenant.vendor_financial.profitability');
            Route::get('/payment-schedule', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorFinancialController::class, 'getPaymentSchedule'])->name('tenant.vendor_financial.payment_schedule');
            Route::post('/orders/{order}/payment-plan', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorFinancialController::class, 'createPaymentPlan'])->name('tenant.vendor_financial.create_payment_plan');
            Route::post('/payments/{payment}/disburse', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorFinancialController::class, 'processDisbursement'])->name('tenant.vendor_financial.process_disbursement');
        });
        
        // Vendor Analytics and Intelligence Routes
        Route::prefix('vendor-analytics')->group(function () {
            Route::get('/dashboard', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorAnalyticsController::class, 'getDashboard'])->name('tenant.vendor_analytics.dashboard');
            Route::get('/performance-heatmap', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorAnalyticsController::class, 'getPerformanceHeatmap'])->name('tenant.vendor_analytics.heatmap');
            Route::get('/risk-analysis', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorAnalyticsController::class, 'getRiskAnalysis'])->name('tenant.vendor_analytics.risk');
            Route::post('/recommendations', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorAnalyticsController::class, 'getRecommendations'])->name('tenant.vendor_analytics.recommendations');
            Route::get('/performance-trends', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorAnalyticsController::class, 'getPerformanceTrends'])->name('tenant.vendor_analytics.trends');
            Route::post('/compare', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorAnalyticsController::class, 'getVendorComparison'])->name('tenant.vendor_analytics.compare');
            Route::get('/real-time-kpis', [\App\Infrastructure\Presentation\Http\Controllers\Tenant\VendorAnalyticsController::class, 'getRealTimeKPIs'])->name('tenant.vendor_analytics.real_time_kpis');
        });
        
        // Analytics & Reports
        Route::prefix('analytics')->group(function () {
            Route::get('/overview', [AnalyticsController::class, 'overview'])->name('tenant.analytics.overview');
            Route::get('/sales', [AnalyticsController::class, 'sales'])->name('tenant.analytics.sales');
            Route::get('/customers', [AnalyticsController::class, 'customers'])->name('tenant.analytics.customers');
            Route::get('/customers/segmentation', [AnalyticsController::class, 'customerSegmentation'])->name('tenant.analytics.customers.segmentation');
            Route::get('/vendors', [AnalyticsController::class, 'vendors'])->name('tenant.analytics.vendors');
            Route::get('/products', [AnalyticsController::class, 'products'])->name('tenant.analytics.products');
            Route::get('/products/overview', [AnalyticsController::class, 'productsOverview'])->name('tenant.analytics.products.overview');
            Route::get('/products/performance', [AnalyticsController::class, 'productsPerformance'])->name('tenant.analytics.products.performance');
            Route::get('/products/inventory', [AnalyticsController::class, 'productsInventory'])->name('tenant.analytics.products.inventory');
            Route::get('/products/revenue-by-category', [AnalyticsController::class, 'revenueByCategory'])->name('tenant.analytics.products.revenue_by_category');
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
            
            Route::get('/vendor', [SettingsController::class, 'getVendorSettings'])->name('tenant.settings.vendor');
            Route::put('/vendor', [SettingsController::class, 'updateVendorSettings'])->name('tenant.settings.update_vendor');
        });

        // Media Management
        Route::prefix('media')->group(function () {
            Route::post('/upload', [MediaController::class, 'upload'])->name('tenant.media.upload');
            Route::post('/delete', [MediaController::class, 'delete'])->name('tenant.media.delete');
        });

        // Quote Management (Vendor Negotiations)
        Route::prefix('quotes')->group(function () {
            Route::get('/', [QuoteController::class, 'index'])->name('tenant.quotes.index');
            Route::post('/', [QuoteController::class, 'store'])->name('tenant.quotes.store');
            
            // Quote Statistics & Reports (must come before /{quote})
            Route::get('/statistics', [QuoteController::class, 'statistics'])->name('tenant.quotes.statistics');
            Route::get('/stats', [QuoteController::class, 'statistics'])->name('tenant.quotes.stats'); // Add stats alias
            Route::get('/export', [QuoteController::class, 'export'])->name('tenant.quotes.export');
            
            // Quote by ID (catch-all - must come last)
            Route::get('/{quote}', [QuoteController::class, 'show'])->name('tenant.quotes.show');
            Route::put('/{quote}', [QuoteController::class, 'update'])->name('tenant.quotes.update');
            Route::delete('/{quote}', [QuoteController::class, 'destroy'])->name('tenant.quotes.destroy');
            
            // Quote Actions
            Route::post('/{quote}/accept', [QuoteController::class, 'accept'])->name('tenant.quotes.accept');
            Route::post('/{quote}/reject', [QuoteController::class, 'reject'])->name('tenant.quotes.reject');
            Route::post('/{quote}/counter', [QuoteController::class, 'counter'])->name('tenant.quotes.counter');
            Route::get('/{quote}/pdf', [QuoteController::class, 'pdf'])->name('tenant.quotes.pdf');
        });

        // Content Management
        Route::prefix('content')->group(function () {
            Route::get('/pages', [ContentController::class, 'index'])->name('tenant.content.index');
            Route::get('/pages/published', [ContentController::class, 'published'])->name('tenant.content.published');
            Route::post('/pages', [ContentController::class, 'store'])->name('tenant.content.store');
            Route::get('/pages/{slug}', [ContentController::class, 'show'])->name('tenant.content.show');
            Route::put('/pages/{slug}', [ContentController::class, 'update'])->name('tenant.content.update');
            Route::delete('/pages/{slug}', [ContentController::class, 'destroy'])->name('tenant.content.destroy');
            Route::patch('/pages/{slug}/publish', [ContentController::class, 'publish'])->name('tenant.content.publish');
            Route::patch('/pages/{slug}/archive', [ContentController::class, 'archive'])->name('tenant.content.archive');
            Route::patch('/pages/{slug}/content', [ContentController::class, 'updateContent'])->name('tenant.content.update-content');
            
            // Navigation Management (Header, Footer, Menus)
            Route::prefix('navigation')->group(function () {
                // Header Configuration
                Route::get('/header', [\App\Http\Controllers\Api\V1\Tenant\Navigation\HeaderConfigController::class, 'index'])->name('tenant.navigation.header.index');
                Route::post('/header', [\App\Http\Controllers\Api\V1\Tenant\Navigation\HeaderConfigController::class, 'store'])->name('tenant.navigation.header.store');
                Route::put('/header', [\App\Http\Controllers\Api\V1\Tenant\Navigation\HeaderConfigController::class, 'update'])->name('tenant.navigation.header.update');
                
                // Footer Configuration
                Route::get('/footer', [\App\Http\Controllers\Api\V1\Tenant\Navigation\FooterConfigController::class, 'index'])->name('tenant.navigation.footer.index');
                Route::post('/footer', [\App\Http\Controllers\Api\V1\Tenant\Navigation\FooterConfigController::class, 'store'])->name('tenant.navigation.footer.store');
                Route::put('/footer', [\App\Http\Controllers\Api\V1\Tenant\Navigation\FooterConfigController::class, 'update'])->name('tenant.navigation.footer.update');
                
                // Menu Management
                Route::prefix('menus')->group(function () {
                    Route::get('/', [\App\Http\Controllers\Api\V1\Tenant\Navigation\MenuController::class, 'index'])->name('tenant.navigation.menus.index');
                    Route::post('/', [\App\Http\Controllers\Api\V1\Tenant\Navigation\MenuController::class, 'store'])->name('tenant.navigation.menus.store');
                    Route::get('/{uuid}', [\App\Http\Controllers\Api\V1\Tenant\Navigation\MenuController::class, 'show'])->name('tenant.navigation.menus.show');
                    Route::put('/{uuid}', [\App\Http\Controllers\Api\V1\Tenant\Navigation\MenuController::class, 'update'])->name('tenant.navigation.menus.update');
                    Route::delete('/{uuid}', [\App\Http\Controllers\Api\V1\Tenant\Navigation\MenuController::class, 'destroy'])->name('tenant.navigation.menus.destroy');
                    Route::post('/reorder', [\App\Http\Controllers\Api\V1\Tenant\Navigation\MenuController::class, 'reorder'])->name('tenant.navigation.menus.reorder');
                    Route::post('/{uuid}/restore', [\App\Http\Controllers\Api\V1\Tenant\Navigation\MenuController::class, 'restore'])->name('tenant.navigation.menus.restore');
                });
            });
        });
        
        // Activity Logs
        Route::prefix('activity-logs')->group(function () {
            Route::post('/batch', [ActivityController::class, 'batchStore'])->name('tenant.activity_logs.batch');
            Route::get('/', [ActivityController::class, 'index'])->name('tenant.activity_logs.index');
            Route::get('/statistics', [ActivityController::class, 'statistics'])->name('tenant.activity_logs.statistics');
        });
        
        // Notifications
        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index'])->name('tenant.notifications.index');
            Route::post('/', [NotificationController::class, 'store'])->name('tenant.notifications.store');
            Route::get('/preferences', [NotificationController::class, 'preferences'])->name('tenant.notifications.preferences');
            Route::put('/preferences', [NotificationController::class, 'updatePreferences'])->name('tenant.notifications.update_preferences');
            Route::get('/unread-count', [NotificationController::class, 'unreadCount'])->name('tenant.notifications.unread_count');
            Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('tenant.notifications.mark_all_read');
            Route::post('/{notification}/read', [NotificationController::class, 'markAsRead'])->name('tenant.notifications.mark_read');
        });
        
        // Platform Interaction (Limited)
        Route::prefix('platform')->group(function () {
            Route::get('/subscription', [SettingsController::class, 'platformSubscription'])->name('tenant.platform.subscription');
            Route::post('/support/ticket', [SettingsController::class, 'createSupportTicket'])->name('tenant.platform.support_ticket');
        });
        
        // Plugin Marketplace
        Route::prefix('plugins')->group(function () {
            Route::get('/marketplace', [PluginMarketplaceController::class, 'marketplace'])->name('tenant.plugins.marketplace');
            Route::get('/marketplace/{pluginName}', [PluginMarketplaceController::class, 'show'])->name('tenant.plugins.show');
            Route::post('/request', [PluginMarketplaceController::class, 'request'])->name('tenant.plugins.request');
            Route::get('/installed', [PluginMarketplaceController::class, 'installed'])->name('tenant.plugins.installed');
            Route::get('/installed/{uuid}', [PluginMarketplaceController::class, 'installedDetail'])->name('tenant.plugins.installed.detail');
            Route::put('/installed/{uuid}/settings', [PluginMarketplaceController::class, 'updateSettings'])->name('tenant.plugins.update_settings');
            Route::delete('/uninstall/{uuid}', [PluginMarketplaceController::class, 'uninstall'])->name('tenant.plugins.uninstall');
        });
        
        // URL Configuration
        Route::prefix('url-configuration')->group(function () {
            Route::get('/', [TenantUrlConfigurationController::class, 'show'])->name('tenant.url_configuration.show');
            Route::patch('/', [TenantUrlConfigurationController::class, 'update'])->name('tenant.url_configuration.update');
            Route::post('/test', [TenantUrlConfigurationController::class, 'test'])->name('tenant.url_configuration.test');
        });
        
        // Custom Domain Management
        Route::prefix('custom-domains')->group(function () {
            Route::get('/', [CustomDomainController::class, 'index'])->name('tenant.custom_domains.index');
            Route::post('/', [CustomDomainController::class, 'store'])->name('tenant.custom_domains.store');
            Route::get('/{domain}', [CustomDomainController::class, 'show'])->name('tenant.custom_domains.show');
            Route::patch('/{domain}', [CustomDomainController::class, 'update'])->name('tenant.custom_domains.update');
            Route::delete('/{domain}', [CustomDomainController::class, 'destroy'])->name('tenant.custom_domains.destroy');
            Route::get('/{domain}/verification-instructions', [CustomDomainController::class, 'verificationInstructions'])->name('tenant.custom_domains.verification_instructions');
            Route::get('/{domain}/dns-instructions', [CustomDomainController::class, 'verificationInstructions'])->name('tenant.custom_domains.dns_instructions');
            Route::post('/{domain}/verify', [CustomDomainController::class, 'verify'])->name('tenant.custom_domains.verify');
            Route::patch('/{domain}/set-primary', [CustomDomainController::class, 'setPrimary'])->name('tenant.custom_domains.set_primary');
            Route::get('/{domain}/ssl-certificate', [CustomDomainController::class, 'sslCertificate'])->name('tenant.custom_domains.ssl_certificate');
            Route::post('/{domain}/renew-ssl', [CustomDomainController::class, 'renewSsl'])->name('tenant.custom_domains.renew_ssl');
            Route::get('/{domain}/verification-logs', [CustomDomainController::class, 'verificationLogs'])->name('tenant.custom_domains.verification_logs');
        });

        // URL Access Analytics
        Route::prefix('url-analytics')->group(function () {
            Route::get('/overview', [UrlAnalyticsController::class, 'overview'])->name('tenant.url_analytics.overview');
            Route::get('/trends', [UrlAnalyticsController::class, 'trends'])->name('tenant.url_analytics.trends');
            Route::get('/geographic', [UrlAnalyticsController::class, 'geographic'])->name('tenant.url_analytics.geographic');
            Route::get('/performance', [UrlAnalyticsController::class, 'urlConfigPerformance'])->name('tenant.url_analytics.performance');
            Route::get('/url-config-performance', [UrlAnalyticsController::class, 'urlConfigPerformance'])->name('tenant.url_analytics.url_config_performance');
            Route::get('/referrers', [UrlAnalyticsController::class, 'referrers'])->name('tenant.url_analytics.referrers');
            Route::get('/devices', [UrlAnalyticsController::class, 'devices'])->name('tenant.url_analytics.devices');
        });
    });