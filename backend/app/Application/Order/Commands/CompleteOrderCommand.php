<?php

namespace App\Application\Order\Commands;

class CompleteOrderCommand
{
    public readonly string $commandId;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $orderId,
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
            'notes' => $this->notes,
        ];
    }
}
