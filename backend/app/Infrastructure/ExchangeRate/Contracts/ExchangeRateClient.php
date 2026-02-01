<?php

namespace App\Infrastructure\ExchangeRate\Contracts;

use App\Infrastructure\ExchangeRate\Exceptions\ApiException;

interface ExchangeRateClient
{
    /**
     * Fetch the exchange rate from the API provider.
     *
     * @param string $from Source currency code (e.g., 'USD')
     * @param string $to Target currency code (e.g., 'IDR')
     * @return float The exchange rate
     * @throws ApiException When the API request fails
     */
    public function fetchRate(string $from, string $to): float;

    /**
     * Test the connection to the API provider.
     *
     * @return bool True if connection is successful, false otherwise
     */
    public function testConnection(): bool;
}
