<?php

use Illuminate\Support\Facades\Route;
use App\Infrastructure\Presentation\Http\Controllers\Platform\TenantController;
use App\Infrastructure\Presentation\Http\Controllers\Platform\AnalyticsController;
use App\Infrastructure\Presentation\Http\Controllers\Platform\SubscriptionController;
use App\Infrastructure\Presentation\Http\Controllers\Platform\DomainController;
use App\Http\Controllers\Platform\ContentController;

/*
|--------------------------------------------------------------------------
| Platform Routes (Account A)
|--------------------------------------------------------------------------
|
| These routes are for platform administrators and owners.
| Account A users can manage tenants, subscriptions, and platform-level
| analytics but cannot access tenant business data.
|
*/

Route::prefix('platform')
    ->middleware(['auth:sanctum', 'platform.access'])
    ->group(function () {
        
        // Tenant Management
        Route::prefix('tenants')->group(function () {
            Route::get('/', [TenantController::class, 'index'])->name('platform.tenants.index');
            Route::post('/', [TenantController::class, 'store'])->name('platform.tenants.store');
            Route::get('/{tenant}', [TenantController::class, 'show'])->name('platform.tenants.show');
            Route::put('/{tenant}', [TenantController::class, 'update'])->name('platform.tenants.update');
            Route::delete('/{tenant}', [TenantController::class, 'destroy'])->name('platform.tenants.destroy');
            
            // Tenant Status Management
            Route::post('/{tenant}/activate', [TenantController::class, 'activate'])->name('platform.tenants.activate');
            Route::post('/{tenant}/suspend', [TenantController::class, 'suspend'])->name('platform.tenants.suspend');
            Route::post('/{tenant}/trial', [TenantController::class, 'startTrial'])->name('platform.tenants.trial');
            
            // Tenant Overview (Limited read-only access to tenant data)
            Route::get('/{tenant}/overview', [TenantController::class, 'overview'])->name('platform.tenants.overview');
            Route::get('/{tenant}/users/count', [TenantController::class, 'usersCount'])->name('platform.tenants.users.count');
            Route::get('/{tenant}/usage', [TenantController::class, 'usage'])->name('platform.tenants.usage');
        });
        
        // Subscription Management
        Route::prefix('subscriptions')->group(function () {
            Route::get('/', [SubscriptionController::class, 'index'])->name('platform.subscriptions.index');
            Route::post('/', [SubscriptionController::class, 'store'])->name('platform.subscriptions.store');
            Route::get('/{subscription}', [SubscriptionController::class, 'show'])->name('platform.subscriptions.show');
            Route::put('/{subscription}', [SubscriptionController::class, 'update'])->name('platform.subscriptions.update');
            
            // Subscription Actions
            Route::post('/{subscription}/activate', [SubscriptionController::class, 'activate'])->name('platform.subscriptions.activate');
            Route::post('/{subscription}/cancel', [SubscriptionController::class, 'cancel'])->name('platform.subscriptions.cancel');
            Route::post('/{subscription}/renew', [SubscriptionController::class, 'renew'])->name('platform.subscriptions.renew');
            
            // Billing
            Route::get('/{subscription}/billing', [SubscriptionController::class, 'billing'])->name('platform.subscriptions.billing');
            Route::post('/{subscription}/invoice', [SubscriptionController::class, 'generateInvoice'])->name('platform.subscriptions.invoice');
        });
        
        // Domain Management
        Route::prefix('domains')->group(function () {
            Route::get('/', [DomainController::class, 'index'])->name('platform.domains.index');
            Route::post('/verify', [DomainController::class, 'verify'])->name('platform.domains.verify');
            Route::get('/{domain}/status', [DomainController::class, 'status'])->name('platform.domains.status');
            Route::post('/{domain}/ssl', [DomainController::class, 'provisionSsl'])->name('platform.domains.ssl');
            
            // Domain Verification
            Route::get('/pending', [DomainController::class, 'pending'])->name('platform.domains.pending');
            Route::post('/{domain}/approve', [DomainController::class, 'approve'])->name('platform.domains.approve');
            Route::post('/{domain}/reject', [DomainController::class, 'reject'])->name('platform.domains.reject');
        });
        
        // Platform Analytics
        Route::prefix('analytics')->group(function () {
            Route::get('/overview', [AnalyticsController::class, 'overview'])->name('platform.analytics.overview');
            Route::get('/tenants', [AnalyticsController::class, 'tenants'])->name('platform.analytics.tenants');
            Route::get('/revenue', [AnalyticsController::class, 'revenue'])->name('platform.analytics.revenue');
            Route::get('/usage', [AnalyticsController::class, 'usage'])->name('platform.analytics.usage');
            Route::get('/growth', [AnalyticsController::class, 'growth'])->name('platform.analytics.growth');
            
            // Export Reports
            Route::get('/export/tenants', [AnalyticsController::class, 'exportTenants'])->name('platform.analytics.export.tenants');
            Route::get('/export/revenue', [AnalyticsController::class, 'exportRevenue'])->name('platform.analytics.export.revenue');
            Route::get('/export/usage', [AnalyticsController::class, 'exportUsage'])->name('platform.analytics.export.usage');
        });
        
        // Content Management
        Route::prefix('content')->group(function () {
            Route::get('/pages', [ContentController::class, 'index'])->name('platform.content.index');
            Route::get('/pages/published', [ContentController::class, 'published'])->name('platform.content.published');
            Route::post('/pages', [ContentController::class, 'store'])->name('platform.content.store');
            Route::get('/pages/{slug}', [ContentController::class, 'show'])->name('platform.content.show');
            Route::put('/pages/{slug}', [ContentController::class, 'update'])->name('platform.content.update');
            Route::delete('/pages/{slug}', [ContentController::class, 'destroy'])->name('platform.content.destroy');
            Route::patch('/pages/{slug}/publish', [ContentController::class, 'publish'])->name('platform.content.publish');
            Route::patch('/pages/{slug}/archive', [ContentController::class, 'archive'])->name('platform.content.archive');
            Route::patch('/pages/{slug}/content', [ContentController::class, 'updateContent'])->name('platform.content.update-content');
        });

        // System Management
        Route::prefix('system')->group(function () {
            Route::get('/health', function () {
                return response()->json(['status' => 'healthy', 'timestamp' => now()]);
            })->name('platform.system.health');
            
            Route::get('/stats', [AnalyticsController::class, 'systemStats'])->name('platform.system.stats');
            Route::get('/logs', [AnalyticsController::class, 'logs'])->name('platform.system.logs');
        });
    });