<?php

namespace Tests\Unit\Domain\ExchangeRate;

use App\Domain\ExchangeRate\ValueObjects\QuotaTracker;
use Carbon\Carbon;
use Eris\Generator;
use Eris\TestTrait;
use Tests\TestCase;

/**
 * Property-Based Tests for QuotaTracker Value Object
 * 
 * @group Feature: dynamic-exchange-rate-system
 */
class QuotaTrackerPropertyTest extends TestCase
{
    use TestTrait;

    /**
     * @group Property 6: Quota Calculation Accuracy
     * @test
     */
    public function property_quota_calculation_accuracy(): void
    {
        $this->forAll(
            Generator\choose(0, 1000),   // Requests made
            Generator\choose(1, 2000)    // Quota limit
        )->then(function ($requestsMade, $quotaLimit) {
            // Ensure requests made doesn't exceed quota limit for valid state
            $requestsMade = min($requestsMade, $quotaLimit);
            
            // Create QuotaTracker
            $tracker = new QuotaTracker(
                $requestsMade,
                $quotaLimit,
                now()->year,
                now()->month,
                now()
            );

            // Property: remaining quota should equal (quota_limit - requests_made)
            $expectedRemaining = max(0, $quotaLimit - $requestsMade);
            $actualRemaining = $tracker->getRemainingQuota();

            $this->assertEquals(
                $expectedRemaining,
                $actualRemaining,
                "Remaining quota calculation failed: expected {$expectedRemaining}, got {$actualRemaining} " .
                "(quota_limit: {$quotaLimit}, requests_made: {$requestsMade})"
            );

            // Additional property: remaining quota should never be negative
            $this->assertGreaterThanOrEqual(
                0,
                $actualRemaining,
                "Remaining quota should never be negative"
            );

            // Property: if requests_made >= quota_limit, remaining should be 0
            if ($requestsMade >= $quotaLimit) {
                $this->assertEquals(
                    0,
                    $actualRemaining,
                    "When requests made >= quota limit, remaining should be 0"
                );
                $this->assertTrue(
                    $tracker->isExhausted(),
                    "Tracker should be exhausted when requests >= quota"
                );
            }

            // Property: if requests_made < quota_limit, remaining should be positive
            if ($requestsMade < $quotaLimit) {
                $this->assertGreaterThan(
                    0,
                    $actualRemaining,
                    "When requests made < quota limit, remaining should be positive"
                );
                $this->assertFalse(
                    $tracker->isExhausted(),
                    "Tracker should not be exhausted when requests < quota"
                );
            }
        });
    }

    /**
     * @group Property 7: Monthly Quota Reset
     * @test
     */
    public function property_monthly_quota_reset(): void
    {
        $this->forAll(
            Generator\choose(1, 100),    // Requests made before reset
            Generator\choose(1, 500),    // Quota limit
            Generator\choose(1, 12),     // Months to go back
            Generator\choose(0, 3)       // Years to go back
        )->then(function ($requestsMade, $quotaLimit, $monthsBack, $yearsBack) {
            // Create a date in the past
            $pastDate = Carbon::now()->subMonths($monthsBack)->subYears($yearsBack);
            
            // Create QuotaTracker with past date
            $tracker = new QuotaTracker(
                $requestsMade,
                $quotaLimit,
                $pastDate->year,
                $pastDate->month,
                $pastDate
            );

            // Property: shouldReset() should return true when month/year differs from current
            $currentDate = Carbon::now();
            $shouldReset = $tracker->shouldReset();
            
            if ($pastDate->year !== $currentDate->year || $pastDate->month !== $currentDate->month) {
                $this->assertTrue(
                    $shouldReset,
                    "shouldReset() should return true when calendar month differs from current " .
                    "(tracker: {$pastDate->year}-{$pastDate->month}, current: {$currentDate->year}-{$currentDate->month})"
                );
            } else {
                $this->assertFalse(
                    $shouldReset,
                    "shouldReset() should return false when calendar month matches current"
                );
            }

            // Property: reset() should create new tracker with requests_made = 0
            $resetTracker = $tracker->reset();
            
            $this->assertEquals(
                0,
                $resetTracker->getRequestsMade(),
                "After reset, requests_made should be 0"
            );

            // Property: reset() should update year and month to current
            $this->assertEquals(
                $currentDate->year,
                $resetTracker->getYear(),
                "After reset, year should be current year"
            );
            
            $this->assertEquals(
                $currentDate->month,
                $resetTracker->getMonth(),
                "After reset, month should be current month"
            );

            // Property: reset() should preserve quota_limit
            $this->assertEquals(
                $quotaLimit,
                $resetTracker->getQuotaLimit(),
                "After reset, quota_limit should remain unchanged"
            );

            // Property: reset() should update last_reset_at to current time
            $this->assertNotNull(
                $resetTracker->getLastResetAt(),
                "After reset, last_reset_at should not be null"
            );
            
            $this->assertEqualsWithDelta(
                $currentDate->timestamp,
                $resetTracker->getLastResetAt()->timestamp,
                5, // Allow 5 seconds delta for test execution time
                "After reset, last_reset_at should be approximately current time"
            );

            // Property: after reset, shouldReset() should return false
            $this->assertFalse(
                $resetTracker->shouldReset(),
                "After reset, shouldReset() should return false"
            );

            // Property: after reset, remaining quota should equal quota_limit
            $this->assertEquals(
                $quotaLimit,
                $resetTracker->getRemainingQuota(),
                "After reset, remaining quota should equal quota_limit"
            );
        });
    }

    /**
     * Test that quota reset works correctly at month boundaries
     * @test
     */
    public function test_quota_reset_at_month_boundaries(): void
    {
        // Test February to March transition
        $febDate = Carbon::create(2024, 2, 28, 23, 59, 59);
        Carbon::setTestNow(Carbon::create(2024, 3, 1, 0, 0, 0));
        
        $tracker = new QuotaTracker(50, 100, $febDate->year, $febDate->month, $febDate);
        
        $this->assertTrue($tracker->shouldReset(), "Should reset when crossing from Feb to Mar");
        
        // Test December to January transition (year change)
        $decDate = Carbon::create(2023, 12, 31, 23, 59, 59);
        Carbon::setTestNow(Carbon::create(2024, 1, 1, 0, 0, 0));
        
        $tracker = new QuotaTracker(50, 100, $decDate->year, $decDate->month, $decDate);
        
        $this->assertTrue($tracker->shouldReset(), "Should reset when crossing from Dec to Jan (year change)");
        
        // Reset test time
        Carbon::setTestNow();
    }

    /**
     * Test increment usage property
     * @test
     */
    public function test_increment_usage_property(): void
    {
        $this->forAll(
            Generator\choose(0, 50),     // Initial requests
            Generator\choose(1, 100),    // Quota limit
            Generator\choose(1, 10)      // Increment count
        )->then(function ($initialRequests, $quotaLimit, $incrementCount) {
            $tracker = new QuotaTracker(
                $initialRequests,
                $quotaLimit,
                now()->year,
                now()->month,
                now()
            );

            // Property: incrementUsage() should increase requests_made by specified count
            $incrementedTracker = $tracker->incrementUsage($incrementCount);
            
            $this->assertEquals(
                $initialRequests + $incrementCount,
                $incrementedTracker->getRequestsMade(),
                "After incrementUsage({$incrementCount}), requests_made should increase by {$incrementCount}"
            );

            // Property: incrementUsage() should preserve quota_limit
            $this->assertEquals(
                $quotaLimit,
                $incrementedTracker->getQuotaLimit(),
                "incrementUsage() should not change quota_limit"
            );

            // Property: incrementUsage() should preserve year and month
            $this->assertEquals(
                $tracker->getYear(),
                $incrementedTracker->getYear(),
                "incrementUsage() should not change year"
            );
            
            $this->assertEquals(
                $tracker->getMonth(),
                $incrementedTracker->getMonth(),
                "incrementUsage() should not change month"
            );

            // Property: remaining quota should decrease by increment count
            $expectedRemainingDecrease = min($incrementCount, $tracker->getRemainingQuota());
            $actualRemainingAfter = $incrementedTracker->getRemainingQuota();
            $expectedRemainingAfter = max(0, $tracker->getRemainingQuota() - $incrementCount);
            
            $this->assertEquals(
                $expectedRemainingAfter,
                $actualRemainingAfter,
                "Remaining quota should decrease correctly after increment"
            );
        });
    }

    /**
     * Test immutability property of QuotaTracker
     * @test
     */
    public function test_quota_tracker_immutability(): void
    {
        $this->forAll(
            Generator\choose(10, 50),    // Initial requests
            Generator\choose(100, 200),  // Quota limit
            Generator\choose(1, 5)       // Increment count
        )->then(function ($initialRequests, $quotaLimit, $incrementCount) {
            $originalTracker = new QuotaTracker(
                $initialRequests,
                $quotaLimit,
                now()->year,
                now()->month,
                now()
            );

            $originalRequestsMade = $originalTracker->getRequestsMade();
            $originalRemaining = $originalTracker->getRemainingQuota();

            // Property: incrementUsage() should return new instance, not modify original
            $newTracker = $originalTracker->incrementUsage($incrementCount);
            
            $this->assertEquals(
                $originalRequestsMade,
                $originalTracker->getRequestsMade(),
                "Original tracker should not be modified by incrementUsage()"
            );
            
            $this->assertEquals(
                $originalRemaining,
                $originalTracker->getRemainingQuota(),
                "Original tracker remaining quota should not change"
            );

            // Property: reset() should return new instance, not modify original
            $resetTracker = $originalTracker->reset();
            
            $this->assertEquals(
                $originalRequestsMade,
                $originalTracker->getRequestsMade(),
                "Original tracker should not be modified by reset()"
            );
            
            $this->assertNotEquals(
                $resetTracker->getRequestsMade(),
                $originalTracker->getRequestsMade(),
                "Reset tracker should have different requests_made than original"
            );
        });
    }

    /**
     * Test usage percentage calculation
     * @test
     */
    public function test_usage_percentage_calculation(): void
    {
        $this->forAll(
            Generator\choose(0, 100),    // Requests made
            Generator\choose(100, 200)   // Quota limit
        )->then(function ($requestsMade, $quotaLimit) {
            $tracker = new QuotaTracker(
                $requestsMade,
                $quotaLimit,
                now()->year,
                now()->month,
                now()
            );

            // Property: usage percentage should be (requests_made / quota_limit) * 100
            $expectedPercentage = round(($requestsMade / $quotaLimit) * 100, 2);
            $actualPercentage = $tracker->getUsagePercentage();
            
            $this->assertEquals(
                $expectedPercentage,
                $actualPercentage,
                "Usage percentage calculation incorrect"
            );

            // Property: usage percentage should be between 0 and 100
            $this->assertGreaterThanOrEqual(
                0,
                $actualPercentage,
                "Usage percentage should not be negative"
            );
            
            $this->assertLessThanOrEqual(
                100,
                $actualPercentage,
                "Usage percentage should not exceed 100"
            );
        });
    }

    /**
     * Test canMakeRequest property
     * @test
     */
    public function test_can_make_request_property(): void
    {
        $this->forAll(
            Generator\choose(0, 150),    // Requests made
            Generator\choose(100, 200)   // Quota limit
        )->then(function ($requestsMade, $quotaLimit) {
            $requestsMade = min($requestsMade, $quotaLimit + 50); // Allow some over-quota scenarios
            
            $tracker = new QuotaTracker(
                min($requestsMade, $quotaLimit), // Clamp to valid range for constructor
                $quotaLimit,
                now()->year,
                now()->month,
                now()
            );

            // Property: canMakeRequest() should be true when remaining quota > 0
            $canMake = $tracker->canMakeRequest();
            $remaining = $tracker->getRemainingQuota();
            
            if ($remaining > 0) {
                $this->assertTrue(
                    $canMake,
                    "canMakeRequest() should be true when remaining quota > 0"
                );
            } else {
                $this->assertFalse(
                    $canMake,
                    "canMakeRequest() should be false when remaining quota = 0"
                );
            }

            // Property: canMakeRequest() should be inverse of isExhausted()
            $this->assertEquals(
                !$tracker->isExhausted(),
                $canMake,
                "canMakeRequest() should be inverse of isExhausted()"
            );
        });
    }

    /**
     * Test toArray includes all necessary fields
     * @test
     */
    public function test_to_array_completeness(): void
    {
        $tracker = new QuotaTracker(50, 100, now()->year, now()->month, now());
        $array = $tracker->toArray();

        // Verify all expected fields are present
        $this->assertArrayHasKey('requests_made', $array);
        $this->assertArrayHasKey('quota_limit', $array);
        $this->assertArrayHasKey('remaining_quota', $array);
        $this->assertArrayHasKey('usage_percentage', $array);
        $this->assertArrayHasKey('year', $array);
        $this->assertArrayHasKey('month', $array);
        $this->assertArrayHasKey('last_reset_at', $array);
        $this->assertArrayHasKey('should_reset', $array);
        $this->assertArrayHasKey('is_exhausted', $array);

        // Verify values match
        $this->assertEquals(50, $array['requests_made']);
        $this->assertEquals(100, $array['quota_limit']);
        $this->assertEquals(50, $array['remaining_quota']);
        $this->assertEquals(50.0, $array['usage_percentage']);
        $this->assertFalse($array['is_exhausted']);
    }
}
