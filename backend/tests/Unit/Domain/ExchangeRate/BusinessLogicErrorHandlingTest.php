<?php

namespace Tests\Unit\Domain\ExchangeRate;

use App\Domain\ExchangeRate\Exceptions\InvalidManualRateException;
use App\Domain\ExchangeRate\Exceptions\NoRateAvailableException;
use App\Domain\ExchangeRate\Exceptions\StaleRateException;
use App\Domain\ExchangeRate\Services\ExchangeRateValidationService;
use Carbon\Carbon;
use Tests\TestCase;

/**
 * Test business logic error handling scenarios
 * 
 * @group Feature: dynamic-exchange-rate-system
 */
class BusinessLogicErrorHandlingTest extends TestCase
{
    private ExchangeRateValidationService $validationService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validationService = new ExchangeRateValidationService();
    }

    public function test_validate_manual_rate_throws_for_null_when_required(): void
    {
        $this->expectException(InvalidManualRateException::class);
        $this->expectExceptionMessage('Manual exchange rate is required when in manual mode');
        
        $this->validationService->validateManualRate(null, true);
    }

    public function test_validate_manual_rate_allows_null_when_not_required(): void
    {
        // Should not throw
        $this->validationService->validateManualRate(null, false);
        $this->assertTrue(true); // Assert that no exception was thrown
    }

    public function test_validate_manual_rate_throws_for_negative_rate(): void
    {
        $this->expectException(InvalidManualRateException::class);
        $this->expectExceptionMessage('Manual exchange rate must be positive, got: -1000');
        
        $this->validationService->validateManualRate(-1000.0);
    }

    public function test_validate_manual_rate_throws_for_zero_rate(): void
    {
        $this->expectException(InvalidManualRateException::class);
        $this->expectExceptionMessage('Manual exchange rate must be positive, got: 0');
        
        $this->validationService->validateManualRate(0.0);
    }

    public function test_validate_manual_rate_throws_for_too_low_rate(): void
    {
        $this->expectException(InvalidManualRateException::class);
        $this->expectExceptionMessage('Manual exchange rate 5000 is too low. Minimum allowed: 10000');
        
        $this->validationService->validateManualRate(5000.0);
    }

    public function test_validate_manual_rate_throws_for_too_high_rate(): void
    {
        $this->expectException(InvalidManualRateException::class);
        $this->expectExceptionMessage('Manual exchange rate 30000 is too high. Maximum allowed: 25000');
        
        $this->validationService->validateManualRate(30000.0);
    }

    public function test_validate_manual_rate_accepts_valid_rate(): void
    {
        // Should not throw for valid rates
        $this->validationService->validateManualRate(15000.0);
        $this->validationService->validateManualRate(10000.0); // Minimum
        $this->validationService->validateManualRate(25000.0); // Maximum
        $this->assertTrue(true); // Assert that no exception was thrown
    }

    public function test_validate_rate_age_throws_for_stale_rate(): void
    {
        $staleDate = Carbon::now()->subDays(10);
        
        $this->expectException(StaleRateException::class);
        $this->expectExceptionMessage('Exchange rate is stale: last updated 10 days ago');
        
        $this->validationService->validateRateAge($staleDate, 7);
    }

    public function test_validate_rate_age_accepts_fresh_rate(): void
    {
        $freshDate = Carbon::now()->subDays(3);
        
        // Should not throw
        $this->validationService->validateRateAge($freshDate, 7);
        $this->assertTrue(true);
    }

    public function test_validate_rate_availability_throws_for_null_rate(): void
    {
        $this->expectException(NoRateAvailableException::class);
        $this->expectExceptionMessage('No cached exchange rate is available and API providers are unavailable');
        
        $this->validationService->validateRateAvailability(null, null, 'api');
    }

    public function test_validate_rate_availability_throws_for_null_date(): void
    {
        $this->expectException(NoRateAvailableException::class);
        $this->expectExceptionMessage('No cached exchange rate is available and API providers are unavailable');
        
        $this->validationService->validateRateAvailability(15000.0, null, 'api');
    }

    public function test_validate_rate_availability_logs_warning_for_stale_cached_rate(): void
    {
        $staleDate = Carbon::now()->subDays(10);
        
        // Should not throw for cached rates, but should log warning
        $this->validationService->validateRateAvailability(15000.0, $staleDate, 'cached');
        $this->assertTrue(true);
    }

    public function test_validate_rate_availability_throws_for_stale_api_rate(): void
    {
        $staleDate = Carbon::now()->subDays(10);
        
        $this->expectException(StaleRateException::class);
        
        $this->validationService->validateRateAvailability(15000.0, $staleDate, 'api');
    }

    public function test_validate_api_rate_accepts_valid_rate(): void
    {
        // Should not throw for valid API rates
        $this->validationService->validateApiRate(15000.0, 'test-provider');
        $this->assertTrue(true);
    }

    public function test_validate_api_rate_throws_for_negative_rate(): void
    {
        $this->expectException(InvalidManualRateException::class);
        $this->expectExceptionMessage('Manual exchange rate must be positive, got: -1000');
        
        $this->validationService->validateApiRate(-1000.0, 'test-provider');
    }

    public function test_validate_api_rate_logs_warning_for_extreme_values(): void
    {
        // Should log warning but not throw for extreme but positive values
        $this->validationService->validateApiRate(5000.0, 'test-provider'); // Very low
        $this->validationService->validateApiRate(35000.0, 'test-provider'); // Very high
        $this->assertTrue(true);
    }

    public function test_should_warn_about_staleness(): void
    {
        $recentDate = Carbon::now()->subDays(1);
        $oldDate = Carbon::now()->subDays(5);
        
        $this->assertFalse($this->validationService->shouldWarnAboutStaleness($recentDate, 3));
        $this->assertTrue($this->validationService->shouldWarnAboutStaleness($oldDate, 3));
    }

    public function test_get_reasonable_rate_bounds(): void
    {
        $bounds = $this->validationService->getReasonableRateBounds();
        
        $this->assertIsArray($bounds);
        $this->assertArrayHasKey('min', $bounds);
        $this->assertArrayHasKey('max', $bounds);
        $this->assertEquals(10000.0, $bounds['min']);
        $this->assertEquals(25000.0, $bounds['max']);
    }

    public function test_stale_rate_exception_properties(): void
    {
        $rateDate = Carbon::now()->subDays(10);
        $exception = StaleRateException::forRate($rateDate, 7);
        
        $this->assertEquals($rateDate, $exception->getRateDate());
        $this->assertEquals(7, $exception->getMaxAgeDays());
        $this->assertEquals(10, $exception->getDaysOld());
    }

    public function test_no_rate_available_exception_types(): void
    {
        $noProvidersException = NoRateAvailableException::noProviders();
        $this->assertStringContainsString('No exchange rate providers are configured', $noProvidersException->getMessage());

        $exhaustedException = NoRateAvailableException::allProvidersExhausted();
        $this->assertStringContainsString('All exchange rate providers have exhausted', $exhaustedException->getMessage());

        $noCachedException = NoRateAvailableException::noCachedRate();
        $this->assertStringContainsString('No cached exchange rate is available', $noCachedException->getMessage());

        $apiFailureException = NoRateAvailableException::apiFailure('Connection timeout');
        $this->assertStringContainsString('Exchange rate API failure: Connection timeout', $apiFailureException->getMessage());
    }

    public function test_invalid_manual_rate_exception_types(): void
    {
        $notPositiveException = InvalidManualRateException::notPositive(-100.0);
        $this->assertStringContainsString('Manual exchange rate must be positive, got: -100', $notPositiveException->getMessage());

        $tooLowException = InvalidManualRateException::tooLow(5000.0, 10000.0);
        $this->assertStringContainsString('Manual exchange rate 5000 is too low', $tooLowException->getMessage());

        $tooHighException = InvalidManualRateException::tooHigh(30000.0, 25000.0);
        $this->assertStringContainsString('Manual exchange rate 30000 is too high', $tooHighException->getMessage());

        $unreasonableException = InvalidManualRateException::unreasonableValue(50000.0);
        $this->assertStringContainsString('Manual exchange rate 50000 appears unreasonable', $unreasonableException->getMessage());

        $requiredException = InvalidManualRateException::required();
        $this->assertStringContainsString('Manual exchange rate is required when in manual mode', $requiredException->getMessage());
    }
}