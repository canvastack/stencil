<?php

namespace App\Domain\Order\Listeners;

use App\Domain\Order\Events\OrderStatusChanged;
use App\Domain\Order\Notifications\OrderStatusChangedNotification;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Spatie\Multitenancy\Jobs\TenantAware;

/**
 * Order Status Changed Listener
 * 
 * Handles the OrderStatusChanged domain event by:
 * - Sending notifications to relevant users
 * - Logging the status change
 * - Broadcasting real-time updates
 */
class OrderStatusChangedListener implements ShouldQueue, TenantAware
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
            // Find the order
            $order = Order::where('uuid', $event->getAggregateId())->first();
            
            if (!$order) {
                Log::warning('Order not found for status change event', [
                    'order_id' => $event->getAggregateId(),
                    'event' => $event->getEventName()
                ]);
                return;
            }

            // Log the status change
            Log::info('Order status changed', [
                'order_id' => $order->uuid,
                'order_number' => $order->order_number,
                'old_status' => $event->getOldStatus(),
                'new_status' => $event->getNewStatus(),
                'changed_by' => $event->getChangedBy(),
                'reason' => $event->getReason(),
                'tenant_id' => $event->getTenantId()
            ]);

            // Send notifications if configured
            if ($event->shouldNotifyByEmail()) {
                $this->sendNotifications($order, $event);
            }

            // Store notification in database for in-app notifications
            $this->storeInAppNotification($order, $event);

        } catch (\Exception $e) {
            Log::error('Failed to handle order status changed event', [
                'order_id' => $event->getAggregateId(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Re-throw to trigger retry mechanism
            throw $e;
        }
    }

    /**
     * Send notifications to relevant users
     */
    private function sendNotifications(Order $order, OrderStatusChanged $event): void
    {
        $notification = new OrderStatusChangedNotification(
            $order,
            $event->getOldStatus(),
            $event->getNewStatus()
        );

        // Notify customer
        if ($order->customer) {
            $order->customer->notify($notification);
        }

        // Notify admin users for critical changes
        if ($event->isCriticalChange()) {
            $this->notifyAdminUsers($order, $notification);
        }

        // Note: Vendor notifications should be sent to vendor contact persons (users)
        // not to the vendor entity directly. This should be handled separately
        // through vendor user relationships when that feature is implemented.
    }

    /**
     * Store in-app notification for real-time display
     */
    private function storeInAppNotification(Order $order, OrderStatusChanged $event): void
    {
        // Create notification for customer if exists
        if ($order->customer) {
            $order->customer->notifications()->create([
                'id' => \Illuminate\Support\Str::uuid(),
                'type' => OrderStatusChangedNotification::class,
                'data' => [
                    'order_id' => $order->id,
                    'order_uuid' => $order->uuid,
                    'order_number' => $order->order_number,
                    'old_status' => $event->getOldStatus(),
                    'new_status' => $event->getNewStatus(),
                    'message' => $this->getNotificationMessage($order, $event),
                    'is_critical' => $event->isCriticalChange(),
                    'changed_by' => $event->getChangedBy(),
                    'reason' => $event->getReason(),
                ],
                'read_at' => null,
                'created_at' => $event->getOccurredAt(),
                'updated_at' => $event->getOccurredAt(),
            ]);
        }
        
        // Create notification records for relevant users
        $users = $this->getRelevantUsers($order);
        
        foreach ($users as $user) {
            $user->notifications()->create([
                'id' => \Illuminate\Support\Str::uuid(),
                'type' => OrderStatusChangedNotification::class,
                'notifiable_type' => get_class($user),
                'notifiable_id' => $user->id,
                'data' => [
                    'order_id' => $order->id,
                    'order_uuid' => $order->uuid,
                    'order_number' => $order->order_number,
                    'old_status' => $event->getOldStatus(),
                    'new_status' => $event->getNewStatus(),
                    'message' => $this->getNotificationMessage($order, $event),
                    'is_critical' => $event->isCriticalChange(),
                    'changed_by' => $event->getChangedBy(),
                    'reason' => $event->getReason(),
                ],
                'read_at' => null,
                'created_at' => $event->getOccurredAt(),
                'updated_at' => $event->getOccurredAt(),
            ]);
        }
    }

    /**
     * Get users who should receive notifications for this order
     */
    private function getRelevantUsers(Order $order): array
    {
        $users = [];

        // Add customer (if customer is a User model with notifications)
        if ($order->customer && $order->customer instanceof User) {
            $users[] = $order->customer;
        }

        // Add admin users from the same tenant
        $adminUsers = User::where('tenant_id', $order->tenant_id)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['admin', 'order_manager']);
            })
            ->get();

        $users = array_merge($users, $adminUsers->toArray());

        // Note: Vendor notifications should be sent to vendor contact persons (users)
        // not to the vendor entity directly. This should be handled separately
        // through vendor user relationships when that feature is implemented.

        return $users;
    }

    /**
     * Notify admin users for critical changes
     */
    private function notifyAdminUsers(Order $order, OrderStatusChangedNotification $notification): void
    {
        $adminUsers = User::where('tenant_id', $order->tenant_id)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['admin', 'order_manager']);
            })
            ->get();

        Notification::send($adminUsers, $notification);
    }

    /**
     * Check if vendor should be notified for this status
     */
    private function shouldNotifyVendor(string $status): bool
    {
        $vendorStatuses = [
            'confirmed',
            'in_production',
            'quality_check',
            'ready_for_pickup',
            'cancelled'
        ];

        return in_array($status, $vendorStatuses, true);
    }

    /**
     * Get notification message for in-app display
     */
    private function getNotificationMessage(Order $order, OrderStatusChanged $event): string
    {
        $statusLabels = [
            'pending' => 'Menunggu Konfirmasi',
            'confirmed' => 'Dikonfirmasi',
            'in_production' => 'Dalam Produksi',
            'quality_check' => 'Pemeriksaan Kualitas',
            'ready_for_pickup' => 'Siap Diambil',
            'shipped' => 'Dikirim',
            'delivered' => 'Diterima',
            'completed' => 'Selesai',
            'cancelled' => 'Dibatalkan',
            'refunded' => 'Dikembalikan'
        ];

        $newStatusLabel = $statusLabels[$event->getNewStatus()] ?? $event->getNewStatus();
        
        return "Status pesanan {$order->order_number} diubah menjadi {$newStatusLabel}";
    }
}