<?php

namespace App\Application\Order\Commands;

class RequestFinalPaymentCommand
{
    public readonly string $commandId;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $orderId,
        public readonly float $finalAmount,
        ?string $commandId = null,
        public readonly ?string $invoiceNumber = null,
    ) {
        $this->commandId = $commandId ?? \Ramsey\Uuid\Uuid::uuid4()->toString();
    }

    public static function fromArray(array $data): self
    {
        return new self(
            tenantId: $data['tenant_id'],
            orderId: $data['order_id'],
            finalAmount: (float) $data['final_amount'],
            commandId: $data['command_id'] ?? null,
            invoiceNumber: $data['invoice_number'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'command_id' => $this->commandId,
            'tenant_id' => $this->tenantId,
            'order_id' => $this->orderId,
            'final_amount' => $this->finalAmount,
            'invoice_number' => $this->invoiceNumber,
        ];
    }
}
