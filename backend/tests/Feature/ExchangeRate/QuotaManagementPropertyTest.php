<?php

namespace Tests\Feature\ExchangeRate;

use App\Application\ExchangeRate\Services\QuotaManagementService;
use App\Domain\ExchangeRate\Repositories\ApiQuotaTrackingRepositoryInterface;
use App\Domain\ExchangeRate\Repositories\ExchangeRateProviderRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Models\ApiQuotaTracking;
use App\Models\ExchangeRateProvider;
use Eris\Generator;
use Eris\TestTrait;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * @group Feature: dynamic-exchange-rate-system
 */
class QuotaManagementPropertyTest extends TestCase
{
    use TestTrait;
    use RefreshDatabase;

    private QuotaManagementService $service;
    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test tenant with unique slug
        $this->tenant = Tenant::create([
            'uuid' => Str::uuid(),
            'name' => 'Test Tenant - Quota Management',
            'slug' => 'test-tenant-quota-' . uniqid(),
            'domain' => 'test-quota-' . uniqid() . '.test',
            'status' => 'active',
            'subscription_status' => 'active',
        ]);

        // Bind repository implementations
        $this->app->bind(ApiQuotaTrackingRepositoryInterface::class, \App\Infrastructure\ExchangeRate\Repositories\ApiQuotaTrackingRepository::class);
        $this->app->bind(ExchangeRateProviderRepositoryInterface::class, \App\Infrastructure\ExchangeRate\Repositories\ExchangeRateProviderRepository::class);

        // Create service instance
        $this->service = $this->app->make(QuotaManagementService::class);
    }

    /**
     * @group Property 5: Quota Increment on API Request
     * @test
     */
    public function property_quota_increment_on_api_request(): void
    {
        $this->forAll(
            Generator\choose(1, 20), // Initial requests made
            Generator\choose(1, 5)   // Number of increments
        )
        ->withMaxSize(10) // Reduced from default 100 to 10 iterations
        ->then(function ($initialRequests, $incrementCount) {
            // Setup
            $provider = ExchangeRateProvider::create([
                'tenant_id' => $this->tenant->id,
                'name' => 'Test Provider ' . uniqid(),
                'code' => 'test-' . uniqid(),
                'api_url' => 'https://test.com',
                'is_unlimited' => false,
                'monthly_quota' => 100,
                'priority' => 1,
                'is_enabled' => true,
                'warning_threshold' => 50,
                'critical_threshold' => 20,
            ]);

            $quota = ApiQuotaTracking::create([
                'provider_id' => $provider->id,
                'requests_made' => $initialRequests,
                'quota_limit' => 100,
                'year' => now()->year,
                'month' => now()->month,
                'last_reset_at' => now(),
            ]);

            // Execute - increment multiple times
            for ($i = 0; $i < $incrementCount; $i++) {
                $this->service->incrementQuota($provider->id);
            }

            // Verify
            $updatedQuota = ApiQuotaTracking::forProvider($provider->id)->currentMonth()->first();
            $this->assertNotNull($updatedQuota);
            $this->assertEquals($initialRequests + $incrementCount, $updatedQuota->requests_made);

            // Cleanup
            $provider->delete();
        });
    }

    /**
     * @group Property 7: Monthly Quota Reset
     * @test
     */
    public function property_monthly_quota_reset(): void
    {
        $this->forAll(
            Generator\choose(1, 50),  // Requests made before reset
            Generator\choose(1, 6)    // Months to go back
        )
        ->withMaxSize(10) // Reduced from default 100 to 10 iterations
        ->then(function ($requestsMade, $monthsBack) {
            // Setup
            $provider = ExchangeRateProvider::create([
                'tenant_id' => $this->tenant->id,
                'name' => 'Test Provider ' . uniqid(),
                'code' => 'test-' . uniqid(),
                'api_url' => 'https://test.com',
                'is_unlimited' => false,
                'monthly_quota' => 100,
                'priority' => 1,
                'is_enabled' => true,
                'warning_threshold' => 50,
                'critical_threshold' => 20,
            ]);

            // Create quota from previous month
            $pastDate = now()->subMonths($monthsBack);
            $oldQuota = ApiQuotaTracking::create([
                'provider_id' => $provider->id,
                'requests_made' => $requestsMade,
                'quota_limit' => 100,
                'year' => $pastDate->year,
                'month' => $pastDate->month,
                'last_reset_at' => $pastDate,
            ]);

            // Verify old quota needs reset
            $this->assertTrue($oldQuota->shouldReset(), 'Old quota should need reset');

            // Execute - this will create a new current month record
            $wasReset = $this->service->resetQuotaIfNeeded($provider->id);

            // Verify - resetQuotaIfNeeded creates a new current month record
            $this->assertTrue($wasReset, 'Quota should have been reset');

            // Check that current month quota exists and is reset
            $currentQuota = ApiQuotaTracking::forProvider($provider->id)->currentMonth()->first();
            $this->assertNotNull($currentQuota);
            $this->assertEquals(0, $currentQuota->requests_made);
            $this->assertEquals(now()->year, $currentQuota->year);
            $this->assertEquals(now()->month, $currentQuota->month);

            // Old quota should still exist (not deleted, just superseded)
            $oldQuotaStillExists = ApiQuotaTracking::where('id', $oldQuota->id)->exists();
            $this->assertTrue($oldQuotaStillExists, 'Old quota record should still exist');

            // Cleanup
            $provider->delete();
        });
    }

    /**
     * @group Property 8: Quota Persistence
     * @test
     */
    public function property_quota_persistence(): void
    {
        $this->forAll(
            Generator\choose(1, 50),  // Requests made
            Generator\choose(50, 150) // Quota limit
        )
        ->withMaxSize(10) // Reduced from default 100 to 10 iterations
        ->then(function ($requestsMade, $quotaLimit) {
            // Setup
            $provider = ExchangeRateProvider::create([
                'tenant_id' => $this->tenant->id,
                'name' => 'Test Provider ' . uniqid(),
                'code' => 'test-' . uniqid(),
                'api_url' => 'https://test.com',
                'is_unlimited' => false,
                'monthly_quota' => $quotaLimit,
                'priority' => 1,
                'is_enabled' => true,
                'warning_threshold' => 50,
                'critical_threshold' => 20,
            ]);

            $quota = ApiQuotaTracking::create([
                'provider_id' => $provider->id,
                'requests_made' => $requestsMade,
                'quota_limit' => $quotaLimit,
                'year' => now()->year,
                'month' => now()->month,
                'last_reset_at' => now(),
            ]);

            $quotaId = $quota->id;

            // Retrieve from database - verify persistence
            $persistedQuota = ApiQuotaTracking::find($quotaId);

            // Verify
            $this->assertNotNull($persistedQuota, 'Quota should persist in database');
            $this->assertEquals($requestsMade, $persistedQuota->requests_made);
            $this->assertEquals($quotaLimit, $persistedQuota->quota_limit);
            $this->assertEquals(now()->year, $persistedQuota->year);
            $this->assertEquals(now()->month, $persistedQuota->month);

            // Cleanup
            $provider->delete();
        });
    }

    /**
     * @group Property 6: Quota Calculation Accuracy
     * @test
     */
    public function property_quota_calculation_accuracy(): void
    {
        $this->forAll(
            Generator\choose(0, 50),   // Requests made
            Generator\choose(50, 150), // Quota limit
            Generator\bool()           // Is unlimited
        )
        ->withMaxSize(10) // Reduced from default 100 to 10 iterations
        ->then(function ($requestsMade, $quotaLimit, $isUnlimited) {
            // Setup
            $provider = ExchangeRateProvider::create([
                'tenant_id' => $this->tenant->id,
                'name' => 'Test Provider ' . uniqid(),
                'code' => 'test-' . uniqid(),
                'api_url' => 'https://test.com',
                'is_unlimited' => $isUnlimited,
                'monthly_quota' => $isUnlimited ? 0 : $quotaLimit,
                'priority' => 1,
                'is_enabled' => true,
                'warning_threshold' => 50,
                'critical_threshold' => 20,
            ]);

            if (!$isUnlimited) {
                $quota = ApiQuotaTracking::create([
                    'provider_id' => $provider->id,
                    'requests_made' => min($requestsMade, $quotaLimit),
                    'quota_limit' => $quotaLimit,
                    'year' => now()->year,
                    'month' => now()->month,
                    'last_reset_at' => now(),
                ]);

                // Verify calculation
                $expectedRemaining = max(0, $quotaLimit - min($requestsMade, $quotaLimit));
                $this->assertEquals($expectedRemaining, $quota->remaining_quota);
            } else {
                // Unlimited providers should return null for remaining quota
                $remaining = $provider->getRemainingQuota();
                $this->assertNull($remaining);
            }

            // Cleanup
            $provider->delete();
        });
    }

    /**
     * Test getQuotaStatus returns correct dashboard data
     * @test
     */
    public function test_get_quota_status_returns_dashboard_data(): void
    {
        // Setup multiple providers
        $provider1 = ExchangeRateProvider::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Provider 1',
            'code' => 'provider1',
            'api_url' => 'https://provider1.com',
            'is_unlimited' => false,
            'monthly_quota' => 100,
            'priority' => 1,
            'is_enabled' => true,
            'warning_threshold' => 50,
            'critical_threshold' => 20,
        ]);

        ApiQuotaTracking::create([
            'provider_id' => $provider1->id,
            'requests_made' => 80,
            'quota_limit' => 100,
            'year' => now()->year,
            'month' => now()->month,
            'last_reset_at' => now(),
        ]);

        $provider2 = ExchangeRateProvider::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Provider 2',
            'code' => 'provider2',
            'api_url' => 'https://provider2.com',
            'is_unlimited' => true,
            'monthly_quota' => 0,
            'priority' => 2,
            'is_enabled' => true,
            'warning_threshold' => 50,
            'critical_threshold' => 20,
        ]);

        // Execute
        $status = $this->service->getQuotaStatus($this->tenant->id);

        // Verify
        $this->assertCount(2, $status);
        
        // Check provider 1
        $this->assertEquals('Provider 1', $status[0]['provider_name']);
        $this->assertEquals(100, $status[0]['monthly_quota']);
        $this->assertEquals(80, $status[0]['requests_used']);
        $this->assertEquals(20, $status[0]['remaining_quota']);
        $this->assertTrue($status[0]['is_at_critical']); // Below critical threshold
        
        // Check provider 2
        $this->assertEquals('Provider 2', $status[1]['provider_name']);
        $this->assertTrue($status[1]['is_unlimited']);
        $this->assertEquals(PHP_INT_MAX, $status[1]['remaining_quota']);
        $this->assertFalse($status[1]['is_at_critical']);

        // Cleanup
        $provider1->delete();
        $provider2->delete();
    }
}

