<?php

namespace App\Domain\Order\ValueObjects;

use Carbon\Carbon;

/**
 * Value Object for Refund Calculation
 * 
 * Encapsulates all financial calculations and business rules
 * applied for a refund request.
 */
class RefundCalculation
{
    public readonly float $orderTotal;
    public readonly float $customerPaidAmount;
    public readonly float $vendorCostPaid;
    public readonly int $productionProgress;
    public readonly string $refundReason;
    public readonly int $qualityIssuePercentage;
    public readonly string $faultParty;
    public readonly Carbon $calculatedAt;
    public readonly string $calculatedBy;

    // Calculated values
    public float $refundableToCustomer = 0;
    public float $companyLoss = 0;
    public float $vendorRecoverable = 0;
    public float $insuranceCover = 0;
    public array $appliedRules = [];

    public function __construct(array $data)
    {
        $this->orderTotal = $data['orderTotal'];
        $this->customerPaidAmount = $data['customerPaidAmount'];
        $this->vendorCostPaid = $data['vendorCostPaid'];
        $this->productionProgress = $data['productionProgress'];
        $this->refundReason = $data['refundReason'];
        $this->qualityIssuePercentage = $data['qualityIssuePercentage'] ?? 100;
        $this->faultParty = $data['faultParty'] ?? 'unknown';
        $this->calculatedAt = $data['calculatedAt'] instanceof Carbon 
            ? $data['calculatedAt'] 
            : Carbon::parse($data['calculatedAt']);
        $this->calculatedBy = $data['calculatedBy'];
    }

    /**
     * Get the net company financial impact.
     * Positive = loss, Negative = gain
     */
    public function getNetCompanyImpact(): float
    {
        return $this->refundableToCustomer - $this->vendorRecoverable - $this->insuranceCover;
    }

    /**
     * Get the insurance fund utilization percentage.
     */
    public function getInsuranceUtilization(): float
    {
        if ($this->companyLoss <= 0) {
            return 0;
        }
        
        return ($this->insuranceCover / ($this->companyLoss + $this->insuranceCover)) * 100;
    }

    /**
     * Check if this refund requires high-level approval.
     */
    public function requiresHighLevelApproval(): bool
    {
        return $this->refundableToCustomer > 2000000 || // > 2M IDR
               $this->getNetCompanyImpact() > 1000000 || // > 1M IDR company loss
               $this->faultParty === 'company'; // Company fault always needs approval
    }

    /**
     * Get risk level of this refund.
     */
    public function getRiskLevel(): string
    {
        $refundAmount = $this->refundableToCustomer;
        $netImpact = $this->getNetCompanyImpact();
        
        // High value refunds are inherently risky regardless of company impact
        if ($refundAmount > 5000000) {
            return 'critical'; // > 5M IDR
        } elseif ($refundAmount > 2000000 || $netImpact > 1500000) {
            return 'high'; // > 2M IDR or > 1.5M company loss
        } elseif ($refundAmount > 1000000 || $netImpact > 200000 || $this->faultParty === 'vendor') {
            return 'medium'; // > 1M IDR, moderate company loss, quality issues, vendor problems
        } else {
            return 'low'; // Small amounts with no company loss
        }
    }

    /**
     * Get summary for approval workflow.
     */
    public function getApprovalSummary(): array
    {
        return [
            'order_total' => $this->orderTotal,
            'customer_paid' => $this->customerPaidAmount,
            'refund_amount' => $this->refundableToCustomer,
            'company_impact' => $this->getNetCompanyImpact(),
            'risk_level' => $this->getRiskLevel(),
            'fault_party' => $this->faultParty,
            'applied_rules' => $this->appliedRules,
            'requires_high_approval' => $this->requiresHighLevelApproval()
        ];
    }

    /**
     * Convert to array for storage.
     */
    public function toArray(): array
    {
        return [
            'orderTotal' => $this->orderTotal,
            'customerPaidAmount' => $this->customerPaidAmount,
            'vendorCostPaid' => $this->vendorCostPaid,
            'productionProgress' => $this->productionProgress,
            'refundReason' => $this->refundReason,
            'qualityIssuePercentage' => $this->qualityIssuePercentage,
            'faultParty' => $this->faultParty,
            'calculatedAt' => $this->calculatedAt->toISOString(),
            'calculatedBy' => $this->calculatedBy,
            'refundableToCustomer' => $this->refundableToCustomer,
            'companyLoss' => $this->companyLoss,
            'vendorRecoverable' => $this->vendorRecoverable,
            'insuranceCover' => $this->insuranceCover,
            'appliedRules' => $this->appliedRules,
            'netCompanyImpact' => $this->getNetCompanyImpact(),
            'riskLevel' => $this->getRiskLevel(),
            'requiresHighLevelApproval' => $this->requiresHighLevelApproval(),
        ];
    }

    /**
     * Create from stored array.
     */
    public static function fromArray(array $data): self
    {
        $calculation = new self($data);
        
        // Restore calculated values
        $calculation->refundableToCustomer = $data['refundableToCustomer'] ?? 0;
        $calculation->companyLoss = $data['companyLoss'] ?? 0;
        $calculation->vendorRecoverable = $data['vendorRecoverable'] ?? 0;
        $calculation->insuranceCover = $data['insuranceCover'] ?? 0;
        $calculation->appliedRules = $data['appliedRules'] ?? [];
        
        return $calculation;
    }
}