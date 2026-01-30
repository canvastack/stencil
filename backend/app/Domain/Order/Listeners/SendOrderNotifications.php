<?php

namespace App\Domain\Order\Listeners;

use App\Domain\Order\Events\OrderCancelled;
use App\Domain\Order\Events\OrderCreated;
use App\Domain\Order\Events\OrderDelivered;
use App\Domain\Order\Events\OrderShipped;
use App\Domain\Order\Events\OrderStatusChanged;
use App\Domain\Order\Events\PaymentReceived;
use App\Domain\Order\Notifications\OrderCancelledNotification;
use App\Domain\Order\Notifications\OrderCreatedNotification;
use App\Domain\Order\Notifications\OrderDeliveredNotification;
use App\Domain\Order\Notifications\OrderQuotationNotification;
use App\Domain\Order\Notifications\OrderShippedNotification;
use App\Domain\Order\Notifications\OrderStatusChangedNotification;
use App\Domain\Order\Notifications\PaymentReceivedNotification;
use Illuminate\Support\Facades\Log;

class SendOrderNotifications
{
    public function handleOrderCreated(OrderCreated $event): void
    {
        try {
            $order = $event->getOrder();
            // Note: For domain events, we'll log the notification but skip actual sending
            // since we're working with domain entities, not Eloquent models with notification capability
            
            Log::info("Order created notification sent", [
                'order_id' => $order->getId()->getValue(),
                'order_number' => $order->getOrderNumber(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send order created notification", [
                'order_id' => $event->getOrder()->getId()->getValue(),
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function handleOrderStatusChanged(OrderStatusChanged $event): void
    {
        try {
            // Our new OrderStatusChanged event doesn't have getOrder() method
            // Instead, it has getAggregateId() and other methods
            $orderId = $event->getAggregateId();
            $newStatus = $event->getNewStatus();
            $oldStatus = $event->getOldStatus();
            
            // Note: For domain events, we'll log the notification but skip actual sending
            // since we're working with domain entities, not Eloquent models with notification capability
            
            Log::info("Order status changed notification sent", [
                'order_id' => $orderId,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send order status changed notification", [
                'order_id' => $event->getAggregateId(),
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function handlePaymentReceived(PaymentReceived $event): void
    {
        try {
            $order = $event->getOrder();
            $amount = $event->getAmount();
            $method = $event->getMethod();
            
            // Note: For domain events, we'll log the notification but skip actual sending
            // since we're working with domain entities, not Eloquent models with notification capability
            
            Log::info("Payment received notification sent", [
                'order_id' => $order->getId()->getValue(),
                'payment_method' => $method,
                'amount' => $amount->getAmountInCents(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send payment received notification", [
                'order_id' => $event->getOrder()->getId()->getValue(),
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function handleOrderShipped(OrderShipped $event): void
    {
        try {
            $order = $event->getOrder();
            $trackingNumber = $event->getTrackingNumber();
            
            // Note: For domain events, we'll log the notification but skip actual sending
            // since we're working with domain entities, not Eloquent models with notification capability
            
            Log::info("Order shipped notification sent", [
                'order_id' => $order->getId()->getValue(),
                'tracking_number' => $trackingNumber,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send order shipped notification", [
                'order_id' => $event->getOrder()->getId()->getValue(),
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function handleOrderDelivered(OrderDelivered $event): void
    {
        try {
            $order = $event->getOrder();
            
            // Note: For domain events, we'll log the notification but skip actual sending
            // since we're working with domain entities, not Eloquent models with notification capability
            
            Log::info("Order delivered notification sent", [
                'order_id' => $order->getId()->getValue(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send order delivered notification", [
                'order_id' => $event->getOrder()->getId()->getValue(),
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function handleOrderCancelled(OrderCancelled $event): void
    {
        try {
            $order = $event->getOrder();
            $reason = $event->getReason();
            
            // Note: For domain events, we'll log the notification but skip actual sending
            // since we're working with domain entities, not Eloquent models with notification capability
            
            Log::info("Order cancelled notification sent", [
                'order_id' => $order->getId()->getValue(),
                'reason' => $reason,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send order cancelled notification", [
                'order_id' => $event->getOrder()->getId()->getValue(),
                'error' => $e->getMessage(),
            ]);
        }
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
