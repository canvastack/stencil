<?php

namespace Tests\Unit\Infrastructure\ExchangeRate;

use App\Infrastructure\ExchangeRate\Adapters\FrankfurterClient;
use App\Infrastructure\ExchangeRate\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FrankfurterClientTest extends TestCase
{
    /** @test */
    public function it_fetches_exchange_rate_successfully(): void
    {
        Http::fake([
            'api.frankfurter.app/*' => Http::response([
                'rates' => [
                    'IDR' => 15420.50
                ]
            ], 200)
        ]);

        $client = new FrankfurterClient();
        $rate = $client->fetchRate('USD', 'IDR');

        $this->assertEquals(15420.50, $rate);
    }

    /** @test */
    public function it_throws_exception_on_http_error(): void
    {
        Http::fake([
            'api.frankfurter.app/*' => Http::response('Bad Request', 400)
        ]);

        $client = new FrankfurterClient();

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Invalid response from provider frankfurter.app: Invalid currency codes or parameters');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_throws_exception_on_missing_rate_data(): void
    {
        Http::fake([
            'api.frankfurter.app/*' => Http::response([
                'rates' => []
            ], 200)
        ]);

        $client = new FrankfurterClient();

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Invalid response from provider frankfurter.app: Missing rate data for IDR');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_throws_exception_on_invalid_rate(): void
    {
        Http::fake([
            'api.frankfurter.app/*' => Http::response([
                'rates' => [
                    'IDR' => 0
                ]
            ], 200)
        ]);

        $client = new FrankfurterClient();

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Invalid response from provider frankfurter.app: Invalid exchange rate: rate must be positive');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_throws_exception_on_connection_timeout(): void
    {
        Http::fake(function () {
            throw new \Illuminate\Http\Client\ConnectionException('Connection timeout');
        });

        $client = new FrankfurterClient();

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Network timeout after 10 seconds for provider: frankfurter.app');

        $client->fetchRate('USD', 'IDR');
    }

    /** @test */
    public function it_tests_connection_successfully(): void
    {
        Http::fake([
            'api.frankfurter.app/*' => Http::response([
                'rates' => [
                    'IDR' => 15420.50
                ]
            ], 200)
        ]);

        $client = new FrankfurterClient();
        $result = $client->testConnection();

        $this->assertTrue($result);
    }

    /** @test */
    public function it_returns_false_on_connection_test_failure(): void
    {
        Http::fake([
            'api.frankfurter.app/*' => Http::response('Service Unavailable', 503)
        ]);

        $client = new FrankfurterClient();
        $result = $client->testConnection();

        $this->assertFalse($result);
    }
}
