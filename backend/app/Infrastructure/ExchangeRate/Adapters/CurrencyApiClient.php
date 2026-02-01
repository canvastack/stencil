<?php

namespace App\Infrastructure\ExchangeRate\Adapters;

use App\Infrastructure\ExchangeRate\Contracts\ExchangeRateClient;
use App\Infrastructure\ExchangeRate\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;

class CurrencyApiClient implements ExchangeRateClient
{
    private const BASE_URL = 'https://api.currencyapi.com/v3/latest';
    private const TIMEOUT = 10; // seconds

    public function __construct(
        private string $apiKey
    ) {}

    /**
     * Fetch the exchange rate from currencyapi.com
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
                ->get(self::BASE_URL, [
                    'apikey' => $this->apiKey,
                    'base_currency' => $from,
                    'currencies' => $to
                ]);

            // Handle specific HTTP status codes
            if ($response->status() === 429) {
                $retryAfter = $response->header('Retry-After');
                throw ApiException::rateLimit('currencyapi.com', $retryAfter ? (int) $retryAfter : null);
            }

            if ($response->status() === 401 || $response->status() === 403) {
                throw ApiException::authentication('currencyapi.com', 'Invalid API key');
            }

            if (!$response->successful()) {
                throw ApiException::connectionFailed(
                    'currencyapi.com',
                    "HTTP request returned status code {$response->status()}: {$response->body()}"
                );
            }

            // Parse JSON response
            $data = $response->json();
            
            if ($data === null) {
                throw ApiException::invalidJson('currencyapi.com', $response->body());
            }

            // Check for API error in response
            if (isset($data['error'])) {
                $errorMessage = $data['error']['message'] ?? 'Unknown error';
                $errorCode = $data['error']['code'] ?? 0;
                
                if ($errorCode === 401 || str_contains($errorMessage, 'invalid') && str_contains($errorMessage, 'key')) {
                    throw ApiException::authentication('currencyapi.com', $errorMessage);
                }
                
                if ($errorCode === 429 || str_contains($errorMessage, 'quota') || str_contains($errorMessage, 'limit')) {
                    throw ApiException::rateLimit('currencyapi.com');
                }

                throw ApiException::invalidResponse('currencyapi.com', "API error: {$errorMessage}");
            }

            // Validate response structure
            if (!isset($data['data'][$to]['value'])) {
                throw ApiException::invalidResponse('currencyapi.com', "Missing rate data for {$to}");
            }

            $rate = (float) $data['data'][$to]['value'];

            if ($rate <= 0) {
                throw ApiException::invalidResponse('currencyapi.com', 'Invalid exchange rate: rate must be positive');
            }

            return $rate;

        } catch (ConnectionException $e) {
            // Check if it's a timeout
            if (str_contains($e->getMessage(), 'timeout') || str_contains($e->getMessage(), 'timed out')) {
                throw ApiException::networkTimeout('currencyapi.com', self::TIMEOUT);
            }
            
            throw ApiException::connectionFailed('currencyapi.com', $e->getMessage());
        } catch (RequestException $e) {
            throw ApiException::connectionFailed('currencyapi.com', $e->getMessage());
        } catch (ApiException $e) {
            // Re-throw our custom exceptions
            throw $e;
        } catch (\Exception $e) {
            // Catch any other unexpected exceptions
            throw ApiException::connectionFailed('currencyapi.com', 'Unexpected error: ' . $e->getMessage());
        }
    }

    /**
     * Test the connection to currencyapi.com
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
