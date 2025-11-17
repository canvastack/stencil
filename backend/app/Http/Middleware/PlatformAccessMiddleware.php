<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;

class PlatformAccessMiddleware
{
    /**
     * Handle an incoming request for platform access.
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        // Use the platform guard to get the authenticated user
        $user = auth('platform')->user();

        // Check if user is authenticated via platform guard
        if (!$user) {
            // Check if user is authenticated via other guards (tenant/api) 
            $tenantUser = auth('tenant')->user() ?? auth('api')->user();
            
            if ($tenantUser) {
                // User is authenticated but not as platform account
                return response()->json([
                    'message' => 'Unauthorized',
                    'error' => 'Platform access requires Account A credentials'
                ], 403);
            }
            
            // No authentication at all
            return response()->json([
                'message' => 'Unauthenticated',
                'error' => 'Authentication required for platform access'
            ], 401);
        }

        // Check if user is a platform account (Account A)
        if (!$user instanceof AccountEloquentModel) {
            return response()->json([
                'message' => 'Unauthorized',
                'error' => 'Platform access requires Account A credentials'
            ], 403);
        }

        // Check if account is active
        if (!$user->isActive()) {
            return response()->json([
                'message' => 'Account is not active',
                'error' => 'Your platform account is not active'
            ], 403);
        }

        // Check if account can manage tenants
        if (!$user->canManageTenants()) {
            return response()->json([
                'message' => 'Insufficient Permissions', 
                'error' => 'Account does not have platform management permissions'
            ], 403);
        }

        // Set the default guard to platform for this request
        auth()->setDefaultDriver('platform');

        // Add platform context to request
        $request->attributes->set('platform_account', $user);
        $request->attributes->set('account_type', 'platform');

        return $next($request);
    }
}