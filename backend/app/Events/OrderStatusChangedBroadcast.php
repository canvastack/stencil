<?php

namespace App\Events;

use App\Domain\Order\Events\OrderStatusChanged;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Order Status Changed Broadcast Event
 * 
 * Laravel event that implements ShouldBroadcast for real-time updates.
 * Triggered by the OrderStatusChanged domain event.
 */
class OrderStatusChangedBroadcast implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        private Order $order,
        private string $oldStatus,
        private string $newStatus,
        private ?string $changedBy = null,
        private ?string $reason = null
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            // Tenant-specific channel for admin users
            new PrivateChannel("tenant.{$this->order->tenant_id}.orders"),
            
            // Order-specific channel for detailed updates
            new PrivateChannel("order.{$this->order->uuid}"),
            
            // Customer-specific channel if customer exists
            ...$this->getCustomerChannels(),
            
            // Vendor-specific channel if vendor exists
            ...$this->getVendorChannels(),
        ];
    }

    /**
     * Get customer-specific channels
     */
    private function getCustomerChannels(): array
    {
        if (!$this->order->customer) {
            return [];
        }

        return [
            new PrivateChannel("customer.{$this->order->customer->uuid}.orders")
        ];
    }

    /**
     * Get vendor-specific channels
     */
    private function getVendorChannels(): array
    {
        if (!$this->order->vendor) {
            return [];
        }

        return [
            new PrivateChannel("vendor.{$this->order->vendor->uuid}.orders")
        ];
    }

    /**
     * Get the event name for broadcasting
     */
    public function broadcastAs(): string
    {
        return 'order.status.changed';
    }

    /**
     * Get the data to broadcast
     */
    public function broadcastWith(): array
    {
        return [
            'order' => [
                'id' => $this->order->id,
                'uuid' => $this->order->uuid,
                'order_number' => $this->order->order_number,
                'status' => $this->order->status,
                'payment_status' => $this->order->payment_status,
                'total_amount' => $this->order->total_amount,
                'customer_id' => $this->order->customer_id,
                'vendor_id' => $this->order->vendor_id,
            ],
            'status_change' => [
                'old_status' => $this->oldStatus,
                'new_status' => $this->newStatus,
                'changed_by' => $this->changedBy,
                'reason' => $this->reason,
                'changed_at' => now()->toISOString(),
            ],
            'notification' => [
                'title' => 'Status Pesanan Diperbarui',
                'message' => $this->getNotificationMessage(),
                'type' => $this->getNotificationType(),
                'is_critical' => $this->isCriticalChange(),
            ],
            'metadata' => [
                'tenant_id' => $this->order->tenant_id,
                'timestamp' => now()->timestamp,
                'event_type' => 'order_status_changed',
            ]
        ];
    }

    /**
     * Get notification message for display
     */
    private function getNotificationMessage(): string
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

        $newStatusLabel = $statusLabels[$this->newStatus] ?? $this->newStatus;
        
        return "Pesanan {$this->order->order_number} sekarang berstatus {$newStatusLabel}";
    }

    /**
     * Get notification type for UI styling
     */
    private function getNotificationType(): string
    {
        return match ($this->newStatus) {
            'completed', 'delivered' => 'success',
            'cancelled', 'refunded', 'failed' => 'error',
            'shipped', 'confirmed' => 'info',
            'in_production', 'quality_check' => 'warning',
            default => 'info'
        };
    }

    /**
     * Check if this is a critical status change
     */
    private function isCriticalChange(): bool
    {
        $criticalStatuses = [
            'cancelled',
            'shipped',
            'delivered',
            'completed',
            'refunded',
            'failed'
        ];

        return in_array($this->newStatus, $criticalStatuses, true);
    }

    /**
     * Determine if the event should be queued
     */
    public function shouldQueue(): bool
    {
        return true;
    }

    /**
     * Get the queue connection for broadcasting
     */
    public function broadcastQueue(): string
    {
        return 'broadcasts';
    }
}