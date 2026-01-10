<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Infrastructure\Persistence\Eloquent\Models\User as UserEloquentModel;

class EnforceTenantContext
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
        
        // Check if user is a tenant user (not a platform account)
        if (!($user instanceof UserEloquentModel)) {
            return response()->json([
                'message' => 'Access denied. Tenant credentials required.',
                'error' => 'Invalid token context for this endpoint.'
            ], 401);
        }
        
        return $next($request);
    }
}
