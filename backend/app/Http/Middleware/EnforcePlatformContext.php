<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Infrastructure\Persistence\Eloquent\Models\Account as AccountEloquentModel;

class EnforcePlatformContext
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }
        
        // Check if user is a platform account (not a tenant user)
        if (!($user instanceof AccountEloquentModel)) {
            return response()->json([
                'message' => 'Access denied. Platform credentials required.',
                'error' => 'Invalid token context for this endpoint.'
            ], 401);
        }
        
        return $next($request);
    }
}
