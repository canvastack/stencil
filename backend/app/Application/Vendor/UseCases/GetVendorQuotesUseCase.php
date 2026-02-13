<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Queries\GetVendorQuotesQuery;
use Illuminate\Support\Facades\DB;

/**
 * Use Case: Get Vendor Quotes
 * 
 * Retrieves all quotes (order_vendor_negotiations) for a specific vendor.
 * 
 * Business Rules:
 * - Only return quotes for the authenticated vendor
 * - Support filtering by status
 * - Support pagination
 * - Tenant isolation enforced
 * - Return quotes ordered by created_at DESC
 */
final class GetVendorQuotesUseCase
{
    /**
     * Execute query to get vendor quotes
     * 
     * @param GetVendorQuotesQuery $query
     * @return array Paginated quotes data
     */
    public function execute(GetVendorQuotesQuery $query): array
    {
        $queryBuilder = DB::table('order_vendor_negotiations as ovn')
            ->leftJoin('orders as o', 'ovn.order_id', '=', 'o.id')
            ->leftJoin('customers as c', 'o.customer_id', '=', 'c.id')
            ->select(
                'ovn.*',
                'o.uuid as order_uuid',
                'o.order_number',
                'o.status as order_status',
                'o.total_amount',
                'o.created_at as order_created_at',
                'c.name as customer_name',
                'c.email as customer_email',
                'c.company as customer_company'
            )
            ->where('ovn.vendor_id', $query->vendorId)
            ->where('ovn.tenant_id', $query->tenantId)
            ->whereNull('ovn.deleted_at')
            // SECURITY: Vendor should NOT see draft quotes
            // Only show quotes that have been sent to vendor
            ->whereIn('ovn.status', ['sent', 'pending_response', 'accepted', 'rejected', 'countered', 'expired']);

        // Filter by status if provided
        if ($query->status) {
            $queryBuilder->where('ovn.status', $query->status);
        }

        // Get total count
        $total = $queryBuilder->count();

        // Get paginated results
        $quotes = $queryBuilder
            ->orderBy('ovn.created_at', 'desc')
            ->offset(($query->page - 1) * $query->perPage)
            ->limit($query->perPage)
            ->get();

        return [
            'data' => $quotes->map(function ($quote) {
                // Generate quote number from order number and round
                $quoteNumber = $quote->order_number ? "{$quote->order_number}-Q{$quote->round}" : "Q-{$quote->id}";
                
                return [
                    'id' => $quote->id,
                    'uuid' => $quote->uuid,
                    'tenant_id' => $quote->tenant_id,
                    'order_id' => $quote->order_id,
                    'vendor_id' => $quote->vendor_id,
                    'quote_number' => $quoteNumber,
                    'status' => $quote->status,
                    'initial_offer' => $quote->initial_offer,
                    'latest_offer' => $quote->latest_offer,
                    'currency' => $quote->currency,
                    'quote_details' => isset($quote->quote_details) ? json_decode($quote->quote_details, true) : null,
                    'history' => isset($quote->history) ? json_decode($quote->history, true) : [],
                    'round' => $quote->round,
                    'expires_at' => $quote->expires_at,
                    'closed_at' => $quote->closed_at,
                    'created_at' => $quote->created_at,
                    'updated_at' => $quote->updated_at,
                    
                    // Order data
                    'order' => $quote->order_id ? [
                        'id' => $quote->order_id,
                        'uuid' => $quote->order_uuid,
                        'order_number' => $quote->order_number,
                        'customer_name' => $quote->customer_name,
                        'total_amount' => $quote->total_amount,
                        'status' => $quote->order_status,
                        'created_at' => $quote->order_created_at,
                    ] : null,
                    
                    // Unread message count (placeholder - will be implemented later)
                    'unread_message_count' => 0,
                ];
            })->toArray(),
            'pagination' => [
                'total' => $total,
                'per_page' => $query->perPage,
                'current_page' => $query->page,
                'last_page' => (int) ceil($total / $query->perPage),
                'from' => (($query->page - 1) * $query->perPage) + 1,
                'to' => min($query->page * $query->perPage, $total),
            ],
        ];
    }
}
