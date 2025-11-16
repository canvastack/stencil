<?php

use Illuminate\Support\Facades\Route;
use App\Infrastructure\Presentation\Http\Controllers\Platform\AuthController as PlatformAuthController;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\AuthController as TenantAuthController;

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
Route::prefix('platform')->group(function () {
    // Public authentication routes
    Route::post('/login', [PlatformAuthController::class, 'login'])->name('platform.auth.login');
    
    // Protected authentication routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [PlatformAuthController::class, 'logout'])->name('platform.auth.logout');
        Route::post('/refresh', [PlatformAuthController::class, 'refresh'])->name('platform.auth.refresh');
        Route::get('/me', [PlatformAuthController::class, 'me'])->name('platform.auth.me');
        Route::post('/validate', [PlatformAuthController::class, 'validate'])->name('platform.auth.validate');
    });
});

// Tenant Authentication Routes (Account B)
Route::prefix('tenant')->group(function () {
    // Public authentication routes
    Route::post('/login', [TenantAuthController::class, 'login'])->name('tenant.auth.login');
    Route::post('/context-login', [TenantAuthController::class, 'contextLogin'])->name('tenant.auth.context_login');
    
    // Protected authentication routes  
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [TenantAuthController::class, 'logout'])->name('tenant.auth.logout');
        Route::post('/refresh', [TenantAuthController::class, 'refresh'])->name('tenant.auth.refresh');
        Route::get('/me', [TenantAuthController::class, 'me'])->name('tenant.auth.me');
        Route::post('/validate', [TenantAuthController::class, 'validate'])->name('tenant.auth.validate');
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
});