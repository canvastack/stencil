<?php

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Shared\Rules\Repositories\RuleExecutionLogRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Infrastructure\Persistence\Eloquent\Models\RuleExecutionLog;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RuleExecutionLogRepository implements RuleExecutionLogRepositoryInterface
{
    public function create(array $data): array
    {
        $log = RuleExecutionLog::create([
            'id' => UuidValueObject::generate()->getValue(),
            'tenant_id' => $data['tenant_id'],
            'rule_code' => $data['rule_code'],
            'context' => $data['context'],
            'result' => $data['result'],
            'execution_time' => $data['execution_time'],
            'executed_at' => $data['executed_at'] ?? now()
        ]);

        return $log->toArray();
    }

    public function getByTenantWithFilters(int $tenantId, array $filters = [], int $limit = 50, int $offset = 0): array // Changed parameter type
    {
        $query = RuleExecutionLog::where('tenant_id', $tenantId); // Changed

        if (isset($filters['rule_code'])) {
            $query->where('rule_code', $filters['rule_code']);
        }

        if (isset($filters['context'])) {
            $query->where('context', $filters['context']);
        }

        if (isset($filters['start_date'])) {
            $query->where('executed_at', '>=', $filters['start_date']);
        }

        if (isset($filters['end_date'])) {
            $query->where('executed_at', '<=', $filters['end_date']);
        }

        $total = $query->count();
        
        $logs = $query->orderBy('executed_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get()
            ->toArray();

        return [
            'logs' => $logs,
            'total' => $total
        ];
    }

    public function getStatsByTenant(int $tenantId, \DateTimeInterface $since): array // Changed parameter type
    {
        $stats = RuleExecutionLog::where('tenant_id', $tenantId) // Changed
            ->where('executed_at', '>=', $since)
            ->selectRaw('
                COUNT(*) as total_validations,
                COUNT(CASE WHEN JSON_EXTRACT(result, "$.isValid") = true THEN 1 END) as successful_validations,
                COUNT(CASE WHEN JSON_EXTRACT(result, "$.isValid") = false THEN 1 END) as failed_validations,
                AVG(execution_time) as average_execution_time,
                COUNT(DISTINCT rule_code) as rules_with_errors
            ')
            ->first();

        return [
            'total_validations' => $stats->total_validations ?? 0,
            'successful_validations' => $stats->successful_validations ?? 0,
            'failed_validations' => $stats->failed_validations ?? 0,
            'average_execution_time' => round($stats->average_execution_time ?? 0, 2),
            'rules_with_errors' => $stats->rules_with_errors ?? 0
        ];
    }

    public function getByRuleCode(string $ruleCode, int $limit = 100): Collection
    {
        return RuleExecutionLog::where('rule_code', $ruleCode)
            ->orderBy('executed_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function getRecentByTenant(int $tenantId, int $limit = 50): Collection // Changed parameter type
    {
        return RuleExecutionLog::where('tenant_id', $tenantId) // Changed
            ->orderBy('executed_at', 'desc')
            ->limit($limit)
            ->get();
    }

    public function deleteOlderThan(\DateTimeInterface $date): int
    {
        return RuleExecutionLog::where('executed_at', '<', $date)->delete();
    }

    public function getPerformanceMetrics(int $tenantId, string $ruleCode = null): array // Changed parameter type
    {
        $query = RuleExecutionLog::where('tenant_id', $tenantId); // Changed

        if ($ruleCode) {
            $query->where('rule_code', $ruleCode);
        }

        $metrics = $query->selectRaw('
            rule_code,
            COUNT(*) as execution_count,
            AVG(execution_time) as avg_execution_time,
            MIN(execution_time) as min_execution_time,
            MAX(execution_time) as max_execution_time,
            STDDEV(execution_time) as stddev_execution_time
        ')
        ->groupBy('rule_code')
        ->orderBy('avg_execution_time', 'desc')
        ->get();

        return $metrics->map(function ($metric) {
            return [
                'rule_code' => $metric->rule_code,
                'execution_count' => $metric->execution_count,
                'avg_execution_time' => round($metric->avg_execution_time, 2),
                'min_execution_time' => round($metric->min_execution_time, 2),
                'max_execution_time' => round($metric->max_execution_time, 2),
                'stddev_execution_time' => round($metric->stddev_execution_time ?? 0, 2)
            ];
        })->toArray();
    }

    public function getErrorRateStats(int $tenantId, \DateTimeInterface $since): array // Changed parameter type
    {
        $stats = RuleExecutionLog::where('tenant_id', $tenantId) // Changed
            ->where('executed_at', '>=', $since)
            ->selectRaw('
                rule_code,
                COUNT(*) as total_executions,
                COUNT(CASE WHEN JSON_EXTRACT(result, "$.isValid") = false THEN 1 END) as failed_executions,
                (COUNT(CASE WHEN JSON_EXTRACT(result, "$.isValid") = false THEN 1 END) * 100.0 / COUNT(*)) as error_rate
            ')
            ->groupBy('rule_code')
            ->having('total_executions', '>', 0)
            ->orderBy('error_rate', 'desc')
            ->get();

        return $stats->map(function ($stat) {
            return [
                'rule_code' => $stat->rule_code,
                'total_executions' => $stat->total_executions,
                'failed_executions' => $stat->failed_executions,
                'error_rate' => round($stat->error_rate, 2)
            ];
        })->toArray();
    }

    public function getMostExecutedRules(int $tenantId, int $limit = 10): array // Changed parameter type
    {
        $stats = RuleExecutionLog::where('tenant_id', $tenantId) // Changed
            ->selectRaw('
                rule_code,
                COUNT(*) as execution_count,
                AVG(execution_time) as avg_execution_time,
                MAX(executed_at) as last_executed
            ')
            ->groupBy('rule_code')
            ->orderBy('execution_count', 'desc')
            ->limit($limit)
            ->get();

        return $stats->map(function ($stat) {
            return [
                'rule_code' => $stat->rule_code,
                'execution_count' => $stat->execution_count,
                'avg_execution_time' => round($stat->avg_execution_time, 2),
                'last_executed' => $stat->last_executed
            ];
        })->toArray();
    }

    public function getSlowestRules(int $tenantId, int $limit = 10): array // Changed parameter type
    {
        $stats = RuleExecutionLog::where('tenant_id', $tenantId) // Changed
            ->selectRaw('
                rule_code,
                COUNT(*) as execution_count,
                AVG(execution_time) as avg_execution_time,
                MAX(execution_time) as max_execution_time,
                MIN(execution_time) as min_execution_time
            ')
            ->groupBy('rule_code')
            ->having('execution_count', '>=', 5) // Only include rules with at least 5 executions
            ->orderBy('avg_execution_time', 'desc')
            ->limit($limit)
            ->get();

        return $stats->map(function ($stat) {
            return [
                'rule_code' => $stat->rule_code,
                'execution_count' => $stat->execution_count,
                'avg_execution_time' => round($stat->avg_execution_time, 2),
                'max_execution_time' => round($stat->max_execution_time, 2),
                'min_execution_time' => round($stat->min_execution_time, 2)
            ];
        })->toArray();
    }
}