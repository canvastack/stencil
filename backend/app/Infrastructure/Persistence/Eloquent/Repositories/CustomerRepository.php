<?php

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Customer\Entities\Customer;
use App\Domain\Customer\Repositories\CustomerRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Infrastructure\Persistence\Eloquent\Models\Customer as CustomerModel;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Customer Repository Implementation (Adapter)
 * 
 * Implements customer data persistence using Eloquent ORM.
 * Part of the Infrastructure layer - framework specific.
 * 
 * Database Integration:
 * - Maps to customers table
 * - Handles UUID-based operations
 * - Maintains tenant isolation
 * - Converts between domain entities and Eloquent models
 */
class CustomerRepository implements CustomerRepositoryInterface
{
    /**
     * Save customer (create or update)
     */
    public function save(Customer $customer): Customer
    {
        $model = CustomerModel::updateOrCreate(
            ['uuid' => $customer->getId()->getValue()],
            [
                'tenant_id' => $customer->getTenantId()->getValue(),
                'name' => $customer->getName(),
                'email' => $customer->getEmail(),
                'phone' => $customer->getPhone(),
                'company' => $customer->getCompany(),
                'address' => $customer->getAddress() ? json_encode([
                    'street' => $customer->getAddress()->getStreet(),
                    'city' => $customer->getAddress()->getCity(),
                    'state' => $customer->getAddress()->getState(),
                    'postal_code' => $customer->getAddress()->getPostalCode(),
                    'country' => $customer->getAddress()->getCountry(),
                ]) : null,
                'contact_info' => $customer->getContactInfo() ? json_encode([
                    'email' => $customer->getContactInfo()->getEmail(),
                    'phone' => $customer->getContactInfo()->getPhone(),
                    'website' => $customer->getContactInfo()->getWebsite(),
                    'social_media' => $customer->getContactInfo()->getSocialMedia(),
                ]) : null,
                'preferences' => json_encode($customer->getPreferences()),
                'metadata' => json_encode($customer->getMetadata()),
                'status' => $customer->getStatus(),
                'created_at' => $customer->getCreatedAt(),
                'updated_at' => $customer->getUpdatedAt(),
            ]
        );

        return $this->toDomainEntity($model);
    }

    /**
     * Find customer by UUID
     */
    public function findById(UuidValueObject $id): ?Customer
    {
        $model = CustomerModel::where('uuid', $id->getValue())->first();
        
        return $model ? $this->toDomainEntity($model) : null;
    }

    /**
     * Find customer by email within tenant
     */
    public function findByEmail(UuidValueObject $tenantId, string $email): ?Customer
    {
        $model = CustomerModel::where('tenant_id', $tenantId->getValue())
            ->where('email', $email)
            ->first();
        
        return $model ? $this->toDomainEntity($model) : null;
    }

    /**
     * Find customers by status within tenant
     */
    public function findByStatus(UuidValueObject $tenantId, string $status): array
    {
        $models = CustomerModel::where('tenant_id', $tenantId->getValue())
            ->where('status', $status)
            ->get();
        
        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Check if customer email exists within tenant
     */
    public function existsByEmail(UuidValueObject $tenantId, string $email): bool
    {
        return CustomerModel::where('tenant_id', $tenantId->getValue())
            ->where('email', $email)
            ->exists();
    }

    /**
     * Get paginated customers with filters
     */
    public function findWithFilters(
        UuidValueObject $tenantId,
        array $filters = [],
        int $page = 1,
        int $perPage = 15,
        string $sortBy = 'created_at',
        string $sortDirection = 'desc'
    ): array {
        $query = CustomerModel::where('tenant_id', $tenantId->getValue());

        // Apply filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('email', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('company', 'ILIKE', '%' . $filters['search'] . '%');
            });
        }

        if (isset($filters['company'])) {
            $query->where('company', 'ILIKE', '%' . $filters['company'] . '%');
        }

        $models = $query->orderBy($sortBy, $sortDirection)
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Count customers with filters
     */
    public function countWithFilters(UuidValueObject $tenantId, array $filters = []): int
    {
        $query = CustomerModel::where('tenant_id', $tenantId->getValue());

        // Apply same filters as findWithFilters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('email', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('company', 'ILIKE', '%' . $filters['search'] . '%');
            });
        }

        if (isset($filters['company'])) {
            $query->where('company', 'ILIKE', '%' . $filters['company'] . '%');
        }

        return $query->count();
    }

    /**
     * Delete customer (soft delete)
     */
    public function delete(UuidValueObject $id): bool
    {
        return CustomerModel::where('uuid', $id->getValue())->delete() > 0;
    }

    /**
     * Get customer statistics for tenant
     */
    public function getStatistics(UuidValueObject $tenantId): array
    {
        $total = CustomerModel::where('tenant_id', $tenantId->getValue())->count();
        $active = CustomerModel::where('tenant_id', $tenantId->getValue())
            ->where('status', 'active')
            ->count();
        $inactive = CustomerModel::where('tenant_id', $tenantId->getValue())
            ->where('status', 'inactive')
            ->count();

        return [
            'total' => $total,
            'active' => $active,
            'inactive' => $inactive,
            'active_percentage' => $total > 0 ? round(($active / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Search customers by term (name, email, company)
     */
    public function search(UuidValueObject $tenantId, string $searchTerm): array
    {
        $models = CustomerModel::where('tenant_id', $tenantId->getValue())
            ->where(function ($query) use ($searchTerm) {
                $query->where('name', 'ILIKE', '%' . $searchTerm . '%')
                      ->orWhere('email', 'ILIKE', '%' . $searchTerm . '%')
                      ->orWhere('company', 'ILIKE', '%' . $searchTerm . '%');
            })
            ->orderBy('name')
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Get recent customers for tenant
     */
    public function getRecent(UuidValueObject $tenantId, int $limit = 10): array
    {
        $models = CustomerModel::where('tenant_id', $tenantId->getValue())
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Find customers by type within tenant
     */
    public function findByType(UuidValueObject $tenantId, string $type): array
    {
        $models = CustomerModel::where('tenant_id', $tenantId->getValue())
            ->where('type', $type)
            ->orderBy('name')
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Find customers with recent orders
     */
    public function findWithRecentOrders(UuidValueObject $tenantId, int $days = 30): array
    {
        // This would need to join with orders table when available
        // For now, return all active customers
        $models = CustomerModel::where('tenant_id', $tenantId->getValue())
            ->where('status', 'active')
            ->where('created_at', '>=', now()->subDays($days))
            ->orderBy('created_at', 'desc')
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Find inactive customers
     */
    public function findInactive(UuidValueObject $tenantId, int $days = 90): array
    {
        $models = CustomerModel::where('tenant_id', $tenantId->getValue())
            ->where(function ($query) use ($days) {
                $query->where('status', 'inactive')
                      ->orWhere('updated_at', '<', now()->subDays($days));
            })
            ->orderBy('updated_at')
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Get customer order statistics
     */
    public function getOrderStatistics(UuidValueObject $customerId): array
    {
        // This would need to be implemented when Order model is available
        // For now, return empty statistics
        return [
            'total_orders' => 0,
            'total_spent' => 0,
            'average_order_value' => 0,
            'last_order_date' => null,
            'orders_this_year' => 0,
            'orders_this_month' => 0,
        ];
    }

    /**
     * Convert Eloquent model to domain entity
     */
    private function toDomainEntity(CustomerModel $model): Customer
    {
        // Handle tenant_id conversion: database stores integer ID, domain expects UUID
        $tenantUuid = $model->tenant_id;
        if (is_numeric($tenantUuid)) {
            // Look up tenant UUID from integer ID
            $tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::find($tenantUuid);
            $tenantUuid = $tenant ? $tenant->uuid : $tenantUuid;
        }

        return Customer::reconstitute(
            id: new UuidValueObject($model->uuid),
            tenantId: new UuidValueObject($tenantUuid),
            name: $model->name,
            email: $model->email,
            phone: $model->phone,
            company: $model->company,
            address: is_array($model->address) ? $model->address : ($model->address ? json_decode($model->address, true) : null),
            contactInfo: is_array($model->contact_info) ? $model->contact_info : ($model->contact_info ? json_decode($model->contact_info, true) : null),
            preferences: is_array($model->preferences) ? $model->preferences : (json_decode($model->preferences, true) ?? []),
            metadata: is_array($model->metadata) ? $model->metadata : (json_decode($model->metadata, true) ?? []),
            status: $model->status,
            createdAt: $model->created_at instanceof \DateTimeImmutable ? $model->created_at : new \DateTimeImmutable($model->created_at->toDateTimeString()),
            updatedAt: $model->updated_at instanceof \DateTimeImmutable ? $model->updated_at : new \DateTimeImmutable($model->updated_at->toDateTimeString())
        );
    }
}