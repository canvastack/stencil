<?php

namespace App\Domain\ExchangeRate\Services;

use App\Domain\ExchangeRate\Exceptions\InvalidManualRateException;
use App\Domain\ExchangeRate\Exceptions\NoRateAvailableException;
use App\Domain\ExchangeRate\Exceptions\StaleRateException;
use DateTimeInterface;

class ExchangeRateValidationService
{
    // Reasonable bounds for USD to IDR exchange rate
    private const MIN_REASONABLE_RATE = 10000.0;  // 1 USD = 10,000 IDR (very low)
    private const MAX_REASONABLE_RATE = 25000.0;  // 1 USD = 25,000 IDR (very high)
    
    // Default maximum age for cached rates
    private const DEFAULT_MAX_AGE_DAYS = 7;

    /**
     * Validate a manual exchange rate
     *
     * @param float|null $rate
     * @param bool $isRequired
     * @throws InvalidManualRateException
     */
    public function validateManualRate(?float $rate, bool $isRequired = true): void
    {
        if ($rate === null) {
            if ($isRequired) {
                throw InvalidManualRateException::required();
            }
            return;
        }

        if ($rate <= 0) {
            throw InvalidManualRateException::notPositive($rate);
        }

        if ($rate < self::MIN_REASONABLE_RATE) {
            throw InvalidManualRateException::tooLow($rate, self::MIN_REASONABLE_RATE);
        }

        if ($rate > self::MAX_REASONABLE_RATE) {
            throw InvalidManualRateException::tooHigh($rate, self::MAX_REASONABLE_RATE);
        }
    }

    /**
     * Validate that a rate is not stale
     *
     * @param DateTimeInterface $rateDate
     * @param int $maxAgeDays
     * @throws StaleRateException
     */
    public function validateRateAge(DateTimeInterface $rateDate, int $maxAgeDays = self::DEFAULT_MAX_AGE_DAYS): void
    {
        $daysDiff = now()->diffInDays($rateDate);
        
        if ($daysDiff > $maxAgeDays) {
            throw StaleRateException::forRate($rateDate, $maxAgeDays);
        }
    }

    /**
     * Validate that a rate is available for use
     *
     * @param float|null $rate
     * @param DateTimeInterface|null $rateDate
     * @param string $source
     * @throws NoRateAvailableException
     * @throws StaleRateException
     */
    public function validateRateAvailability(?float $rate, ?DateTimeInterface $rateDate, string $source): void
    {
        if ($rate === null || $rateDate === null) {
            throw NoRateAvailableException::noCachedRate();
        }

        // Check if rate is stale (but don't throw for cached rates, just warn)
        if ($source === 'cached') {
            try {
                $this->validateRateAge($rateDate);
            } catch (StaleRateException $e) {
                // For cached rates, we log the staleness but don't throw
                // The calling code can decide how to handle stale cached rates
                \Illuminate\Support\Facades\Log::warning('Using stale cached rate', [
                    'rate' => $rate,
                    'rate_date' => $rateDate->format('Y-m-d H:i:s'),
                    'days_old' => $e->getDaysOld(),
                    'max_age' => $e->getMaxAgeDays()
                ]);
            }
        } else {
            // For non-cached rates, enforce staleness check
            $this->validateRateAge($rateDate);
        }
    }

    /**
     * Validate API rate response
     *
     * @param float $rate
     * @param string $provider
     * @throws InvalidManualRateException
     */
    public function validateApiRate(float $rate, string $provider): void
    {
        if ($rate <= 0) {
            throw InvalidManualRateException::notPositive($rate);
        }

        // More lenient bounds for API rates as they might fluctuate more
        $minApiRate = self::MIN_REASONABLE_RATE * 0.8;  // 20% below minimum
        $maxApiRate = self::MAX_REASONABLE_RATE * 1.2;  // 20% above maximum

        if ($rate < $minApiRate || $rate > $maxApiRate) {
            \Illuminate\Support\Facades\Log::warning('API rate outside reasonable bounds', [
                'provider' => $provider,
                'rate' => $rate,
                'min_expected' => $minApiRate,
                'max_expected' => $maxApiRate
            ]);
            
            // Don't throw for API rates, just log the warning
            // The rate might be legitimate due to market conditions
        }
    }

    /**
     * Check if a rate should trigger a staleness warning
     *
     * @param DateTimeInterface $rateDate
     * @param int $warningThresholdDays
     * @return bool
     */
    public function shouldWarnAboutStaleness(DateTimeInterface $rateDate, int $warningThresholdDays = 3): bool
    {
        return now()->diffInDays($rateDate) >= $warningThresholdDays;
    }

    /**
     * Get reasonable rate bounds for display/validation
     *
     * @return array{min: float, max: float}
     */
    public function getReasonableRateBounds(): array
    {
        return [
            'min' => self::MIN_REASONABLE_RATE,
            'max' => self::MAX_REASONABLE_RATE
        ];
    }
}