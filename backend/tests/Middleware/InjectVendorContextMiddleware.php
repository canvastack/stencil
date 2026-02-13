<?php

namespace Tests\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Test middleware to inject vendor context into requests
 * Used for testing vendor portal endpoints
 */
class InjectVendorContextMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // Get vendor context from app container (set by test)
        if (app()->has('test.vendor.context')) {
            $context = app('test.vendor.context');
            
            $request->merge([
                'vendor' => $context['vendor'],
                'vendor_user' => $context['vendor_user'],
                'tenant_id' => $context['tenant_id'],
            ]);
            
            $request->attributes->set('tenant_id', $context['tenant_id']);
            $request->attributes->set('tenant', $context['tenant']);
        }
        
        return $next($request);
    }
}
