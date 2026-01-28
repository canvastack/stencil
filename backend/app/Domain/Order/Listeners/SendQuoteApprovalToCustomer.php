<?php

namespace App\Domain\Order\Listeners;

use App\Domain\Order\Events\QuoteApproved;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendQuoteApprovalToCustomer
{
    public function handle(QuoteApproved $event): void
    {
        try {
            $order = $event->getOrder();
            $approvedPrice = $event->getApprovedPrice();
            $approvalNotes = $event->getApprovalNotes();
            
            // For now, just log the event since we don't have mail infrastructure set up
            Log::info("Quote approval notification would be sent to customer", [
                'order_id' => $order->getId()->getValue(),
                'customer_id' => $order->getCustomerId()->getValue(),
                'approved_price' => $approvedPrice,
                'approval_notes' => $approvalNotes,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to process quote approval notification", [
                'order_id' => $event->getOrder()->getId()->getValue(),
                'error' => $e->getMessage(),
            ]);
        }
    }
}
