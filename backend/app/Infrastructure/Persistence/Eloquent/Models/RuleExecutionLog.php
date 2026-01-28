<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RuleExecutionLog extends Model
{
    use HasUuids;

    protected $table = 'rule_execution_logs';

    protected $fillable = [
        'id',
        'tenant_id',
        'rule_code',
        'context',
        'result',
        'execution_time',
        'executed_at'
    ];

    protected $casts = [
        'result' => 'array',
        'execution_time' => 'float',
        'executed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Get the tenant that owns this execution log
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }

    /**
     * Scope to get logs by tenant
     */
    public function scopeByTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to get logs by rule code
     */
    public function scopeByRuleCode($query, string $ruleCode)
    {
        return $query->where('rule_code', $ruleCode);
    }

    /**
     * Scope to get logs by context
     */
    public function scopeByContext($query, string $context)
    {
        return $query->where('context', $context);
    }

    /**
     * Scope to get successful executions
     */
    public function scopeSuccessful($query)
    {
        return $query->whereJsonPath('result->isValid', true);
    }

    /**
     * Scope to get failed executions
     */
    public function scopeFailed($query)
    {
        return $query->whereJsonPath('result->isValid', false);
    }

    /**
     * Scope to get executions within date range
     */
    public function scopeWithinDateRange($query, \DateTimeInterface $start, \DateTimeInterface $end)
    {
        return $query->whereBetween('executed_at', [$start, $end]);
    }

    /**
     * Scope to get recent executions
     */
    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('executed_at', '>=', now()->subDays($days));
    }

    /**
     * Scope to get slow executions
     */
    public function scopeSlow($query, float $thresholdMs = 100.0)
    {
        return $query->where('execution_time', '>', $thresholdMs);
    }

    /**
     * Check if execution was successful
     */
    public function wasSuccessful(): bool
    {
        return ($this->result['isValid'] ?? false) === true;
    }

    /**
     * Check if execution failed
     */
    public function failed(): bool
    {
        return !$this->wasSuccessful();
    }

    /**
     * Get execution errors
     */
    public function getErrors(): array
    {
        return $this->result['errors'] ?? [];
    }

    /**
     * Get execution warnings
     */
    public function getWarnings(): array
    {
        return $this->result['warnings'] ?? [];
    }

    /**
     * Get execution metadata
     */
    public function getMetadata(): array
    {
        return $this->result['metadata'] ?? [];
    }

    /**
     * Check if execution was slow
     */
    public function wasSlow(float $thresholdMs = 100.0): bool
    {
        return $this->execution_time > $thresholdMs;
    }

    /**
     * Get formatted execution time
     */
    public function getFormattedExecutionTime(): string
    {
        if ($this->execution_time < 1) {
            return number_format($this->execution_time * 1000, 2) . 'μs';
        } elseif ($this->execution_time < 1000) {
            return number_format($this->execution_time, 2) . 'ms';
        } else {
            return number_format($this->execution_time / 1000, 2) . 's';
        }
    }
}