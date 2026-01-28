<?php

namespace App\Domain\Order\Listeners;

use App\Domain\Order\Events\ProductionCompleted;
use App\Domain\Order\Events\PaymentReceived;
use Illuminate\Support\Facades\Log;

class TriggerInvoiceGeneration
{
    public function handle($event): void
    {
        if ($event instanceof PaymentReceived) {
            $this->handlePaymentReceived($event);
        } elseif ($event instanceof ProductionCompleted) {
            $this->handleOrderCompleted($event);
        }
    }

    public function handlePaymentReceived(PaymentReceived $event): void
    {
        $this->generateInvoice($event->getOrder());
    }

    public function handleOrderCompleted(ProductionCompleted $event): void
    {
        $this->generateInvoice($event->getOrder());
    }

    private function generateInvoice($order): void
    {
        try {
            if (!$order) {
                Log::warning("Cannot generate invoice: order not found");
                return;
            }

            // For now, just log the invoice generation since we don't have full infrastructure
            Log::info("Invoice would be generated for order", [
                'order_id' => $order->getId()->getValue(),
                'order_number' => $order->getOrderNumber(),
                'total_amount' => $order->getTotalAmount()->getAmountInCents(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to process invoice generation", [
                'order_id' => $order->getId()->getValue() ?? null,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function subscribe($events): array
    {
        return [
            PaymentReceived::class => 'handlePaymentReceived',
            ProductionCompleted::class => 'handleOrderCompleted',
        ];
    }
}
