<?php

namespace App\Domain\Order\Listeners;

use App\Domain\Order\Events\QuoteRequested;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendQuoteRequestToVendor
{
    public function handle(QuoteRequested $event): void
    {
        try {
            $order = $event->getOrder();
            $vendorId = $event->getVendorId();
            $quotedPrice = $event->getQuotedPrice();
            $leadTimeDays = $event->getLeadTimeDays();
            
            // For now, just log the event since we don't have mail infrastructure set up
            Log::info("Quote request would be sent to vendor", [
                'order_id' => $order->getId()->getValue(),
                'vendor_id' => $vendorId,
                'quoted_price' => $quotedPrice,
                'lead_time_days' => $leadTimeDays,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to process quote request", [
                'order_id' => $event->getOrder()->getId()->getValue(),
                'error' => $e->getMessage(),
            ]);
        }
    }
}
