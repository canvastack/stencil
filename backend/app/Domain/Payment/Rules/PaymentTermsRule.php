<?php

namespace App\Domain\Payment\Rules;

use App\Domain\Shared\Rules\BusinessRule;
use App\Domain\Shared\Rules\RuleResult;
use App\Domain\Shared\ValueObjects\Money;

class PaymentTermsRule extends BusinessRule
{
    protected int $priority = 85;
    protected array $applicableContexts = ['order_creation', 'payment_validation'];

    public function getRuleCode(): string
    {
        return 'payment_terms';
    }

    public function getName(): string
    {
        return 'Payment Terms Validation';
    }

    public function getDescription(): string
    {
        return 'Validates payment terms and down payment requirements based on customer history and order value';
    }

    public function getCategory(): string
    {
        return 'payment';
    }

    public function getDefaultParameters(): array
    {
        return [
            'dp50_minimum_percentage' => 0.5, // 50%
            'full_payment_threshold' => 5000000000, // IDR 50M in cents
            'currency' => 'IDR'
        ];
    }

    public function evaluate($context): RuleResult
    {
        $orderValue = is_object($context) && method_exists($context, 'getOrderValue') 
            ? $context->getOrderValue() 
            : new Money($context['order_value'] ?? 0, 'IDR');

        $paymentType = is_object($context) && method_exists($context, 'getPaymentType')
            ? $context->getPaymentType()
            : ($context['payment_type'] ?? 'DP50');

        $customerId = is_object($context) && method_exists($context, 'getCustomerId')
            ? $context->getCustomerId()
            : ($context['customer_id'] ?? null);

        // Mock customer payment history - in real implementation, fetch from database
        $customerHasPaymentDelays = false; // Mock data

        if ($paymentType === 'DP50') {
            $minimumDPPercentage = $this->parameters['dp50_minimum_percentage'] ?? 0.5;
            $minimumDP = $orderValue->multiply($minimumDPPercentage);
            
            $proposedDP = is_object($context) && method_exists($context, 'getProposedDownPayment')
                ? $context->getProposedDownPayment()
                : new Money($context['proposed_down_payment'] ?? $minimumDP->getAmount(), 'IDR');

            if ($proposedDP->isLessThan($minimumDP)) {
                $dpPercentage = $minimumDPPercentage * 100;
                return RuleResult::failure(
                    "Down payment {$proposedDP->getFormattedAmount()} is below minimum {$dpPercentage}% ({$minimumDP->getFormattedAmount()})"
                );
            }
        }

        // Check customer payment history for credit terms
        if ($customerHasPaymentDelays && $paymentType === 'DP50') {
            return RuleResult::failure(
                "Customer has payment delays in history. Full payment required."
            );
        }

        // High-value orders require full payment
        $fullPaymentThreshold = new Money($this->parameters['full_payment_threshold'] ?? 5000000000, 'IDR');
        if ($orderValue->isGreaterThan($fullPaymentThreshold) && $paymentType !== 'FULL') {
            return RuleResult::failure(
                "Orders above {$fullPaymentThreshold->getFormattedAmount()} require full payment"
            );
        }

        // Generate payment schedule
        $paymentSchedule = $this->calculatePaymentSchedule($paymentType, $orderValue);

        return RuleResult::success([
            'payment_schedule' => $paymentSchedule,
            'credit_terms_eligible' => !$customerHasPaymentDelays,
            'payment_type' => $paymentType
        ]);
    }

    private function calculatePaymentSchedule(string $paymentType, Money $orderValue): array
    {
        switch ($paymentType) {
            case 'DP50':
                $downPayment = $orderValue->multiply(0.5);
                $finalPayment = $orderValue->subtract($downPayment);
                return [
                    ['type' => 'down_payment', 'amount' => $downPayment->getAmount(), 'due_date' => 'order_confirmation'],
                    ['type' => 'final_payment', 'amount' => $finalPayment->getAmount(), 'due_date' => 'before_delivery']
                ];
            case 'FULL':
                return [
                    ['type' => 'full_payment', 'amount' => $orderValue->getAmount(), 'due_date' => 'order_confirmation']
                ];
            default:
                return [];
        }
    }
}