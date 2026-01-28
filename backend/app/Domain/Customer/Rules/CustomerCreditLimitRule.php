<?php

namespace App\Domain\Customer\Rules;

use App\Domain\Shared\Rules\BusinessRule;
use App\Domain\Shared\Rules\RuleResult;
use App\Domain\Shared\ValueObjects\Money;

class CustomerCreditLimitRule extends BusinessRule
{
    protected int $priority = 95;
    protected array $applicableContexts = ['order_creation', 'credit_check', 'customer_validation'];

    public function getRuleCode(): string
    {
        return 'customer_credit_limit';
    }

    public function getName(): string
    {
        return 'Customer Credit Limit';
    }

    public function getDescription(): string
    {
        return 'Validates customer credit limits and outstanding balances to prevent over-extension';
    }

    public function getCategory(): string
    {
        return 'customer';
    }

    public function getDefaultParameters(): array
    {
        return [
            'default_credit_limit' => 10000000000, // IDR 100M in cents
            'warning_threshold' => 0.8, // 80% of credit limit
            'currency' => 'IDR'
        ];
    }

    public function evaluate($context): RuleResult
    {
        // Handle both object and array context
        $orderValue = is_object($context) && method_exists($context, 'getOrderValue') 
            ? $context->getOrderValue() 
            : new Money($context['order_value'] ?? 0, 'IDR');

        $customerId = is_object($context) && method_exists($context, 'getCustomerId')
            ? $context->getCustomerId()
            : ($context['customer_id'] ?? null);

        if (!$customerId) {
            return RuleResult::failure('Customer ID is required for credit limit validation');
        }

        // Mock customer data for testing - in real implementation, fetch from database
        $creditLimit = new Money($this->parameters['default_credit_limit'] ?? 10000000000, 'IDR');
        $outstandingBalance = new Money(2000000000, 'IDR'); // Mock outstanding balance
        
        $totalExposure = $orderValue->add($outstandingBalance);

        if ($totalExposure->isGreaterThan($creditLimit)) {
            return RuleResult::failure([
                "Total exposure {$totalExposure->getFormattedAmount()} exceeds credit limit {$creditLimit->getFormattedAmount()}",
                "Outstanding balance: {$outstandingBalance->getFormattedAmount()}",
                "New order value: {$orderValue->getFormattedAmount()}"
            ]);
        }

        // Warning if approaching credit limit (80%)
        $warningThreshold = $creditLimit->multiply($this->parameters['warning_threshold'] ?? 0.8);
        $warnings = [];
        if ($totalExposure->isGreaterThan($warningThreshold)) {
            $warnings[] = "Approaching credit limit: {$totalExposure->getFormattedAmount()} of {$creditLimit->getFormattedAmount()}";
        }

        return RuleResult::success([
            'credit_utilization' => $totalExposure->getAmount() / $creditLimit->getAmount(),
            'available_credit' => $creditLimit->subtract($totalExposure)->getAmount()
        ], $warnings);
    }
}