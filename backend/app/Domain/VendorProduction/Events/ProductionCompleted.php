<?php

namespace App\Domain\VendorProduction\Events;

use App\Models\VendorProductionUpdate;
use App\Models\VendorPurchaseOrder;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Production Completed Event
 * 
 * Dispatched when vendor marks production as completed.
 * Used to trigger completion notifications and next-step workflows.
 */
class ProductionCompleted
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly VendorPurchaseOrder $purchaseOrder,
        public readonly VendorProductionUpdate $finalUpdate
    ) {}

    /**
     * Get the tenant ID for this event
     */
    public function getTenantId(): int
    {
        return $this->purchaseOrder->tenant_id;
    }

    /**
     * Get the completion date
     */
    public function getCompletionDate(): ?\DateTimeInterface
    {
        return $this->finalUpdate->actual_completion_date;
    }

    /**
     * Check if production was completed on time
     */
    public function isOnTime(): bool
    {
        if (!$this->purchaseOrder->expected_delivery_date) {
            return true;
        }

        $completionDate = $this->getCompletionDate();
        if (!$completionDate) {
            return true;
        }

        return $completionDate <= $this->purchaseOrder->expected_delivery_date;
    }

    /**
     * Get days overdue (negative if early)
     */
    public function getDaysOverdue(): int
    {
        if (!$this->purchaseOrder->expected_delivery_date) {
            return 0;
        }

        $completionDate = $this->getCompletionDate();
        if (!$completionDate) {
            return 0;
        }

        $diff = $completionDate->diff($this->purchaseOrder->expected_delivery_date);
        return $diff->invert ? $diff->days : -$diff->days;
    }
}
