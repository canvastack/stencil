<?php

namespace App\Domain\Pricing\ValueObjects;

use App\Domain\Shared\ValueObjects\Money;

/**
 * Tax Structure Value Object
 * 
 * Immutable representation of comprehensive tax calculation
 * with all tax components and exemptions
 */
class TaxStructure
{
    public function __construct(
        private Money $taxableAmount,
        private Money $ppnTax,
        private Money $pphTax,
        private Money $regionalTax,
        private Money $tradeTax,
        private array $exemptions = [],
        private array $taxBreakdown = []
    ) {}
    
    /**
     * Get total tax amount
     */
    public function getTotalTax(): Money
    {
        return $this->ppnTax
            ->add($this->pphTax)
            ->add($this->regionalTax)
            ->add($this->tradeTax);
    }
    
    /**
     * Get effective tax rate
     */
    public function getEffectiveTaxRate(): float
    {
        if ($this->taxableAmount->getAmountInCents() === 0) {
            return 0.0;
        }
        
        return $this->getTotalTax()->getAmountInCents() / $this->taxableAmount->getAmountInCents();
    }
    
    /**
     * Get tax savings from exemptions
     */
    public function getTaxSavings(): Money
    {
        $totalSavings = Money::zero($this->taxableAmount->getCurrency());
        
        foreach ($this->exemptions as $exemption) {
            if (isset($exemption['savings']) && $exemption['savings'] instanceof Money) {
                $totalSavings = $totalSavings->add($exemption['savings']);
            }
        }
        
        return $totalSavings;
    }
    
    // Getters
    public function getTaxableAmount(): Money { return $this->taxableAmount; }
    public function getPpnTax(): Money { return $this->ppnTax; }
    public function getPphTax(): Money { return $this->pphTax; }
    public function getRegionalTax(): Money { return $this->regionalTax; }
    public function getTradeTax(): Money { return $this->tradeTax; }
    public function getExemptions(): array { return $this->exemptions; }
    public function getTaxBreakdown(): array { return $this->taxBreakdown; }
    
    /**
     * Check if any exemptions apply
     */
    public function hasExemptions(): bool
    {
        return !empty($this->exemptions);
    }
    
    /**
     * Convert to array for API responses
     */
    public function toArray(): array
    {
        return [
            'taxable_amount' => $this->taxableAmount->toArray(),
            'ppn_tax' => $this->ppnTax->toArray(),
            'pph_tax' => $this->pphTax->toArray(),
            'regional_tax' => $this->regionalTax->toArray(),
            'trade_tax' => $this->tradeTax->toArray(),
            'total_tax' => $this->getTotalTax()->toArray(),
            'effective_tax_rate' => round($this->getEffectiveTaxRate() * 100, 2), // As percentage
            'tax_savings' => $this->getTaxSavings()->toArray(),
            'exemptions' => $this->exemptions,
            'tax_breakdown' => $this->taxBreakdown,
            'has_exemptions' => $this->hasExemptions()
        ];
    }
}