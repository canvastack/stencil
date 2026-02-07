<?php

namespace App\Domain\Quote\Services;

use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;

/**
 * Quote Duplication Checker Service
 * 
 * Domain service responsible for detecting duplicate quotes
 * to prevent multiple active quotes for the same order-vendor combination.
 * 
 * Business Rules:
 * - Only one active quote allowed per order-vendor combination
 * - Active statuses: draft, sent, pending_response, countered (rejected, expired, accepted are considered closed)
 * - Rejected, expired, accepted quotes are ignored
 * - Different vendors can have quotes for same order
 */
class QuoteDuplicationChecker
{
    /**
     * Check if a duplicate active quote exists.
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param int $orderId Internal order ID
     * @param int $vendorId Internal vendor ID
     * @param array $statuses Statuses to consider as "active" (default: draft, sent, pending_response, countered)
     * @param int|null $excludeQuoteId Quote ID to exclude from check (for updates)
     * @return bool True if duplicate exists, false otherwise
     */
    public function check(
        int $tenantId,
        int $orderId,
        int $vendorId,
        array $statuses = ['draft', 'sent', 'pending_response', 'countered'],
        ?int $excludeQuoteId = null
    ): bool {
        $query = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('order_id', $orderId)
            ->where('vendor_id', $vendorId)
            ->whereIn('status', $statuses);

        // Exclude specific quote ID if provided (useful for updates)
        if ($excludeQuoteId !== null) {
            $query->where('id', '!=', $excludeQuoteId);
        }

        return $query->exists();
    }

    /**
     * Get existing active quote if it exists.
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param int $orderId Internal order ID
     * @param int $vendorId Internal vendor ID
     * @param array $statuses Statuses to consider as "active"
     * @return OrderVendorNegotiation|null The existing quote or null
     */
    public function getExisting(
        int $tenantId,
        int $orderId,
        int $vendorId,
        array $statuses = ['draft', 'sent', 'pending_response', 'countered']
    ): ?OrderVendorNegotiation {
        return OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('order_id', $orderId)
            ->where('vendor_id', $vendorId)
            ->whereIn('status', $statuses)
            ->with(['order.customer', 'vendor'])
            ->orderBy('created_at', 'desc')
            ->first();
    }

    /**
     * Check if any active quotes exist for an order (any vendor).
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param int $orderId Internal order ID
     * @param array $statuses Statuses to consider as "active"
     * @return bool True if any active quotes exist
     */
    public function hasActiveQuotesForOrder(
        int $tenantId,
        int $orderId,
        array $statuses = ['draft', 'sent', 'pending_response', 'countered']
    ): bool {
        return OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('order_id', $orderId)
            ->whereIn('status', $statuses)
            ->exists();
    }

    /**
     * Count active quotes for an order.
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param int $orderId Internal order ID
     * @param array $statuses Statuses to consider as "active"
     * @return int Number of active quotes
     */
    public function countActiveQuotesForOrder(
        int $tenantId,
        int $orderId,
        array $statuses = ['draft', 'sent', 'pending_response', 'countered']
    ): int {
        return OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('order_id', $orderId)
            ->whereIn('status', $statuses)
            ->count();
    }

    /**
     * Get all active quotes for an order.
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param int $orderId Internal order ID
     * @param array $statuses Statuses to consider as "active"
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getActiveQuotesForOrder(
        int $tenantId,
        int $orderId,
        array $statuses = ['draft', 'sent', 'pending_response', 'countered']
    ) {
        return OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('order_id', $orderId)
            ->whereIn('status', $statuses)
            ->with(['vendor'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Validate that a quote can be created without duplication.
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param int $orderId Internal order ID
     * @param int $vendorId Internal vendor ID
     * @throws \InvalidArgumentException If duplicate exists
     * @return void
     */
    public function validateNoDuplicate(
        int $tenantId,
        int $orderId,
        int $vendorId
    ): void {
        if ($this->check($tenantId, $orderId, $vendorId)) {
            throw new \InvalidArgumentException(
                'An active quote already exists for this order and vendor combination. ' .
                'Please edit the existing quote instead of creating a new one.'
            );
        }
    }
}
