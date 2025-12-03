<?php

namespace App\Application\Order\Commands;

class CreatePurchaseOrderCommand
{
    public readonly string $id;
    public readonly string $orderNumber;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $customerId,
        public readonly float $totalAmount,
        public readonly string $currency = 'IDR',
        public readonly array $items = [],
        ?string $id = null,
        ?string $orderNumber = null,
        public readonly ?array $shippingAddress = null,
        public readonly ?array $billingAddress = null,
        public readonly ?string $notes = null,
    ) {
        $this->id = $id ?? \Ramsey\Uuid\Uuid::uuid4()->toString();
        $this->orderNumber = $orderNumber ?? $this->generateOrderNumber();
    }

    private function generateOrderNumber(): string
    {
        return 'ORD-' . date('YmdHis') . '-' . strtoupper(bin2hex(random_bytes(3)));
    }

    public static function fromArray(array $data): self
    {
        return new self(
            tenantId: $data['tenant_id'],
            customerId: $data['customer_id'],
            totalAmount: (float) $data['total_amount'],
            currency: $data['currency'] ?? 'IDR',
            items: $data['items'] ?? [],
            id: $data['id'] ?? null,
            orderNumber: $data['order_number'] ?? null,
            shippingAddress: $data['shipping_address'] ?? null,
            billingAddress: $data['billing_address'] ?? null,
            notes: $data['notes'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenantId,
            'customer_id' => $this->customerId,
            'order_number' => $this->orderNumber,
            'total_amount' => $this->totalAmount,
            'currency' => $this->currency,
            'items' => $this->items,
            'shipping_address' => $this->shippingAddress,
            'billing_address' => $this->billingAddress,
            'notes' => $this->notes,
        ];
    }
}
