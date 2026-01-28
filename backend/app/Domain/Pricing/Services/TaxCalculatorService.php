<?php

namespace App\Domain\Pricing\Services;

use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Customer\Entities\Customer;
use App\Domain\Pricing\ValueObjects\TaxStructure;

/**
 * Tax Calculator Service
 * 
 * Calculates taxes based on Indonesian tax regulations:
 * - PPN (VAT): 11% for most goods and services
 * - PPh (Income Tax): Various rates based on transaction type
 * - Regional taxes where applicable
 * - Export/import considerations
 */
class TaxCalculatorService
{
    private const DEFAULT_PPN_RATE = 0.11; // 11% VAT in Indonesia
    private const PPH_RATE_ARTICLE_23 = 0.02; // 2% for services
    private const PPH_RATE_ARTICLE_22 = 0.015; // 1.5% for goods
    
    private array $taxRates;
    private array $exemptions;
    
    public function __construct()
    {
        $this->initializeTaxRates();
        $this->initializeExemptions();
    }
    
    /**
     * Calculate total tax for customer and order
     */
    public function calculateTax(Money $taxableAmount, Customer $customer): Money
    {
        $taxStructure = $this->calculateTaxStructure($taxableAmount, $customer);
        
        return $taxStructure->getTotalTax();
    }
    
    /**
     * Calculate detailed tax structure
     */
    public function calculateTaxStructure(Money $taxableAmount, Customer $customer): TaxStructure
    {
        $taxes = [];
        
        // 1. PPN (VAT) - 11%
        $ppnTax = $this->calculatePPN($taxableAmount, $customer);
        $taxes['ppn'] = $ppnTax;
        
        // 2. PPh (Income Tax) - if applicable
        $pphTax = $this->calculatePPh($taxableAmount, $customer);
        $taxes['pph'] = $pphTax;
        
        // 3. Regional taxes - if applicable
        $regionalTax = $this->calculateRegionalTax($taxableAmount, $customer);
        $taxes['regional'] = $regionalTax;
        
        // 4. Export/import taxes - if applicable
        $tradeTax = $this->calculateTradeTax($taxableAmount, $customer);
        $taxes['trade'] = $tradeTax;
        
        return new TaxStructure(
            taxableAmount: $taxableAmount,
            ppnTax: $ppnTax,
            pphTax: $pphTax,
            regionalTax: $regionalTax,
            tradeTax: $tradeTax,
            exemptions: $this->getApplicableExemptions($customer),
            taxBreakdown: $this->generateTaxBreakdown($taxes)
        );
    }
    
    /**
     * Calculate PPN (VAT) tax
     */
    private function calculatePPN(Money $taxableAmount, Customer $customer): Money
    {
        // Check for PPN exemptions
        if ($this->isExemptFromPPN($customer)) {
            return new Money(0, $taxableAmount->getCurrency());
        }
        
        // Standard PPN rate is 11%
        $ppnRate = $this->getPPNRate($customer);
        
        return $taxableAmount->multiply($ppnRate);
    }
    
    /**
     * Calculate PPh (Income Tax)
     */
    private function calculatePPh(Money $taxableAmount, Customer $customer): Money
    {
        // PPh is typically paid by the service provider, not the customer
        // But in some B2B transactions, it might be applicable
        
        if (!$this->requiresPPhDeduction($customer)) {
            return new Money(0, $taxableAmount->getCurrency());
        }
        
        // Determine PPh article and rate
        $pphRate = $this->getPPhRate($customer);
        
        return $taxableAmount->multiply($pphRate);
    }
    
    /**
     * Calculate regional taxes
     */
    private function calculateRegionalTax(Money $taxableAmount, Customer $customer): Money
    {
        $customerRegion = $customer->getRegion();
        
        // Some regions have additional taxes
        $regionalRate = match($customerRegion) {
            'DKI_JAKARTA' => 0.001, // 0.1% regional tax
            'JAWA_BARAT' => 0.0005, // 0.05% regional tax
            default => 0.0
        };
        
        if ($regionalRate > 0) {
            return $taxableAmount->multiply($regionalRate);
        }
        
        return new Money(0, $taxableAmount->getCurrency());
    }
    
    /**
     * Calculate trade taxes (export/import)
     */
    private function calculateTradeTax(Money $taxableAmount, Customer $customer): Money
    {
        if (!$customer->isInternational()) {
            return new Money(0, $taxableAmount->getCurrency());
        }
        
        // Export taxes or duties might apply
        $tradeRate = $this->getTradeRate($customer);
        
        return $taxableAmount->multiply($tradeRate);
    }
    
    /**
     * Get PPN rate for customer
     */
    private function getPPNRate(Customer $customer): float
    {
        // Standard rate
        $rate = self::DEFAULT_PPN_RATE;
        
        // Special rates for certain customer types or products
        if ($customer->isGovernment()) {
            return $rate; // Government still pays PPN
        }
        
        if ($customer->isExportCustomer()) {
            return 0.0; // Export is PPN exempt
        }
        
        return $rate;
    }
    
    /**
     * Get PPh rate for customer
     */
    private function getPPhRate(Customer $customer): float
    {
        // PPh Article 23 for services (2%)
        if ($customer->requiresPPhArticle23()) {
            return self::PPH_RATE_ARTICLE_23;
        }
        
        // PPh Article 22 for goods (1.5%)
        if ($customer->requiresPPhArticle22()) {
            return self::PPH_RATE_ARTICLE_22;
        }
        
        return 0.0;
    }
    
    /**
     * Get trade tax rate
     */
    private function getTradeRate(Customer $customer): float
    {
        $customerCountry = $customer->getCountry();
        
        // Trade agreements might affect rates
        $tradeRates = [
            'SINGAPORE' => 0.0,    // ASEAN free trade
            'MALAYSIA' => 0.0,     // ASEAN free trade
            'THAILAND' => 0.0,     // ASEAN free trade
            'USA' => 0.005,        // 0.5% trade tax
            'CHINA' => 0.003,      // 0.3% trade tax
            'JAPAN' => 0.002,      // 0.2% trade tax
            'AUSTRALIA' => 0.001,  // 0.1% trade tax
        ];
        
        $defaultRate = 0.01; // 1% default trade tax
        
        return $tradeRates[$customerCountry] ?? $defaultRate;
    }
    
    /**
     * Check if customer is exempt from PPN
     */
    private function isExemptFromPPN(Customer $customer): bool
    {
        // Certain customer types might be exempt
        return $customer->isExportCustomer() || 
               $customer->isFreeTradeZone() ||
               $customer->hasSpecialExemption('PPN');
    }
    
    /**
     * Check if PPh deduction is required
     */
    private function requiresPPhDeduction(Customer $customer): bool
    {
        // Large corporate customers might require PPh deduction
        return $customer->isCorporate() && 
               $customer->getTotalSpent()->getAmount() > 5000000000; // > 50M IDR annually
    }
    
    /**
     * Get applicable exemptions for customer
     */
    private function getApplicableExemptions(Customer $customer): array
    {
        $exemptions = [];
        
        if ($this->isExemptFromPPN($customer)) {
            $exemptions[] = [
                'type' => 'PPN',
                'reason' => $this->getPPNExemptionReason($customer),
                'savings' => $customer->getTotalSpent()->multiply(self::DEFAULT_PPN_RATE)
            ];
        }
        
        return $exemptions;
    }
    
    /**
     * Get PPN exemption reason
     */
    private function getPPNExemptionReason(Customer $customer): string
    {
        if ($customer->isExportCustomer()) {
            return 'Export transaction - PPN exempt under Indonesian tax law';
        }
        
        if ($customer->isFreeTradeZone()) {
            return 'Free trade zone - PPN exempt';
        }
        
        if ($customer->hasSpecialExemption('PPN')) {
            return 'Special exemption certificate on file';
        }
        
        return 'Unknown exemption reason';
    }
    
    /**
     * Generate tax breakdown
     */
    private function generateTaxBreakdown(array $taxes): array
    {
        $breakdown = [];
        
        foreach ($taxes as $taxType => $taxAmount) {
            if ($taxAmount->getAmount() > 0) {
                $breakdown[$taxType] = [
                    'amount' => $taxAmount->getAmount(),
                    'currency' => $taxAmount->getCurrency(),
                    'formatted' => $taxAmount->format(),
                    'rate' => $this->getTaxRate($taxType),
                    'description' => $this->getTaxDescription($taxType)
                ];
            }
        }
        
        return $breakdown;
    }
    
    /**
     * Get tax rate for type
     */
    private function getTaxRate(string $taxType): float
    {
        return match($taxType) {
            'ppn' => self::DEFAULT_PPN_RATE,
            'pph' => self::PPH_RATE_ARTICLE_23,
            'regional' => 0.001,
            'trade' => 0.01,
            default => 0.0
        };
    }
    
    /**
     * Get tax description
     */
    private function getTaxDescription(string $taxType): string
    {
        return match($taxType) {
            'ppn' => 'Pajak Pertambahan Nilai (Value Added Tax)',
            'pph' => 'Pajak Penghasilan (Income Tax)',
            'regional' => 'Regional Tax',
            'trade' => 'Trade/Export Tax',
            default => 'Other Tax'
        };
    }
    
    /**
     * Initialize tax rates
     */
    private function initializeTaxRates(): void
    {
        $this->taxRates = [
            'ppn' => [
                'standard' => 0.11,
                'reduced' => 0.0,
                'export' => 0.0
            ],
            'pph' => [
                'article_23' => 0.02,
                'article_22' => 0.015,
                'article_21' => 0.05
            ],
            'regional' => [
                'DKI_JAKARTA' => 0.001,
                'JAWA_BARAT' => 0.0005,
                'default' => 0.0
            ]
        ];
    }
    
    /**
     * Initialize exemptions
     */
    private function initializeExemptions(): void
    {
        $this->exemptions = [
            'export_customers' => true,
            'free_trade_zones' => true,
            'government_entities' => false,
            'educational_institutions' => true,
            'healthcare_facilities' => true
        ];
    }
    
    /**
     * Validate tax calculation
     */
    public function validateTaxCalculation(Money $taxableAmount, Money $calculatedTax): bool
    {
        // Tax should not exceed 25% of taxable amount (sanity check)
        $maxTax = $taxableAmount->multiply(0.25);
        
        return !$calculatedTax->isGreaterThan($maxTax);
    }
    
    /**
     * Get tax compliance report
     */
    public function getTaxComplianceReport(Customer $customer, Money $taxableAmount): array
    {
        $taxStructure = $this->calculateTaxStructure($taxableAmount, $customer);
        
        return [
            'customer_id' => $customer->getId(),
            'taxable_amount' => $taxableAmount->toArray(),
            'tax_structure' => $taxStructure->toArray(),
            'compliance_status' => 'compliant',
            'exemptions_applied' => $taxStructure->getExemptions(),
            'calculated_at' => now()->toISOString(),
            'tax_period' => date('Y-m'),
            'regulations_applied' => [
                'UU_PPN_1984' => 'Undang-Undang Pajak Pertambahan Nilai',
                'UU_PPH_2008' => 'Undang-Undang Pajak Penghasilan',
                'PMK_REGIONAL' => 'Peraturan Menteri Keuangan Regional'
            ]
        ];
    }
}