<?php

namespace App\Domain\ExchangeRate\Exceptions;

use DomainException;

class NoRateAvailableException extends DomainException
{
    public static function noProviders(): self
    {
        return new self('No exchange rate providers are configured or available');
    }

    public static function allProvidersExhausted(): self
    {
        return new self('All exchange rate providers have exhausted their quotas');
    }

    public static function noCachedRate(): self
    {
        return new self('No cached exchange rate is available and API providers are unavailable');
    }

    public static function apiFailure(string $reason): self
    {
        return new self("Exchange rate API failure: {$reason}");
    }
}