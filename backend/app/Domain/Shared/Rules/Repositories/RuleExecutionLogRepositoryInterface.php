<?php

namespace App\Domain\Shared\Rules\Repositories;

use Illuminate\Support\Collection;

interface RuleExecutionLogRepositoryInterface
{
    /**
     * Create a new rule execution log
     */
    public function create(array $data): array;

    /**
     * Get execution logs by tenant with filters
     */
    public function getByTenantWithFilters(int $tenantId, array $filters = [], int $limit = 50, int $offset = 0): array; // Changed parameter type

    /**
     * Get execution statistics by tenant
     */
    public function getStatsByTenant(int $tenantId, \DateTimeInterface $since): array; // Changed parameter type

    /**
     * Get execution logs by rule code
     */
    public function getByRuleCode(string $ruleCode, int $limit = 100): Collection;

    /**
     * Get recent execution logs for a tenant
     */
    public function getRecentByTenant(int $tenantId, int $limit = 50): Collection; // Changed parameter type

    /**
     * Delete old execution logs
     */
    public function deleteOlderThan(\DateTimeInterface $date): int;

    /**
     * Get execution performance metrics
     */
    public function getPerformanceMetrics(int $tenantId, string $ruleCode = null): array; // Changed parameter type

    /**
     * Get error rate statistics
     */
    public function getErrorRateStats(int $tenantId, \DateTimeInterface $since): array; // Changed parameter type

    /**
     * Get most frequently executed rules
     */
    public function getMostExecutedRules(int $tenantId, int $limit = 10): array; // Changed parameter type

    /**
     * Get slowest executing rules
     */
    public function getSlowestRules(int $tenantId, int $limit = 10): array; // Changed parameter type
}