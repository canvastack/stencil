<?php

namespace App\Domain\VendorProduction\Events;

use App\Models\VendorPurchaseOrder;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Production Status Changed Event
 * 
 * Dispatched when production status changes (e.g., started -> in_progress).
 * Used to trigger status-specific notifications.
 */
class ProductionStatusChanged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly VendorPurchaseOrder $purchaseOrder,
        public readonly ?string $oldStatus,
        public readonly string $newStatus,
        public readonly int $progressPercentage
    ) {}

    /**
     * Get the tenant ID for this event
     */
    public function getTenantId(): int
    {
        return $this->purchaseOrder->tenant_id;
    }

    /**
     * Check if this is a critical status change
     */
    public function isCritical(): bool
    {
        return in_array($this->newStatus, ['completed', 'delayed'], true);
    }

    /**
     * Check if production just started
     */
    public function isProductionStarted(): bool
    {
        return $this->newStatus === 'started' && $this->oldStatus === null;
    }

    /**
     * Check if production is completed
     */
    public function isCompleted(): bool
    {
        return $this->newStatus === 'completed';
    }

    /**
     * Check if production is delayed
     */
    public function isDelayed(): bool
    {
        return $this->newStatus === 'delayed';
    }
}
