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
            $customer = $event->order->customer;
            
            if (!$customer || !$customer->email) {
                Log::warning("Cannot send quote approval: customer not found or missing email", [
                    'order_id' => $event->order->id,
                    'customer_id' => $event->order->customer_id,
                ]);
                return;
            }

            Mail::to($customer->email)->send(new \App\Domain\Order\Mails\QuoteApprovalMail(
                $event->order,
                $event->approvedPrice,
                $event->approvalNotes
            ));

            Log::info("Quote approval email sent to customer", [
                'order_id' => $event->order->id,
                'customer_id' => $customer->id,
                'customer_email' => $customer->email,
                'approved_price' => $event->approvedPrice,
                'approval_notes' => $event->approvalNotes,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send quote approval email", [
                'order_id' => $event->order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
