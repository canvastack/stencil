<?php

namespace Tests\Unit\Infrastructure\ExchangeRate;

use App\Infrastructure\ExchangeRate\Adapters\ExchangeRateApiClient;
use App\Infrastructure\ExchangeRate\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExchangeRateApiClientTest extends TestCase
{
    private string $apiKey = 'test-api-key';

    /** @test */
    public function it_fetches_exchange_rate_successfully(): void
    {
        Http::fake([
            'v6.exchangerate-api.com/*' => Http::response([
                'result' => 'success',
                'conversion_rate' => 15420.50
            ], 200)
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);
        $rate = $client->fetchRate('USD', 'IDR');

        $this->assertEquals(15420.50, $rate);
    }

    /** @test */
    public function it_throws_exception_on_api_error_response(): void
    {
        Http::fake([
            'v6.exchangerate-api.com/*' => Http::response([
                'result' => 'error',
                'error-type' => 'invalid-key'
            ], 200)
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Authentication failed for provider: exchangerate-api.com. Invalid API key');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_throws_exception_on_http_error(): void
    {
        Http::fake([
            'v6.exchangerate-api.com/*' => Http::response('Not Found', 404)
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Connection failed to provider exchangerate-api.com: HTTP request returned status code 404: Not Found');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_throws_exception_on_missing_conversion_rate(): void
    {
        Http::fake([
            'v6.exchangerate-api.com/*' => Http::response([
                'result' => 'success'
            ], 200)
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Invalid response from provider exchangerate-api.com: Missing conversion_rate field');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_throws_exception_on_invalid_rate(): void
    {
        Http::fake([
            'v6.exchangerate-api.com/*' => Http::response([
                'result' => 'success',
                'conversion_rate' => -100
            ], 200)
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);

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

        $client = new ExchangeRateApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Network timeout after 10 seconds for provider: exchangerate-api.com');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_tests_connection_successfully(): void
    {
        Http::fake([
            'v6.exchangerate-api.com/*' => Http::response([
                'result' => 'success',
                'conversion_rate' => 15420.50
            ], 200)
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);
        $result = $client->testConnection();

        $this->assertTrue($result);
    }

    /** @test */
    public function it_returns_false_on_connection_test_failure(): void
    {
        Http::fake([
            'v6.exchangerate-api.com/*' => Http::response('Unauthorized', 401)
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);
        $result = $client->testConnection();

        $this->assertFalse($result);
    }
}
