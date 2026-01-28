<?php

namespace App\Domain\Shared\Rules;

use App\Domain\Shared\Rules\Repositories\RuleConfigurationRepositoryInterface;
use App\Domain\Shared\Rules\Repositories\RuleExecutionLogRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use Illuminate\Support\Facades\Auth;

class BusinessRuleEngine
{
    private BusinessRuleRegistry $ruleRegistry;
    private RuleConfigurationRepositoryInterface $configRepository;
    private RuleExecutionLogRepositoryInterface $logRepository;

    public function __construct(
        BusinessRuleRegistry $ruleRegistry,
        RuleConfigurationRepositoryInterface $configRepository,
        RuleExecutionLogRepositoryInterface $logRepository
    ) {
        $this->ruleRegistry = $ruleRegistry;
        $this->configRepository = $configRepository;
        $this->logRepository = $logRepository;
    }

    /**
     * Validate context against applicable rules
     */
    public function validateContext(string $context, $data): ValidationResult
    {
        $applicableRules = $this->getRulesForContext($context);
        $results = [];

        foreach ($applicableRules as $rule) {
            $config = $this->getRuleConfiguration($rule->getRuleCode());
            
            if (!$config || !$config->isEnabled()) {
                continue;
            }

            // Apply configuration parameters to rule
            if ($config->getParameters()) {
                $rule->setParameters($config->getParameters());
            }

            // Set priority from configuration
            if ($config->getPriority() !== $rule->getDefaultPriority()) {
                $rule->setPriority($config->getPriority());
            }

            $startTime = microtime(true);
            $result = $rule->evaluate($data);
            $executionTime = (microtime(true) - $startTime) * 1000; // Convert to milliseconds

            $result->setExecutionTime($executionTime);
            $result->setRuleCode($rule->getRuleCode());

            $results[] = $result;

            // Log execution
            $this->logExecution($rule->getRuleCode(), $context, $result, $executionTime);

            // Stop on first critical failure
            if (!$result->isValid() && $rule->getPriority() >= 90) {
                break;
            }
        }

        return new ValidationResult($results);
    }

    /**
     * Get rules applicable to a context
     */
    private function getRulesForContext(string $context): array
    {
        $rules = $this->ruleRegistry->getRulesForContext($context)->toArray();

        // Sort by priority (highest first)
        usort($rules, fn($a, $b) => $b->getPriority() <=> $a->getPriority());

        return $rules;
    }

    /**
     * Get rule configuration for current tenant
     */
    private function getRuleConfiguration(string $ruleCode): ?RuleConfiguration
    {
        if (!Auth::check() || !Auth::user()->tenant_id) {
            return null;
        }

        $tenantId = Auth::user()->tenant_id; // Changed - no longer wrapping in UuidValueObject
        return $this->configRepository->getByTenantAndRule($tenantId, $ruleCode);
    }

    /**
     * Log rule execution
     */
    private function logExecution(string $ruleCode, string $context, RuleResult $result, float $executionTime): void
    {
        if (!Auth::check() || !Auth::user()->tenant_id) {
            return;
        }

        try {
            $this->logRepository->create([
                'tenant_id' => Auth::user()->tenant_id, // Changed - no longer wrapping in UuidValueObject
                'rule_code' => $ruleCode,
                'context' => $context,
                'result' => $result->toArray(),
                'execution_time' => $executionTime,
                'executed_at' => now()
            ]);
        } catch (\Exception $e) {
            // Log execution failure but don't break rule validation
            \Log::warning('Failed to log rule execution', [
                'rule_code' => $ruleCode,
                'context' => $context,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Test a specific rule
     */
    public function testRule(string $ruleCode, $testContext = null): RuleResult
    {
        $rule = $this->ruleRegistry->getRule($ruleCode);
        
        if (!$rule) {
            return RuleResult::failure("Rule '{$ruleCode}' not found");
        }

        // Use provided test context or rule's default
        $context = $testContext ?? $rule->createTestContext();

        $startTime = microtime(true);
        $result = $rule->evaluate($context);
        $executionTime = (microtime(true) - $startTime) * 1000;

        $result->setExecutionTime($executionTime);
        $result->setRuleCode($ruleCode);

        // Log test execution
        $this->logExecution($ruleCode, 'test', $result, $executionTime);

        return $result;
    }

    /**
     * Get all available rules
     */
    public function getAllRules(): \Illuminate\Support\Collection
    {
        return $this->ruleRegistry->getAllRules();
    }

    /**
     * Get rules by category
     */
    public function getRulesByCategory(string $category): \Illuminate\Support\Collection
    {
        return $this->ruleRegistry->getRulesByCategory($category);
    }

    /**
     * Check if rule exists
     */
    public function hasRule(string $ruleCode): bool
    {
        return $this->ruleRegistry->hasRule($ruleCode);
    }

    /**
     * Get rule by code
     */
    public function getRule(string $ruleCode): ?BusinessRule
    {
        return $this->ruleRegistry->getRule($ruleCode);
    }
}