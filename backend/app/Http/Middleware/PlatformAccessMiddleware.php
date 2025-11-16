<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;

class PlatformAccessMiddleware
{
    /**
     * Handle an incoming request for platform access.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Check if user is authenticated
        if (!$user) {
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
                'message' => 'Account Inactive',
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

        // Add platform context to request
        $request->attributes->set('platform_account', $user);
        $request->attributes->set('account_type', 'platform');

        return $next($request);
    }
}