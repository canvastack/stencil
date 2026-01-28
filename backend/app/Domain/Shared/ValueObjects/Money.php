<?php

namespace App\Domain\Shared\ValueObjects;

use InvalidArgumentException;

/**
 * Money Value Object
 * 
 * Handles monetary amounts with proper precision and currency support.
 * All amounts are stored in the smallest currency unit (cents for IDR/USD).
 * 
 * Database Integration:
 * - Stores amounts as BIGINT in cents (e.g., 100000 = Rp 1,000.00)
 * - Supports multiple currencies with proper formatting
 * - Prevents floating-point precision issues
 */
class Money
{
    private int $amountInCents;
    private string $currency;

    /**
     * @param int $amountInCents Amount in smallest currency unit (cents)
     * @param string $currency ISO 4217 currency code
     */
    public function __construct(int $amountInCents, string $currency = 'IDR')
    {
        $this->guardAgainstNegativeAmount($amountInCents);
        $this->guardAgainstInvalidCurrency($currency);
        
        $this->amountInCents = $amountInCents;
        $this->currency = strtoupper($currency);
    }

    /**
     * Create Money from decimal amount (e.g., 1000.50 IDR)
     */
    public static function fromDecimal(float $amount, string $currency = 'IDR'): self
    {
        $amountInCents = (int) round($amount * 100);
        return new self($amountInCents, $currency);
    }

    /**
     * Create Money from cents/smallest unit
     */
    public static function fromCents(int $cents, string $currency = 'IDR'): self
    {
        return new self($cents, $currency);
    }

    /**
     * Create zero amount
     */
    public static function zero(string $currency = 'IDR'): self
    {
        return new self(0, $currency);
    }

    /**
     * Get amount in cents (for database storage)
     */
    public function getAmountInCents(): int
    {
        return $this->amountInCents;
    }

    /**
     * Get amount as decimal (for display)
     */
    public function getAmount(): float
    {
        return $this->amountInCents / 100.0;
    }

    /**
     * Get currency code
     */
    public function getCurrency(): string
    {
        return $this->currency;
    }

    /**
     * Add another Money amount
     */
    public function add(Money $other): Money
    {
        $this->guardAgainstDifferentCurrency($other);
        return new Money($this->amountInCents + $other->amountInCents, $this->currency);
    }

    /**
     * Subtract another Money amount
     */
    public function subtract(Money $other): Money
    {
        $this->guardAgainstDifferentCurrency($other);
        $newAmount = $this->amountInCents - $other->amountInCents;
        $this->guardAgainstNegativeAmount($newAmount);
        return new Money($newAmount, $this->currency);
    }

    /**
     * Multiply by a factor
     */
    public function multiply(float $multiplier): Money
    {
        if ($multiplier < 0) {
            throw new InvalidArgumentException('Multiplier cannot be negative');
        }
        
        $newAmount = (int) round($this->amountInCents * $multiplier);
        return new Money($newAmount, $this->currency);
    }

    /**
     * Divide by a factor
     */
    public function divide(float $divisor): Money
    {
        if ($divisor <= 0) {
            throw new InvalidArgumentException('Divisor must be positive');
        }
        
        $newAmount = (int) round($this->amountInCents / $divisor);
        return new Money($newAmount, $this->currency);
    }

    /**
     * Calculate percentage of amount
     */
    public function percentage(float $percentage): Money
    {
        if ($percentage < 0 || $percentage > 100) {
            throw new InvalidArgumentException('Percentage must be between 0 and 100');
        }
        
        return $this->multiply($percentage / 100);
    }

    /**
     * Check if amount is zero
     */
    public function isZero(): bool
    {
        return $this->amountInCents === 0;
    }

    /**
     * Check if amount is positive
     */
    public function isPositive(): bool
    {
        return $this->amountInCents > 0;
    }

    /**
     * Check if this amount is greater than another
     */
    public function isGreaterThan(Money $other): bool
    {
        $this->guardAgainstDifferentCurrency($other);
        return $this->amountInCents > $other->amountInCents;
    }

    /**
     * Check if this amount is less than another
     */
    public function isLessThan(Money $other): bool
    {
        $this->guardAgainstDifferentCurrency($other);
        return $this->amountInCents < $other->amountInCents;
    }

    /**
     * Check if amounts are equal
     */
    public function equals(Money $other): bool
    {
        return $this->amountInCents === $other->amountInCents && 
               $this->currency === $other->currency;
    }

    /**
     * Format amount for display
     */
    public function format(): string
    {
        $amount = $this->getAmount();
        
        return match ($this->currency) {
            'IDR' => 'Rp ' . number_format($amount, 0, ',', '.'),
            'USD' => '$' . number_format($amount, 2, '.', ','),
            'EUR' => '€' . number_format($amount, 2, ',', '.'),
            'SGD' => 'S$' . number_format($amount, 2, '.', ','),
            'MYR' => 'RM' . number_format($amount, 2, '.', ','),
            default => $this->currency . ' ' . number_format($amount, 2, '.', ','),
        };
    }

    /**
     * Convert to array for database storage
     */
    public function toArray(): array
    {
        return [
            'amount' => $this->amountInCents,
            'currency' => $this->currency,
        ];
    }

    /**
     * Create from database array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            $data['amount'] ?? 0,
            $data['currency'] ?? 'IDR'
        );
    }

    public function __toString(): string
    {
        return $this->format();
    }

    private function guardAgainstNegativeAmount(int $amount): void
    {
        if ($amount < 0) {
            throw new InvalidArgumentException('Money amount cannot be negative');
        }
    }

    private function guardAgainstInvalidCurrency(string $currency): void
    {
        $validCurrencies = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY', 'GBP', 'AUD'];
        
        if (!in_array(strtoupper($currency), $validCurrencies)) {
            throw new InvalidArgumentException("Invalid currency code: {$currency}");
        }
    }

    private function guardAgainstDifferentCurrency(Money $other): void
    {
        if ($this->currency !== $other->currency) {
            throw new InvalidArgumentException(
                "Cannot perform operation on different currencies: {$this->currency} vs {$other->currency}"
            );
        }
    }
}