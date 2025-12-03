<?php

namespace App\Application\Order\Commands;

class RefundOrderCommand
{
    public readonly string $commandId;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $orderId,
        public readonly float $refundAmount,
        ?string $commandId = null,
        public readonly ?string $refundReason = null,
    ) {
        $this->commandId = $commandId ?? \Ramsey\Uuid\Uuid::uuid4()->toString();
    }

    public static function fromArray(array $data): self
    {
        return new self(
            tenantId: $data['tenant_id'],
            orderId: $data['order_id'],
            refundAmount: (float) $data['refund_amount'],
            commandId: $data['command_id'] ?? null,
            refundReason: $data['refund_reason'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'command_id' => $this->commandId,
            'tenant_id' => $this->tenantId,
            'order_id' => $this->orderId,
            'refund_amount' => $this->refundAmount,
            'refund_reason' => $this->refundReason,
        ];
    }
}
