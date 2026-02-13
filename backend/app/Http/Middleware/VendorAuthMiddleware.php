<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

/**
 * Vendor Authentication Middleware
 * 
 * Validates vendor portal access and loads vendor context.
 * Requirements: 1.6, 1.8, 15.11
 */
class VendorAuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated via Sanctum
        if (!Auth::guard('sanctum')->check()) {
            return response()->json([
                'message' => 'Unauthenticated. Please login to access vendor portal.',
                'error' => 'UNAUTHENTICATED'
            ], 401);
        }

        $user = Auth::guard('sanctum')->user();

        // Verify user account type is 'vendor'
        if ($user->account_type !== 'vendor') {
            return response()->json([
                'message' => 'Access denied. This endpoint is only accessible to vendor accounts.',
                'error' => 'FORBIDDEN_ACCOUNT_TYPE'
            ], 403);
        }

        // Verify token has 'vendor:access' ability
        $token = $user->currentAccessToken();
        if (!$token || !$token->can('vendor:access')) {
            return response()->json([
                'message' => 'Access denied. Invalid token permissions.',
                'error' => 'FORBIDDEN_TOKEN_ABILITY'
            ], 403);
        }

        // Load vendor record
        $vendor = $user->vendor;
        if (!$vendor) {
            return response()->json([
                'message' => 'Vendor record not found. Please contact support.',
                'error' => 'VENDOR_NOT_FOUND'
            ], 404);
        }

        // Check portal access is enabled
        if (!$vendor->portal_access_enabled) {
            return response()->json([
                'message' => 'Portal access is disabled for your account. Please contact support.',
                'error' => 'PORTAL_ACCESS_DISABLED'
            ], 403);
        }

        // Check vendor is active
        if ($vendor->status !== 'active') {
            return response()->json([
                'message' => 'Your vendor account is not active. Please contact support.',
                'error' => 'VENDOR_INACTIVE'
            ], 403);
        }

        // Check onboarding is completed
        if ($vendor->onboarding_status !== 'completed') {
            return response()->json([
                'message' => 'Please complete your onboarding process first.',
                'error' => 'ONBOARDING_INCOMPLETE',
                'onboarding_status' => $vendor->onboarding_status
            ], 403);
        }

        // Update last activity timestamp
        $user->update(['last_login_at' => now()]);

        // Add vendor to request for easy access in controllers
        $request->merge([
            'vendor' => $vendor,
            'vendor_user' => $user,
        ]);

        return $next($request);
    }
}
