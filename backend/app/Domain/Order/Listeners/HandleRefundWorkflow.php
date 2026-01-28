<?php

namespace App\Domain\Order\Listeners;

use App\Domain\Order\Events\RefundProcessed;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class HandleRefundWorkflow
{
    public function handle(RefundProcessed $event): void
    {
        try {
            $order = $event->getOrder();
            $refundAmount = $event->getRefundAmount();
            $refundReason = $event->getRefundReason();
            
            // For now, just log the event since we don't have full infrastructure set up
            Log::info("Refund workflow would be processed", [
                'order_id' => $order->getId()->getValue(),
                'refund_amount' => $refundAmount->getAmountInCents(),
                'refund_reason' => $refundReason,
                'transaction_reference' => $event->getTransactionReference(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to process refund workflow", [
                'order_id' => $event->getOrder()->getId()->getValue(),
                'error' => $e->getMessage(),
            ]);
        }
    }
}
