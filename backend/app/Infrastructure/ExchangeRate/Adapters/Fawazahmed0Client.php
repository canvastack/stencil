<?php

namespace App\Infrastructure\ExchangeRate\Adapters;

use App\Infrastructure\ExchangeRate\Contracts\ExchangeRateClient;
use App\Infrastructure\ExchangeRate\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;

class Fawazahmed0Client implements ExchangeRateClient
{
    private const BASE_URL = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies';
    private const TIMEOUT = 10; // seconds

    public function __construct()
    {
        // No API key required for this provider
    }

    /**
     * Fetch the exchange rate from fawazahmed0 API
     *
     * @param string $from Source currency code
     * @param string $to Target currency code
     * @return float The exchange rate
     * @throws ApiException When the API request fails
     */
    public function fetchRate(string $from, string $to): float
    {
        try {
            $from = strtolower($from);
            $to = strtolower($to);

            $response = Http::timeout(self::TIMEOUT)
                ->get(self::BASE_URL . "/{$from}.json");

            // Handle specific HTTP status codes
            if ($response->status() === 429) {
                $retryAfter = $response->header('Retry-After');
                throw ApiException::rateLimit('fawazahmed0', $retryAfter ? (int) $retryAfter : null);
            }

            if ($response->status() === 404) {
                throw ApiException::invalidResponse('fawazahmed0', "Currency {$from} not supported");
            }

            if (!$response->successful()) {
                throw ApiException::connectionFailed(
                    'fawazahmed0',
                    "HTTP request returned status code {$response->status()}: {$response->body()}"
                );
            }

            // Parse JSON response
            $data = $response->json();
            
            if ($data === null) {
                throw ApiException::invalidJson('fawazahmed0', $response->body());
            }

            // Validate response structure
            if (!isset($data[$from][$to])) {
                throw ApiException::invalidResponse('fawazahmed0', "Missing rate data for {$to}");
            }

            $rate = (float) $data[$from][$to];

            if ($rate <= 0) {
                throw ApiException::invalidResponse('fawazahmed0', 'Invalid exchange rate: rate must be positive');
            }

            return $rate;

        } catch (ConnectionException $e) {
            // Check if it's a timeout
            if (str_contains($e->getMessage(), 'timeout') || str_contains($e->getMessage(), 'timed out')) {
                throw ApiException::networkTimeout('fawazahmed0', self::TIMEOUT);
            }
            
            throw ApiException::connectionFailed('fawazahmed0', $e->getMessage());
        } catch (RequestException $e) {
            throw ApiException::connectionFailed('fawazahmed0', $e->getMessage());
        } catch (ApiException $e) {
            // Re-throw our custom exceptions
            throw $e;
        } catch (\Exception $e) {
            // Catch any other unexpected exceptions
            throw ApiException::connectionFailed('fawazahmed0', 'Unexpected error: ' . $e->getMessage());
        }
    }

    /**
     * Test the connection to fawazahmed0 API
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
