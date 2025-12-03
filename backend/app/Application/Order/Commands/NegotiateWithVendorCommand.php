<?php

namespace App\Application\Order\Commands;

class NegotiateWithVendorCommand
{
    public readonly string $commandId;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $orderId,
        public readonly string $vendorId,
        public readonly float $quotedPrice,
        public readonly int $leadTimeInDays,
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
            vendorId: $data['vendor_id'],
            quotedPrice: (float) $data['quoted_price'],
            leadTimeInDays: (int) $data['lead_time_in_days'],
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
            'vendor_id' => $this->vendorId,
            'quoted_price' => $this->quotedPrice,
            'lead_time_in_days' => $this->leadTimeInDays,
            'notes' => $this->notes,
        ];
    }
}
