<?php

namespace App\Infrastructure\ExchangeRate\Adapters;

use App\Infrastructure\ExchangeRate\Contracts\ExchangeRateClient;
use App\Infrastructure\ExchangeRate\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;

class ExchangeRateApiClient implements ExchangeRateClient
{
    private const BASE_URL = 'https://v6.exchangerate-api.com/v6';
    private const TIMEOUT = 10; // seconds

    public function __construct(
        private string $apiKey
    ) {}

    /**
     * Fetch the exchange rate from exchangerate-api.com
     *
     * @param string $from Source currency code
     * @param string $to Target currency code
     * @return float The exchange rate
     * @throws ApiException When the API request fails
     */
    public function fetchRate(string $from, string $to): float
    {
        try {
            $response = Http::timeout(self::TIMEOUT)
                ->get(self::BASE_URL . "/{$this->apiKey}/pair/{$from}/{$to}");

            // Handle specific HTTP status codes first
            if ($response->status() === 429) {
                $retryAfter = $response->header('Retry-After');
                throw ApiException::rateLimit('exchangerate-api.com', $retryAfter ? (int) $retryAfter : null);
            }

            if ($response->status() === 401 || $response->status() === 403) {
                throw ApiException::authentication('exchangerate-api.com', 'Invalid API key');
            }

            if (!$response->successful()) {
                throw ApiException::connectionFailed(
                    'exchangerate-api.com',
                    "HTTP request returned status code {$response->status()}: {$response->body()}"
                );
            }

            // Parse JSON response
            $data = $response->json();
            
            if ($data === null) {
                throw ApiException::invalidJson('exchangerate-api.com', $response->body());
            }

            // Validate response structure
            if (!isset($data['result'])) {
                throw ApiException::invalidResponse('exchangerate-api.com', 'Missing result field');
            }

            if ($data['result'] !== 'success') {
                $errorType = $data['error-type'] ?? 'unknown';
                
                // Handle specific API error types
                if ($errorType === 'invalid-key') {
                    throw ApiException::authentication('exchangerate-api.com', 'Invalid API key');
                }
                
                if ($errorType === 'quota-reached') {
                    throw ApiException::rateLimit('exchangerate-api.com');
                }

                throw ApiException::invalidResponse('exchangerate-api.com', "API error: {$errorType}");
            }

            if (!isset($data['conversion_rate'])) {
                throw ApiException::invalidResponse('exchangerate-api.com', 'Missing conversion_rate field');
            }

            $rate = (float) $data['conversion_rate'];

            if ($rate <= 0) {
                throw ApiException::invalidResponse('exchangerate-api.com', 'Invalid exchange rate: rate must be positive');
            }

            return $rate;

        } catch (ConnectionException $e) {
            // Check if it's a timeout
            if (str_contains($e->getMessage(), 'timeout') || str_contains($e->getMessage(), 'timed out')) {
                throw ApiException::networkTimeout('exchangerate-api.com', self::TIMEOUT);
            }
            
            throw ApiException::connectionFailed('exchangerate-api.com', $e->getMessage());
        } catch (RequestException $e) {
            throw ApiException::connectionFailed('exchangerate-api.com', $e->getMessage());
        } catch (ApiException $e) {
            // Re-throw our custom exceptions
            throw $e;
        } catch (\Exception $e) {
            // Catch any other unexpected exceptions
            throw ApiException::connectionFailed('exchangerate-api.com', 'Unexpected error: ' . $e->getMessage());
        }
    }

    /**
     * Test the connection to exchangerate-api.com
     *
     * @return bool True if connection is successful
     */
    public function testConnection(): bool
    {
        try {
            $this->fetchRate('USD', 'IDR');
            return true;
        } catch (ApiException $e) {
            return false;
        }
    }
}
