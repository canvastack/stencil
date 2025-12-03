<?php

namespace App\Application\Order\Subscribers;

use App\Domain\Order\Events\OrderCancelled;
use App\Domain\Order\Events\OrderCreated;
use App\Domain\Order\Events\OrderDelivered;
use App\Domain\Order\Events\OrderShipped;
use App\Domain\Order\Events\OrderStatusChanged;
use App\Domain\Order\Events\PaymentReceived;
use App\Domain\Order\Listeners\SendOrderNotifications;

class NotificationSubscriber
{
    public function __construct(
        private SendOrderNotifications $sendOrderNotifications
    ) {}

    public function handleOrderCreated(OrderCreated $event): void
    {
        $this->sendOrderNotifications->handleOrderCreated($event);
    }

    public function handleOrderStatusChanged(OrderStatusChanged $event): void
    {
        $this->sendOrderNotifications->handleOrderStatusChanged($event);
    }

    public function handlePaymentReceived(PaymentReceived $event): void
    {
        $this->sendOrderNotifications->handlePaymentReceived($event);
    }

    public function handleOrderShipped(OrderShipped $event): void
    {
        $this->sendOrderNotifications->handleOrderShipped($event);
    }

    public function handleOrderDelivered(OrderDelivered $event): void
    {
        $this->sendOrderNotifications->handleOrderDelivered($event);
    }

    public function handleOrderCancelled(OrderCancelled $event): void
    {
        $this->sendOrderNotifications->handleOrderCancelled($event);
    }

    public function subscribe($events): array
    {
        return [
            OrderCreated::class => 'handleOrderCreated',
            OrderStatusChanged::class => 'handleOrderStatusChanged',
            PaymentReceived::class => 'handlePaymentReceived',
            OrderShipped::class => 'handleOrderShipped',
            OrderDelivered::class => 'handleOrderDelivered',
            OrderCancelled::class => 'handleOrderCancelled',
        ];
    }
}
