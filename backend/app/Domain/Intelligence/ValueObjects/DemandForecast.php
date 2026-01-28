<?php

namespace App\Domain\Intelligence\ValueObjects;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use Carbon\Carbon;

/**
 * Demand Forecast Value Object
 * 
 * Contains AI-generated demand forecasting data including product-level
 * forecasts, seasonal patterns, and confidence metrics.
 */
class DemandForecast
{
    public function __construct(
        private UuidValueObject $tenantId,
        private array $productForecasts,
        private float $totalForecast,
        private array $seasonalPatterns,
        private float $confidence,
        private int $forecastPeriod,
        private string $methodology,
        private Carbon $generatedAt
    ) {
        $this->validateForecast();
    }

    public function getTenantId(): UuidValueObject
    {
        return $this->tenantId;
    }

    public function getProductForecasts(): array
    {
        return $this->productForecasts;
    }

    public function getTotalForecast(): float
    {
        return $this->totalForecast;
    }

    public function getSeasonalPatterns(): array
    {
        return $this->seasonalPatterns;
    }

    public function getConfidence(): float
    {
        return $this->confidence;
    }

    public function getForecastPeriod(): int
    {
        return $this->forecastPeriod;
    }

    public function getMethodology(): string
    {
        return $this->methodology;
    }

    public function getGeneratedAt(): Carbon
    {
        return $this->generatedAt;
    }

    /**
     * Check if forecast is high confidence
     */
    public function isHighConfidence(): bool
    {
        return $this->confidence >= 0.8;
    }

    /**
     * Get top forecasted products
     */
    public function getTopForecastedProducts(int $limit = 10): array
    {
        $sorted = $this->productForecasts;
        arsort($sorted);
        
        return array_slice($sorted, 0, $limit, true);
    }

    /**
     * Get products with declining demand
     */
    public function getDecliningProducts(): array
    {
        // This would compare against historical data in real implementation
        return array_filter($this->productForecasts, fn($forecast) => $forecast < 50);
    }

    /**
     * Get products with growing demand
     */
    public function getGrowingProducts(): array
    {
        // This would compare against historical data in real implementation
        return array_filter($this->productForecasts, fn($forecast) => $forecast > 100);
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'tenant_id' => $this->tenantId->getValue(),
            'product_forecasts' => $this->productForecasts,
            'total_forecast' => $this->totalForecast,
            'seasonal_patterns' => $this->seasonalPatterns,
            'confidence' => $this->confidence,
            'forecast_period' => $this->forecastPeriod,
            'methodology' => $this->methodology,
            'generated_at' => $this->generatedAt->toISOString(),
            'top_forecasted_products' => $this->getTopForecastedProducts(),
            'declining_products' => $this->getDecliningProducts(),
            'growing_products' => $this->getGrowingProducts(),
            'indicators' => [
                'high_confidence' => $this->isHighConfidence(),
                'has_seasonal_patterns' => !empty($this->seasonalPatterns),
                'growth_expected' => $this->totalForecast > 0
            ]
        ];
    }

    private function validateForecast(): void
    {
        if ($this->confidence < 0 || $this->confidence > 1) {
            throw new \InvalidArgumentException('Confidence must be between 0 and 1');
        }

        if ($this->forecastPeriod <= 0) {
            throw new \InvalidArgumentException('Forecast period must be positive');
        }

        if (!is_array($this->productForecasts)) {
            throw new \InvalidArgumentException('Product forecasts must be an array');
        }

        if (!is_array($this->seasonalPatterns)) {
            throw new \InvalidArgumentException('Seasonal patterns must be an array');
        }

        if (empty(trim($this->methodology))) {
            throw new \InvalidArgumentException('Methodology cannot be empty');
        }
    }
}