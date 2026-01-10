<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Order\Entities\Order;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Order\ValueObjects\OrderNumber;
use App\Domain\Order\ValueObjects\OrderTotal;
use App\Domain\Order\Enums\OrderStatus;
use App\Infrastructure\Persistence\Eloquent\Models\Order as OrderModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use DateTime;

class OrderEloquentRepository implements OrderRepositoryInterface
{
    private ?OrderModel $lastSavedModel = null;

    public function __construct(
        private OrderModel $model
    ) {}
    
    public function getLastSavedModel(): ?OrderModel
    {
        return $this->lastSavedModel;
    }

    public function findById(UuidValueObject $id): ?Order
    {
        $model = $this->model->where('uuid', $id->getValue())->first();
        
        if (!$model) {
            return null;
        }
        
        return $this->toDomain($model);
    }

    public function findByOrderNumber(UuidValueObject $tenantId, OrderNumber $orderNumber): ?Order
    {
        $model = $this->model
            ->where('tenant_id', $this->resolveTenantId($tenantId))
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
            ->where('tenant_id', $this->resolveTenantId($tenantId))
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByCustomerId(UuidValueObject $tenantId, UuidValueObject $customerId): array
    {
        $models = $this->model
            ->where('tenant_id', $this->resolveTenantId($tenantId))
            ->where('customer_id', $this->resolveCustomerId($customerId))
            ->orderBy('created_at', 'desc')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByStatus(UuidValueObject $tenantId, OrderStatus $status): array
    {
        $models = $this->model
            ->where('tenant_id', $this->resolveTenantId($tenantId))
            ->where('status', $status->value)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findRecentOrders(UuidValueObject $tenantId, int $limit = 10): array
    {
        $models = $this->model
            ->where('tenant_id', $this->resolveTenantId($tenantId))
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findOrdersByDateRange(UuidValueObject $tenantId, DateTime $startDate, DateTime $endDate): array
    {
        $models = $this->model
            ->where('tenant_id', $this->resolveTenantId($tenantId))
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function save(Order $order): Order
    {
        $data = $this->fromDomain($order);
        
        $this->lastSavedModel = $this->model->updateOrCreate(
            ['uuid' => $data['uuid']],
            $data
        );
        
        return $this->toDomain($this->lastSavedModel);
    }

    public function delete(UuidValueObject $id): bool
    {
        return $this->model->where('uuid', $id->getValue())->delete() > 0;
    }

    public function existsByOrderNumber(UuidValueObject $tenantId, OrderNumber $orderNumber): bool
    {
        return $this->model
            ->where('tenant_id', $this->resolveTenantId($tenantId))
            ->where('order_number', $orderNumber->getValue())
            ->exists();
    }

    public function countByTenantId(UuidValueObject $tenantId): int
    {
        return $this->model
            ->where('tenant_id', $this->resolveTenantId($tenantId))
            ->count();
    }

    public function countByStatus(UuidValueObject $tenantId, OrderStatus $status): int
    {
        return $this->model
            ->where('tenant_id', $this->resolveTenantId($tenantId))
            ->where('status', $status->value)
            ->count();
    }

    public function getTotalRevenueByTenant(UuidValueObject $tenantId): float
    {
        return (float) $this->model
            ->where('tenant_id', $this->resolveTenantId($tenantId))
            ->where('status', OrderStatus::COMPLETED->value)
            ->sum('total_amount');
    }

    public function getMonthlyRevenue(UuidValueObject $tenantId, int $year, int $month): float
    {
        return (float) $this->model
            ->where('tenant_id', $this->resolveTenantId($tenantId))
            ->where('status', OrderStatus::COMPLETED->value)
            ->whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->sum('total_amount');
    }

    public function updateOrderStatus(UuidValueObject $orderId, OrderStatus $status): bool
    {
        return $this->model
            ->where('uuid', $orderId->getValue())
            ->update(['status' => $status->value]) > 0;
    }

    private function resolveTenantId(UuidValueObject $tenantUuid): int
    {
        $tenant = TenantEloquentModel::where('uuid', $tenantUuid->getValue())->first();
        if (!$tenant) {
            throw new \InvalidArgumentException("Tenant not found with UUID: {$tenantUuid->getValue()}");
        }
        return $tenant->id;
    }

    private function getTenantUuid(int $tenantId): string
    {
        $tenant = TenantEloquentModel::find($tenantId);
        if (!$tenant) {
            throw new \InvalidArgumentException("Tenant not found with ID: {$tenantId}");
        }
        return $tenant->uuid;
    }

    private function resolveCustomerId(UuidValueObject $customerUuid): int
    {
        $customer = Customer::where('uuid', $customerUuid->getValue())->first();
        if (!$customer) {
            throw new \InvalidArgumentException("Customer not found with UUID: {$customerUuid->getValue()}");
        }
        return $customer->id;
    }

    private function getCustomerUuid(int $customerId): string
    {
        $customer = Customer::find($customerId);
        if (!$customer) {
            throw new \InvalidArgumentException("Customer not found with ID: {$customerId}");
        }
        return $customer->uuid;
    }

    private function resolveVendorId(UuidValueObject $vendorUuid): ?int
    {
        $vendor = Vendor::where('uuid', $vendorUuid->getValue())->first();
        if (!$vendor) {
            return null;
        }
        return $vendor->id;
    }

    private function getVendorUuid(?int $vendorId): ?string
    {
        if ($vendorId === null) {
            return null;
        }
        
        $vendor = Vendor::find($vendorId);
        if (!$vendor) {
            return null;
        }
        return $vendor->uuid;
    }

    private function toDomain(OrderModel $model): Order
    {
        $vendorUuid = $model->vendor_id ? $this->getVendorUuid($model->vendor_id) : null;
        
        return new Order(
            new UuidValueObject($model->uuid),
            new UuidValueObject($this->getTenantUuid($model->tenant_id)),
            new UuidValueObject($this->getCustomerUuid($model->customer_id)),
            new OrderNumber($model->order_number),
            new OrderTotal($model->total_amount, $model->currency),
            OrderStatus::fromString($model->status),
            $model->items ?? [],
            $vendorUuid ? new UuidValueObject($vendorUuid) : null,
            $model->shipping_address,
            $model->billing_address,
            $model->notes,
            $model->created_at,
            $model->updated_at
        );
    }

    private function fromDomain(Order $order): array
    {
        $vendorId = null;
        if ($order->getVendorId()) {
            $vendorId = $this->resolveVendorId($order->getVendorId());
        }
        
        $data = [
            'uuid' => $order->getId()->getValue(),
            'tenant_id' => $this->resolveTenantId($order->getTenantId()),
            'customer_id' => $this->resolveCustomerId($order->getCustomerId()),
            'vendor_id' => $vendorId,
            'order_number' => $order->getOrderNumber()->getValue(),
            'status' => $order->getStatus()->value,
            'total_amount' => $order->getTotal()->getAmount(),
            'currency' => $order->getTotal()->getCurrency(),
            'items' => $order->getItems(),
            'shipping_address' => null,
            'billing_address' => null,
            'notes' => null,
        ];
        
        if ($order->getStatus() === OrderStatus::COMPLETED) {
            $existingOrder = $this->model->where('uuid', $order->getId()->getValue())->first();
            if (!$existingOrder || !$existingOrder->completed_at) {
                $data['completed_at'] = now();
            }
        }
        
        return $data;
    }
}