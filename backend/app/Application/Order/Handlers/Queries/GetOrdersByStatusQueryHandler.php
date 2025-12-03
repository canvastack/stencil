<?php

namespace App\Application\Order\Handlers\Queries;

use App\Application\Order\Queries\GetOrdersByStatusQuery;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Shared\ValueObjects\UuidValueObject;

class GetOrdersByStatusQueryHandler
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository
    ) {}

    public function handle(GetOrdersByStatusQuery $query): array
    {
        $tenantUuid = new UuidValueObject($query->tenantId);
        
        if ($query->status === null) {
            // Get all orders if no status specified
            $orders = $this->orderRepository->findByTenantId($tenantUuid);
        } else {
            $status = OrderStatus::from($query->status);
            $orders = $this->orderRepository->findByStatus($tenantUuid, $status);
        }

        $offset = ($query->page - 1) * $query->perPage;
        return array_slice($orders, $offset, $query->perPage);
    }
}