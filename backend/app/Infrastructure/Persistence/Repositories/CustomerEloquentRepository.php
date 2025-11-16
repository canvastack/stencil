<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Customer\Entities\Customer;
use App\Domain\Customer\Repositories\CustomerRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Customer\ValueObjects\CustomerName;
use App\Domain\Customer\ValueObjects\CustomerEmail;
use App\Domain\Customer\ValueObjects\CustomerPhone;
use App\Domain\Customer\ValueObjects\CustomerAddress;
use App\Domain\Customer\Enums\CustomerStatus;
use App\Domain\Customer\Enums\CustomerType;
use App\Infrastructure\Persistence\Eloquent\CustomerEloquentModel;

class CustomerEloquentRepository implements CustomerRepositoryInterface
{
    public function __construct(
        private CustomerEloquentModel $model
    ) {}

    public function findById(UuidValueObject $id): ?Customer
    {
        $model = $this->model->find($id->getValue());
        
        if (!$model) {
            return null;
        }
        
        return $this->toDomain($model);
    }

    public function findByEmail(UuidValueObject $tenantId, CustomerEmail $email): ?Customer
    {
        $model = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('email', $email->getValue())
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
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByStatus(UuidValueObject $tenantId, CustomerStatus $status): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('status', $status->value)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByType(UuidValueObject $tenantId, CustomerType $type): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('type', $type->value)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByTag(UuidValueObject $tenantId, string $tag): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->whereJsonContains('tags', $tag)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findRecentCustomers(UuidValueObject $tenantId, int $limit = 10): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findInactiveCustomers(UuidValueObject $tenantId, int $daysSinceLastOrder = 90): array
    {
        $date = now()->subDays($daysSinceLastOrder);
        
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where(function ($query) use ($date) {
                $query->whereNull('last_order_at')
                      ->orWhere('last_order_at', '<', $date);
            })
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function save(Customer $customer): Customer
    {
        $data = $this->fromDomain($customer);
        
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

    public function existsByEmail(UuidValueObject $tenantId, CustomerEmail $email): bool
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('email', $email->getValue())
            ->exists();
    }

    public function countByTenantId(UuidValueObject $tenantId): int
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->count();
    }

    public function countByStatus(UuidValueObject $tenantId, CustomerStatus $status): int
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('status', $status->value)
            ->count();
    }

    public function countByType(UuidValueObject $tenantId, CustomerType $type): int
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('type', $type->value)
            ->count();
    }

    public function searchByName(UuidValueObject $tenantId, string $searchTerm): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where(function ($query) use ($searchTerm) {
                $query->where('first_name', 'like', "%{$searchTerm}%")
                      ->orWhere('last_name', 'like', "%{$searchTerm}%");
            })
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findActiveBusinessCustomers(UuidValueObject $tenantId): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('type', CustomerType::BUSINESS->value)
            ->where('status', CustomerStatus::ACTIVE->value)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findCustomersWithoutOrders(UuidValueObject $tenantId): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->whereNull('last_order_at')
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findTopCustomers(UuidValueObject $tenantId, int $limit = 10): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->whereNotNull('last_order_at')
            ->orderBy('last_order_at', 'desc')
            ->limit($limit)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function updateLastOrderAt(UuidValueObject $customerId): bool
    {
        return $this->model
            ->where('id', $customerId->getValue())
            ->update(['last_order_at' => now()]) > 0;
    }

    private function toDomain(CustomerEloquentModel $model): Customer
    {
        return new Customer(
            new UuidValueObject($model->id),
            new UuidValueObject($model->tenant_id),
            new CustomerName($model->first_name, $model->last_name),
            new CustomerEmail($model->email),
            $model->phone ? new CustomerPhone($model->phone) : null,
            $model->address ? new CustomerAddress(
                $model->address['street'],
                $model->address['city'],
                $model->address['province'],
                $model->address['postal_code'],
                $model->address['country'] ?? 'Indonesia'
            ) : null,
            CustomerStatus::fromString($model->status),
            CustomerType::fromString($model->type),
            $model->company,
            $model->tax_number,
            $model->notes,
            $model->tags ?? [],
            $model->last_order_at,
            $model->created_at,
            $model->updated_at
        );
    }

    private function fromDomain(Customer $customer): array
    {
        return [
            'id' => $customer->getId()->getValue(),
            'tenant_id' => $customer->getTenantId()->getValue(),
            'first_name' => $customer->getName()->getFirstName(),
            'last_name' => $customer->getName()->getLastName(),
            'email' => $customer->getEmail()->getValue(),
            'phone' => $customer->getPhone()?->getValue(),
            'address' => $customer->getAddress()?->toArray(),
            'status' => $customer->getStatus()->value,
            'type' => $customer->getType()->value,
            'company' => $customer->getCompany(),
            'tax_number' => $customer->getTaxNumber(),
            'notes' => $customer->getNotes(),
            'tags' => $customer->getTags(),
            'last_order_at' => $customer->getLastOrderAt(),
        ];
    }
}