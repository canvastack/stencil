<?php

namespace App\Domain\Order\Rules;

use App\Domain\Shared\Rules\BusinessRule;
use App\Domain\Shared\Rules\RuleResult;
use App\Domain\Shared\ValueObjects\Money;

class OrderValueValidationRule extends BusinessRule
{
    protected int $priority = 100; // Highest priority
    protected array $applicableContexts = ['order_creation', 'order_validation', 'order_update'];

    private Money $minimumOrderValue;
    private Money $maximumOrderValue;
    private Money $specialApprovalThreshold;

    public function __construct()
    {
        // Using exact amounts as stored in orders.total_amount (in cents)
        $this->minimumOrderValue = new Money(50000000, 'IDR'); // IDR 500,000 in cents
        $this->maximumOrderValue = new Money(50000000000, 'IDR'); // IDR 500,000,000 in cents
        $this->specialApprovalThreshold = new Money(10000000000, 'IDR'); // IDR 100,000,000 in cents
    }

    public function getRuleCode(): string
    {
        return 'order_value_validation';
    }

    public function getName(): string
    {
        return 'Order Value Validation';
    }

    public function getDescription(): string
    {
        return 'Validates order values against minimum and maximum thresholds, and flags orders requiring special approval';
    }

    public function getCategory(): string
    {
        return 'order';
    }

    public function getDefaultParameters(): array
    {
        return [
            'minimum_order_value' => 50000000, // IDR 500,000 in cents
            'maximum_order_value' => 50000000000, // IDR 500,000,000 in cents
            'special_approval_threshold' => 10000000000, // IDR 100,000,000 in cents
            'currency' => 'IDR'
        ];
    }

    public function evaluate($context): RuleResult
    {
        // Handle both object and array context
        $orderValue = is_object($context) && method_exists($context, 'getOrderValue') 
            ? $context->getOrderValue() 
            : new Money($context['order_value'] ?? 0, 'IDR');

        // Use parameters if set, otherwise use defaults
        $minValue = new Money($this->parameters['minimum_order_value'] ?? 50000000, 'IDR');
        $maxValue = new Money($this->parameters['maximum_order_value'] ?? 50000000000, 'IDR');
        $approvalThreshold = new Money($this->parameters['special_approval_threshold'] ?? 10000000000, 'IDR');

        if ($orderValue->isLessThan($minValue)) {
            return RuleResult::failure(
                "Order value {$orderValue->getFormattedAmount()} is below minimum {$minValue->getFormattedAmount()}"
            );
        }

        if ($orderValue->isGreaterThan($maxValue)) {
            return RuleResult::failure(
                "Order value {$orderValue->getFormattedAmount()} exceeds maximum {$maxValue->getFormattedAmount()}"
            );
        }

        $metadata = [];
        if ($orderValue->isGreaterThan($approvalThreshold)) {
            $metadata['requires_special_approval'] = true;
            $metadata['approval_level'] = 'executive';
            
            // Store in orders.metadata JSON field
            $metadata['business_rule_triggered'] = [
                'rule' => 'OrderValueValidationRule',
                'threshold_exceeded' => $approvalThreshold->getAmount(),
                'order_value' => $orderValue->getAmount(),
                'triggered_at' => now()->toISOString()
            ];
        }

        return RuleResult::success($metadata);
    }
}