<?php

namespace App\Domain\Order\Listeners;

use App\Domain\Order\Events\OrderShipped;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendShippingNotification
{
    public function handle(OrderShipped $event): void
    {
        try {
            $order = $event->getOrder();
            $trackingNumber = $event->getTrackingNumber();
            
            // For now, just log the event since we don't have mail infrastructure set up
            Log::info("Shipping notification would be sent to customer", [
                'order_id' => $order->getId()->getValue(),
                'customer_id' => $order->getCustomerId()->getValue(),
                'tracking_number' => $trackingNumber,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to process shipping notification", [
                'order_id' => $event->getOrder()->getId()->getValue(),
                'tracking_number' => $event->getTrackingNumber(),
                'error' => $e->getMessage(),
            ]);
        }
    }
}
