<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Vendor\VendorAuthController;
use App\Http\Controllers\Api\Vendor\VendorQuoteController;
use App\Http\Controllers\Api\Vendor\VendorMessageController;
use App\Http\Controllers\Api\Vendor\VendorProfileController;

/*
|--------------------------------------------------------------------------
| Vendor Portal API Routes
|--------------------------------------------------------------------------
|
| Routes for the vendor portal system. Vendors can:
| - Authenticate and manage their account
| - View and respond to quotes
| - Communicate via messages
| - Manage their profile
|
| All routes are prefixed with /api/v1/vendor
|
*/

// ============================================================================
// Public Routes (No Authentication Required)
// ============================================================================

Route::prefix('auth')->group(function () {
    Route::post('/login', [VendorAuthController::class, 'login'])
        ->name('vendor.auth.login');
    
    Route::post('/password/email', [VendorAuthController::class, 'requestPasswordReset'])
        ->name('vendor.auth.password.email');
    
    Route::post('/password/reset', [VendorAuthController::class, 'resetPassword'])
        ->name('vendor.auth.password.reset');
});

// ============================================================================
// Protected Routes (Authentication Required)
// ============================================================================

Route::middleware([
    'auth:sanctum',
    'vendor.auth',      // Verify vendor account
    'vendor.tenant',    // Enforce tenant scoping
    'vendor.rate-limit' // Rate limiting
])->group(function () {
    
    // ------------------------------------------------------------------------
    // Authentication Routes
    // ------------------------------------------------------------------------
    
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [VendorAuthController::class, 'logout'])
            ->name('vendor.auth.logout');
        
        Route::post('/password/change', [VendorAuthController::class, 'changePassword'])
            ->name('vendor.auth.password.change');
    });
    
    // ------------------------------------------------------------------------
    // Quote Routes
    // ------------------------------------------------------------------------
    
    Route::prefix('quotes')->group(function () {
        // List quotes
        Route::get('/', [VendorQuoteController::class, 'index'])
            ->name('vendor.quotes.index');
        
        // Get quote detail
        Route::get('/{uuid}', [VendorQuoteController::class, 'show'])
            ->name('vendor.quotes.show');
        
        // Quote response actions
        Route::post('/{uuid}/accept', [VendorQuoteController::class, 'accept'])
            ->name('vendor.quotes.accept');
        
        Route::post('/{uuid}/reject', [VendorQuoteController::class, 'reject'])
            ->name('vendor.quotes.reject');
        
        Route::post('/{uuid}/counter-offer', [VendorQuoteController::class, 'counterOffer'])
            ->name('vendor.quotes.counter-offer');
        
        // Quote messages
        Route::get('/{uuid}/messages', [VendorMessageController::class, 'index'])
            ->name('vendor.quotes.messages.index');
        
        Route::post('/{uuid}/messages', [VendorMessageController::class, 'store'])
            ->name('vendor.quotes.messages.store');
    });
    
    // ------------------------------------------------------------------------
    // Profile Routes
    // ------------------------------------------------------------------------
    
    Route::prefix('profile')->group(function () {
        Route::get('/', [VendorProfileController::class, 'show'])
            ->name('vendor.profile.show');
        
        Route::put('/', [VendorProfileController::class, 'update'])
            ->name('vendor.profile.update');
    });
});

