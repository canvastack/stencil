<?php

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Shared\Rules\RuleConfiguration;
use App\Domain\Shared\Rules\Repositories\RuleConfigurationRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Infrastructure\Persistence\Eloquent\Models\RuleConfiguration as EloquentRuleConfiguration;
use Illuminate\Support\Collection;

class RuleConfigurationRepository implements RuleConfigurationRepositoryInterface
{
    public function create(array $data): RuleConfiguration
    {
        $eloquentConfig = EloquentRuleConfiguration::create([
            'id' => $data['id'] ?? UuidValueObject::generate()->getValue(),
            'tenant_id' => $data['tenant_id'],
            'rule_code' => $data['rule_code'],
            'enabled' => $data['enabled'] ?? true,
            'priority' => $data['priority'] ?? 100,
            'parameters' => $data['parameters'] ?? [],
            'applicable_contexts' => $data['applicable_contexts'] ?? []
        ]);

        return $this->toDomainEntity($eloquentConfig);
    }

    public function update(RuleConfiguration $configuration, array $data): RuleConfiguration
    {
        $eloquentConfig = EloquentRuleConfiguration::where('id', $configuration->getId()->getValue())->first();
        
        if (!$eloquentConfig) {
            throw new \RuntimeException('Rule configuration not found');
        }

        $eloquentConfig->update(array_filter([
            'enabled' => $data['enabled'] ?? null,
            'priority' => $data['priority'] ?? null,
            'parameters' => $data['parameters'] ?? null,
            'applicable_contexts' => $data['applicable_contexts'] ?? null
        ], fn($value) => $value !== null));

        return $this->toDomainEntity($eloquentConfig->fresh());
    }

    public function delete(RuleConfiguration $configuration): bool
    {
        return EloquentRuleConfiguration::where('id', $configuration->getId()->getValue())->delete() > 0;
    }

    public function findById(UuidValueObject $id): ?RuleConfiguration
    {
        $eloquentConfig = EloquentRuleConfiguration::find($id->getValue());
        
        return $eloquentConfig ? $this->toDomainEntity($eloquentConfig) : null;
    }

    public function getByTenantAndRule(int $tenantId, string $ruleCode): ?RuleConfiguration // Changed parameter type
    {
        $eloquentConfig = EloquentRuleConfiguration::where('tenant_id', $tenantId) // Changed
            ->where('rule_code', $ruleCode)
            ->first();

        return $eloquentConfig ? $this->toDomainEntity($eloquentConfig) : null;
    }

    public function getByTenantId(int $tenantId): Collection // Changed parameter type
    {
        $eloquentConfigs = EloquentRuleConfiguration::where('tenant_id', $tenantId) // Changed
            ->orderBy('priority', 'desc')
            ->orderBy('rule_code')
            ->get();

        return $eloquentConfigs->map(fn($config) => $this->toDomainEntity($config));
    }

    public function getByRuleCode(string $ruleCode): Collection
    {
        $eloquentConfigs = EloquentRuleConfiguration::where('rule_code', $ruleCode)
            ->orderBy('tenant_id')
            ->get();

        return $eloquentConfigs->map(fn($config) => $this->toDomainEntity($config));
    }

    public function getEnabledByTenantId(int $tenantId): Collection // Changed parameter type
    {
        $eloquentConfigs = EloquentRuleConfiguration::where('tenant_id', $tenantId) // Changed
            ->where('enabled', true)
            ->orderBy('priority', 'desc')
            ->orderBy('rule_code')
            ->get();

        return $eloquentConfigs->map(fn($config) => $this->toDomainEntity($config));
    }

    public function getByTenantAndContext(int $tenantId, string $context): Collection // Changed parameter type
    {
        $eloquentConfigs = EloquentRuleConfiguration::where('tenant_id', $tenantId) // Changed
            ->where('enabled', true)
            ->whereJsonContains('applicable_contexts', $context)
            ->orderBy('priority', 'desc')
            ->get();

        return $eloquentConfigs->map(fn($config) => $this->toDomainEntity($config));
    }

    public function exists(int $tenantId, string $ruleCode): bool // Changed parameter type
    {
        return EloquentRuleConfiguration::where('tenant_id', $tenantId) // Changed
            ->where('rule_code', $ruleCode)
            ->exists();
    }

    public function bulkUpdate(array $updates): Collection
    {
        $updatedConfigs = collect();

        foreach ($updates as $update) {
            $eloquentConfig = EloquentRuleConfiguration::where('tenant_id', $update['tenant_id'])
                ->where('rule_code', $update['rule_code'])
                ->first();

            if ($eloquentConfig) {
                $eloquentConfig->update(array_filter([
                    'enabled' => $update['enabled'] ?? null,
                    'priority' => $update['priority'] ?? null,
                    'parameters' => $update['parameters'] ?? null
                ], fn($value) => $value !== null));

                $updatedConfigs->push($this->toDomainEntity($eloquentConfig->fresh()));
            }
        }

        return $updatedConfigs;
    }

    public function getWithFilters(int $tenantId, array $filters = []): Collection // Changed parameter type
    {
        $query = EloquentRuleConfiguration::where('tenant_id', $tenantId); // Changed

        if (isset($filters['enabled'])) {
            $query->where('enabled', $filters['enabled']);
        }

        if (isset($filters['rule_code'])) {
            $query->where('rule_code', 'like', '%' . $filters['rule_code'] . '%');
        }

        if (isset($filters['priority_min'])) {
            $query->where('priority', '>=', $filters['priority_min']);
        }

        if (isset($filters['priority_max'])) {
            $query->where('priority', '<=', $filters['priority_max']);
        }

        if (isset($filters['context'])) {
            $query->whereJsonContains('applicable_contexts', $filters['context']);
        }

        $eloquentConfigs = $query->orderBy('priority', 'desc')
            ->orderBy('rule_code')
            ->get();

        return $eloquentConfigs->map(fn($config) => $this->toDomainEntity($config));
    }

    public function countByTenantId(int $tenantId): int // Changed parameter type
    {
        return EloquentRuleConfiguration::where('tenant_id', $tenantId)->count(); // Changed
    }

    public function getStatsByTenantId(int $tenantId): array // Changed parameter type
    {
        $total = EloquentRuleConfiguration::where('tenant_id', $tenantId)->count(); // Changed
        $enabled = EloquentRuleConfiguration::where('tenant_id', $tenantId) // Changed
            ->where('enabled', true)
            ->count();

        $priorityStats = EloquentRuleConfiguration::where('tenant_id', $tenantId) // Changed
            ->selectRaw('AVG(priority) as avg_priority, MIN(priority) as min_priority, MAX(priority) as max_priority')
            ->first();

        return [
            'total_configurations' => $total,
            'enabled_configurations' => $enabled,
            'disabled_configurations' => $total - $enabled,
            'average_priority' => round($priorityStats->avg_priority ?? 0, 2),
            'min_priority' => $priorityStats->min_priority ?? 0,
            'max_priority' => $priorityStats->max_priority ?? 0
        ];
    }

    private function toDomainEntity(EloquentRuleConfiguration $eloquentConfig): RuleConfiguration
    {
        return new RuleConfiguration(
            new UuidValueObject($eloquentConfig->id),
            $eloquentConfig->tenant_id, // Changed - no longer wrapping in UuidValueObject
            $eloquentConfig->rule_code,
            $eloquentConfig->enabled,
            $eloquentConfig->priority,
            $eloquentConfig->parameters ?? [],
            $eloquentConfig->applicable_contexts ?? [],
            $eloquentConfig->created_at,
            $eloquentConfig->updated_at
        );
    }
}