<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RuleConfiguration extends Model
{
    use HasUuids;

    protected $table = 'rule_configurations';

    protected $fillable = [
        'id',
        'tenant_id',
        'rule_code',
        'enabled',
        'priority',
        'parameters',
        'applicable_contexts'
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'priority' => 'integer',
        'parameters' => 'array',
        'applicable_contexts' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected $attributes = [
        'enabled' => true,
        'priority' => 100,
        'parameters' => '{}',
        'applicable_contexts' => '[]'
    ];

    /**
     * Get the tenant that owns this rule configuration
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }

    /**
     * Scope to get enabled configurations
     */
    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }

    /**
     * Scope to get configurations by rule code
     */
    public function scopeByRuleCode($query, string $ruleCode)
    {
        return $query->where('rule_code', $ruleCode);
    }

    /**
     * Scope to get configurations by tenant
     */
    public function scopeByTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Scope to get configurations by context
     */
    public function scopeByContext($query, string $context)
    {
        return $query->whereJsonContains('applicable_contexts', $context);
    }

    /**
     * Scope to order by priority
     */
    public function scopeOrderByPriority($query, string $direction = 'desc')
    {
        return $query->orderBy('priority', $direction);
    }

    /**
     * Check if configuration is applicable to context
     */
    public function isApplicableToContext(string $context): bool
    {
        return in_array($context, $this->applicable_contexts ?? []);
    }

    /**
     * Get parameter value
     */
    public function getParameter(string $key, $default = null)
    {
        return ($this->parameters ?? [])[$key] ?? $default;
    }

    /**
     * Check if parameter exists
     */
    public function hasParameter(string $key): bool
    {
        return array_key_exists($key, $this->parameters ?? []);
    }

    /**
     * Update parameters
     */
    public function updateParameters(array $parameters): void
    {
        $this->parameters = array_merge($this->parameters ?? [], $parameters);
        $this->save();
    }

    /**
     * Reset to default parameters
     */
    public function resetParameters(array $defaultParameters = []): void
    {
        $this->parameters = $defaultParameters;
        $this->save();
    }
}