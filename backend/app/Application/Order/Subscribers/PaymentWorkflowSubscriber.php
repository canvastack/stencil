<?php

namespace App\Application\Order\Subscribers;

use App\Domain\Order\Events\PaymentReceived;
use App\Domain\Order\Events\RefundProcessed;
use App\Domain\Order\Listeners\TriggerInvoiceGeneration;
use App\Domain\Order\Listeners\HandleRefundWorkflow;

class PaymentWorkflowSubscriber
{
    public function __construct(
        private TriggerInvoiceGeneration $triggerInvoiceGeneration,
        private HandleRefundWorkflow $handleRefundWorkflow
    ) {}

    public function handlePaymentReceived(PaymentReceived $event): void
    {
        $this->triggerInvoiceGeneration->handle($event);
    }

    public function handleRefundProcessed(RefundProcessed $event): void
    {
        $this->handleRefundWorkflow->handle($event);
    }

    public function subscribe($events): array
    {
        return [
            PaymentReceived::class => 'handlePaymentReceived',
            RefundProcessed::class => 'handleRefundProcessed',
        ];
    }
}
