<?php

namespace App\Application\Order\Subscribers;

use App\Domain\Order\Events\OrderCancelled;
use App\Domain\Order\Events\ProductionCompleted;
use App\Domain\Order\Events\OrderShipped;
use App\Domain\Order\Events\VendorAssigned;
use App\Domain\Order\Events\QuoteRequested;
use App\Domain\Order\Events\QuoteApproved;
use App\Domain\Order\Listeners\SendVendorAssignmentEmail;
use App\Domain\Order\Listeners\SendQuoteRequestToVendor;
use App\Domain\Order\Listeners\SendQuoteApprovalToCustomer;
use App\Domain\Order\Listeners\UpdateInventoryOnOrderComplete;
use App\Domain\Order\Listeners\SendShippingNotification;
use App\Domain\Order\Listeners\ProcessOrderCompletion;

class OrderWorkflowSubscriber
{
    public function __construct(
        private SendVendorAssignmentEmail $sendVendorAssignmentEmail,
        private SendQuoteRequestToVendor $sendQuoteRequestToVendor,
        private SendQuoteApprovalToCustomer $sendQuoteApprovalToCustomer,
        private UpdateInventoryOnOrderComplete $updateInventoryOnOrderComplete,
        private SendShippingNotification $sendShippingNotification,
        private ProcessOrderCompletion $processOrderCompletion
    ) {}

    public function handleVendorAssigned(VendorAssigned $event): void
    {
        $this->sendVendorAssignmentEmail->handle($event);
    }

    public function handleQuoteRequested(QuoteRequested $event): void
    {
        $this->sendQuoteRequestToVendor->handle($event);
    }

    public function handleQuoteApproved(QuoteApproved $event): void
    {
        $this->sendQuoteApprovalToCustomer->handle($event);
    }

    public function handleOrderShipped(OrderShipped $event): void
    {
        $this->sendShippingNotification->handle($event);
    }

    public function handleOrderCompleted(ProductionCompleted $event): void
    {
        $this->updateInventoryOnOrderComplete->handle($event);
        // ProcessOrderCompletion should handle OrderDelivered, not ProductionCompleted
        // We'll create an OrderDelivered event from ProductionCompleted
        $orderDeliveredEvent = new \App\Domain\Order\Events\OrderDelivered($event->getOrder());
        $this->processOrderCompletion->handle($orderDeliveredEvent);
    }

    public function subscribe($events): array
    {
        return [
            VendorAssigned::class => 'handleVendorAssigned',
            QuoteRequested::class => 'handleQuoteRequested',
            QuoteApproved::class => 'handleQuoteApproved',
            OrderShipped::class => 'handleOrderShipped',
            ProductionCompleted::class => 'handleOrderCompleted',
        ];
    }
}
