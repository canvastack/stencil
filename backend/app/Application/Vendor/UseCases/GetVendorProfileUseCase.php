<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Queries\GetVendorProfileQuery;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Use Case: Get Vendor Profile
 * 
 * Retrieves vendor profile information including performance metrics.
 * 
 * Business Rules:
 * - Vendor must exist and belong to tenant
 * - Include basic vendor information
 * - Include performance metrics (quotes accepted, rejected, response time)
 * - Tenant isolation enforced
 */
final class GetVendorProfileUseCase
{
    /**
     * Execute query to get vendor profile
     * 
     * @param GetVendorProfileQuery $query
     * @return array Vendor profile data
     * @throws InvalidArgumentException If validation fails
     */
    public function execute(GetVendorProfileQuery $query): array
    {
        // Get vendor with basic info
        $vendor = DB::table('vendors')
            ->where('id', $query->vendorId)
            ->where('tenant_id', $query->tenantId)
            ->whereNull('deleted_at')
            ->first();

        if (!$vendor) {
            throw new InvalidArgumentException('Vendor not found');
        }

        // Get performance metrics
        $totalQuotes = DB::table('order_vendor_negotiations')
            ->where('vendor_id', $query->vendorId)
            ->where('tenant_id', $query->tenantId)
            ->whereNull('deleted_at')
            ->count();

        $acceptedQuotes = DB::table('order_vendor_negotiations')
            ->where('vendor_id', $query->vendorId)
            ->where('tenant_id', $query->tenantId)
            ->where('status', 'accepted')
            ->whereNull('deleted_at')
            ->count();

        $rejectedQuotes = DB::table('order_vendor_negotiations')
            ->where('vendor_id', $query->vendorId)
            ->where('tenant_id', $query->tenantId)
            ->where('status', 'rejected')
            ->whereNull('deleted_at')
            ->count();

        $pendingQuotes = DB::table('order_vendor_negotiations')
            ->where('vendor_id', $query->vendorId)
            ->where('tenant_id', $query->tenantId)
            ->whereIn('status', ['sent', 'pending_response', 'countered'])
            ->whereNull('deleted_at')
            ->count();

        // Calculate average response time (in hours)
        $avgResponseTime = DB::table('order_vendor_negotiations')
            ->where('vendor_id', $query->vendorId)
            ->where('tenant_id', $query->tenantId)
            ->whereNotNull('responded_at')
            ->whereNull('deleted_at')
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (responded_at - created_at)) / 3600) as avg_hours')
            ->value('avg_hours');

        // Cast to float if not null
        $avgResponseTime = $avgResponseTime !== null ? (float) $avgResponseTime : null;

        // Calculate acceptance rate
        $acceptanceRate = $totalQuotes > 0 
            ? round(($acceptedQuotes / $totalQuotes) * 100, 2) 
            : 0;

        return [
            'id' => $vendor->id,
            'uuid' => $vendor->uuid,
            'company_name' => $vendor->company_name,
            'name' => $vendor->name,
            'email' => $vendor->email,
            'phone' => $vendor->phone,
            'contact_person' => $vendor->contact_person,
            'address' => $vendor->address,
            'location' => $vendor->location ? json_decode($vendor->location, true) : null,
            'status' => $vendor->status,
            'category' => $vendor->category,
            'tax_id' => $vendor->tax_id,
            'bank_account' => $vendor->bank_account,
            'bank_name' => $vendor->bank_name,
            'rating' => $vendor->rating,
            'total_orders' => $vendor->total_orders,
            'onboarding_status' => $vendor->onboarding_status,
            'onboarding_completed_at' => $vendor->onboarding_completed_at,
            'portal_access_enabled' => $vendor->portal_access_enabled,
            'portal_last_access_at' => $vendor->portal_last_access_at,
            'created_at' => $vendor->created_at,
            'updated_at' => $vendor->updated_at,
            'performance_metrics' => [
                'total_quotes' => $totalQuotes,
                'accepted_quotes' => $acceptedQuotes,
                'rejected_quotes' => $rejectedQuotes,
                'pending_quotes' => $pendingQuotes,
                'acceptance_rate' => $acceptanceRate,
                'avg_response_time_hours' => $avgResponseTime !== null ? round($avgResponseTime, 2) : null,
            ],
        ];
    }
}
