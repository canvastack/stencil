<?php

namespace App\Domain\Order\Repositories;

use App\Domain\Order\Entities\Order;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Order\ValueObjects\OrderNumber;
use App\Domain\Order\Enums\OrderStatus;

interface OrderRepositoryInterface
{
    public function findById(UuidValueObject $id): ?Order;

    public function findByOrderNumber(UuidValueObject $tenantId, OrderNumber $orderNumber): ?Order;

    public function findByTenantId(UuidValueObject $tenantId): array;

    public function findByCustomerId(UuidValueObject $tenantId, UuidValueObject $customerId): array;

    public function findByStatus(UuidValueObject $tenantId, OrderStatus $status): array;

    public function findRecentOrders(UuidValueObject $tenantId, int $limit = 10): array;

    public function findOrdersByDateRange(UuidValueObject $tenantId, \DateTime $startDate, \DateTime $endDate): array;

    public function save(Order $order): Order;

    public function delete(UuidValueObject $id): bool;

    public function existsByOrderNumber(UuidValueObject $tenantId, OrderNumber $orderNumber): bool;

    public function countByTenantId(UuidValueObject $tenantId): int;

    public function countByStatus(UuidValueObject $tenantId, OrderStatus $status): int;

    public function getTotalRevenueByTenant(UuidValueObject $tenantId): float;

    public function getMonthlyRevenue(UuidValueObject $tenantId, int $year, int $month): float;

    public function updateOrderStatus(UuidValueObject $orderId, OrderStatus $status): bool;
}