<?php

namespace App\Application\Order\Handlers\Queries;

use App\Application\Order\Queries\GetOrderHistoryQuery;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;

class GetOrderHistoryQueryHandler
{
    public function __construct(
        private OrderRepositoryInterface $orderRepository
    ) {}

    public function handle(GetOrderHistoryQuery $query): array
    {
        $orders = $this->orderRepository->findRecentOrders(
            new UuidValueObject($query->tenantId),
            $query->limit
        );

        return array_map(fn($order) => [
            'id' => $order->getId()->getValue(),
            'order_number' => $order->getOrderNumber()->getValue(),
            'status' => $order->getStatus()->value,
            'total_amount' => $order->getTotal()->getAmount(),
            'currency' => $order->getTotal()->getCurrency(),
            'created_at' => $order->getCreatedAt()?->format('Y-m-d H:i:s'),
            'updated_at' => $order->getUpdatedAt()?->format('Y-m-d H:i:s'),
        ], $orders);
    }
}