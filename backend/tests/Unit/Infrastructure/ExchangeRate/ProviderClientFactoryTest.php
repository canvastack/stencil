<?php

namespace Tests\Unit\Infrastructure\ExchangeRate;

use App\Domain\ExchangeRate\Entities\Provider;
use App\Infrastructure\ExchangeRate\Adapters\CurrencyApiClient;
use App\Infrastructure\ExchangeRate\Adapters\ExchangeRateApiClient;
use App\Infrastructure\ExchangeRate\Adapters\Fawazahmed0Client;
use App\Infrastructure\ExchangeRate\Adapters\FrankfurterClient;
use App\Infrastructure\ExchangeRate\Factories\ProviderClientFactory;
use InvalidArgumentException;
use Tests\TestCase;

class ProviderClientFactoryTest extends TestCase
{
    private ProviderClientFactory $factory;

    protected function setUp(): void
    {
        parent::setUp();
        $this->factory = new ProviderClientFactory();
    }

    /** @test */
    public function it_creates_exchange_rate_api_client(): void
    {
        $provider = new Provider(
            code: 'exchangerate-api',
            name: 'exchangerate-api.com',
            apiUrl: 'https://v6.exchangerate-api.com',
            apiKey: 'test-key',
            requiresApiKey: true,
            isUnlimited: false,
            monthlyQuota: 1500
        );

        $client = $this->factory->create($provider);

        $this->assertInstanceOf(ExchangeRateApiClient::class, $client);
    }

    /** @test */
    public function it_creates_currency_api_client(): void
    {
        $provider = new Provider(
            code: 'currencyapi',
            name: 'currencyapi.com',
            apiUrl: 'https://api.currencyapi.com',
            apiKey: 'test-key',
            requiresApiKey: true,
            isUnlimited: false,
            monthlyQuota: 300
        );

        $client = $this->factory->create($provider);

        $this->assertInstanceOf(CurrencyApiClient::class, $client);
    }

    /** @test */
    public function it_creates_fawazahmed0_client(): void
    {
        $provider = new Provider(
            code: 'fawazahmed0',
            name: 'fawazahmed0',
            apiUrl: 'https://cdn.jsdelivr.net',
            apiKey: null,
            requiresApiKey: false,
            isUnlimited: true,
            monthlyQuota: null
        );

        $client = $this->factory->create($provider);

        $this->assertInstanceOf(Fawazahmed0Client::class, $client);
    }

    /** @test */
    public function it_creates_frankfurter_client(): void
    {
        $provider = new Provider(
            code: 'frankfurter',
            name: 'frankfurter.app',
            apiUrl: 'https://api.frankfurter.app',
            apiKey: null,
            requiresApiKey: false,
            isUnlimited: true,
            monthlyQuota: null
        );

        $client = $this->factory->create($provider);

        $this->assertInstanceOf(FrankfurterClient::class, $client);
    }

    /** @test */
    public function it_throws_exception_for_unknown_provider(): void
    {
        $provider = new Provider(
            code: 'unknown',
            name: 'unknown-provider',
            apiUrl: 'https://unknown.com',
            apiKey: null,
            requiresApiKey: false,
            isUnlimited: true,
            monthlyQuota: null
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Unknown provider: unknown-provider');

        $this->factory->create($provider);
    }

    /** @test */
    public function it_throws_exception_when_api_key_missing_for_exchange_rate_api(): void
    {
        $provider = new Provider(
            code: 'exchangerate-api',
            name: 'exchangerate-api.com',
            apiUrl: 'https://v6.exchangerate-api.com',
            apiKey: null,
            requiresApiKey: false, // Set to false to bypass Provider validation
            isUnlimited: true,
            monthlyQuota: null
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('API key required for exchangerate-api.com');

        $this->factory->create($provider);
    }

    /** @test */
    public function it_throws_exception_when_api_key_missing_for_currency_api(): void
    {
        $provider = new Provider(
            code: 'currencyapi',
            name: 'currencyapi.com',
            apiUrl: 'https://api.currencyapi.com',
            apiKey: null,
            requiresApiKey: false, // Set to false to bypass Provider validation
            isUnlimited: true,
            monthlyQuota: null
        );

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('API key required for currencyapi.com');

        $this->factory->create($provider);
    }
}
