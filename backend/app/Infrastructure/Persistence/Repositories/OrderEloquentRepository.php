<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Order\Entities\Order;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Order\ValueObjects\OrderNumber;
use App\Domain\Order\ValueObjects\OrderTotal;
use App\Domain\Order\Enums\OrderStatus;
use App\Infrastructure\Persistence\Eloquent\OrderEloquentModel;
use DateTime;

class OrderEloquentRepository implements OrderRepositoryInterface
{
    public function __construct(
        private OrderEloquentModel $model
    ) {}

    public function findById(UuidValueObject $id): ?Order
    {
        $model = $this->model->find($id->getValue());
        
        if (!$model) {
            return null;
        }
        
        return $this->toDomain($model);
    }

    public function findByOrderNumber(UuidValueObject $tenantId, OrderNumber $orderNumber): ?Order
    {
        $model = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('order_number', $orderNumber->getValue())
            ->first();
        
        if (!$model) {
            return null;
        }
        
        return $this->toDomain($model);
    }

    public function findByTenantId(UuidValueObject $tenantId): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByCustomerId(UuidValueObject $tenantId, UuidValueObject $customerId): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('customer_id', $customerId->getValue())
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByStatus(UuidValueObject $tenantId, OrderStatus $status): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('status', $status->value)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findRecentOrders(UuidValueObject $tenantId, int $limit = 10): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findOrdersByDateRange(UuidValueObject $tenantId, DateTime $startDate, DateTime $endDate): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function save(Order $order): Order
    {
        $data = $this->fromDomain($order);
        
        $model = $this->model->updateOrCreate(
            ['id' => $data['id']],
            $data
        );
        
        return $this->toDomain($model);
    }

    public function delete(UuidValueObject $id): bool
    {
        return $this->model->where('id', $id->getValue())->delete() > 0;
    }

    public function existsByOrderNumber(UuidValueObject $tenantId, OrderNumber $orderNumber): bool
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('order_number', $orderNumber->getValue())
            ->exists();
    }

    public function countByTenantId(UuidValueObject $tenantId): int
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->count();
    }

    public function countByStatus(UuidValueObject $tenantId, OrderStatus $status): int
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('status', $status->value)
            ->count();
    }

    public function getTotalRevenueByTenant(UuidValueObject $tenantId): float
    {
        return (float) $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('status', OrderStatus::COMPLETED->value)
            ->sum('total_amount');
    }

    public function getMonthlyRevenue(UuidValueObject $tenantId, int $year, int $month): float
    {
        return (float) $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('status', OrderStatus::COMPLETED->value)
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->sum('total_amount');
    }

    public function updateOrderStatus(UuidValueObject $orderId, OrderStatus $status): bool
    {
        return $this->model
            ->where('id', $orderId->getValue())
            ->update(['status' => $status->value]) > 0;
    }

    private function toDomain(OrderEloquentModel $model): Order
    {
        return new Order(
            new UuidValueObject($model->id),
            new UuidValueObject($model->tenant_id),
            new UuidValueObject($model->customer_id),
            new OrderNumber($model->order_number),
            new OrderTotal($model->total_amount, $model->currency),
            OrderStatus::fromString($model->status),
            $model->items ?? [],
            $model->shipping_address,
            $model->billing_address,
            $model->notes,
            $model->created_at,
            $model->updated_at
        );
    }

    private function fromDomain(Order $order): array
    {
        return [
            'id' => $order->getId()->getValue(),
            'tenant_id' => $order->getTenantId()->getValue(),
            'customer_id' => $order->getCustomerId()->getValue(),
            'order_number' => $order->getOrderNumber()->getValue(),
            'status' => $order->getStatus()->value,
            'total_amount' => $order->getTotal()->getAmount(),
            'currency' => $order->getTotal()->getCurrency(),
            'items' => $order->getItems(),
            'shipping_address' => null,
            'billing_address' => null,
            'notes' => null,
        ];
    }
}