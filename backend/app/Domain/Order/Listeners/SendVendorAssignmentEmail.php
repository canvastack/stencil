<?php

namespace App\Domain\Order\Listeners;

use App\Domain\Order\Events\VendorAssigned;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendVendorAssignmentEmail
{
    public function handle(VendorAssigned $event): void
    {
        try {
            $order = $event->getOrder();
            $vendorId = $event->getVendorId();
            
            // For now, just log the event since we don't have mail infrastructure set up
            Log::info("Vendor assignment email would be sent", [
                'order_id' => $order->getId()->getValue(),
                'vendor_id' => $vendorId->getValue(),
                'order_number' => $order->getOrderNumber(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to process vendor assignment email", [
                'order_id' => $event->getOrder()->getId()->getValue(),
                'vendor_id' => $event->getVendorId()->getValue(),
                'error' => $e->getMessage(),
            ]);
        }
    }
}
