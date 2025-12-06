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

// Authentication & User Info
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
    
    // Platform content for anonymous users (using database content)
    Route::prefix('content')->group(function () {
        Route::get('/pages/{slug}', [App\Http\Controllers\Api\V1\Public\ContentController::class, 'getPage']);
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