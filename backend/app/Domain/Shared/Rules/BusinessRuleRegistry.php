<?php

namespace App\Domain\Shared\Rules;

use App\Domain\Order\Rules\OrderValueValidationRule;
use App\Domain\Customer\Rules\CustomerCreditLimitRule;
use App\Domain\Vendor\Rules\VendorCapabilityRule;
use App\Domain\Vendor\Rules\VendorPerformanceRule;
use App\Domain\Payment\Rules\PaymentTermsRule;
use App\Domain\Quality\Rules\QualityStandardsRule;
use Illuminate\Support\Collection;

class BusinessRuleRegistry
{
    private array $rules = [];

    public function __construct()
    {
        $this->registerDefaultRules();
    }

    /**
     * Register all default business rules
     */
    private function registerDefaultRules(): void
    {
        // Order Management Rules
        $this->register(new OrderValueValidationRule());
        
        // Customer Management Rules  
        $this->register(new CustomerCreditLimitRule());
        
        // Vendor Management Rules
        $this->register(new VendorCapabilityRule());
        $this->register(new VendorPerformanceRule());
        
        // Payment Rules
        $this->register(new PaymentTermsRule());
        
        // Quality Rules
        $this->register(new QualityStandardsRule());
    }

    /**
     * Register a business rule
     */
    public function register(BusinessRule $rule): void
    {
        $this->rules[$rule->getRuleCode()] = $rule;
    }

    /**
     * Get a specific rule by code
     */
    public function getRule(string $ruleCode): ?BusinessRule
    {
        return $this->rules[$ruleCode] ?? null;
    }

    /**
     * Get all registered rules
     */
    public function getAllRules(): Collection
    {
        return collect($this->rules);
    }

    /**
     * Get rules by category
     */
    public function getRulesByCategory(string $category): Collection
    {
        return collect($this->rules)->filter(function (BusinessRule $rule) use ($category) {
            return $rule->getCategory() === $category;
        });
    }

    /**
     * Get rules applicable to a context
     */
    public function getRulesForContext(string $context): Collection
    {
        return collect($this->rules)->filter(function (BusinessRule $rule) use ($context) {
            return in_array($context, $rule->getApplicableContexts());
        });
    }

    /**
     * Get total number of registered rules
     */
    public function getTotalRules(): int
    {
        return count($this->rules);
    }

    /**
     * Check if a rule exists
     */
    public function hasRule(string $ruleCode): bool
    {
        return isset($this->rules[$ruleCode]);
    }
}