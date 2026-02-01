<?php

namespace App\Domain\ExchangeRate\Exceptions;

use InvalidArgumentException;

class InvalidManualRateException extends InvalidArgumentException
{
    public static function notPositive(float $rate): self
    {
        return new self("Manual exchange rate must be positive, got: {$rate}");
    }

    public static function tooLow(float $rate, float $minimum): self
    {
        return new self("Manual exchange rate {$rate} is too low. Minimum allowed: {$minimum}");
    }

    public static function tooHigh(float $rate, float $maximum): self
    {
        return new self("Manual exchange rate {$rate} is too high. Maximum allowed: {$maximum}");
    }

    public static function unreasonableValue(float $rate): self
    {
        return new self("Manual exchange rate {$rate} appears unreasonable. Please verify the value.");
    }

    public static function required(): self
    {
        return new self('Manual exchange rate is required when in manual mode');
    }
}