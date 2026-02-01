<?php

namespace Tests\Unit\Infrastructure\ExchangeRate;

use App\Infrastructure\ExchangeRate\Adapters\Fawazahmed0Client;
use App\Infrastructure\ExchangeRate\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class Fawazahmed0ClientTest extends TestCase
{
    /** @test */
    public function it_fetches_exchange_rate_successfully(): void
    {
        Http::fake([
            'cdn.jsdelivr.net/*' => Http::response([
                'usd' => [
                    'idr' => 15420.50
                ]
            ], 200)
        ]);

        $client = new Fawazahmed0Client();
        $rate = $client->fetchRate('USD', 'IDR');

        $this->assertEquals(15420.50, $rate);
    }

    /** @test */
    public function it_converts_currency_codes_to_lowercase(): void
    {
        Http::fake([
            'cdn.jsdelivr.net/*/usd.json' => Http::response([
                'usd' => [
                    'idr' => 15420.50
                ]
            ], 200)
        ]);

        $client = new Fawazahmed0Client();
        $rate = $client->fetchRate('USD', 'IDR');

        $this->assertEquals(15420.50, $rate);
        
        Http::assertSent(function ($request) {
            return str_contains($request->url(), '/usd.json');
        });
    }

    /** @test */
    public function it_throws_exception_on_http_error(): void
    {
        Http::fake([
            'cdn.jsdelivr.net/*' => Http::response('Not Found', 404)
        ]);

        $client = new Fawazahmed0Client();

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Invalid response from provider fawazahmed0: Currency usd not supported');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_throws_exception_on_missing_rate_data(): void
    {
        Http::fake([
            'cdn.jsdelivr.net/*' => Http::response([
                'usd' => []
            ], 200)
        ]);

        $client = new Fawazahmed0Client();

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Invalid response from provider fawazahmed0: Missing rate data for idr');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_throws_exception_on_invalid_rate(): void
    {
        Http::fake([
            'cdn.jsdelivr.net/*' => Http::response([
                'usd' => [
                    'idr' => -100
                ]
            ], 200)
        ]);

        $client = new Fawazahmed0Client();

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Invalid response from provider fawazahmed0: Invalid exchange rate: rate must be positive');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_throws_exception_on_connection_timeout(): void
    {
        Http::fake(function () {
            throw new \Illuminate\Http\Client\ConnectionException('Connection timeout');
        });

        $client = new Fawazahmed0Client();

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Network timeout after 10 seconds for provider: fawazahmed0');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_tests_connection_successfully(): void
    {
        Http::fake([
            'cdn.jsdelivr.net/*' => Http::response([
                'usd' => [
                    'idr' => 15420.50
                ]
            ], 200)
        ]);

        $client = new Fawazahmed0Client();
        $result = $client->testConnection();

        $this->assertTrue($result);
    }

    /** @test */
    public function it_returns_false_on_connection_test_failure(): void
    {
        Http::fake([
            'cdn.jsdelivr.net/*' => Http::response('Service Unavailable', 503)
        ]);

        $client = new Fawazahmed0Client();
        $result = $client->testConnection();

        $this->assertFalse($result);
    }
}
