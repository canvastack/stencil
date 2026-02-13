<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\AuditLog;
use Illuminate\Support\Facades\DB;

/**
 * Audit Log Repository Implementation
 * 
 * Implements audit log data persistence using Eloquent ORM.
 * Part of the Infrastructure layer - framework specific.
 * 
 * Business Rules:
 * - Audit logs are immutable (no updates)
 * - Tenant-scoped for data isolation
 * - Automatic metadata capture (IP, user agent, timestamps)
 * - Retention policy: 2 years
 */
class AuditLogRepository implements AuditLogRepositoryInterface
{
    /**
     * Create new audit log entry
     * 
     * @param int $tenantId
     * @param string $action
     * @param string $entityType
     * @param string|int|null $entityId
     * @param int|null $userId
     * @param array $metadata
     * @param string|null $ipAddress
     * @return array
     */
    public function create(
        int $tenantId,
        string $action,
        string $entityType,
        string|int|null $entityId,
        ?int $userId,
        array $metadata = [],
        ?string $ipAddress = null
    ): array {
        // Extract old_values and new_values from metadata if present
        $oldValues = $metadata['old_values'] ?? null;
        $newValues = $metadata['new_values'] ?? null;
        $userAgent = $metadata['user_agent'] ?? null;
        
        // Remove them from metadata to avoid duplication
        unset($metadata['old_values'], $metadata['new_values'], $metadata['user_agent']);
        
        $auditLog = AuditLog::create([
            'tenant_id' => $tenantId,
            'user_id' => $userId,
            'user_type' => 'vendor', // Default to vendor for vendor portal
            'action_type' => $action,
            'resource_type' => $entityType,
            'resource_id' => $entityId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'metadata' => $metadata,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
        ]);
        
        return $auditLog->toArray();
    }

    /**
     * Find audit logs by entity (resource)
     * 
     * @param int $tenantId
     * @param string $entityType
     * @param string|int $entityId
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function findByEntity(
        int $tenantId,
        string $entityType,
        string|int $entityId,
        int $page = 1,
        int $perPage = 50
    ): array {
        $query = AuditLog::where('tenant_id', $tenantId)
            ->where('resource_type', $entityType)
            ->where('resource_id', $entityId)
            ->orderBy('created_at', 'desc');

        $total = $query->count();
        
        $logs = $query->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get()
            ->toArray();

        return [
            'data' => $logs,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => ceil($total / $perPage),
        ];
    }

    /**
     * Find audit logs by user
     * 
     * @param int $tenantId
     * @param int $userId
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function findByUser(
        int $tenantId,
        int $userId,
        int $page = 1,
        int $perPage = 50
    ): array {
        $query = AuditLog::where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc');

        $total = $query->count();
        
        $logs = $query->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get()
            ->toArray();

        return [
            'data' => $logs,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => ceil($total / $perPage),
        ];
    }

    /**
     * Find audit logs by action type
     * 
     * @param int $tenantId
     * @param string $action
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function findByAction(
        int $tenantId,
        string $action,
        int $page = 1,
        int $perPage = 50
    ): array {
        $query = AuditLog::where('tenant_id', $tenantId)
            ->where('action_type', $action)
            ->orderBy('created_at', 'desc');

        $total = $query->count();
        
        $logs = $query->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get()
            ->toArray();

        return [
            'data' => $logs,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => ceil($total / $perPage),
        ];
    }

    /**
     * Find audit logs with complex filters
     * 
     * @param int $tenantId
     * @param array $filters
     * @param int $page
     * @param int $perPage
     * @return array
     */
    public function findWithFilters(
        int $tenantId,
        array $filters = [],
        int $page = 1,
        int $perPage = 50
    ): array {
        $query = AuditLog::where('tenant_id', $tenantId);

        // Apply filters
        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['user_type'])) {
            $query->where('user_type', $filters['user_type']);
        }

        if (isset($filters['action_type'])) {
            $query->where('action_type', $filters['action_type']);
        }

        if (isset($filters['resource_type'])) {
            $query->where('resource_type', $filters['resource_type']);
        }

        if (isset($filters['resource_id'])) {
            $query->where('resource_id', $filters['resource_id']);
        }

        if (isset($filters['ip_address'])) {
            $query->where('ip_address', $filters['ip_address']);
        }

        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        $query->orderBy('created_at', 'desc');

        $total = $query->count();
        
        $logs = $query->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get()
            ->toArray();

        return [
            'data' => $logs,
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'last_page' => ceil($total / $perPage),
            'filters' => $filters,
        ];
    }

    /**
     * Export audit logs to CSV
     * 
     * @param int $tenantId
     * @param array $filters
     * @return string CSV content
     */
    public function exportToCsv(int $tenantId, array $filters = []): string
    {
        $query = AuditLog::where('tenant_id', $tenantId);

        // Apply same filters as findWithFilters
        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (isset($filters['user_type'])) {
            $query->where('user_type', $filters['user_type']);
        }

        if (isset($filters['action_type'])) {
            $query->where('action_type', $filters['action_type']);
        }

        if (isset($filters['resource_type'])) {
            $query->where('resource_type', $filters['resource_type']);
        }

        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        // Generate CSV
        $csv = "ID,Tenant ID,User ID,User Type,Action Type,Resource Type,Resource ID,IP Address,User Agent,Created At\n";
        
        foreach ($logs as $log) {
            $csv .= sprintf(
                "%d,%d,%s,%s,%s,%s,%s,%s,%s,%s\n",
                $log->id,
                $log->tenant_id,
                $log->user_id ?? 'N/A',
                $log->user_type,
                $log->action_type,
                $log->resource_type,
                $log->resource_id,
                $log->ip_address,
                str_replace('"', '""', $log->user_agent ?? ''),
                $log->created_at->format('Y-m-d H:i:s')
            );
        }

        return $csv;
    }

    /**
     * Get audit log statistics
     * 
     * @param int $tenantId
     * @param array $filters
     * @return array
     */
    public function getStatistics(int $tenantId, array $filters = []): array
    {
        $query = AuditLog::where('tenant_id', $tenantId);

        // Apply date filters if provided
        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        $total = $query->count();

        // Count by action type
        $actionCounts = DB::table('audit_logs')
            ->select('action_type', DB::raw('count(*) as count'))
            ->where('tenant_id', $tenantId);

        if (isset($filters['date_from'])) {
            $actionCounts->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $actionCounts->where('created_at', '<=', $filters['date_to']);
        }

        $actionCounts = $actionCounts->groupBy('action_type')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get()
            ->toArray();

        // Count by user type
        $userTypeCounts = DB::table('audit_logs')
            ->select('user_type', DB::raw('count(*) as count'))
            ->where('tenant_id', $tenantId);

        if (isset($filters['date_from'])) {
            $userTypeCounts->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $userTypeCounts->where('created_at', '<=', $filters['date_to']);
        }

        $userTypeCounts = $userTypeCounts->groupBy('user_type')
            ->get()
            ->toArray();

        // Count by resource type
        $resourceTypeCounts = DB::table('audit_logs')
            ->select('resource_type', DB::raw('count(*) as count'))
            ->where('tenant_id', $tenantId);

        if (isset($filters['date_from'])) {
            $resourceTypeCounts->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $resourceTypeCounts->where('created_at', '<=', $filters['date_to']);
        }

        $resourceTypeCounts = $resourceTypeCounts->groupBy('resource_type')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get()
            ->toArray();

        return [
            'total_logs' => $total,
            'top_actions' => $actionCounts,
            'user_type_distribution' => $userTypeCounts,
            'top_resources' => $resourceTypeCounts,
            'date_range' => [
                'from' => $filters['date_from'] ?? null,
                'to' => $filters['date_to'] ?? null,
            ],
        ];
    }

    /**
     * Delete audit logs older than specified date (retention policy)
     * 
     * @param \DateTimeImmutable $olderThan
     * @return int Number of deleted records
     */
    public function deleteOlderThan(\DateTimeImmutable $olderThan): int
    {
        return AuditLog::where('created_at', '<', $olderThan->format('Y-m-d H:i:s'))
            ->delete();
    }
}
