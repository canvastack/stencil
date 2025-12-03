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
            $vendor = $event->order->vendor;
            
            if (!$vendor || !$vendor->email) {
                Log::warning("Cannot send vendor assignment email: vendor not found or missing email", [
                    'order_id' => $event->order->id,
                    'vendor_id' => $event->vendorId,
                ]);
                return;
            }

            Mail::to($vendor->email)->send(new \App\Domain\Order\Mails\VendorAssignmentMail(
                $event->order,
                $vendor
            ));

            Log::info("Vendor assignment email sent", [
                'order_id' => $event->order->id,
                'vendor_id' => $vendor->id,
                'vendor_email' => $vendor->email,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send vendor assignment email", [
                'order_id' => $event->order->id,
                'vendor_id' => $event->vendorId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
