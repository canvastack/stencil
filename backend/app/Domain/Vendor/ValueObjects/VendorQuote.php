<?php

namespace App\Domain\Vendor\ValueObjects;

use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use DateTimeImmutable;

/**
 * Vendor Quote Value Object
 * 
 * Immutable representation of a vendor's quote for an order
 * Contains pricing, timeline, and terms information
 */
class VendorQuote
{
    public function __construct(
        private UuidValueObject $vendorId,
        private Money $materialCost,
        private Money $laborCost,
        private Money $overheadCost,
        private Money $totalPrice,
        private int $leadTimeDays,
        private array $paymentTerms,
        private array $qualityStandards,
        private array $deliveryTerms,
        private ?DateTimeImmutable $validUntil = null,
        private array $metadata = []
    ) {}
    
    /**
     * Create vendor quote from basic pricing
     */
    public static function fromBasicPricing(
        UuidValueObject $vendorId,
        Money $totalPrice,
        int $leadTimeDays,
        array $paymentTerms = [],
        ?DateTimeImmutable $validUntil = null
    ): self {
        // Estimate cost breakdown (typical for etching business)
        $materialCost = $totalPrice->multiply(0.65); // 65% materials
        $laborCost = $totalPrice->multiply(0.25);    // 25% labor
        $overheadCost = $totalPrice->multiply(0.10); // 10% overhead
        
        return new self(
            vendorId: $vendorId,
            materialCost: $materialCost,
            laborCost: $laborCost,
            overheadCost: $overheadCost,
            totalPrice: $totalPrice,
            leadTimeDays: $leadTimeDays,
            paymentTerms: $paymentTerms,
            qualityStandards: [],
            deliveryTerms: [],
            validUntil: $validUntil,
            metadata: []
        );
    }
    
    /**
     * Create detailed vendor quote
     */
    public static function createDetailed(
        UuidValueObject $vendorId,
        Money $materialCost,
        Money $laborCost,
        Money $overheadCost,
        int $leadTimeDays,
        array $paymentTerms,
        array $qualityStandards,
        array $deliveryTerms,
        ?DateTimeImmutable $validUntil = null,
        array $metadata = []
    ): self {
        $totalPrice = $materialCost->add($laborCost)->add($overheadCost);
        
        return new self(
            vendorId: $vendorId,
            materialCost: $materialCost,
            laborCost: $laborCost,
            overheadCost: $overheadCost,
            totalPrice: $totalPrice,
            leadTimeDays: $leadTimeDays,
            paymentTerms: $paymentTerms,
            qualityStandards: $qualityStandards,
            deliveryTerms: $deliveryTerms,
            validUntil: $validUntil,
            metadata: $metadata
        );
    }
    
    /**
     * Check if quote is still valid
     */
    public function isValid(): bool
    {
        if ($this->validUntil === null) {
            return true; // No expiration
        }
        
        return $this->validUntil > new DateTimeImmutable();
    }
    
    /**
     * Get cost breakdown percentage
     */
    public function getCostBreakdown(): array
    {
        $total = $this->totalPrice->getAmountInCents();
        
        if ($total === 0) {
            return [
                'material_percentage' => 0,
                'labor_percentage' => 0,
                'overhead_percentage' => 0
            ];
        }
        
        return [
            'material_percentage' => round(($this->materialCost->getAmountInCents() / $total) * 100, 2),
            'labor_percentage' => round(($this->laborCost->getAmountInCents() / $total) * 100, 2),
            'overhead_percentage' => round(($this->overheadCost->getAmountInCents() / $total) * 100, 2)
        ];
    }
    
    /**
     * Calculate estimated delivery date
     */
    public function getEstimatedDeliveryDate(?DateTimeImmutable $orderDate = null): DateTimeImmutable
    {
        $startDate = $orderDate ?? new DateTimeImmutable();
        return $startDate->modify("+{$this->leadTimeDays} days");
    }
    
    /**
     * Get payment schedule based on terms
     */
    public function getPaymentSchedule(?DateTimeImmutable $orderDate = null): array
    {
        $startDate = $orderDate ?? new DateTimeImmutable();
        $schedule = [];
        
        // Default payment terms if not specified
        $terms = $this->paymentTerms ?: [
            'down_payment' => ['percentage' => 50, 'due_days' => 0],
            'final_payment' => ['percentage' => 50, 'due_days' => $this->leadTimeDays]
        ];
        
        foreach ($terms as $termName => $term) {
            $amount = $this->totalPrice->multiply($term['percentage'] / 100);
            $dueDate = $startDate->modify("+{$term['due_days']} days");
            
            $schedule[] = [
                'name' => $termName,
                'amount' => $amount,
                'due_date' => $dueDate,
                'percentage' => $term['percentage']
            ];
        }
        
        return $schedule;
    }
    
    // Getters
    public function getVendorId(): UuidValueObject { return $this->vendorId; }
    public function getMaterialCost(): Money { return $this->materialCost; }
    public function getLaborCost(): Money { return $this->laborCost; }
    public function getOverheadCost(): Money { return $this->overheadCost; }
    public function getTotalPrice(): Money { return $this->totalPrice; }
    public function getLeadTimeDays(): int { return $this->leadTimeDays; }
    public function getPaymentTerms(): array { return $this->paymentTerms; }
    public function getQualityStandards(): array { return $this->qualityStandards; }
    public function getDeliveryTerms(): array { return $this->deliveryTerms; }
    public function getValidUntil(): ?DateTimeImmutable { return $this->validUntil; }
    public function getMetadata(): array { return $this->metadata; }
    
    /**
     * Convert to array for API responses
     */
    public function toArray(): array
    {
        return [
            'vendor_id' => $this->vendorId->toString(),
            'material_cost' => $this->materialCost->toArray(),
            'labor_cost' => $this->laborCost->toArray(),
            'overhead_cost' => $this->overheadCost->toArray(),
            'total_price' => $this->totalPrice->toArray(),
            'lead_time_days' => $this->leadTimeDays,
            'payment_terms' => $this->paymentTerms,
            'quality_standards' => $this->qualityStandards,
            'delivery_terms' => $this->deliveryTerms,
            'valid_until' => $this->validUntil?->format('Y-m-d H:i:s'),
            'is_valid' => $this->isValid(),
            'cost_breakdown' => $this->getCostBreakdown(),
            'estimated_delivery' => $this->getEstimatedDeliveryDate()->format('Y-m-d'),
            'payment_schedule' => $this->getPaymentSchedule(),
            'metadata' => $this->metadata
        ];
    }
    
    /**
     * Compare with another quote
     */
    public function compareWith(VendorQuote $other): array
    {
        return [
            'price_difference' => $this->totalPrice->subtract($other->getTotalPrice())->toArray(),
            'lead_time_difference' => $this->leadTimeDays - $other->getLeadTimeDays(),
            'material_cost_difference' => $this->materialCost->subtract($other->getMaterialCost())->toArray(),
            'labor_cost_difference' => $this->laborCost->subtract($other->getLaborCost())->toArray(),
            'is_cheaper' => $this->totalPrice->isLessThan($other->getTotalPrice()),
            'is_faster' => $this->leadTimeDays < $other->getLeadTimeDays(),
            'recommendation' => $this->generateComparisonRecommendation($other)
        ];
    }
    
    /**
     * Generate comparison recommendation
     */
    private function generateComparisonRecommendation(VendorQuote $other): string
    {
        $priceDiff = $this->totalPrice->subtract($other->getTotalPrice());
        $timeDiff = $this->leadTimeDays - $other->getLeadTimeDays();
        
        if ($priceDiff->getAmountInCents() < 0 && $timeDiff < 0) {
            return 'This quote is both cheaper and faster - highly recommended';
        } elseif ($priceDiff->getAmountInCents() < 0) {
            return 'This quote is cheaper but takes longer - good value option';
        } elseif ($timeDiff < 0) {
            return 'This quote is faster but more expensive - premium option';
        } else {
            return 'This quote is more expensive and slower - consider alternatives';
        }
    }
}