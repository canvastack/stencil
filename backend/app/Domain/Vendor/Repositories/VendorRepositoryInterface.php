<?php

namespace App\Domain\Vendor\Repositories;

use App\Domain\Vendor\Entities\Vendor;
use App\Domain\Shared\ValueObjects\UuidValueObject;

/**
 * Vendor Repository Interface (Port)
 * 
 * Defines the contract for vendor data persistence.
 * Part of the Domain layer - framework agnostic.
 * 
 * Database Integration:
 * - Abstracts access to vendors table
 * - Handles UUID-based lookups
 * - Maintains tenant isolation
 */
interface VendorRepositoryInterface
{
    /**
     * Save vendor (create or update)
     */
    public function save(Vendor $vendor): Vendor;

    /**
     * Find vendor by UUID
     */
    public function findById(UuidValueObject $id): ?Vendor;

    /**
     * Find vendor by email within tenant
     */
    public function findByEmail(UuidValueObject $tenantId, string $email): ?Vendor;

    /**
     * Find vendors by status within tenant
     */
    public function findByStatus(UuidValueObject $tenantId, string $status): array;

    /**
     * Find vendors by capability within tenant
     */
    public function findByCapability(UuidValueObject $tenantId, string $capability): array;

    /**
     * Check if vendor email exists within tenant
     */
    public function existsByEmail(UuidValueObject $tenantId, string $email): bool;

    /**
     * Get paginated vendors with filters
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
     * Count vendors with filters
     */
    public function countWithFilters(UuidValueObject $tenantId, array $filters = []): int;

    /**
     * Delete vendor (soft delete)
     */
    public function delete(UuidValueObject $id): bool;

    /**
     * Get vendor statistics for tenant
     */
    public function getStatistics(UuidValueObject $tenantId): array;

    /**
     * Find top-rated vendors for tenant
     */
    public function findTopRated(UuidValueObject $tenantId, int $limit = 10): array;

    /**
     * Search vendors by term (name, company, email)
     */
    public function search(UuidValueObject $tenantId, string $searchTerm): array;

    /**
     * Get recent vendors for tenant
     */
    public function getRecent(UuidValueObject $tenantId, int $limit = 10): array;

    /**
     * Find vendors with specific capabilities
     */
    public function findWithCapabilities(UuidValueObject $tenantId, array $capabilities): array;

    /**
     * Get vendor performance metrics
     */
    public function getPerformanceMetrics(UuidValueObject $tenantId): array;

    /**
     * Find vendors available for new orders
     */
    public function findAvailableVendors(UuidValueObject $tenantId): array;

    /**
     * Get vendor order history count
     */
    public function getOrderCount(UuidValueObject $vendorId): int;

    /**
     * Find vendors by rating range
     */
    public function findByRatingRange(
        UuidValueObject $tenantId,
        float $minRating,
        float $maxRating
    ): array;

    /**
     * Find all active vendors across all tenants (for vendor matching)
     */
    public function findActiveVendors(): array;
}