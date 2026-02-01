<?php

namespace Tests\Unit\Domain\ExchangeRate;

use App\Domain\ExchangeRate\Entities\ExchangeRate;
use Carbon\Carbon;
use Eris\Generator;
use Eris\TestTrait;
use Tests\TestCase;

/**
 * Property-Based Tests for ExchangeRate Entity
 * 
 * @group Feature: dynamic-exchange-rate-system
 */
class ExchangeRateEntityPropertyTest extends TestCase
{
    use TestTrait;

    /**
     * @group Property 28: Currency Conversion Application
     * @test
     */
    public function property_currency_conversion_application(): void
    {
        $this->forAll(
            Generator\choose(1000, 50000),      // Exchange rate (IDR per USD, e.g., 15000)
            Generator\choose(0, 1000000),       // USD amount in cents (0 to $10,000)
            Generator\elements(['api', 'manual']), // Source type
            Generator\elements(['exchangerate-api', 'currencyapi', 'fawazahmed0', 'frankfurter', null]) // Provider
        )->then(function ($exchangeRateValue, $usdAmountCents, $source, $provider) {
            // Create ExchangeRate entity
            $exchangeRate = new ExchangeRate(
                $exchangeRateValue,
                Carbon::now(),
                $source,
                $provider
            );

            // Convert USD cents to USD dollars for conversion
            $usdAmountDollars = $usdAmountCents / 100;

            // Property: convert() should return IDR amount in dollars (not cents)
            $convertedAmount = $exchangeRate->convert($usdAmountDollars);

            // Property: Converted amount should equal USD amount * exchange rate
            $expectedAmount = round($usdAmountDollars * $exchangeRateValue, 2);
            
            $this->assertEquals(
                $expectedAmount,
                $convertedAmount,
                "Currency conversion failed: {$usdAmountDollars} USD * {$exchangeRateValue} rate should equal {$expectedAmount} IDR, got {$convertedAmount}"
            );

            // Property: Converted amount should always be non-negative
            $this->assertGreaterThanOrEqual(
                0,
                $convertedAmount,
                "Converted amount should never be negative"
            );

            // Property: Converting zero should always return zero
            $zeroConversion = $exchangeRate->convert(0);
            $this->assertEquals(
                0,
                $zeroConversion,
                "Converting 0 USD should always return 0 IDR"
            );

            // Property: Conversion should be proportional (double input = double output)
            if ($usdAmountDollars > 0) {
                $doubleAmount = $exchangeRate->convert($usdAmountDollars * 2);
                $expectedDouble = round($convertedAmount * 2, 2);
                
                $this->assertEquals(
                    $expectedDouble,
                    $doubleAmount,
                    "Conversion should be proportional: double input should give double output"
                );
            }

            // Property: Rate should be preserved in entity
            $this->assertEquals(
                $exchangeRateValue,
                $exchangeRate->getRate(),
                "Exchange rate should be preserved in entity"
            );

            // Property: Source should be preserved in entity
            $this->assertEquals(
                $source,
                $exchangeRate->getSource(),
                "Source should be preserved in entity"
            );

            // Property: Provider should be preserved in entity
            $this->assertEquals(
                $provider,
                $exchangeRate->getProviderCode(),
                "Provider code should be preserved in entity"
            );
        });
    }

    /**
     * Test conversion with realistic exchange rates
     * @test
     */
    public function test_conversion_with_realistic_rates(): void
    {
        $this->forAll(
            Generator\choose(14000, 16000),     // Realistic IDR/USD rate (14,000-16,000)
            Generator\choose(1, 100000)         // USD amount in cents ($0.01 to $1,000)
        )->then(function ($rate, $usdCents) {
            $exchangeRate = new ExchangeRate($rate, Carbon::now());
            $usdDollars = $usdCents / 100;
            
            $converted = $exchangeRate->convert($usdDollars);
            
            // Property: Converted amount should be reasonable (within expected range)
            $expectedMin = ($usdDollars * $rate) * 0.99; // Allow 1% tolerance for rounding
            $expectedMax = ($usdDollars * $rate) * 1.01;
            
            $this->assertGreaterThanOrEqual(
                $expectedMin,
                $converted,
                "Converted amount should be within reasonable range (minimum)"
            );
            
            $this->assertLessThanOrEqual(
                $expectedMax,
                $converted,
                "Converted amount should be within reasonable range (maximum)"
            );
        });
    }

    /**
     * Test conversion precision and rounding
     * @test
     */
    public function test_conversion_precision_and_rounding(): void
    {
        $this->forAll(
            Generator\choose(10000, 20000),     // Exchange rate
            Generator\choose(1, 999)            // USD cents (fractional dollars)
        )->then(function ($rate, $usdCents) {
            $exchangeRate = new ExchangeRate($rate, Carbon::now());
            $usdDollars = $usdCents / 100; // Creates fractional dollars
            
            $converted = $exchangeRate->convert($usdDollars);
            
            // Property: Result should be rounded to 2 decimal places
            $this->assertEquals(
                round($converted, 2),
                $converted,
                "Converted amount should be rounded to 2 decimal places"
            );
            
            // Property: Result should not have more than 2 decimal places
            $decimalPlaces = strlen(substr(strrchr($converted, "."), 1));
            $this->assertLessThanOrEqual(
                2,
                $decimalPlaces,
                "Converted amount should not have more than 2 decimal places"
            );
        });
    }

    /**
     * Test conversion edge cases
     * @test
     */
    public function test_conversion_edge_cases(): void
    {
        $exchangeRate = new ExchangeRate(15000, Carbon::now());
        
        // Test very small amounts
        $smallAmount = $exchangeRate->convert(0.01); // 1 cent
        $this->assertEquals(150.00, $smallAmount, "Small amount conversion should work correctly");
        
        // Test large amounts
        $largeAmount = $exchangeRate->convert(10000); // $10,000
        $this->assertEquals(150000000.00, $largeAmount, "Large amount conversion should work correctly");
        
        // Test fractional amounts
        $fractionalAmount = $exchangeRate->convert(1.23);
        $this->assertEquals(18450.00, $fractionalAmount, "Fractional amount conversion should work correctly");
    }

    /**
     * Test that negative amounts throw exception
     * @test
     */
    public function test_negative_amount_throws_exception(): void
    {
        $exchangeRate = new ExchangeRate(15000, Carbon::now());
        
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Amount must be non-negative');
        
        $exchangeRate->convert(-1.0);
    }

    /**
     * Test that zero or negative rates throw exception during construction
     * @test
     */
    public function test_invalid_rate_throws_exception(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Exchange rate must be greater than zero');
        
        new ExchangeRate(0, Carbon::now());
    }

    /**
     * Test conversion consistency across multiple calls
     * @test
     */
    public function test_conversion_consistency(): void
    {
        $this->forAll(
            Generator\choose(10000, 20000),     // Exchange rate
            Generator\choose(1, 10000)          // USD amount in cents
        )->then(function ($rate, $usdCents) {
            $exchangeRate = new ExchangeRate($rate, Carbon::now());
            $usdDollars = $usdCents / 100;
            
            // Property: Multiple calls with same input should return same result
            $result1 = $exchangeRate->convert($usdDollars);
            $result2 = $exchangeRate->convert($usdDollars);
            $result3 = $exchangeRate->convert($usdDollars);
            
            $this->assertEquals(
                $result1,
                $result2,
                "Multiple conversion calls should return consistent results"
            );
            
            $this->assertEquals(
                $result2,
                $result3,
                "Multiple conversion calls should return consistent results"
            );
        });
    }

    /**
     * Test conversion mathematical properties
     * @test
     */
    public function test_conversion_mathematical_properties(): void
    {
        $this->forAll(
            Generator\choose(10000, 20000),     // Exchange rate
            Generator\choose(1, 1000),          // First USD amount
            Generator\choose(1, 1000)           // Second USD amount
        )->then(function ($rate, $usd1Cents, $usd2Cents) {
            $exchangeRate = new ExchangeRate($rate, Carbon::now());
            $usd1 = $usd1Cents / 100;
            $usd2 = $usd2Cents / 100;
            
            // Property: convert(a + b) should equal convert(a) + convert(b) (within rounding tolerance)
            $sumConverted = $exchangeRate->convert($usd1 + $usd2);
            $convertedSum = $exchangeRate->convert($usd1) + $exchangeRate->convert($usd2);
            
            $this->assertEqualsWithDelta(
                $sumConverted,
                $convertedSum,
                0.01, // Allow 1 cent tolerance for rounding differences
                "Conversion should be additive: convert(a + b) ≈ convert(a) + convert(b)"
            );
            
            // Property: convert(a * n) should equal convert(a) * n (within rounding tolerance)
            $multiplier = 3;
            $multipliedConverted = $exchangeRate->convert($usd1 * $multiplier);
            $convertedMultiplied = $exchangeRate->convert($usd1) * $multiplier;
            
            $this->assertEqualsWithDelta(
                $multipliedConverted,
                $convertedMultiplied,
                0.01, // Allow 1 cent tolerance for rounding differences
                "Conversion should be multiplicative: convert(a * n) ≈ convert(a) * n"
            );
        });
    }

    /**
     * Test toArray includes conversion rate
     * @test
     */
    public function test_to_array_includes_rate(): void
    {
        $rate = 15000;
        $fetchedAt = Carbon::now();
        $source = 'api';
        $provider = 'exchangerate-api';
        
        $exchangeRate = new ExchangeRate($rate, $fetchedAt, $source, $provider);
        $array = $exchangeRate->toArray();
        
        $this->assertArrayHasKey('rate', $array);
        $this->assertEquals($rate, $array['rate']);
        $this->assertEquals($source, $array['source']);
        $this->assertEquals($provider, $array['provider_code']);
        $this->assertArrayHasKey('fetched_at', $array);
        $this->assertArrayHasKey('is_stale', $array);
        $this->assertArrayHasKey('age_hours', $array);
    }
}
