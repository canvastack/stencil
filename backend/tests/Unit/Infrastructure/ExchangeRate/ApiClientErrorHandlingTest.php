<?php

namespace Tests\Unit\Infrastructure\ExchangeRate;

use App\Infrastructure\ExchangeRate\Adapters\ExchangeRateApiClient;
use App\Infrastructure\ExchangeRate\Adapters\CurrencyApiClient;
use App\Infrastructure\ExchangeRate\Adapters\FrankfurterClient;
use App\Infrastructure\ExchangeRate\Adapters\Fawazahmed0Client;
use App\Infrastructure\ExchangeRate\Exceptions\ApiException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Test API client error handling scenarios
 * 
 * @group Feature: dynamic-exchange-rate-system
 */
class ApiClientErrorHandlingTest extends TestCase
{
    private string $apiKey = 'test-api-key';

    public function test_exchange_rate_api_client_handles_network_timeout(): void
    {
        Http::fake([
            '*' => function () {
                throw new ConnectionException('Connection timed out');
            }
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Network timeout after 10 seconds for provider: exchangerate-api.com');
        
        $client->fetchRate('USD', 'IDR');
    }

    public function test_exchange_rate_api_client_handles_rate_limit(): void
    {
        Http::fake([
            '*' => Http::response([], 429, ['Retry-After' => '60'])
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Rate limit exceeded for provider: exchangerate-api.com');
        
        $client->fetchRate('USD', 'IDR');
    }

    public function test_exchange_rate_api_client_handles_authentication_error(): void
    {
        Http::fake([
            '*' => Http::response([], 401)
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Authentication failed for provider: exchangerate-api.com');
        
        $client->fetchRate('USD', 'IDR');
    }

    public function test_exchange_rate_api_client_handles_invalid_json(): void
    {
        Http::fake([
            '*' => Http::response('invalid json response', 200)
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Invalid JSON response from provider: exchangerate-api.com');
        
        $client->fetchRate('USD', 'IDR');
    }

    public function test_exchange_rate_api_client_handles_api_error_response(): void
    {
        Http::fake([
            '*' => Http::response([
                'result' => 'error',
                'error-type' => 'invalid-key'
            ], 200)
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Authentication failed for provider: exchangerate-api.com');
        
        $client->fetchRate('USD', 'IDR');
    }

    public function test_currency_api_client_handles_network_timeout(): void
    {
        Http::fake([
            '*' => function () {
                throw new ConnectionException('Operation timed out');
            }
        ]);

        $client = new CurrencyApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Network timeout after 10 seconds for provider: currencyapi.com');
        
        $client->fetchRate('USD', 'IDR');
    }

    public function test_currency_api_client_handles_api_error(): void
    {
        Http::fake([
            '*' => Http::response([
                'error' => [
                    'code' => 401,
                    'message' => 'Invalid API key provided'
                ]
            ], 200)
        ]);

        $client = new CurrencyApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Authentication failed for provider: currencyapi.com');
        
        $client->fetchRate('USD', 'IDR');
    }

    public function test_frankfurter_client_handles_bad_request(): void
    {
        Http::fake([
            '*' => Http::response('Bad Request', 400)
        ]);

        $client = new FrankfurterClient();

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Invalid response from provider frankfurter.app: Invalid currency codes or parameters');
        
        $client->fetchRate('USD', 'IDR');
    }

    public function test_fawazahmed0_client_handles_not_found(): void
    {
        Http::fake([
            '*' => Http::response('Not Found', 404)
        ]);

        $client = new Fawazahmed0Client();

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Invalid response from provider fawazahmed0: Currency usd not supported');
        
        $client->fetchRate('USD', 'IDR');
    }

    public function test_api_exception_error_types(): void
    {
        $timeoutException = ApiException::networkTimeout('test-provider', 30);
        $this->assertEquals(ApiException::ERROR_NETWORK_TIMEOUT, $timeoutException->getErrorType());
        $this->assertTrue($timeoutException->isRetryable());

        $rateLimitException = ApiException::rateLimit('test-provider', 60);
        $this->assertEquals(ApiException::ERROR_RATE_LIMIT, $rateLimitException->getErrorType());
        $this->assertTrue($rateLimitException->isRetryable());

        $authException = ApiException::authentication('test-provider', 'Invalid key');
        $this->assertEquals(ApiException::ERROR_AUTHENTICATION, $authException->getErrorType());
        $this->assertFalse($authException->isRetryable());

        $jsonException = ApiException::invalidJson('test-provider', 'bad json');
        $this->assertEquals(ApiException::ERROR_INVALID_JSON, $jsonException->getErrorType());
        $this->assertFalse($jsonException->isRetryable());
    }

    public function test_api_exception_context(): void
    {
        $exception = ApiException::networkTimeout('test-provider', 30);
        
        $context = $exception->getContext();
        $this->assertIsArray($context);
        $this->assertEquals('test-provider', $context['provider']);
        $this->assertEquals(30, $context['timeout']);
    }

    public function test_connection_exception_handling(): void
    {
        Http::fake([
            '*' => function () {
                throw new ConnectionException('Connection failed');
            }
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);

        $this->expectException(ApiException::class);
        $this->expectExceptionMessage('Connection failed to provider exchangerate-api.com');
        
        $client->fetchRate('USD', 'IDR');
    }

    public function test_test_connection_returns_false_on_error(): void
    {
        Http::fake([
            '*' => function () {
                throw new ConnectionException('Connection failed');
            }
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);
        
        $this->assertFalse($client->testConnection());
    }

    public function test_test_connection_returns_true_on_success(): void
    {
        Http::fake([
            '*' => Http::response([
                'result' => 'success',
                'conversion_rate' => 15000.0
            ], 200)
        ]);

        $client = new ExchangeRateApiClient($this->apiKey);
        
        $this->assertTrue($client->testConnection());
    }
}