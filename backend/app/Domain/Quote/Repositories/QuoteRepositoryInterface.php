<?php

declare(strict_types=1);

namespace App\Domain\Quote\Repositories;

use App\Domain\Quote\Entities\Quote;
use App\Domain\Quote\ValueObjects\QuoteStatus;

/**
 * Quote Repository Interface
 * 
 * Defines the contract for quote persistence operations.
 * Follows repository pattern for data access abstraction.
 */
interface QuoteRepositoryInterface
{
    /**
     * Find quote by UUID
     * 
     * @param string $uuid Quote UUID
     * @param int $tenantId Tenant ID for isolation
     * @return Quote|null Quote entity or null if not found
     */
    public function findByUuid(string $uuid, int $tenantId): ?Quote;

    /**
     * Find quote by ID
     * 
     * @param int $id Quote ID
     * @param int $tenantId Tenant ID for isolation
     * @return Quote|null Quote entity or null if not found
     */
    public function findById(int $id, int $tenantId): ?Quote;

    /**
     * List quotes with filtering and pagination
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param array $filters Filtering criteria
     * @param string $sortBy Sort field
     * @param string $sortOrder Sort direction (asc|desc)
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array{data: Quote[], total: int, page: int, per_page: int}
     */
    public function list(
        int $tenantId,
        array $filters = [],
        string $sortBy = 'created_at',
        string $sortOrder = 'desc',
        int $page = 1,
        int $perPage = 20
    ): array;

    /**
     * Find quotes by order ID
     * 
     * @param int $orderId Order ID
     * @param int $tenantId Tenant ID for isolation
     * @return Quote[] Array of quote entities
     */
    public function findByOrderId(int $orderId, int $tenantId): array;

    /**
     * Find quotes by vendor ID
     * 
     * @param int $vendorId Vendor ID
     * @param int $tenantId Tenant ID for isolation
     * @param array $filters Additional filters
     * @return Quote[] Array of quote entities
     */
    public function findByVendorId(int $vendorId, int $tenantId, array $filters = []): array;

    /**
     * Find active quote for order and vendor
     * 
     * @param int $orderId Order ID
     * @param int $vendorId Vendor ID
     * @param int $tenantId Tenant ID for isolation
     * @return Quote|null Active quote or null
     */
    public function findActiveQuoteForOrderAndVendor(
        int $orderId,
        int $vendorId,
        int $tenantId
    ): ?Quote;

    /**
     * Find expired quotes for a specific tenant
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param array $statuses Statuses to check for expiration
     * @param \DateTimeImmutable $now Current timestamp
     * @return Quote[] Array of expired quote entities
     */
    public function findExpiredQuotes(int $tenantId, array $statuses, \DateTimeImmutable $now): array;

    /**
     * Find all expired quotes across all tenants
     * 
     * @param array $statuses Statuses to check for expiration
     * @param \DateTimeImmutable $now Current timestamp
     * @return Quote[] Array of expired quote entities
     */
    public function findAllExpiredQuotes(array $statuses, \DateTimeImmutable $now): array;

    /**
     * Save quote (create or update)
     * 
     * @param Quote $quote Quote entity to save
     * @return Quote Saved quote entity with ID
     */
    public function save(Quote $quote): Quote;

    /**
     * Delete quote (soft delete)
     * 
     * @param Quote $quote Quote entity to delete
     * @return bool True if deleted successfully
     */
    public function delete(Quote $quote): bool;

    /**
     * Count quotes by status
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param QuoteStatus|null $status Status to count (null for all)
     * @return int Count of quotes
     */
    public function countByStatus(int $tenantId, ?QuoteStatus $status = null): int;

    /**
     * Get quote statistics
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param array $filters Additional filters
     * @return array Statistics data
     */
    public function getStatistics(int $tenantId, array $filters = []): array;
}
