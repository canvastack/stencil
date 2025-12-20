<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProductBulkUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $productIds;
    public $tenantId;
    public $userId;
    public $userName;
    public $timestamp;

    public function __construct(array $productIds, $tenantId, $userId = null, $userName = null)
    {
        $this->productIds = $productIds;
        $this->tenantId = $tenantId;
        $this->userId = $userId;
        $this->userName = $userName;
        $this->timestamp = now()->toISOString();
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('products.' . $this->tenantId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'product.bulk_updated';
    }

    public function broadcastWith(): array
    {
        return [
            'productIds' => $this->productIds,
            'tenantId' => $this->tenantId,
            'userId' => $this->userId,
            'userName' => $this->userName,
            'timestamp' => $this->timestamp,
        ];
    }
}
