<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        if ($request->expectsJson()) {
            return null;
        }

        // For API requests (any path starting with api/), return null
        if (str_starts_with($request->path(), 'api/')) {
            return null;
        }

        // Determine redirect based on request path
        $path = $request->path();
        
        if (str_starts_with($path, 'platform') || str_starts_with($path, 'admin')) {
            return route('platform.auth.login');
        }
        
        if (str_starts_with($path, 'tenant')) {
            return route('tenant.auth.login');
        }
        
        // Default to tenant login for unspecified paths
        return route('tenant.auth.login');
    }
}
