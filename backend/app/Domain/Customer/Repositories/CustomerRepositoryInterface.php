<?php

namespace App\Domain\Customer\Repositories;

use App\Domain\Customer\Entities\Customer;
use App\Domain\Shared\ValueObjects\UuidValueObject;

/**
 * Customer Repository Interface (Port)
 * 
 * Defines the contract for customer data persistence.
 * Part of the Domain layer - framework agnostic.
 * 
 * Database Integration:
 * - Abstracts access to customers table
 * - Handles UUID-based lookups
 * - Maintains tenant isolation
 */
interface CustomerRepositoryInterface
{
    /**
     * Save customer (create or update)
     */
    public function save(Customer $customer): Customer;

    /**
     * Find customer by UUID
     */
    public function findById(UuidValueObject $id): ?Customer;

    /**
     * Find customer by email within tenant
     */
    public function findByEmail(UuidValueObject $tenantId, string $email): ?Customer;

    /**
     * Find customers by status within tenant
     */
    public function findByStatus(UuidValueObject $tenantId, string $status): array;

    /**
     * Find customers by type within tenant
     */
    public function findByType(UuidValueObject $tenantId, string $type): array;

    /**
     * Check if email exists within tenant
     */
    public function existsByEmail(UuidValueObject $tenantId, string $email): bool;

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
    ): array;

    /**
     * Count customers with filters
     */
    public function countWithFilters(UuidValueObject $tenantId, array $filters = []): int;

    /**
     * Delete customer (soft delete)
     */
    public function delete(UuidValueObject $id): bool;

    /**
     * Search customers by term (name, email, company)
     */
    public function search(UuidValueObject $tenantId, string $searchTerm): array;

    /**
     * Get customer statistics for tenant
     */
    public function getStatistics(UuidValueObject $tenantId): array;

    /**
     * Get recent customers for tenant
     */
    public function getRecent(UuidValueObject $tenantId, int $limit = 10): array;

    /**
     * Find customers with recent orders
     */
    public function findWithRecentOrders(UuidValueObject $tenantId, int $days = 30): array;

    /**
     * Find inactive customers
     */
    public function findInactive(UuidValueObject $tenantId, int $days = 90): array;

    /**
     * Get customer order statistics
     */
    public function getOrderStatistics(UuidValueObject $customerId): array;
}