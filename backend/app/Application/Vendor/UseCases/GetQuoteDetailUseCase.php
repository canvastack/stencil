<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Queries\GetQuoteDetailQuery;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Use Case: Get Quote Detail
 * 
 * Retrieves detailed information about a specific quote (order_vendor_negotiation).
 * 
 * Business Rules:
 * - Only return quote if it belongs to the authenticated vendor
 * - Tenant isolation enforced
 * - Include related order information
 * - Include product details if available
 */
final class GetQuoteDetailUseCase
{
    /**
     * Execute query to get quote detail
     * 
     * @param GetQuoteDetailQuery $query
     * @return array Quote detail data
     * @throws InvalidArgumentException If quote not found or access denied
     */
    public function execute(GetQuoteDetailQuery $query): array
    {
        // Get quote with related data
        $quote = DB::table('order_vendor_negotiations as ovn')
            ->leftJoin('orders as o', 'ovn.order_id', '=', 'o.id')
            ->leftJoin('customers as c', 'o.customer_id', '=', 'c.id')
            ->leftJoin('products as p', 'ovn.product_id', '=', 'p.id')
            ->select(
                'ovn.*',
                'o.uuid as order_uuid',
                'o.order_number',
                'o.status as order_status',
                'o.total_amount as order_total',
                'o.created_at as order_created_at',
                'c.name as customer_name',
                'c.email as customer_email',
                'c.phone as customer_phone',
                'p.name as product_name',
                'p.sku as product_sku'
            )
            ->where('ovn.uuid', $query->quoteUuid)
            ->where('ovn.vendor_id', $query->vendorId)
            ->where('ovn.tenant_id', $query->tenantId)
            ->whereNull('ovn.deleted_at')
            // SECURITY: Vendor should NOT see draft quotes
            // Only show quotes that have been sent to vendor
            ->whereIn('ovn.status', ['sent', 'pending_response', 'accepted', 'rejected', 'countered', 'admin_countered', 'expired'])
            ->first();

        if (!$quote) {
            throw new InvalidArgumentException('Quote not found or access denied');
        }

        // Generate quote number
        $quoteNumber = $quote->order_number ? "{$quote->order_number}-Q{$quote->round}" : "Q-{$quote->id}";

        // Parse quote_details to extract items
        $quoteDetails = isset($quote->quote_details) ? json_decode($quote->quote_details, true) : null;
        $items = $quoteDetails['items'] ?? [];
        
        // SECURITY: Filter items to remove customer pricing and profit margins
        // Vendors should ONLY see vendor_cost, NOT unit_price/total_price
        $vendorSafeItems = array_map(function ($item) {
            return [
                'id' => $item['id'] ?? null,
                'product_id' => $item['product_id'] ?? null,
                'product_name' => $item['product_name'] ?? $item['description'] ?? '',
                'description' => $item['description'] ?? '',
                'quantity' => $item['quantity'] ?? 1,
                // ONLY vendor_cost - NEVER unit_price or total_price
                'vendor_cost' => $item['vendor_cost'] ?? 0,
                'total_vendor_cost' => $item['total_vendor_cost'] ?? ($item['vendor_cost'] ?? 0) * ($item['quantity'] ?? 1),
                'specifications' => $item['specifications'] ?? [],
                'notes' => $item['notes'] ?? null,
                'unit' => $item['unit'] ?? 'pcs',
            ];
        }, $items);

        // Extract admin counter offer if exists and format for frontend
        $adminCounterOffer = null;
        if (isset($quoteDetails['admin_counter_offer'])) {
            $rawAdminCounter = $quoteDetails['admin_counter_offer'];
            $vendorCounter = $quoteDetails['counter_offer'] ?? null;
            
            // Format admin counter offer for frontend display
            $formattedItems = [];
            $totalAdminCounter = 0;
            $totalVendorCounter = 0;
            
            foreach ($rawAdminCounter['items'] as $adminItem) {
                // Find matching vendor counter item
                $vendorItem = null;
                if ($vendorCounter && isset($vendorCounter['items'])) {
                    foreach ($vendorCounter['items'] as $vItem) {
                        if ($vItem['product_id'] == $adminItem['product_id']) {
                            $vendorItem = $vItem;
                            break;
                        }
                    }
                }
                
                // Get quantity from items array
                $quantity = 1;
                foreach ($items as $item) {
                    if ($item['product_id'] == $adminItem['product_id']) {
                        $quantity = $item['quantity'] ?? 1;
                        break;
                    }
                }
                
                $adminUnitPrice = $adminItem['admin_counter_unit_price'] ?? 0;
                $vendorUnitPrice = $vendorItem['counter_unit_price'] ?? 0;
                
                $adminTotalPrice = $adminUnitPrice * $quantity;
                $vendorTotalPrice = $vendorUnitPrice * $quantity;
                
                $totalAdminCounter += $adminTotalPrice;
                $totalVendorCounter += $vendorTotalPrice;
                
                $formattedItems[] = [
                    'product_id' => $adminItem['product_id'],
                    'product_name' => $vendorItem['product_name'] ?? '',
                    'quantity' => $quantity,
                    'vendor_counter_unit_price' => $vendorUnitPrice,
                    'vendor_counter_total_price' => $vendorTotalPrice,
                    'admin_counter_unit_price' => $adminUnitPrice,
                    'admin_counter_total_price' => $adminTotalPrice,
                    'difference_amount' => $adminTotalPrice - $vendorTotalPrice,
                    'notes' => $adminItem['notes'] ?? null,
                ];
            }
            
            $adminCounterOffer = [
                'items' => $formattedItems,
                'total_admin_counter' => $totalAdminCounter,
                'total_vendor_counter' => $totalVendorCounter,
                'total_difference' => $totalAdminCounter - $totalVendorCounter,
                'notes' => $rawAdminCounter['notes'] ?? null,
                'submitted_at' => $quoteDetails['negotiation_history'][count($quoteDetails['negotiation_history']) - 1]['timestamp'] ?? null,
                'round' => $quote->round,
            ];
        }
        
        $negotiationHistory = $quoteDetails['negotiation_history'] ?? [];
        $maxRounds = $quoteDetails['max_rounds'] ?? 5;

        return [
            'id' => $quote->id,
            'uuid' => $quote->uuid,
            'tenant_id' => $quote->tenant_id,
            'order_id' => $quote->order_id,
            'vendor_id' => $quote->vendor_id,
            'product_id' => $quote->product_id,
            'quote_number' => $quoteNumber,
            'status' => $quote->status,
            'initial_offer' => $quote->initial_offer,
            'latest_offer' => $quote->latest_offer,
            'currency' => $quote->currency,
            'quote_details' => $quoteDetails,
            'items' => $vendorSafeItems, // Filtered items without customer pricing
            'history' => isset($quote->history) ? json_decode($quote->history, true) : [],
            'round' => $quote->round,
            'current_round' => $quote->round,
            'max_rounds' => $maxRounds,
            'admin_counter_offer' => $adminCounterOffer,
            'negotiation_history' => $negotiationHistory,
            'expires_at' => $quote->expires_at,
            'closed_at' => $quote->closed_at,
            'created_at' => $quote->created_at,
            'updated_at' => $quote->updated_at,
            'sent_at' => $quote->sent_at ?? null,
            'responded_at' => $quote->responded_at ?? null,
            'order' => [
                'id' => $quote->order_id,
                'uuid' => $quote->order_uuid,
                'order_number' => $quote->order_number,
                'status' => $quote->order_status,
                'total_amount' => $quote->order_total,
                'created_at' => $quote->order_created_at,
            ],
            'customer' => [
                'name' => $quote->customer_name,
                'email' => $quote->customer_email,
                'phone' => $quote->customer_phone,
            ],
            'product' => $quote->product_id ? [
                'name' => $quote->product_name,
                'sku' => $quote->product_sku,
            ] : null,
            'unread_message_count' => 0,
        ];
    }
}
