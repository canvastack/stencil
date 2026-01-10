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
        // Try multiple auth guards (sanctum for API, platform for tests)
        $user = auth('sanctum')->user() ?? auth('platform')->user();

        // Check if user is authenticated
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated',
                'error' => 'Authentication required for platform access'
            ], 401);
        }

        // CRITICAL: Check if user is a platform account (Account A) FIRST
        if (!$user instanceof AccountEloquentModel) {
            // This is a tenant user trying to access platform routes
            return response()->json([
                'message' => 'Unauthenticated',
                'error' => 'Invalid authentication type for platform access'
            ], 401);
        }
        
        // Additional validation: Check token abilities for Sanctum authentication
        if ($request->user('sanctum') && method_exists($user, 'currentAccessToken')) {
            $token = $user->currentAccessToken();
            
            if ($token) {
                // Check if token has platform abilities
                $hasPlatformAbility = $token->can('platform:read') || 
                                     $token->can('platform:write') || 
                                     $token->can('tenants:manage');
                
                if (!$hasPlatformAbility) {
                    // This token doesn't have platform permissions
                    return response()->json([
                        'message' => 'Unauthenticated',
                        'error' => 'Invalid token permissions for platform access'
                    ], 401);
                }
            }
        }

        // Check if account is active
        if (!$user->isActive()) {
            return response()->json([
                'message' => 'Account is not active',
                'error' => 'Your platform account is not active'
            ], 403);
        }

        // Check if account can manage tenants (skip for some routes like /me)
        $skipPermissionCheck = in_array($request->path(), [
            'api/v1/platform/me',
            'api/v1/platform/logout',
            'api/v1/platform/validate-token',
            'api/v1/platform/refresh'
        ]);
        
        if (!$skipPermissionCheck && !$user->canManageTenants()) {
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
