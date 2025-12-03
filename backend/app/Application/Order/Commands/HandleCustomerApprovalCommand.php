<?php

namespace App\Application\Order\Commands;

class HandleCustomerApprovalCommand
{
    public readonly string $commandId;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $orderId,
        public readonly bool $approved,
        ?string $commandId = null,
        public readonly ?string $rejectionReason = null,
    ) {
        $this->commandId = $commandId ?? \Ramsey\Uuid\Uuid::uuid4()->toString();
    }

    public static function fromArray(array $data): self
    {
        return new self(
            tenantId: $data['tenant_id'],
            orderId: $data['order_id'],
            approved: (bool) $data['approved'],
            commandId: $data['command_id'] ?? null,
            rejectionReason: $data['rejection_reason'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'command_id' => $this->commandId,
            'tenant_id' => $this->tenantId,
            'order_id' => $this->orderId,
            'approved' => $this->approved,
            'rejection_reason' => $this->rejectionReason,
        ];
    }
}
