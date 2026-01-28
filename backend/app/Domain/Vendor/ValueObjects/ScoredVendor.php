<?php

namespace App\Domain\Vendor\ValueObjects;

use App\Domain\Vendor\Entities\Vendor;

/**
 * Scored Vendor Value Object
 * 
 * Represents a vendor with its calculated score for a specific order
 */
class ScoredVendor
{
    public function __construct(
        private Vendor $vendor,
        private VendorScore $score
    ) {}
    
    // Getters
    public function getVendor(): Vendor { return $this->vendor; }
    public function getScore(): VendorScore { return $this->score; }
    
    /**
     * Get vendor ID
     */
    public function getVendorId(): string
    {
        return $this->vendor->getId()->toString();
    }
    
    /**
     * Get vendor name
     */
    public function getVendorName(): string
    {
        return $this->vendor->getName();
    }
    
    /**
     * Get total score
     */
    public function getTotalScore(): float
    {
        return $this->score->getTotalScore();
    }
    
    /**
     * Check if vendor is recommended
     */
    public function isRecommended(): bool
    {
        return $this->score->meetsThreshold(80.0); // 80+ is recommended
    }
    
    /**
     * Get recommendation level
     */
    public function getRecommendationLevel(): string
    {
        $score = $this->score->getTotalScore();
        
        return match(true) {
            $score >= 95 => 'highly_recommended',
            $score >= 85 => 'recommended',
            $score >= 75 => 'acceptable',
            $score >= 65 => 'consider_with_caution',
            default => 'not_recommended'
        };
    }
    
    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'vendor_id' => $this->getVendorId(),
            'vendor_name' => $this->getVendorName(),
            'vendor_company' => $this->vendor->getCompany(),
            'vendor_rating' => $this->vendor->getRating(),
            'score' => $this->score->toArray(),
            'is_recommended' => $this->isRecommended(),
            'recommendation_level' => $this->getRecommendationLevel(),
            'capabilities' => $this->vendor->getCapabilities(),
            'specializations' => $this->vendor->getSpecializations()
        ];
    }
}