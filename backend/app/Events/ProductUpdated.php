<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProductUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $productId;
    public $tenantId;
    public $userId;
    public $userName;
    public $timestamp;

    public function __construct($productId, $tenantId, $userId = null, $userName = null)
    {
        $this->productId = $productId;
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
        return 'product.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'productId' => $this->productId,
            'tenantId' => $this->tenantId,
            'userId' => $this->userId,
            'userName' => $this->userName,
            'timestamp' => $this->timestamp,
        ];
    }
}
