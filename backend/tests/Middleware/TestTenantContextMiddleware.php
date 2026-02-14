<?php

namespace Tests\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Test Tenant Context Middleware
 * 
 * Injects tenant context into request attributes for testing purposes.
 * This simulates what TenantContextMiddleware would do in production.
 */
class TestTenantContextMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get tenant context from app container (set in test setUp)
        $context = app('test.tenant.context');
        
        if ($context) {
            // Use merge() to add to request input (same as VendorAuthMiddleware)
            $request->merge([
                'tenant_id' => $context['tenant_id'],
                'tenant' => $context['tenant'],
            ]);
            
            // Also set as attributes for backward compatibility
            $request->attributes->set('tenant_id', $context['tenant_id']);
            $request->attributes->set('tenant', $context['tenant']);
        }
        
        // If user is authenticated and has vendor relationship, add vendor context
        $user = $request->user();
        if ($user && $user->vendor) {
            $request->merge([
                'vendor' => $user->vendor,
                'vendor_user' => $user,
            ]);
        }
        
        return $next($request);
    }
}
