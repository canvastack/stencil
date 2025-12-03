<?php

namespace App\Application\Order\Commands;

class ShipOrderCommand
{
    public readonly string $commandId;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $orderId,
        public readonly string $trackingNumber,
        public readonly string $shippingProvider,
        ?string $commandId = null,
        public readonly ?string $notes = null,
    ) {
        $this->commandId = $commandId ?? \Ramsey\Uuid\Uuid::uuid4()->toString();
    }

    public static function fromArray(array $data): self
    {
        return new self(
            tenantId: $data['tenant_id'],
            orderId: $data['order_id'],
            trackingNumber: $data['tracking_number'],
            shippingProvider: $data['shipping_provider'],
            commandId: $data['command_id'] ?? null,
            notes: $data['notes'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'command_id' => $this->commandId,
            'tenant_id' => $this->tenantId,
            'order_id' => $this->orderId,
            'tracking_number' => $this->trackingNumber,
            'shipping_provider' => $this->shippingProvider,
            'notes' => $this->notes,
        ];
    }
}
