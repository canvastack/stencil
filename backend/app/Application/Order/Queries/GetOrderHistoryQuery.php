<?php

namespace App\Application\Order\Queries;

class GetOrderHistoryQuery
{
    public readonly string $queryId;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $orderId,
        public readonly int $limit = 50,
        ?string $queryId = null,
    ) {
        $this->queryId = $queryId ?? \Ramsey\Uuid\Uuid::uuid4()->toString();
    }

    public static function fromArray(array $data): self
    {
        return new self(
            tenantId: $data['tenant_id'],
            orderId: $data['order_id'],
            limit: (int)($data['limit'] ?? 50),
            queryId: $data['query_id'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'query_id' => $this->queryId,
            'tenant_id' => $this->tenantId,
            'order_id' => $this->orderId,
            'limit' => $this->limit,
        ];
    }
}