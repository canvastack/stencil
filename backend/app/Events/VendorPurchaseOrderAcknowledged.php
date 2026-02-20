<?php

namespace App\Events;

use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event fired when vendor acknowledges a purchase order
 * 
 * Requirements: 20.7 - Track vendor acknowledgment
 */
class VendorPurchaseOrderAcknowledged
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public OrderDocument $purchaseOrder,
        public int $vendorUserId,
        public ?string $notes = null
    ) {
    }
}
