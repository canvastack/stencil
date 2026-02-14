<?php

namespace App\Domain\VendorProduction\Events;

use App\Models\VendorProductionUpdate;
use App\Models\VendorPurchaseOrder;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Production Update Created Event
 * 
 * Dispatched when a vendor creates a new production update.
 * Used to trigger notifications to admin users.
 */
class ProductionUpdateCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly VendorProductionUpdate $update,
        public readonly VendorPurchaseOrder $purchaseOrder
    ) {}

    /**
     * Get the tenant ID for this event
     */
    public function getTenantId(): int
    {
        return $this->update->tenant_id;
    }

    /**
     * Get the vendor ID
     */
    public function getVendorId(): int
    {
        return $this->update->vendor_id;
    }

    /**
     * Get the update status
     */
    public function getStatus(): string
    {
        return $this->update->status;
    }

    /**
     * Get the progress percentage
     */
    public function getProgressPercentage(): int
    {
        return $this->update->progress_percentage;
    }

    /**
     * Check if this is a milestone update
     */
    public function isMilestone(): bool
    {
        return $this->update->is_milestone;
    }

    /**
     * Check if this is a critical update (completed or delayed)
     */
    public function isCritical(): bool
    {
        return in_array($this->update->status, ['completed', 'delayed'], true);
    }
}
