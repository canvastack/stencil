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
            $order = $event->order;
            $customer = $order->customer;
            
            if (!$customer || !$customer->email) {
                Log::warning("Cannot send shipping notification: customer not found or missing email", [
                    'order_id' => $order->id,
                    'customer_id' => $order->customer_id,
                ]);
                return;
            }

            Mail::to($customer->email)->send(new \App\Domain\Order\Mails\ShippingNotificationMail(
                $order,
                $event->trackingNumber
            ));

            Log::info("Shipping notification email sent", [
                'order_id' => $order->id,
                'customer_id' => $customer->id,
                'customer_email' => $customer->email,
                'tracking_number' => $event->trackingNumber,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send shipping notification", [
                'order_id' => $event->order->id,
                'tracking_number' => $event->trackingNumber,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
