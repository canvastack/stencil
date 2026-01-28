<?php

namespace App\Domain\Intelligence\ValueObjects;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use Carbon\Carbon;

/**
 * Order Recommendations Value Object
 * 
 * Contains comprehensive recommendations for a customer including
 * product suggestions, vendor recommendations, and pricing strategies.
 */
class OrderRecommendations
{
    public function __construct(
        private UuidValueObject $customerId,
        private array $productRecommendations,
        private array $vendorRecommendations,
        private array $pricingRecommendations,
        private float $confidenceScore,
        private array $reasoning,
        private Carbon $generatedAt
    ) {
        $this->validateRecommendations();
    }

    public function getCustomerId(): UuidValueObject
    {
        return $this->customerId;
    }

    public function getProductRecommendations(): array
    {
        return $this->productRecommendations;
    }

    public function getVendorRecommendations(): array
    {
        return $this->vendorRecommendations;
    }

    public function getPricingRecommendations(): array
    {
        return $this->pricingRecommendations;
    }

    public function getConfidenceScore(): float
    {
        return $this->confidenceScore;
    }

    public function getReasoning(): array
    {
        return $this->reasoning;
    }

    public function getGeneratedAt(): Carbon
    {
        return $this->generatedAt;
    }

    /**
     * Get top N product recommendations
     */
    public function getTopProductRecommendations(int $limit = 5): array
    {
        return array_slice($this->productRecommendations, 0, $limit);
    }

    /**
     * Get top N vendor recommendations
     */
    public function getTopVendorRecommendations(int $limit = 3): array
    {
        return array_slice($this->vendorRecommendations, 0, $limit);
    }

    /**
     * Get primary pricing recommendation
     */
    public function getPrimaryPricingRecommendation(): ?PricingRecommendation
    {
        return $this->pricingRecommendations[0] ?? null;
    }

    /**
     * Check if recommendations are high confidence
     */
    public function isHighConfidence(): bool
    {
        return $this->confidenceScore >= 0.8;
    }

    /**
     * Get recommendations summary for display
     */
    public function getSummary(): array
    {
        return [
            'customer_id' => $this->customerId->getValue(),
            'product_count' => count($this->productRecommendations),
            'vendor_count' => count($this->vendorRecommendations),
            'pricing_strategies' => count($this->pricingRecommendations),
            'confidence' => $this->confidenceScore,
            'generated_at' => $this->generatedAt->toISOString(),
            'is_high_confidence' => $this->isHighConfidence()
        ];
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'customer_id' => $this->customerId->getValue(),
            'product_recommendations' => array_map(
                fn($rec) => $rec instanceof ProductRecommendation ? $rec->toArray() : $rec,
                $this->productRecommendations
            ),
            'vendor_recommendations' => array_map(
                fn($rec) => $rec instanceof VendorRecommendation ? $rec->toArray() : $rec,
                $this->vendorRecommendations
            ),
            'pricing_recommendations' => array_map(
                fn($rec) => $rec instanceof PricingRecommendation ? $rec->toArray() : $rec,
                $this->pricingRecommendations
            ),
            'confidence_score' => $this->confidenceScore,
            'reasoning' => $this->reasoning,
            'generated_at' => $this->generatedAt->toISOString(),
            'summary' => $this->getSummary()
        ];
    }

    private function validateRecommendations(): void
    {
        if ($this->confidenceScore < 0 || $this->confidenceScore > 1) {
            throw new \InvalidArgumentException('Confidence score must be between 0 and 1');
        }

        if (!is_array($this->productRecommendations)) {
            throw new \InvalidArgumentException('Product recommendations must be an array');
        }

        if (!is_array($this->vendorRecommendations)) {
            throw new \InvalidArgumentException('Vendor recommendations must be an array');
        }

        if (!is_array($this->pricingRecommendations)) {
            throw new \InvalidArgumentException('Pricing recommendations must be an array');
        }

        if (!is_array($this->reasoning)) {
            throw new \InvalidArgumentException('Reasoning must be an array');
        }
    }
}