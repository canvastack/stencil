<?php

namespace App\Domain\Order\Listeners;

use App\Domain\Order\Events\OrderDelivered;
use Illuminate\Support\Facades\Log;

class ProcessOrderCompletion
{
    public function handle(OrderDelivered $event): void
    {
        try {
            $order = $event->getOrder();
            
            // For now, just log the event since we don't have full infrastructure set up
            Log::info("Order completion processing would be performed", [
                'order_id' => $order->getId()->getValue(),
                'order_number' => $order->getOrderNumber(),
                'customer_id' => $order->getCustomerId()->getValue(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to process order completion", [
                'order_id' => $event->getOrder()->getId()->getValue(),
                'error' => $e->getMessage(),
            ]);
        }
    }
}
