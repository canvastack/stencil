<?php

namespace App\Domain\Order\Services;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\RefundRequest;
use App\Domain\Order\ValueObjects\RefundCalculation;
use App\Domain\Order\Enums\OrderStatus;

/**
 * Refund Calculation Engine for PT Custom Etching Xenial
 * 
 * Implements business rules for refund calculations based on:
 * - Order status and progress
 * - Refund reason and fault party
 * - Financial protection rules
 * - Insurance fund availability
 */
class RefundCalculationEngine
{
    /**
     * Calculate refund amount and financial breakdown.
     */
    public static function calculate(Order $order, RefundRequest $request): RefundCalculation
    {
        $calculation = new RefundCalculation([
            'orderTotal' => $order->total_amount,
            'customerPaidAmount' => $order->total_paid_amount,
            'vendorCostPaid' => $order->total_disbursed_amount ?? 0,
            'productionProgress' => static::calculateProductionProgress($order),
            'refundReason' => $request->refund_reason,
            'qualityIssuePercentage' => $request->quality_issue_percentage ?? 100,
            'faultParty' => static::determineFaultParty($request->refund_reason),
            'calculatedAt' => now(),
            'calculatedBy' => auth()->user()->name ?? 'System'
        ]);

        // Apply calculation rules based on scenarios
        switch ($request->refund_reason) {
            case 'customer_request':
                return static::calculateCustomerInitiated($order, $request, $calculation);
                
            case 'quality_issue':
                return static::calculateQualityIssue($order, $request, $calculation);
                
            case 'vendor_failure':
                return static::calculateVendorFailure($order, $request, $calculation);
                
            case 'timeline_delay':
                return static::calculateTimelineDelay($order, $request, $calculation);
                
            case 'production_error':
                return static::calculateProductionError($order, $request, $calculation);
                
            default:
                return static::calculateDefault($order, $request, $calculation);
        }
    }

    /**
     * Calculate production progress percentage.
     */
    private static function calculateProductionProgress(Order $order): int
    {
        switch ($order->status) {
            case OrderStatus::DRAFT->value:
            case OrderStatus::PENDING->value:
            case OrderStatus::VENDOR_SOURCING->value:
            case OrderStatus::VENDOR_NEGOTIATION->value:
            case OrderStatus::CUSTOMER_QUOTE->value:
            case OrderStatus::AWAITING_PAYMENT->value:
                return 0;
                
            case OrderStatus::PARTIAL_PAYMENT->value:
            case OrderStatus::FULL_PAYMENT->value:
                return 10; // Payment received, production starting
                
            case OrderStatus::IN_PRODUCTION->value:
                return 50; // Mid-production
                
            case OrderStatus::QUALITY_CONTROL->value:
                return 80; // Nearly complete
                
            case OrderStatus::SHIPPING->value:
                return 90; // Ready to ship
                
            case OrderStatus::COMPLETED->value:
                return 100; // Completed
                
            default:
                return 0;
        }
    }

    /**
     * Determine fault party based on refund reason.
     */
    private static function determineFaultParty(string $reason): string
    {
        return match($reason) {
            'customer_request' => 'customer',
            'quality_issue' => 'vendor', // Assume vendor fault unless proven otherwise
            'vendor_failure' => 'vendor',
            'timeline_delay' => 'vendor', // Usually vendor delay
            'production_error' => 'company', // Internal error
            'shipping_damage' => 'external', // Shipping company
            default => 'unknown'
        };
    }

    /**
     * Calculate refund for customer-initiated cancellation.
     */
    private static function calculateCustomerInitiated(Order $order, RefundRequest $request, RefundCalculation $calc): RefundCalculation
    {
        // Scenario 1: Pre-Production - Customer pays only admin costs
        if ($calc->vendorCostPaid == 0) {
            $adminCost = $calc->orderTotal * 0.05; // 5% admin cost
            $calc->refundableToCustomer = max(0, $calc->customerPaidAmount - $adminCost);
            $calc->companyLoss = 0;
            $calc->vendorRecoverable = 0;
            $calc->appliedRules = ['pre_production_admin_cost_deduction'];
            
            return $calc;
        }

        // Scenario 2: Mid-Production - Customer pays production costs incurred
        $productionCostIncurred = $calc->vendorCostPaid + ($calc->orderTotal * 0.1); // 10% handling
        $calc->refundableToCustomer = max(0, $calc->customerPaidAmount - $productionCostIncurred);
        $calc->companyLoss = max(0, $productionCostIncurred - $calc->customerPaidAmount);
        $calc->vendorRecoverable = 0; // Can't recover from vendor if customer cancels
        $calc->appliedRules = ['customer_pays_incurred_costs', 'handling_fee_applied'];

        return $calc;
    }

    /**
     * Calculate refund for quality issues.
     */
    private static function calculateQualityIssue(Order $order, RefundRequest $request, RefundCalculation $calc): RefundCalculation
    {
        $qualityPercentage = $calc->qualityIssuePercentage / 100;
        
        // Calculate proportional refund based on quality issue percentage
        $calc->refundableToCustomer = $calc->customerPaidAmount * $qualityPercentage;
        $calc->vendorRecoverable = $calc->vendorCostPaid * $qualityPercentage;
        
        // Company loss = customer refund - vendor recovery
        $calc->companyLoss = max(0, $calc->refundableToCustomer - $calc->vendorRecoverable);
        
        // Apply insurance fund coverage for quality issues
        $insuranceBalance = InsuranceFundService::getBalance($order->tenant_id);
        $calc->insuranceCover = min($calc->companyLoss, $insuranceBalance);
        $calc->companyLoss -= $calc->insuranceCover;
        
        $calc->appliedRules = [
            'quality_issue_partial_refund',
            'vendor_liability_applied',
            'insurance_fund_coverage'
        ];

        return $calc;
    }

    /**
     * Calculate refund for vendor failure.
     */
    private static function calculateVendorFailure(Order $order, RefundRequest $request, RefundCalculation $calc): RefundCalculation
    {
        // Full refund to customer, try to recover from vendor what was paid
        $calc->refundableToCustomer = $calc->customerPaidAmount;
        $calc->vendorRecoverable = $calc->vendorCostPaid;
        
        // For vendor failure, we expect full recovery so company loss should be minimal
        // Company loss = customer refund - vendor recovery
        $potentialCompanyLoss = $calc->refundableToCustomer - $calc->vendorRecoverable;
        
        // Insurance covers any remaining company loss from vendor failure
        $insuranceBalance = InsuranceFundService::getBalance($order->tenant_id);
        $calc->insuranceCover = min($potentialCompanyLoss, $insuranceBalance);
        $calc->companyLoss = max(0, $potentialCompanyLoss - $calc->insuranceCover);
        
        $calc->appliedRules = [
            'vendor_failure_full_recovery',
            'vendor_full_liability',
            'insurance_backup_coverage'
        ];

        return $calc;
    }

    /**
     * Calculate refund for timeline delays.
     */
    private static function calculateTimelineDelay(Order $order, RefundRequest $request, RefundCalculation $calc): RefundCalculation
    {
        $delayDays = $request->delay_days ?? 0;
        
        // Compensation based on delay severity
        if ($delayDays <= 7) {
            // Minor delay - 10% compensation
            $compensationRate = 0.1;
        } elseif ($delayDays <= 30) {
            // Major delay - 25% compensation
            $compensationRate = 0.25;
        } else {
            // Critical delay - full refund option
            $compensationRate = 1.0;
        }
        
        $compensation = $calc->customerPaidAmount * $compensationRate;
        
        if ($compensationRate >= 1.0) {
            // Full refund scenario
            $calc->refundableToCustomer = $calc->customerPaidAmount;
            $calc->vendorRecoverable = $calc->vendorCostPaid * 0.8; // 80% vendor liability
        } else {
            // Compensation scenario
            $calc->refundableToCustomer = $compensation;
            $calc->vendorRecoverable = $compensation; // Vendor pays compensation
        }
        
        $calc->companyLoss = max(0, $calc->refundableToCustomer - $calc->vendorRecoverable);
        
        $calc->appliedRules = [
            "timeline_delay_{$delayDays}_days",
            "compensation_rate_{$compensationRate}",
            'vendor_delay_liability'
        ];

        return $calc;
    }

    /**
     * Calculate refund for production errors.
     */
    private static function calculateProductionError(Order $order, RefundRequest $request, RefundCalculation $calc): RefundCalculation
    {
        // Company fault - full refund to customer
        $calc->refundableToCustomer = $calc->customerPaidAmount;
        $calc->vendorRecoverable = 0; // Can't recover if company error
        $calc->companyLoss = $calc->refundableToCustomer;
        
        // Insurance covers production errors but not 100% - company should bear some responsibility
        $insuranceBalance = InsuranceFundService::getBalance($order->tenant_id);
        $maxInsuranceCover = $calc->companyLoss * 0.8; // Insurance covers max 80% for production errors
        $calc->insuranceCover = min($maxInsuranceCover, $insuranceBalance);
        $calc->companyLoss -= $calc->insuranceCover;
        
        $calc->appliedRules = [
            'production_error_full_refund',
            'company_liability',
            'insurance_partial_coverage_80pct'
        ];

        return $calc;
    }

    /**
     * Default calculation for other scenarios.
     */
    private static function calculateDefault(Order $order, RefundRequest $request, RefundCalculation $calc): RefundCalculation
    {
        // Conservative approach - case-by-case basis
        $calc->refundableToCustomer = $calc->customerPaidAmount * 0.8; // 80% refund
        $calc->vendorRecoverable = $calc->vendorCostPaid * 0.5; // 50% vendor recovery
        $calc->companyLoss = $calc->refundableToCustomer - $calc->vendorRecoverable;
        
        $calc->appliedRules = ['default_conservative_calculation'];

        return $calc;
    }

    /**
     * Validate calculation results.
     */
    public static function validateCalculation(RefundCalculation $calc): array
    {
        $errors = [];
        
        if ($calc->refundableToCustomer < 0) {
            $errors[] = 'Customer refund amount cannot be negative';
        }
        
        if ($calc->refundableToCustomer > $calc->orderTotal * 1.1) {
            $errors[] = 'Customer refund exceeds reasonable limit (110% of order total)';
        }
        
        if ($calc->vendorRecoverable > $calc->vendorCostPaid * 1.1) {
            $errors[] = 'Vendor recovery exceeds reasonable limit (110% of vendor cost)';
        }
        
        if ($calc->insuranceCover > $calc->companyLoss) {
            $errors[] = 'Insurance cover cannot exceed company loss';
        }
        
        return $errors;
    }
}