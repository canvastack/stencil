<?php

namespace Tests\Unit\Infrastructure\ExchangeRate;

use App\Infrastructure\ExchangeRate\Adapters\CurrencyApiClient;
use App\Infrastructure\ExchangeRate\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CurrencyApiClientTest extends TestCase
{
    private string $apiKey = 'test-api-key';

    /** @test */
    public function it_fetches_exchange_rate_successfully(): void
    {
        Http::fake([
            'api.currencyapi.com/*' => Http::response([
                'data' => [
                    'IDR' => [
                        'value' => 15420.50
                    ]
                ]
            ], 200)
        ]);

        $client = new CurrencyApiClient($this->apiKey);
        $rate = $client->fetchRate('USD', 'IDR');

        $this->assertEquals(15420.50, $rate);
    }

    /** @test */
    public function it_throws_exception_on_http_error(): void
    {
        Http::fake([
            'api.currencyapi.com/*' => Http::response('Unauthorized', 401)
        ]);

        $client = new CurrencyApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Authentication failed for provider: currencyapi.com. Invalid API key');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_throws_exception_on_missing_rate_data(): void
    {
        Http::fake([
            'api.currencyapi.com/*' => Http::response([
                'data' => []
            ], 200)
        ]);

        $client = new CurrencyApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Invalid response from provider currencyapi.com: Missing rate data for IDR');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_throws_exception_on_invalid_rate(): void
    {
        Http::fake([
            'api.currencyapi.com/*' => Http::response([
                'data' => [
                    'IDR' => [
                        'value' => 0
                    ]
                ]
            ], 200)
        ]);

        $client = new CurrencyApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Invalid exchange rate: rate must be positive');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_throws_exception_on_connection_timeout(): void
    {
        Http::fake(function () {
            throw new \Illuminate\Http\Client\ConnectionException('Connection timeout');
        });

        $client = new CurrencyApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Network timeout after 10 seconds for provider: currencyapi.com');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_tests_connection_successfully(): void
    {
        Http::fake([
            'api.currencyapi.com/*' => Http::response([
                'data' => [
                    'IDR' => [
                        'value' => 15420.50
                    ]
                ]
            ], 200)
        ]);

        $client = new CurrencyApiClient($this->apiKey);
        $result = $client->testConnection();

        $this->assertTrue($result);
    }

    /** @test */
    public function it_returns_false_on_connection_test_failure(): void
    {
        Http::fake([
            'api.currencyapi.com/*' => Http::response('Unauthorized', 401)
        ]);

        $client = new CurrencyApiClient($this->apiKey);
        $result = $client->testConnection();

        $this->assertFalse($result);
    }
}
