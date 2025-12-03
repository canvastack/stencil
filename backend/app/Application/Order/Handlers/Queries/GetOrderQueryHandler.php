<?php

namespace App\Application\Order\Handlers\Queries;

use App\Application\Order\Queries\GetOrderQuery;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Order\Entities\Order;
use App\Domain\Shared\ValueObjects\UuidValueObject;

class GetOrderQueryHandler
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository
    ) {}

    public function handle(GetOrderQuery $query): ?Order
    {
        return $this->orderRepository->findById(new UuidValueObject($query->orderId));
    }
}