<?php

namespace App\Domain\Product\ValueObjects;

use InvalidArgumentException;

class ProductPrice
{
    private float $amount;
    private string $currency;

    public function __construct(float $amount, string $currency = 'IDR')
    {
        $this->validateAmount($amount);
        $this->validateCurrency($currency);
        
        $this->amount = $amount;
        $this->currency = strtoupper($currency);
    }

    public function getAmount(): float
    {
        return $this->amount;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    public function getFormattedAmount(): string
    {
        return match ($this->currency) {
            'IDR' => 'Rp ' . number_format($this->amount, 0, ',', '.'),
            'USD' => '$' . number_format($this->amount, 2),
            'EUR' => '€' . number_format($this->amount, 2),
            default => $this->currency . ' ' . number_format($this->amount, 2),
        };
    }

    public function equals(ProductPrice $other): bool
    {
        return $this->amount === $other->getAmount() &&
               $this->currency === $other->getCurrency();
    }

    public function isGreaterThan(ProductPrice $other): bool
    {
        if ($this->currency !== $other->getCurrency()) {
            throw new InvalidArgumentException('Cannot compare prices with different currencies');
        }
        
        return $this->amount > $other->getAmount();
    }

    public function __toString(): string
    {
        return $this->getFormattedAmount();
    }

    private function validateAmount(float $amount): void
    {
        if ($amount < 0) {
            throw new InvalidArgumentException('Price amount cannot be negative');
        }
    }

    private function validateCurrency(string $currency): void
    {
        $validCurrencies = ['IDR', 'USD', 'EUR', 'SGD', 'MYR'];
        
        if (!in_array(strtoupper($currency), $validCurrencies)) {
            throw new InvalidArgumentException('Invalid currency code: ' . $currency);
        }
    }
}