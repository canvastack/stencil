<?php

namespace App\Domain\Order\Jobs;

use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Services\OrderStateMachine;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Spatie\Multitenancy\Jobs\NotTenantAware;

class OrderSlaMonitorJob implements ShouldQueue, NotTenantAware
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $orderId,
        public string $status,
        public ?int $escalationIndex = null,
        public bool $thresholdCheck = false
    ) {}

    public function handle(OrderStateMachine $stateMachine): void
    {
        $order = Order::find($this->orderId);

        if (!$order) {
            return;
        }

        $stateMachine->processSlaTimer(
            $order,
            OrderStatus::fromString($this->status),
            $this->escalationIndex,
            $this->thresholdCheck
        );
    }
}
