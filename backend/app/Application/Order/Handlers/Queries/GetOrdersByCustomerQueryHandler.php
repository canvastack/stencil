<?php

namespace App\Application\Order\Handlers\Queries;

use App\Application\Order\Queries\GetOrdersByCustomerQuery;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;

class GetOrdersByCustomerQueryHandler
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository
    ) {}

    public function handle(GetOrdersByCustomerQuery $query): array
    {
        $orders = $this->orderRepository->findByCustomerId(
            new UuidValueObject($query->tenantId),
            new UuidValueObject($query->customerId)
        );

        $offset = ($query->page - 1) * $query->perPage;
        return array_slice($orders, $offset, $query->perPage);
    }
}