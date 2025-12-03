<?php

namespace App\Application\Order\Commands;

class CreateCustomerQuoteCommand
{
    public readonly string $commandId;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $orderId,
        public readonly float $quotePrice,
        public readonly int $validityDaysInDays,
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
            quotePrice: (float) $data['quote_price'],
            validityDaysInDays: (int) $data['validity_days_in_days'],
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
            'quote_price' => $this->quotePrice,
            'validity_days_in_days' => $this->validityDaysInDays,
            'notes' => $this->notes,
        ];
    }
}
