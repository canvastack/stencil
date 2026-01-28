<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Multi-tenant API routes for the CanvaStack Stencil platform.
| Routes are organized by account type:
| - Account A (Platform): Platform management, tenant oversight, analytics
| - Account B (Tenant): Business operations, customer/product management
|
*/

// TEST: Debug permissions endpoint
Route::middleware(['auth:sanctum', 'tenant.context'])->get('/test-permissions-debug', function() {
    $user = auth()->user();
    $allPerms = $user->getAllPermissions();
    $samplePerms = is_array($allPerms) 
        ? array_slice(array_column($allPerms, 'name'), 0, 5) 
        : $allPerms->take(5)->pluck('name')->toArray();
    
    return response()->json([
        'user_id' => $user->id,
        'user_email' => $user->email,
        'tenant_id' => $user->tenant_id ?? null,
        'team_id_global' => getPermissionsTeamId(),
        'permissions_count' => count($allPerms),
        'sample_perms' => $samplePerms,
        'can_pages_content_types_view' => $user->can('pages:content-types:view'),
        'has_permission_to_method' => $user->hasPermissionTo('pages:content-types:view', 'api'),
    ]);
});

// Authentication Routes (without tenant middleware)
Route::prefix('auth')->group(function () {
    Route::post('/register', [App\Http\Controllers\Auth\TenantAuthController::class, 'register']);
    Route::post('/login', [App\Http\Controllers\Auth\TenantAuthController::class, 'login']);
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [App\Http\Controllers\Auth\TenantAuthController::class, 'logout']);
        Route::get('/me', [App\Http\Controllers\Auth\TenantAuthController::class, 'me']);
    });
});

// Legacy user info endpoint
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    $user = $request->user();
    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'account_type' => $user instanceof \App\Infrastructure\Persistence\Eloquent\AccountEloquentModel ? 'platform' : 'tenant',
        'tenant_id' => $user->tenant_id ?? null,
    ]);
});

// Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now(),
        'version' => '1.0.0',
        'environment' => app()->environment()
    ]);
});

// Authentication Routes (Both Account A & B)
require __DIR__.'/auth.php';

// Platform Routes (Account A)
require __DIR__.'/platform.php';

// Tenant Routes (Account B)
Route::prefix('tenant')->group(function () {
    require __DIR__.'/tenant.php';
    

    // Refund Management API Routes  
    Route::prefix('refunds')->middleware(['auth:sanctum', 'tenant.context', 'tenant.scoped'])->group(function () {
        Route::get('/', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'index']);
        Route::post('/', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'store']);
        Route::get('/statistics', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'statistics']);
        Route::get('/{requestNumber}', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'show']);
        Route::put('/{requestNumber}', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'update']);
        Route::post('/{requestNumber}/approve', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'approve']);
        Route::get('/{requestNumber}/approvals', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'approvals']);
        
        // Gateway Integration Routes
        Route::post('/{requestNumber}/process', [App\Http\Controllers\RefundController::class, 'processRefund']);
        Route::post('/{requestNumber}/retry', [App\Http\Controllers\RefundController::class, 'retryRefund']);
        Route::get('/{requestNumber}/gateway-status', [App\Http\Controllers\RefundController::class, 'checkGatewayStatus']);
        Route::post('/{requestNumber}/manual-process', [App\Http\Controllers\RefundController::class, 'processManualRefund']);
        
        // Bulk Operations
        Route::post('/bulk-process', [App\Http\Controllers\RefundController::class, 'bulkProcess']);
        
        // Insurance Fund Routes
        Route::prefix('insurance-fund')->group(function () {
            Route::get('/balance', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'getInsuranceFundBalance']);
            Route::get('/transactions', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'getInsuranceFundTransactions']);
            Route::get('/analytics', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'getInsuranceFundAnalytics']);
        });
        
        // Workflow Management
        Route::get('/pending-workflows', [App\Http\Controllers\RefundController::class, 'pendingWorkflows']);
        Route::get('/{requestNumber}/workflow-history', [App\Http\Controllers\RefundController::class, 'workflowHistory']);
        
        // Dispute Management Routes
        Route::prefix('disputes')->group(function () {
            Route::get('/', [App\Http\Controllers\RefundDisputeController::class, 'index']);
            Route::post('/', [App\Http\Controllers\RefundDisputeController::class, 'store']);
            Route::get('/requires-attention', [App\Http\Controllers\RefundDisputeController::class, 'requiresAttention']);
            Route::get('/statistics', [App\Http\Controllers\RefundDisputeController::class, 'statistics']);
            Route::get('/{dispute}', [App\Http\Controllers\RefundDisputeController::class, 'show']);
            Route::post('/{dispute}/response', [App\Http\Controllers\RefundDisputeController::class, 'addResponse']);
            Route::post('/{dispute}/resolve', [App\Http\Controllers\RefundDisputeController::class, 'resolve']);
            Route::post('/{dispute}/escalate', [App\Http\Controllers\RefundDisputeController::class, 'escalate']);
            Route::get('/{dispute}/recommendation', [App\Http\Controllers\RefundDisputeController::class, 'recommendation']);
        });
    
        
        // Vendor Liability Management Routes
        Route::prefix('vendor-liabilities')->group(function () {
            Route::get('/', [App\Http\Controllers\VendorLiabilityController::class, 'index']);
            Route::post('/from-refund', [App\Http\Controllers\VendorLiabilityController::class, 'createFromRefund'])->name('vendor-liabilities.create-from-refund');
            Route::post('/standalone', [App\Http\Controllers\VendorLiabilityController::class, 'createStandalone']);
            Route::get('/requires-attention', [App\Http\Controllers\VendorLiabilityController::class, 'requiresAttention']);
            Route::get('/statistics', [App\Http\Controllers\VendorLiabilityController::class, 'statistics']);
            Route::get('/vendor-performance', [App\Http\Controllers\VendorLiabilityController::class, 'vendorPerformance']);
            Route::get('/vendor-recommendations', [App\Http\Controllers\VendorLiabilityController::class, 'vendorRecommendations']);
            Route::get('/{liability}', [App\Http\Controllers\VendorLiabilityController::class, 'show']);
            Route::post('/{liability}/file-claim', [App\Http\Controllers\VendorLiabilityController::class, 'fileClaim']);
            Route::post('/{liability}/record-recovery', [App\Http\Controllers\VendorLiabilityController::class, 'recordRecovery']);
            Route::post('/{liability}/mark-disputed', [App\Http\Controllers\VendorLiabilityController::class, 'markAsDisputed']);
            Route::post('/{liability}/write-off', [App\Http\Controllers\VendorLiabilityController::class, 'writeOff']);
        });
    });
    
    // Insurance Fund Management Routes
    Route::prefix('insurance-fund')->middleware(['auth:sanctum', 'tenant.context', 'tenant.scoped'])->group(function () {
        Route::get('/balance', [App\Http\Controllers\InsuranceFundController::class, 'balance']);
        Route::get('/transactions', [App\Http\Controllers\InsuranceFundController::class, 'transactions']);
        Route::get('/analytics', [App\Http\Controllers\InsuranceFundController::class, 'analytics']);
    });
    
    // Refund Analytics & Reporting Routes
    Route::prefix('refund-analytics')->group(function () {
        Route::get('/dashboard', [App\Http\Controllers\RefundAnalyticsController::class, 'dashboard']);
        Route::get('/overview', [App\Http\Controllers\RefundAnalyticsController::class, 'overview']);
        Route::get('/trends', [App\Http\Controllers\RefundAnalyticsController::class, 'trends']);
        Route::get('/financial-impact', [App\Http\Controllers\RefundAnalyticsController::class, 'financialImpact']);
        Route::get('/vendor-analysis', [App\Http\Controllers\RefundAnalyticsController::class, 'vendorAnalysis']);
        Route::get('/dispute-summary', [App\Http\Controllers\RefundAnalyticsController::class, 'disputeSummary']);
        Route::get('/insurance-fund', [App\Http\Controllers\RefundAnalyticsController::class, 'insuranceFund']);
        Route::get('/performance-metrics', [App\Http\Controllers\RefundAnalyticsController::class, 'performanceMetrics']);
        Route::get('/insights', [App\Http\Controllers\RefundAnalyticsController::class, 'insights']);
        Route::get('/real-time-metrics', [App\Http\Controllers\RefundAnalyticsController::class, 'realTimeMetrics']);
        Route::post('/export', [App\Http\Controllers\RefundAnalyticsController::class, 'export']);
        Route::post('/generate-report', [App\Http\Controllers\RefundAnalyticsController::class, 'generateReport']);
    });
    
    // Evidence Management Routes
    Route::prefix('evidence')->group(function () {
        // Upload routes
        Route::post('/refund/{refund}/upload', [App\Http\Controllers\RefundEvidenceController::class, 'uploadRefundEvidence']);
        Route::post('/dispute/{dispute}/upload', [App\Http\Controllers\RefundEvidenceController::class, 'uploadDisputeEvidence']);
        Route::post('/liability/{liability}/upload', [App\Http\Controllers\RefundEvidenceController::class, 'uploadLiabilityEvidence']);
        
        // View routes
        Route::get('/refund/{refund}', [App\Http\Controllers\RefundEvidenceController::class, 'getRefundEvidence']);
        Route::get('/dispute/{dispute}', [App\Http\Controllers\RefundEvidenceController::class, 'getDisputeEvidence']);
        
        // File operations
        Route::get('/download/{fileId}', [App\Http\Controllers\RefundEvidenceController::class, 'downloadEvidence']);
        Route::get('/thumbnail/{fileId}', [App\Http\Controllers\RefundEvidenceController::class, 'getThumbnail']);
        Route::delete('/{fileId}', [App\Http\Controllers\RefundEvidenceController::class, 'deleteEvidence']);
        
        // Summary and configuration
        Route::get('/summary', [App\Http\Controllers\RefundEvidenceController::class, 'evidenceSummary']);
        Route::get('/upload-config', [App\Http\Controllers\RefundEvidenceController::class, 'getUploadConfiguration']);
    });
    
    // Enhanced Payment Gateway Routes
    Route::prefix('enhanced-gateway')->group(function () {
        // Method information and validation
        Route::get('/supported-methods', [App\Http\Controllers\EnhancedRefundGatewayController::class, 'getSupportedMethods']);
        Route::post('/validate-method/{refund}', [App\Http\Controllers\EnhancedRefundGatewayController::class, 'validateRefundMethod']);
        Route::post('/check-fees', [App\Http\Controllers\EnhancedRefundGatewayController::class, 'checkRefundFees']);
        Route::post('/method-recommendations', [App\Http\Controllers\EnhancedRefundGatewayController::class, 'getMethodRecommendations']);
        
        // Enhanced processing
        Route::post('/process-refund/{refund}', [App\Http\Controllers\EnhancedRefundGatewayController::class, 'processEnhancedRefund']);
        Route::post('/generate-qris/{refund}', [App\Http\Controllers\EnhancedRefundGatewayController::class, 'generateQRISRefund']);
        Route::post('/create-virtual-account/{refund}', [App\Http\Controllers\EnhancedRefundGatewayController::class, 'createVirtualAccount']);
    });

});

// Admin API (authenticated users)
Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
    // Admin Reviews API
    Route::prefix('reviews')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\V1\Public\ReviewController::class, 'index']);
        Route::get('/product/{productId}', [App\Http\Controllers\Api\V1\Public\ReviewController::class, 'byProduct'])->where('productId', '[0-9]+');
    });
    
    // Business Types API
    Route::get('/business-types', [App\Http\Controllers\Api\V1\Admin\BusinessTypeController::class, 'index']);
    
    // Business Rules Management API
    Route::prefix('business-rules')->group(function () {
        Route::get('/', [App\Http\Controllers\Admin\BusinessRulesController::class, 'index']);
        Route::get('/stats', [App\Http\Controllers\Admin\BusinessRulesController::class, 'stats']);
        Route::get('/logs', [App\Http\Controllers\Admin\BusinessRulesController::class, 'logs']);
        Route::get('/configurations', [App\Http\Controllers\Admin\BusinessRulesController::class, 'configurations']);
        Route::post('/validate', [App\Http\Controllers\Admin\BusinessRulesController::class, 'validateContext']);
        
        Route::get('/{ruleCode}', [App\Http\Controllers\Admin\BusinessRulesController::class, 'show']);
        Route::post('/{ruleCode}/test', [App\Http\Controllers\Admin\BusinessRulesController::class, 'testRule']);
        
        Route::get('/configurations/{ruleCode}', [App\Http\Controllers\Admin\BusinessRulesController::class, 'getConfiguration']);
        Route::put('/configurations/{ruleCode}', [App\Http\Controllers\Admin\BusinessRulesController::class, 'updateConfiguration']);
        Route::post('/configurations/{ruleCode}/reset', [App\Http\Controllers\Admin\BusinessRulesController::class, 'resetConfiguration']);
    });
    
    // Advanced Pricing Engine API
    Route::prefix('pricing')->group(function () {
        Route::post('/calculate', [App\Http\Controllers\Api\PricingController::class, 'calculatePricing']);
        Route::post('/breakdown', [App\Http\Controllers\Api\PricingController::class, 'getPricingBreakdown']);
        Route::post('/compare', [App\Http\Controllers\Api\PricingController::class, 'comparePricing']);
    });
    
    // Intelligent Vendor Matching API
    Route::prefix('vendor-matching')->group(function () {
        Route::post('/find-vendors', [App\Http\Controllers\Api\VendorMatchingController::class, 'findBestVendors']);
        Route::post('/recommend', [App\Http\Controllers\Api\VendorMatchingController::class, 'getRecommendation']);
        Route::get('/by-material', [App\Http\Controllers\Api\VendorMatchingController::class, 'findByMaterial']);
        Route::get('/by-equipment', [App\Http\Controllers\Api\VendorMatchingController::class, 'findByEquipment']);
        Route::post('/compatibility-score', [App\Http\Controllers\Api\VendorMatchingController::class, 'getCompatibilityScore']);
        Route::post('/analyze-capabilities', [App\Http\Controllers\Api\VendorMatchingController::class, 'analyzeCapabilities']);
    });
    
    // Production Management API
    Route::prefix('production')->group(function () {
        Route::get('/plans', [App\Http\Controllers\Api\ProductionController::class, 'getProductionPlans']);
        Route::post('/plans', [App\Http\Controllers\Api\ProductionController::class, 'createProductionPlan']);
        Route::get('/plans/{planId}', [App\Http\Controllers\Api\ProductionController::class, 'getProductionPlan']);
        Route::put('/plans/{planId}', [App\Http\Controllers\Api\ProductionController::class, 'updateProductionPlan']);
        
        Route::get('/progress/{orderId}', [App\Http\Controllers\Api\ProductionController::class, 'getProductionProgress']);
        Route::post('/progress/{orderId}', [App\Http\Controllers\Api\ProductionController::class, 'updateProductionProgress']);
        Route::get('/progress/{orderId}/report', [App\Http\Controllers\Api\ProductionController::class, 'getProgressReport']);
        
        Route::get('/schedule', [App\Http\Controllers\Api\ProductionController::class, 'getResourceSchedule']);
        Route::post('/schedule/optimize', [App\Http\Controllers\Api\ProductionController::class, 'optimizeResourceSchedule']);
        
        Route::get('/capacity', [App\Http\Controllers\Api\ProductionController::class, 'getCapacityAnalysis']);
        Route::get('/risks', [App\Http\Controllers\Api\ProductionController::class, 'getRiskAnalysis']);
        
        Route::get('/milestones/{orderId}', [App\Http\Controllers\Api\ProductionController::class, 'getMilestones']);
        Route::post('/milestones/{orderId}/complete', [App\Http\Controllers\Api\ProductionController::class, 'completeMilestone']);
        
        Route::get('/quality-checkpoints/{orderId}', [App\Http\Controllers\Api\ProductionController::class, 'getQualityCheckpoints']);
        Route::post('/quality-checkpoints/{checkpointId}/complete', [App\Http\Controllers\Api\ProductionController::class, 'completeQualityCheckpoint']);
    });
    
    // Business Analytics API
    Route::prefix('analytics')->group(function () {
        Route::get('/dashboard', [App\Http\Controllers\Api\AnalyticsController::class, 'getExecutiveDashboard']);
        Route::get('/orders', [App\Http\Controllers\Api\AnalyticsController::class, 'getOrderAnalytics']);
        Route::get('/revenue', [App\Http\Controllers\Api\AnalyticsController::class, 'getRevenueAnalytics']);
        Route::get('/vendors', [App\Http\Controllers\Api\AnalyticsController::class, 'getVendorAnalytics']);
        Route::get('/customers', [App\Http\Controllers\Api\AnalyticsController::class, 'getCustomerAnalytics']);
        Route::get('/production', [App\Http\Controllers\Api\AnalyticsController::class, 'getProductionAnalytics']);
    });
    
    // AI Intelligence API
    Route::prefix('intelligence')->group(function () {
        Route::get('/dashboard', [App\Http\Controllers\Api\IntelligenceController::class, 'getAIDashboard']);
        Route::get('/recommendations/customer/{customerId}', [App\Http\Controllers\Api\IntelligenceController::class, 'generateOrderRecommendations']);
        Route::get('/predictions/order-success/{orderId}', [App\Http\Controllers\Api\IntelligenceController::class, 'predictOrderSuccess']);
        Route::get('/market-trends', [App\Http\Controllers\Api\IntelligenceController::class, 'getMarketTrends']);
        Route::get('/inventory-optimization', [App\Http\Controllers\Api\IntelligenceController::class, 'getInventoryOptimization']);
        Route::get('/demand-forecast', [App\Http\Controllers\Api\IntelligenceController::class, 'getDemandForecast']);
        Route::get('/customer-churn', [App\Http\Controllers\Api\IntelligenceController::class, 'getCustomerChurnPredictions']);
        Route::get('/revenue-predictions', [App\Http\Controllers\Api\IntelligenceController::class, 'getRevenuePredictions']);
        Route::get('/data-insights', [App\Http\Controllers\Api\IntelligenceController::class, 'generateDataInsights']);
    });

    // Voice Command API
    Route::prefix('voice-commands')->group(function () {
        Route::post('/', [App\Http\Controllers\Api\VoiceCommandController::class, 'processCommand']);
        Route::get('/available', [App\Http\Controllers\Api\VoiceCommandController::class, 'getAvailableCommands']);
        Route::post('/train', [App\Http\Controllers\Api\VoiceCommandController::class, 'trainVoicePattern']);
    });

    // Smart Search API
    Route::get('/smart-search', [App\Http\Controllers\Api\SmartSearchController::class, 'search']);
    Route::get('/search-suggestions', [App\Http\Controllers\Api\SmartSearchController::class, 'suggestions']);
    Route::post('/search-analytics', [App\Http\Controllers\Api\SmartSearchController::class, 'recordSearchAnalytics']);
    Route::get('/search-analytics', [App\Http\Controllers\Api\SmartSearchController::class, 'getSearchAnalytics']);
});

// Tenant API (authenticated tenant users)
// Note: Tenant content management routes are in tenant.php using Tenant\ContentController

// Refund Management API Routes (RouteServiceProvider already adds api/v1 prefix)
Route::prefix('refunds')->middleware(['auth:sanctum'])->group(function () {
    Route::get('/', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'index']);
    Route::post('/', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'store']);
    Route::get('/statistics', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'statistics']);
    Route::get('/{requestNumber}', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'show']);
    Route::put('/{requestNumber}', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'update']);
    Route::post('/{requestNumber}/approve', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'approve']);
    Route::get('/{requestNumber}/approvals', [App\Infrastructure\Presentation\Http\Controllers\Tenant\RefundManagementController::class, 'approvals']);
});

// Public API (No authentication required)
Route::prefix('public')->group(function () {
    // Tenant discovery by domain
    Route::get('/tenant/discover', function (Request $request) {
        $domain = $request->get('domain');
        
        if (!$domain) {
            return response()->json(['error' => 'Domain parameter required'], 400);
        }
        
        $tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::where('domain', $domain)
            ->orWhere('slug', $domain)
            ->first();
        
        if (!$tenant) {
            return response()->json(['error' => 'Tenant not found'], 404);
        }
        
        return response()->json([
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'domain' => $tenant->domain,
            'status' => $tenant->status,
        ]);
    });
    
    // Global Categories API (all tenants)
    Route::prefix('categories')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\V1\Public\CategoryController::class, 'index']);
        Route::get('/tree', [App\Http\Controllers\Api\V1\Public\CategoryController::class, 'tree']);
        Route::get('/{id}', [App\Http\Controllers\Api\V1\Public\CategoryController::class, 'show'])->where('id', '[0-9]+');
        Route::get('/slug/{slug}', [App\Http\Controllers\Api\V1\Public\CategoryController::class, 'showBySlug']);
        Route::get('/{categoryId}/products', [App\Http\Controllers\Api\V1\Public\CategoryController::class, 'products'])->where('categoryId', '[0-9]+');
    });

    // Global Products API (all tenants)
    Route::prefix('products')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'index']);
        Route::get('/featured', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'featured']);
        Route::get('/search', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'search']);
        Route::get('/categories', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'getCategories']);
        Route::get('/filter-options', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'getFilterOptions']);
        Route::get('/category/{category}', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'byCategory']);
        Route::get('/{id}', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'show'])->where('id', '[0-9]+');
        Route::get('/slug/{slug}', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'showBySlugGlobal']);
        
        // Product Form Configuration (Public API)
        Route::get('/{uuid}/form-configuration', [App\Infrastructure\Presentation\Http\Controllers\Public\ProductFormController::class, 'show']);
        Route::post('/{uuid}/form-submission', [App\Infrastructure\Presentation\Http\Controllers\Public\ProductFormController::class, 'submit']);
    });
    
    // Tenant-specific Products API
    Route::get('/{tenantSlug}/products', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'index']);
    Route::get('/{tenantSlug}/products/featured', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'featured']);
    Route::get('/{tenantSlug}/products/search', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'search']);
    Route::get('/{tenantSlug}/products/categories', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'getCategories']);
    Route::get('/{tenantSlug}/products/filter-options', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'getFilterOptions']);
    Route::get('/{tenantSlug}/products/slug/{slug}', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'showBySlug']);
    Route::get('/{tenantSlug}/products/{uuid}/options', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'options']);
    Route::get('/{tenantSlug}/products/category/{category}', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'byCategory']);
    Route::get('/{tenantSlug}/products/{id}', [App\Http\Controllers\Api\V1\Public\ProductController::class, 'show'])->where('id', '[0-9]+');
    
    // Tenant-specific Reviews API
    Route::get('/{tenantSlug}/reviews/product/{productUuid}', [App\Http\Controllers\Api\V1\Public\ReviewController::class, 'byProductUuid']);
    
    // Global Reviews API
    Route::prefix('reviews')->group(function () {
        Route::get('/', [App\Http\Controllers\Api\V1\Public\ReviewController::class, 'index']);
        Route::get('/product/{productId}', [App\Http\Controllers\Api\V1\Public\ReviewController::class, 'byProduct'])->where('productId', '[0-9]+');
    });
    
    // Platform content for anonymous users (using database content)
    Route::prefix('content')->group(function () {
        Route::get('/pages/{slug}', [App\Http\Controllers\Api\V1\Public\ContentController::class, 'getPage']);
        Route::get('/pages/{tenantSlug}/{page}', [App\Http\Controllers\Api\V1\Public\ContentController::class, 'getTenantPage']);
    });
    
    // Public Navigation API (for frontend public pages)
    Route::prefix('navigation')->group(function () {
        Route::get('/{tenantSlug}/header', [App\Http\Controllers\Api\V1\Public\NavigationController::class, 'getHeader']);
        Route::get('/{tenantSlug}/footer', [App\Http\Controllers\Api\V1\Public\NavigationController::class, 'getFooter']);
        Route::get('/{tenantSlug}/menus', [App\Http\Controllers\Api\V1\Public\NavigationController::class, 'getMenus']);
    });

    // Public Media Upload (for public forms)
    Route::prefix('media')->group(function () {
        Route::post('/upload', [App\Http\Controllers\MediaController::class, 'uploadPublicFile']);
    });

    // Platform statistics for anonymous users
    Route::get('/stats', function () {
        $tenantCount = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::where('status', 'active')->count();
        
        return response()->json([
            'total_businesses' => $tenantCount,
            'platform_version' => '1.0.0',
            'uptime' => '99.9%'
        ]);
    });
});