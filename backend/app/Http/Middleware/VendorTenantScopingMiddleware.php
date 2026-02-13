<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

/**
 * Vendor Tenant Scoping Middleware
 * 
 * Ensures vendor users can only access data from their own tenant.
 * Works in conjunction with VendorAuthMiddleware.
 * 
 * Business Rules:
 * - Vendor must belong to the same tenant as the request context
 * - Prevents cross-tenant data access
 * - Validates tenant_id consistency
 */
class VendorTenantScopingMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get vendor from request (set by VendorAuthMiddleware)
        $vendor = $request->get('vendor');
        $vendorUser = $request->get('vendor_user');

        if (!$vendor || !$vendorUser) {
            Log::warning('Vendor tenant scoping: vendor or vendor_user not found in request', [
                'path' => $request->path(),
                'has_vendor' => $vendor !== null,
                'has_vendor_user' => $vendorUser !== null,
            ]);

            return response()->json([
                'message' => 'Vendor authentication required',
                'error' => 'Unauthorized'
            ], 401);
        }

        // For vendor routes, tenant context comes from the vendor's tenant_id
        // (not from a separate TenantContextMiddleware)
        $tenantId = $vendor->tenant_id;

        if (!$tenantId) {
            Log::error('Vendor tenant scoping: vendor has no tenant_id', [
                'vendor_uuid' => $vendor->uuid,
                'path' => $request->path(),
            ]);

            return response()->json([
                'message' => 'Vendor has no tenant association',
                'error' => 'Configuration error'
            ], 500);
        }

        // Verify vendor user belongs to the same tenant as vendor
        if ($vendorUser->tenant_id !== $tenantId) {
            Log::error('Vendor tenant scoping: vendor user tenant mismatch', [
                'user_id' => $vendorUser->id,
                'user_tenant_id' => $vendorUser->tenant_id,
                'vendor_tenant_id' => $tenantId,
                'path' => $request->path(),
                'ip_address' => $request->ip(),
            ]);

            return response()->json([
                'message' => 'Access denied: user does not belong to vendor tenant',
                'error' => 'Forbidden'
            ], 403);
        }

        // Set tenant_id in database session for query scoping
        // This ensures all Eloquent queries are automatically scoped to this tenant
        DB::unprepared("SET app.current_tenant_id = {$tenantId}");

        // Add tenant context to request attributes for consistency with other middleware
        $request->attributes->set('tenant_id', $tenantId);
        
        // Add tenant_id to request for easy access in controllers
        $request->merge([
            'tenant_id' => $tenantId,
        ]);

        Log::debug('Vendor tenant scoping: access granted', [
            'vendor_uuid' => $vendor->uuid,
            'tenant_id' => $tenantId,
            'path' => $request->path(),
        ]);

        return $next($request);
    }
}
