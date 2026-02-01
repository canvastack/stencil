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
     * @throws InvalidArgumentException When provider code is unknown
     */
    public function create(Provider $provider): ExchangeRateClient
    {
        $code = $provider->getCode();
        
        // Match provider code (supports both simple codes and tenant-specific codes)
        if (str_starts_with($code, 'exchangerate-api')) {
            return new ExchangeRateApiClient(
                $provider->getApiKey() ?? throw new InvalidArgumentException('API key required for exchangerate-api.com')
            );
        }
        
        if (str_starts_with($code, 'currencyapi')) {
            return new CurrencyApiClient(
                $provider->getApiKey() ?? throw new InvalidArgumentException('API key required for currencyapi.com')
            );
        }
        
        if (str_starts_with($code, 'fawazahmed0')) {
            return new Fawazahmed0Client();
        }
        
        if (str_starts_with($code, 'frankfurter')) {
            return new FrankfurterClient();
        }
        
        throw new InvalidArgumentException("Unknown provider code: {$code}");
    }
}
