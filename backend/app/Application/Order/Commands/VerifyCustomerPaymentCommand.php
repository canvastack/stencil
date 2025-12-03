<?php

namespace App\Application\Order\Commands;

class VerifyCustomerPaymentCommand
{
    public readonly string $commandId;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $orderId,
        public readonly float $paidAmount,
        public readonly string $paymentMethod,
        ?string $commandId = null,
        public readonly ?string $transactionId = null,
    ) {
        $this->commandId = $commandId ?? \Ramsey\Uuid\Uuid::uuid4()->toString();
    }

    public static function fromArray(array $data): self
    {
        return new self(
            tenantId: $data['tenant_id'],
            orderId: $data['order_id'],
            paidAmount: (float) $data['paid_amount'],
            paymentMethod: $data['payment_method'],
            commandId: $data['command_id'] ?? null,
            transactionId: $data['transaction_id'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'command_id' => $this->commandId,
            'tenant_id' => $this->tenantId,
            'order_id' => $this->orderId,
            'paid_amount' => $this->paidAmount,
            'payment_method' => $this->paymentMethod,
            'transaction_id' => $this->transactionId,
        ];
    }
}
