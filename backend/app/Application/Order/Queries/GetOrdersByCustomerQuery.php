<?php

namespace App\Application\Order\Queries;

class GetOrdersByCustomerQuery
{
    public readonly string $queryId;

    public function __construct(
        public readonly string $tenantId,
        public readonly string $customerId,
        public readonly int $page = 1,
        public readonly int $perPage = 15,
        ?string $queryId = null,
    ) {
        $this->queryId = $queryId ?? \Ramsey\Uuid\Uuid::uuid4()->toString();
    }

    public static function fromArray(array $data): self
    {
        return new self(
            tenantId: $data['tenant_id'],
            customerId: $data['customer_id'],
            page: (int)($data['page'] ?? 1),
            perPage: (int)($data['per_page'] ?? 15),
            queryId: $data['query_id'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'query_id' => $this->queryId,
            'tenant_id' => $this->tenantId,
            'customer_id' => $this->customerId,
            'page' => $this->page,
            'per_page' => $this->perPage,
        ];
    }
}