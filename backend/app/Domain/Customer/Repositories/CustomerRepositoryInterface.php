<?php

namespace App\Domain\Customer\Repositories;

use App\Domain\Customer\Entities\Customer;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Customer\ValueObjects\CustomerEmail;
use App\Domain\Customer\Enums\CustomerStatus;
use App\Domain\Customer\Enums\CustomerType;

interface CustomerRepositoryInterface
{
    public function findById(UuidValueObject $id): ?Customer;

    public function findByEmail(UuidValueObject $tenantId, CustomerEmail $email): ?Customer;

    public function findByTenantId(UuidValueObject $tenantId): array;

    public function findByStatus(UuidValueObject $tenantId, CustomerStatus $status): array;

    public function findByType(UuidValueObject $tenantId, CustomerType $type): array;

    public function findByTag(UuidValueObject $tenantId, string $tag): array;

    public function findRecentCustomers(UuidValueObject $tenantId, int $limit = 10): array;

    public function findInactiveCustomers(UuidValueObject $tenantId, int $daysSinceLastOrder = 90): array;

    public function save(Customer $customer): Customer;

    public function delete(UuidValueObject $id): bool;

    public function existsByEmail(UuidValueObject $tenantId, CustomerEmail $email): bool;

    public function countByTenantId(UuidValueObject $tenantId): int;

    public function countByStatus(UuidValueObject $tenantId, CustomerStatus $status): int;

    public function countByType(UuidValueObject $tenantId, CustomerType $type): int;

    public function searchByName(UuidValueObject $tenantId, string $searchTerm): array;

    public function findActiveBusinessCustomers(UuidValueObject $tenantId): array;

    public function findCustomersWithoutOrders(UuidValueObject $tenantId): array;

    public function findTopCustomers(UuidValueObject $tenantId, int $limit = 10): array;

    public function updateLastOrderAt(UuidValueObject $customerId): bool;
}