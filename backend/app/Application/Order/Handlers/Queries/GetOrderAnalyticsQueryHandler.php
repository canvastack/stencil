<?php

namespace App\Application\Order\Handlers\Queries;

use App\Application\Order\Queries\GetOrderAnalyticsQuery;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;

class GetOrderAnalyticsQueryHandler
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository
    ) {}

    public function handle(GetOrderAnalyticsQuery $query): array
    {
        $tenantId = new UuidValueObject($query->tenantId);

        return [
            'revenue' => $this->orderRepository->getMonthlyRevenue(
                $tenantId,
                $query->year,
                $query->month
            ),
            'total_orders' => $this->orderRepository->countByTenantId($tenantId),
            'year' => $query->year,
            'month' => $query->month,
        ];
    }
}