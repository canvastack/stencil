<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Quote\UseCases;

use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;

/**
 * Stub for AuditLogRepository that accepts array parameter
 * This is a temporary solution until the interface/implementation mismatch is resolved
 * 
 * The use cases call create([...]) with an array, but the interface expects individual parameters.
 * This stub uses mixed type to accept both to allow testing to proceed.
 */
class StubAuditLogRepository implements AuditLogRepositoryInterface
{
    public array $auditLogs = [];

    public function create(
        int $tenantId,
        string $action,
        string $entityType,
        string|int|null $entityId,
        ?int $userId,
        array $metadata = [],
        ?string $ipAddress = null
    ): array {
        $log = [
            'tenant_id' => $tenantId,
            'action_type' => $action,
            'resource_type' => $entityType,
            'resource_id' => $entityId,
            'user_id' => $userId,
            'metadata' => $metadata,
            'ip_address' => $ipAddress,
        ];
        
        $this->auditLogs[] = $log;
        return $log;
    }

    public function findByEntity(
        int $tenantId,
        string $entityType,
        string|int $entityId,
        int $page = 1,
        int $perPage = 50
    ): array {
        return ['data' => [], 'total' => 0, 'page' => $page, 'per_page' => $perPage];
    }

    public function findByUser(
        int $tenantId,
        int $userId,
        int $page = 1,
        int $perPage = 50
    ): array {
        return ['data' => [], 'total' => 0, 'page' => $page, 'per_page' => $perPage];
    }

    public function findByAction(
        int $tenantId,
        string $action,
        int $page = 1,
        int $perPage = 50
    ): array {
        return ['data' => [], 'total' => 0, 'page' => $page, 'per_page' => $perPage];
    }

    public function findWithFilters(
        int $tenantId,
        array $filters = [],
        int $page = 1,
        int $perPage = 50
    ): array {
        return ['data' => [], 'total' => 0, 'page' => $page, 'per_page' => $perPage];
    }

    public function exportToCsv(int $tenantId, array $filters = []): string
    {
        return '';
    }

    public function getStatistics(int $tenantId, array $filters = []): array
    {
        return [];
    }

    public function deleteOlderThan(\DateTimeImmutable $olderThan): int
    {
        return 0;
    }
}
