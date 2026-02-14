<?php

namespace App\Application\VendorProduction\UseCases;

use App\Models\VendorProductionUpdate;
use App\Models\VendorPurchaseOrder;
use Illuminate\Support\Collection;

/**
 * Use Case: Get Production Updates
 * 
 * Retrieves all production updates for a purchase order.
 */
class GetProductionUpdatesUseCase
{
    /**
     * Execute the use case
     * 
     * @param string $purchaseOrderUuid
     * @param int $tenantId
     * @param int|null $vendorId Optional vendor ID for authorization
     * @return Collection
     */
    public function execute(string $purchaseOrderUuid, int $tenantId, ?int $vendorId = null): Collection
    {
        // Find purchase order
        $purchaseOrder = VendorPurchaseOrder::where('uuid', $purchaseOrderUuid)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        // If vendor ID provided, validate ownership
        if ($vendorId && $purchaseOrder->vendor_id !== $vendorId) {
            throw new \Exception('Vendor does not own this purchase order');
        }

        // Get all updates with relationships
        return VendorProductionUpdate::where('purchase_order_id', $purchaseOrder->id)
            ->where('tenant_id', $tenantId)
            ->with(['vendor', 'creator'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get recent updates across all purchase orders (admin only)
     * 
     * @param int $tenantId
     * @param int $limit
     * @return Collection
     */
    public function getRecentUpdates(int $tenantId, int $limit = 20): Collection
    {
        return VendorProductionUpdate::where('tenant_id', $tenantId)
            ->with(['purchaseOrder', 'vendor', 'creator'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get milestone updates only
     * 
     * @param string $purchaseOrderUuid
     * @param int $tenantId
     * @return Collection
     */
    public function getMilestones(string $purchaseOrderUuid, int $tenantId): Collection
    {
        $purchaseOrder = VendorPurchaseOrder::where('uuid', $purchaseOrderUuid)
            ->where('tenant_id', $tenantId)
            ->firstOrFail();

        return VendorProductionUpdate::where('purchase_order_id', $purchaseOrder->id)
            ->where('tenant_id', $tenantId)
            ->where('is_milestone', true)
            ->with(['vendor', 'creator'])
            ->orderBy('created_at', 'desc')
            ->get();
    }
}
