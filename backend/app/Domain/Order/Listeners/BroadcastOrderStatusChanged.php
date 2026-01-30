<?php

namespace App\Domain\Order\Listeners;

use App\Domain\Order\Events\OrderStatusChanged;
use App\Events\OrderStatusChangedBroadcast;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Broadcast Order Status Changed Listener
 * 
 * Bridges domain events to Laravel broadcast events for real-time updates.
 */
class BroadcastOrderStatusChanged implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Determine if the listener should be queued.
     */
    public function shouldQueue(): bool
    {
        // Don't queue in testing environment to avoid tenant issues
        return !app()->environment('testing');
    }

    /**
     * Handle the event.
     */
    public function handle(OrderStatusChanged $event): void
    {
        try {
            // Only broadcast if the event should be broadcast
            if (!$event->shouldBroadcast()) {
                return;
            }

            // Find the order
            $order = Order::where('uuid', $event->getAggregateId())->first();
            
            if (!$order) {
                Log::warning('Order not found for broadcast event', [
                    'order_id' => $event->getAggregateId(),
                    'event' => $event->getEventName()
                ]);
                return;
            }

            // Dispatch the broadcast event
            broadcast(new OrderStatusChangedBroadcast(
                $order,
                $event->getOldStatus(),
                $event->getNewStatus(),
                $event->getChangedBy(),
                $event->getReason()
            ));

            Log::info('Order status change broadcasted', [
                'order_id' => $order->uuid,
                'order_number' => $order->order_number,
                'old_status' => $event->getOldStatus(),
                'new_status' => $event->getNewStatus(),
                'tenant_id' => $event->getTenantId()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to broadcast order status changed event', [
                'order_id' => $event->getAggregateId(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Re-throw to trigger retry mechanism
            throw $e;
        }
    }
}