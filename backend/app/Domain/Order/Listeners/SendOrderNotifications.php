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
            if ($event->order->customer) {
                $event->order->customer->notify(new OrderCreatedNotification($event->order));
            }
            
            Log::info("Order created notification sent", [
                'order_id' => $event->order->id,
                'order_number' => $event->order->order_number,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send order created notification", [
                'order_id' => $event->order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function handleOrderStatusChanged(OrderStatusChanged $event): void
    {
        try {
            if (!$event->order->customer) {
                return;
            }

            switch ($event->newStatus) {
                case 'customer_quotation':
                    if (isset($event->metadata['quotation_amount'])) {
                        $event->order->customer->notify(
                            new OrderQuotationNotification(
                                $event->order, 
                                $event->metadata['quotation_amount']
                            )
                        );
                    }
                    break;

                case 'in_production':
                case 'quality_check':
                case 'ready_to_ship':
                    $event->order->customer->notify(
                        new OrderStatusChangedNotification(
                            $event->order,
                            $event->oldStatus,
                            $event->newStatus
                        )
                    );
                    break;
            }

            Log::info("Order status changed notification sent", [
                'order_id' => $event->order->id,
                'old_status' => $event->oldStatus,
                'new_status' => $event->newStatus,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send order status changed notification", [
                'order_id' => $event->order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function handlePaymentReceived(PaymentReceived $event): void
    {
        try {
            if ($event->order->customer) {
                $event->order->customer->notify(
                    new PaymentReceivedNotification($event->order, $event->paymentMethod, $event->amount)
                );
            }

            Log::info("Payment received notification sent", [
                'order_id' => $event->order->id,
                'payment_method' => $event->paymentMethod,
                'amount' => $event->amount,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send payment received notification", [
                'order_id' => $event->order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function handleOrderShipped(OrderShipped $event): void
    {
        try {
            if ($event->order->customer) {
                $event->order->customer->notify(
                    new OrderShippedNotification($event->order, $event->trackingNumber)
                );
            }

            Log::info("Order shipped notification sent", [
                'order_id' => $event->order->id,
                'tracking_number' => $event->trackingNumber,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send order shipped notification", [
                'order_id' => $event->order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function handleOrderDelivered(OrderDelivered $event): void
    {
        try {
            if ($event->order->customer) {
                $event->order->customer->notify(new OrderDeliveredNotification($event->order));
            }

            Log::info("Order delivered notification sent", [
                'order_id' => $event->order->id,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send order delivered notification", [
                'order_id' => $event->order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function handleOrderCancelled(OrderCancelled $event): void
    {
        try {
            if ($event->order->customer) {
                $event->order->customer->notify(
                    new OrderCancelledNotification($event->order, $event->reason)
                );
            }

            Log::info("Order cancelled notification sent", [
                'order_id' => $event->order->id,
                'reason' => $event->reason,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to send order cancelled notification", [
                'order_id' => $event->order->id,
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
