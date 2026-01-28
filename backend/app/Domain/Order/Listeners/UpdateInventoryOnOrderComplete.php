<?php

namespace App\Domain\Order\Listeners;

use App\Domain\Order\Events\ProductionCompleted;
use Illuminate\Support\Facades\Log;

class UpdateInventoryOnOrderComplete
{
    public function handle(ProductionCompleted $event): void
    {
        try {
            $order = $event->getOrder();
            
            // For now, just log the event since we don't have inventory management set up
            Log::info("Inventory would be updated for order completion", [
                'order_id' => $order->getId()->getValue(),
                'order_number' => $order->getOrderNumber(),
                'quality_score' => $event->getQualityScore(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to process inventory update on order completion", [
                'order_id' => $event->getOrder()->getId()->getValue(),
                'error' => $e->getMessage(),
            ]);
        }
    }
}
