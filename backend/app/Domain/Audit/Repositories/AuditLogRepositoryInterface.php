<?php

declare(strict_types=1);

namespace App\Domain\Audit\Repositories;

/**
 * Audit Log Repository Interface
 * 
 * Defines the contract for audit log persistence operations.
 * Follows repository pattern for data access abstraction.
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8
 */
interface AuditLogRepositoryInterface
{
    /**
     * Create audit log entry
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param string $action Action performed (e.g., 'vendor_login', 'quote_accepted')
     * @param string $entityType Entity type (e.g., 'vendor', 'quote', 'user')
     * @param string|int|null $entityId Entity ID (UUID string or integer)
     * @param int|null $userId User who performed the action
     * @param array $metadata Additional context data
     * @param string|null $ipAddress IP address of the user
     * @return array Created audit log data
     */
    public function create(
        int $tenantId,
        string $action,
        string $entityType,
        string|int|null $entityId,
        ?int $userId,
        array $metadata = [],
        ?string $ipAddress = null
    ): array;

    /**
     * Find audit logs by entity
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param string $entityType Entity type
     * @param string|int $entityId Entity ID (UUID string or integer)
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array{data: array[], total: int, page: int, per_page: int}
     */
    public function findByEntity(
        int $tenantId,
        string $entityType,
        string|int $entityId,
        int $page = 1,
        int $perPage = 50
    ): array;

    /**
     * Find audit logs by user
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param int $userId User ID
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array{data: array[], total: int, page: int, per_page: int}
     */
    public function findByUser(
        int $tenantId,
        int $userId,
        int $page = 1,
        int $perPage = 50
    ): array;

    /**
     * Find audit logs by action type
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param string $action Action type
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array{data: array[], total: int, page: int, per_page: int}
     */
    public function findByAction(
        int $tenantId,
        string $action,
        int $page = 1,
        int $perPage = 50
    ): array;

    /**
     * Find audit logs with filters
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param array $filters Filtering criteria
     * @param int $page Page number
     * @param int $perPage Items per page
     * @return array{data: array[], total: int, page: int, per_page: int}
     */
    public function findWithFilters(
        int $tenantId,
        array $filters = [],
        int $page = 1,
        int $perPage = 50
    ): array;

    /**
     * Export audit logs to CSV
     * Requirements: 16.8
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param array $filters Filtering criteria
     * @return string CSV file path
     */
    public function exportToCsv(int $tenantId, array $filters = []): string;

    /**
     * Get audit log statistics
     * 
     * @param int $tenantId Tenant ID for isolation
     * @param array $filters Additional filters
     * @return array Statistics data
     */
    public function getStatistics(int $tenantId, array $filters = []): array;

    /**
     * Clean up old audit logs
     * Requirements: 16.7 - Retain for at least 2 years
     * 
     * @param \DateTimeImmutable $olderThan Delete logs older than this date
     * @return int Number of deleted logs
     */
    public function deleteOlderThan(\DateTimeImmutable $olderThan): int;
}
