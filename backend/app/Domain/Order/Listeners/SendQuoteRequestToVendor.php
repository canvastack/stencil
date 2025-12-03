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
            $vendor = $event->order->vendor;
            
            if (!$vendor || !$vendor->email) {
                Log::warning("Cannot send quote request: vendor not found or missing email", [
                    'order_id' => $event->order->id,
                    'vendor_id' => $event->order->vendor_id,
                ]);
                return;
            }

            Mail::to($vendor->email)->send(new \App\Domain\Order\Mails\QuoteRequestMail(
                $event->order,
                $event->vendorId,
                $event->quotedPrice,
                $event->leadTimeDays
            ));

            Log::info("Quote request email sent to vendor", [
                'order_id' => $event->order->id,
                'vendor_id' => $event->vendorId,
                'vendor_email' => $vendor->email,
                'quoted_price' => $event->quotedPrice,
                'lead_time_days' => $event->leadTimeDays,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send quote request email", [
                'order_id' => $event->order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
