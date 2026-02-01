<?php

namespace App\Infrastructure\ExchangeRate\Factories;

use App\Domain\ExchangeRate\Entities\Provider;
use App\Infrastructure\ExchangeRate\Adapters\CurrencyApiClient;
use App\Infrastructure\ExchangeRate\Adapters\ExchangeRateApiClient;
use App\Infrastructure\ExchangeRate\Adapters\Fawazahmed0Client;
use App\Infrastructure\ExchangeRate\Adapters\FrankfurterClient;
use App\Infrastructure\ExchangeRate\Contracts\ExchangeRateClient;
use InvalidArgumentException;

class ProviderClientFactory
{
    /**
     * Create an appropriate API client based on the provider.
     *
     * @param Provider $provider The provider entity
     * @return ExchangeRateClient The API client instance
     * @throws InvalidArgumentException When provider name is unknown
     */
    public function create(Provider $provider): ExchangeRateClient
    {
        return match($provider->getName()) {
            'exchangerate-api.com' => new ExchangeRateApiClient(
                $provider->getApiKey() ?? throw new InvalidArgumentException('API key required for exchangerate-api.com')
            ),
            'currencyapi.com' => new CurrencyApiClient(
                $provider->getApiKey() ?? throw new InvalidArgumentException('API key required for currencyapi.com')
            ),
            'fawazahmed0' => new Fawazahmed0Client(),
            'frankfurter.app' => new FrankfurterClient(),
            default => throw new InvalidArgumentException("Unknown provider: {$provider->getName()}")
        };
    }
}
