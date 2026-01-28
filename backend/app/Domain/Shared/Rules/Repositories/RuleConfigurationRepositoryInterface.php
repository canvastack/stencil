<?php

namespace App\Domain\Shared\Rules\Repositories;

use App\Domain\Shared\Rules\RuleConfiguration;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use Illuminate\Support\Collection;

interface RuleConfigurationRepositoryInterface
{
    /**
     * Create a new rule configuration
     */
    public function create(array $data): RuleConfiguration;

    /**
     * Update an existing rule configuration
     */
    public function update(RuleConfiguration $configuration, array $data): RuleConfiguration;

    /**
     * Delete a rule configuration
     */
    public function delete(RuleConfiguration $configuration): bool;

    /**
     * Find rule configuration by ID
     */
    public function findById(UuidValueObject $id): ?RuleConfiguration;

    /**
     * Get rule configuration by tenant and rule code
     */
    public function getByTenantAndRule(int $tenantId, string $ruleCode): ?RuleConfiguration; // Changed parameter type

    /**
     * Get all rule configurations for a tenant
     */
    public function getByTenantId(int $tenantId): Collection; // Changed parameter type

    /**
     * Get rule configurations by rule code across tenants
     */
    public function getByRuleCode(string $ruleCode): Collection;

    /**
     * Get enabled rule configurations for a tenant
     */
    public function getEnabledByTenantId(int $tenantId): Collection; // Changed parameter type

    /**
     * Get rule configurations by context for a tenant
     */
    public function getByTenantAndContext(int $tenantId, string $context): Collection; // Changed parameter type

    /**
     * Check if rule configuration exists
     */
    public function exists(int $tenantId, string $ruleCode): bool; // Changed parameter type

    /**
     * Bulk update rule configurations
     */
    public function bulkUpdate(array $updates): Collection;

    /**
     * Get rule configurations with filters
     */
    public function getWithFilters(int $tenantId, array $filters = []): Collection; // Changed parameter type

    /**
     * Count rule configurations for a tenant
     */
    public function countByTenantId(int $tenantId): int; // Changed parameter type

    /**
     * Get rule configuration statistics for a tenant
     */
    public function getStatsByTenantId(int $tenantId): array; // Changed parameter type
}