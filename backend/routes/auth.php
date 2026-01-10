<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Infrastructure\Presentation\Http\Controllers\Platform\AuthController as PlatformAuthController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\AuthController as TenantAuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\RegistrationController;
use App\Http\Controllers\RefundController;
use App\Http\Controllers\PaymentRefundController;
use App\Http\Controllers\ShippingController;
use App\Http\Controllers\MediaController;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
|
| Authentication routes for multi-tenant system:
| - Platform Authentication (Account A)
| - Tenant Authentication (Account B)
|
*/

// Platform Authentication Routes (Account A)
// General Auth Routes (both platform and tenant)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', function (Request $request) {
        $user = $request->user();
        
        // Determine if this is a platform account or tenant user
        $isPlatform = $user instanceof \App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
        
        if ($isPlatform) {
            return response()->json([
                'success' => true,
                'data' => [
                    'account' => [
                        'id' => $user->id,
                        'uuid' => $user->uuid,
                        'name' => $user->name,
                        'email' => $user->email,
                        'account_type' => 'platform_owner',
                        'status' => 'active',
                        'permissions' => ['platform.all']
                    ]
                ]
            ]);
        } else {
            // This is a tenant user
            return response()->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'uuid' => $user->uuid,
                        'name' => $user->name,
                        'email' => $user->email,
                        'email_verified_at' => $user->email_verified_at,
                        'created_at' => $user->created_at,
                        'updated_at' => $user->updated_at,
                        'roles' => ['admin'],
                        'permissions' => ['tenant.all']
                    ],
                    'tenant' => [
                        'id' => '1',
                        'uuid' => '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
                        'name' => 'Demo Etching Company',
                        'slug' => 'etchinx',
                        'domain' => 'etchinx.canvastencil.com',
                        'settings' => [
                            'timezone' => 'Asia/Jakarta',
                            'currency' => 'IDR',
                            'language' => 'id'
                        ]
                    ]
                ]
            ]);
        }
    });
});

Route::prefix('platform')->group(function () {
    // Public authentication routes
    Route::post('/login', [PlatformAuthController::class, 'login'])->name('platform.auth.login');
    
    // Password reset routes (public)
    Route::post('/forgot-password', [PasswordResetController::class, 'forgotPasswordPlatform'])->name('platform.password.email');
    Route::post('/reset-password', [PasswordResetController::class, 'resetPasswordPlatform'])->name('platform.password.reset');
    Route::post('/validate-token', [PasswordResetController::class, 'validateTokenPlatform'])->name('platform.password.validate');
    
    // Email verification routes (public)
    Route::post('/send-verification', [EmailVerificationController::class, 'sendPlatformVerification'])->name('platform.email.verify.send');
    Route::post('/verify-email', [EmailVerificationController::class, 'verify'])->name('platform.email.verify');
    Route::get('/verification-status', [EmailVerificationController::class, 'checkVerificationStatus'])->name('platform.email.verify.status');
    
    // Registration routes (public)
    Route::post('/register', [RegistrationController::class, 'registerPlatformAccount'])->name('platform.register');
    Route::post('/check-email', [RegistrationController::class, 'checkEmailAvailability'])->name('platform.check.email');
    
    // Protected authentication routes
    Route::middleware('auth:platform', 'platform.access')->group(function () {
        Route::post('/logout', [PlatformAuthController::class, 'logout'])->name('platform.auth.logout');
        Route::post('/refresh', [PlatformAuthController::class, 'refresh'])->name('platform.auth.refresh');
        Route::get('/me', [PlatformAuthController::class, 'me'])->name('platform.auth.me');
        Route::post('/validate', [PlatformAuthController::class, 'validateToken'])->name('platform.auth.validate');
        Route::get('/validate-token', [PlatformAuthController::class, 'validateToken'])->name('platform.auth.validate_token');
    });
});

// Tenant Authentication Routes (Account B)
Route::prefix('tenant')->group(function () {
    // Public authentication routes
    Route::post('/login', [TenantAuthController::class, 'login'])->name('tenant.auth.login');
    Route::post('/context-login', [TenantAuthController::class, 'contextLogin'])->name('tenant.auth.context_login');
    
    // Password reset routes (public) - tenant specific
    Route::post('/{tenantId}/forgot-password', [PasswordResetController::class, 'forgotPasswordTenant'])->name('tenant.password.email');
    Route::post('/{tenantId}/reset-password', [PasswordResetController::class, 'resetPasswordTenant'])->name('tenant.password.reset');
    Route::post('/{tenantId}/validate-token', [PasswordResetController::class, 'validateTokenTenant'])->name('tenant.password.validate');
    
    // Email verification routes (public) - tenant specific
    Route::post('/{tenantId}/send-verification', [EmailVerificationController::class, 'sendTenantVerification'])->name('tenant.email.verify.send');
    Route::post('/{tenantId}/verify-email', [EmailVerificationController::class, 'verify'])->name('tenant.email.verify');
    Route::get('/{tenantId}/verification-status', [EmailVerificationController::class, 'checkVerificationStatus'])->name('tenant.email.verify.status');
    
    // Registration routes (public) - tenant specific  
    Route::post('/{tenantId}/register', [RegistrationController::class, 'registerTenantUser'])->name('tenant.register');
    Route::post('/{tenantId}/check-email', [RegistrationController::class, 'checkEmailAvailability'])->name('tenant.check.email');
    Route::get('/{tenantId}/registration-stats', [RegistrationController::class, 'getRegistrationStats'])->name('tenant.registration.stats');
    
    // Protected authentication routes  
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [TenantAuthController::class, 'logout'])->name('tenant.auth.logout');
        Route::post('/refresh', [TenantAuthController::class, 'refresh'])->name('tenant.auth.refresh');
        Route::get('/me', [TenantAuthController::class, 'me'])->name('tenant.auth.me');
        Route::post('/validate', [TenantAuthController::class, 'validateToken'])->name('tenant.auth.validate');
        Route::get('/validate-token', [TenantAuthController::class, 'validateToken'])->name('tenant.auth.validate_token');
        Route::post('/switch-role', [TenantAuthController::class, 'switchRole'])->name('tenant.auth.switch_role');
    });
});

// General Authentication Routes
Route::prefix('auth')->group(function () {
    // Health check
    Route::get('/health', function () {
        return response()->json([
            'service' => 'authentication',
            'status' => 'healthy',
            'timestamp' => now(),
            'guards' => array_keys(config('auth.guards'))
        ]);
    });
    
    // Token validation (accepts both platform and tenant tokens)
    Route::middleware('auth:sanctum')->get('/validate', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        
        if ($user instanceof \App\Infrastructure\Persistence\Eloquent\AccountEloquentModel) {
            return response()->json([
                'valid' => true,
                'account_type' => 'platform',
                'user_id' => $user->id,
                'user_name' => $user->name,
                'permissions' => [
                    'platform:read',
                    'platform:write',
                    'tenants:manage',
                    'analytics:view'
                ]
            ]);
        } else {
            return response()->json([
                'valid' => true,
                'account_type' => 'tenant',
                'user_id' => $user->id,
                'user_name' => $user->name,
                'tenant_id' => $user->tenant_id,
                'tenant_name' => $user->tenant->name,
                'permissions' => $user->getAllPermissions()
            ]);
        }
    });
    
    // Logout from any account type
    Route::middleware('auth:sanctum')->post('/logout', function (\Illuminate\Http\Request $request) {
        $user = $request->user();
        $user->currentAccessToken()->delete();
        
        return response()->json([
            'message' => 'Logout successful'
        ]);
    });
    
    // Public registration routes for tenant creation
    Route::post('/register-tenant', [RegistrationController::class, 'registerTenantWithAdmin'])->name('auth.register.tenant');
});

// API v1 Authentication Routes (REST API with versioning)
// Note: This file is included from routes/api.php which already has /api/v1 prefix from RouteServiceProvider
// So we only need to add 'auth' prefix here
Route::prefix('auth')->group(function () {
    // Platform authentication routes
    Route::prefix('platform')->group(function () {
        Route::post('/register', [RegistrationController::class, 'registerPlatformAccount']);
        Route::post('/check-email', [RegistrationController::class, 'checkEmailAvailability']);
        Route::post('/login', [PlatformAuthController::class, 'login']);
        
        // Password reset
        Route::post('/forgot-password', [PasswordResetController::class, 'forgotPasswordPlatform']);
        Route::post('/reset-password', [PasswordResetController::class, 'resetPasswordPlatform']);
        Route::post('/validate-token', [PasswordResetController::class, 'validateTokenPlatform']);
        
        // Email verification
        Route::post('/send-verification', [EmailVerificationController::class, 'sendPlatformVerification']);
        Route::post('/verify-email', [EmailVerificationController::class, 'verify']);
        Route::get('/verification-status', [EmailVerificationController::class, 'checkVerificationStatus']);
    });
    
    // Tenant authentication routes
    Route::prefix('tenant/{tenantId}')->group(function () {
        Route::post('/register', [RegistrationController::class, 'registerTenantUser']);
        Route::post('/check-email', [RegistrationController::class, 'checkEmailAvailability']);
        Route::get('/registration-stats', [RegistrationController::class, 'getRegistrationStats']);
        Route::post('/login', [TenantAuthController::class, 'login']);
        
        // Password reset
        Route::post('/forgot-password', [PasswordResetController::class, 'forgotPasswordTenant']);
        Route::post('/reset-password', [PasswordResetController::class, 'resetPasswordTenant']);
        Route::post('/validate-token', [PasswordResetController::class, 'validateTokenTenant']);
        
        // Email verification
        Route::post('/send-verification', [EmailVerificationController::class, 'sendTenantVerification']);
        Route::post('/verify-email', [EmailVerificationController::class, 'verify']);
        Route::get('/verification-status', [EmailVerificationController::class, 'checkVerificationStatus']);
    });
    
    // General registration routes
    Route::post('/register-tenant', [RegistrationController::class, 'registerTenantWithAdmin']);
});

/*
|--------------------------------------------------------------------------
| Refund Management Routes (Legacy - Deprecated)
|--------------------------------------------------------------------------
|
| Legacy payment refund routes - replaced by new refund management system
| These routes are commented out to avoid conflicts with new refund system
|
*/

// Legacy refund routes moved to new refund management system
// See: /api/v1/refunds (in api.php) and RefundManagementController

/* Legacy routes commented out - replaced by RefundManagementController
Route::prefix('api/v1/refunds')->middleware(['auth:sanctum'])->group(function () {
    Route::get('/', [RefundController::class, 'index'])->name('refunds.index');
    Route::post('/', [RefundController::class, 'store'])->name('refunds.store');
    Route::get('/{refund}', [RefundController::class, 'show'])->name('refunds.show');
    Route::patch('/{refund}', [RefundController::class, 'update'])->name('refunds.update');
    Route::delete('/{refund}', [RefundController::class, 'destroy'])->name('refunds.destroy');
    
    Route::get('/statistics/summary', [RefundController::class, 'statistics'])->name('refunds.statistics');
    Route::get('/export/data', [RefundController::class, 'export'])->name('refunds.export');
    
    Route::get('/orders/{orderId}/summary', [RefundController::class, 'orderSummary'])->name('refunds.order.summary');
    
    Route::get('/{refund}/workflow-history', [RefundController::class, 'workflowHistory'])->name('refunds.workflow.history');
    Route::get('/workflows/pending', [RefundController::class, 'pendingWorkflows'])->name('refunds.workflows.pending');
    
    Route::post('/{refund}/approve', [PaymentRefundController::class, 'approve'])->name('refunds.approve');
    Route::post('/{refund}/reject', [PaymentRefundController::class, 'reject'])->name('refunds.reject');
    Route::post('/{refund}/process', [PaymentRefundController::class, 'process'])->name('refunds.process');
    Route::post('/{refund}/retry', [PaymentRefundController::class, 'retry'])->name('refunds.retry');
    Route::get('/{refund}/check-status', [PaymentRefundController::class, 'checkStatus'])->name('refunds.check.status');
    
    Route::post('/workflows/{workflow}/approve', [PaymentRefundController::class, 'approveWorkflowStep'])->name('refunds.workflows.approve');
    Route::post('/workflows/{workflow}/escalate', [PaymentRefundController::class, 'escalateWorkflow'])->name('refunds.workflows.escalate');
    
    Route::post('/bulk/approve', [PaymentRefundController::class, 'bulkApprove'])->name('refunds.bulk.approve');
    
    Route::get('/processing-options', [PaymentRefundController::class, 'processingOptions'])->name('refunds.processing.options');
});
*/

// Shipping & Logistics Routes
Route::middleware('auth:sanctum')->prefix('shipping')->group(function () {
    Route::get('/methods', [ShippingController::class, 'shippingMethods'])->name('shipping.methods');
    Route::post('/calculate', [ShippingController::class, 'calculateShipping'])->name('shipping.calculate');
    Route::post('/create', [ShippingController::class, 'createShipment'])->name('shipping.create');
    
    Route::get('/', [ShippingController::class, 'listShipments'])->name('shipments.index');
    Route::get('/{shipment}', [ShippingController::class, 'showShipment'])->name('shipments.show');
    Route::post('/{shipment}/process', [ShippingController::class, 'processShipment'])->name('shipments.process');
    Route::post('/{shipment}/tracking', [ShippingController::class, 'updateTracking'])->name('shipments.tracking');
    Route::post('/{shipment}/cancel', [ShippingController::class, 'cancelShipment'])->name('shipments.cancel');
});

// Media & File Management Routes
Route::middleware('auth:sanctum')->prefix('media')->group(function () {
    Route::post('/upload', [MediaController::class, 'uploadFile'])->name('media.upload');
    Route::get('/files', [MediaController::class, 'listFiles'])->name('media.files.list');
    Route::get('/files/{mediaFile}', [MediaController::class, 'getFile'])->name('media.files.show');
    Route::patch('/files/{mediaFile}', [MediaController::class, 'updateFile'])->name('media.files.update');
    Route::delete('/files/{mediaFile}', [MediaController::class, 'deleteFile'])->name('media.files.delete');
    Route::post('/files/{mediaFile}/move', [MediaController::class, 'moveFile'])->name('media.files.move');
    
    Route::post('/folders', [MediaController::class, 'createFolder'])->name('media.folders.create');
    Route::get('/folders', [MediaController::class, 'listFolders'])->name('media.folders.list');
});