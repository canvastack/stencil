<?php

namespace App\Infrastructure\ExchangeRate\Adapters;

use App\Infrastructure\ExchangeRate\Contracts\ExchangeRateClient;
use App\Infrastructure\ExchangeRate\Exceptions\ApiException;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;

class FrankfurterClient implements ExchangeRateClient
{
    private const BASE_URL = 'https://api.frankfurter.app/latest';
    private const TIMEOUT = 10; // seconds

    public function __construct()
    {
        // No API key required for this provider
    }

    /**
     * Fetch the exchange rate from frankfurter.app
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
                    'from' => $from,
                    'to' => $to
                ]);

            // Handle specific HTTP status codes
            if ($response->status() === 429) {
                $retryAfter = $response->header('Retry-After');
                throw ApiException::rateLimit('frankfurter.app', $retryAfter ? (int) $retryAfter : null);
            }

            if ($response->status() === 400) {
                throw ApiException::invalidResponse('frankfurter.app', 'Invalid currency codes or parameters');
            }

            if (!$response->successful()) {
                throw ApiException::connectionFailed(
                    'frankfurter.app',
                    "HTTP request returned status code {$response->status()}: {$response->body()}"
                );
            }

            // Parse JSON response
            $data = $response->json();
            
            if ($data === null) {
                throw ApiException::invalidJson('frankfurter.app', $response->body());
            }

            // Validate response structure
            if (!isset($data['rates'][$to])) {
                throw ApiException::invalidResponse('frankfurter.app', "Missing rate data for {$to}");
            }

            $rate = (float) $data['rates'][$to];

            if ($rate <= 0) {
                throw ApiException::invalidResponse('frankfurter.app', 'Invalid exchange rate: rate must be positive');
            }

            return $rate;

        } catch (ConnectionException $e) {
            // Check if it's a timeout
            if (str_contains($e->getMessage(), 'timeout') || str_contains($e->getMessage(), 'timed out')) {
                throw ApiException::networkTimeout('frankfurter.app', self::TIMEOUT);
            }
            
            throw ApiException::connectionFailed('frankfurter.app', $e->getMessage());
        } catch (RequestException $e) {
            throw ApiException::connectionFailed('frankfurter.app', $e->getMessage());
        } catch (ApiException $e) {
            // Re-throw our custom exceptions
            throw $e;
        } catch (\Exception $e) {
            // Catch any other unexpected exceptions
            throw ApiException::connectionFailed('frankfurter.app', 'Unexpected error: ' . $e->getMessage());
        }
    }

    /**
     * Test the connection to frankfurter.app
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
