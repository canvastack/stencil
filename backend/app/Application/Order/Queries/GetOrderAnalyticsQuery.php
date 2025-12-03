<?php

namespace App\Application\Order\Queries;

class GetOrderAnalyticsQuery
{
    public readonly string $queryId;

    public function __construct(
        public readonly string $tenantId,
        public readonly int $year,
        public readonly int $month,
        ?string $queryId = null,
    ) {
        $this->queryId = $queryId ?? \Ramsey\Uuid\Uuid::uuid4()->toString();
    }

    public static function fromArray(array $data): self
    {
        return new self(
            tenantId: $data['tenant_id'],
            year: (int)$data['year'],
            month: (int)$data['month'],
            queryId: $data['query_id'] ?? null,
        );
    }

    public function toArray(): array
    {
        return [
            'query_id' => $this->queryId,
            'tenant_id' => $this->tenantId,
            'year' => $this->year,
            'month' => $this->month,
        ];
    }
}