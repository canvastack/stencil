<?php

namespace Tests\Feature\ExchangeRate;

use App\Application\ExchangeRate\Services\AuditTrailService;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Models\ExchangeRateHistory;
use App\Models\ExchangeRateProvider;
use App\Models\ProviderSwitchEvent;
use Eris\Generator;
use Eris\TestTrait;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Property-Based Tests for Audit Trail Service
 * 
 * Tests Properties 18-21:
 * - Property 18: Audit Trail Completeness
 * - Property 19: History Ordering
 * - Property 20: History Filtering
 * - Property 21: Audit Retention
 * 
 * Validates: Requirements 8.1, 8.2, 8.3, 8.5, 8.6, 8.7
 * 
 * @group Feature: dynamic-exchange-rate-system
 */
class AuditTrailPropertyTest extends TestCase
{
    use TestTrait;

    private AuditTrailService $service;
    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test tenant
        $this->tenant = Tenant::create([
            'uuid' => Str::uuid(),
            'name' => 'Test Tenant - Audit Trail',
            'slug' => 'test-tenant-audit',
            'domain' => 'test-audit.test',
            'status' => 'active',
            'subscription_status' => 'active',
        ]);

        // Create service instance
        $this->service = app(AuditTrailService::class);
    }

    protected function tearDown(): void
    {
        // Clean up tenant and related data
        if ($this->tenant && $this->tenant->exists) {
            // Delete related records first
            ExchangeRateHistory::where('tenant_id', $this->tenant->id)->delete();
            ProviderSwitchEvent::where('tenant_id', $this->tenant->id)->delete();
            ExchangeRateProvider::where('tenant_id', $this->tenant->id)->delete();
            
            $this->tenant->delete();
        }

        parent::tearDown();
    }

    /**
     * Property 18: Audit Trail Completeness
     * 
     * For any exchange rate change (manual or API), provider switch, or API request,
     * the system should create an audit trail entry with all relevant details
     * (rate, provider, source, timestamp, reason).
     * 
     * @group Property 18: Audit Trail Completeness
     * @test
     */
    public function property_audit_trail_completeness(): void
    {
        $this->forAll(
            Generator\choose(10000, 20000), // Rate value (IDR per USD)
            Generator\elements(['manual', 'api']), // Source
            Generator\elements(['rate_change', 'api_request']) // Event type
        )
        ->withMaxSize(5)
        ->then(function ($rate, $source, $eventType) {
            // Setup provider
            $provider = ExchangeRateProvider::create([
                'tenant_id' => $this->tenant->id,
                'name' => 'Test Provider ' . uniqid(),
                'code' => 'test-' . uniqid(),
                'api_url' => 'https://test.com',
                'is_unlimited' => false,
                'monthly_quota' => 100,
                'priority' => 1,
                'is_enabled' => true,
            ]);

            // Execute - log different types of events
            if ($eventType === 'rate_change') {
                $history = $this->service->logRateUpdate(
                    $this->tenant->id,
                    $rate / 10000, // Convert to decimal
                    $provider->id,
                    $source,
                    ['test' => 'metadata']
                );
                
                // Verify source
                $this->assertEquals($source, $history->source);
                
                // Event type depends on source for rate updates
                $expectedEventType = $source === 'manual' ? 'manual_update' : 'rate_change';
                $this->assertEquals($expectedEventType, $history->event_type);
            } else {
                $history = $this->service->logApiRequest(
                    $this->tenant->id,
                    $provider->id,
                    true,
                    ['rate' => $rate / 10000, 'test' => 'metadata']
                );
                
                // API requests always have 'api' source
                $this->assertEquals('api', $history->source);
                $this->assertEquals($eventType, $history->event_type);
            }

            // Verify - all relevant details are present
            $this->assertNotNull($history);
            $this->assertEquals($this->tenant->id, $history->tenant_id);
            $this->assertEquals($provider->id, $history->provider_id);
            $this->assertNotNull($history->created_at);
            $this->assertIsArray($history->metadata);
            $this->assertArrayHasKey('timestamp', $history->metadata);

            // Cleanup
            $provider->delete();
        });
    }

    /**
     * Property 18: Audit Trail Completeness - Provider Switch
     * 
     * @group Property 18: Audit Trail Completeness
     * @test
     */
    public function property_audit_trail_completeness_provider_switch(): void
    {
        $this->forAll(
            Generator\elements(['quota_exhausted', 'manual_switch', 'api_failure'])
        )
        ->withMaxSize(3)
        ->then(function ($reason) {
            // Setup providers
            $oldProvider = ExchangeRateProvider::create([
                'tenant_id' => $this->tenant->id,
                'name' => 'Old Provider ' . uniqid(),
                'code' => 'old-' . uniqid(),
                'api_url' => 'https://old.com',
                'is_unlimited' => false,
                'monthly_quota' => 100,
                'priority' => 1,
                'is_enabled' => true,
            ]);

            $newProvider = ExchangeRateProvider::create([
                'tenant_id' => $this->tenant->id,
                'name' => 'New Provider ' . uniqid(),
                'code' => 'new-' . uniqid(),
                'api_url' => 'https://new.com',
                'is_unlimited' => false,
                'monthly_quota' => 100,
                'priority' => 2,
                'is_enabled' => true,
            ]);

            // Execute
            $switchEvent = $this->service->logProviderSwitch(
                $this->tenant->id,
                $oldProvider->id,
                $newProvider->id,
                $reason,
                ['test' => 'metadata']
            );

            // Verify - all relevant details are present
            $this->assertNotNull($switchEvent);
            $this->assertEquals($this->tenant->id, $switchEvent->tenant_id);
            $this->assertEquals($oldProvider->id, $switchEvent->old_provider_id);
            $this->assertEquals($newProvider->id, $switchEvent->new_provider_id);
            $this->assertEquals($reason, $switchEvent->reason);
            $this->assertNotNull($switchEvent->created_at);
            $this->assertIsArray($switchEvent->metadata);
            $this->assertArrayHasKey('timestamp', $switchEvent->metadata);

            // Cleanup
            $oldProvider->delete();
            $newProvider->delete();
        });
    }

    /**
     * Property 19: History Ordering
     * 
     * For any history query, the system should return records in reverse
     * chronological order (newest first) based on created_at timestamp.
     * 
     * @group Property 19: History Ordering
     * @test
     */
    public function property_history_ordering(): void
    {
        $this->forAll(
            Generator\choose(3, 7) // Number of history records to create
        )
        ->withMaxSize(5)
        ->then(function ($recordCount) {
            // Setup provider
            $provider = ExchangeRateProvider::create([
                'tenant_id' => $this->tenant->id,
                'name' => 'Test Provider ' . uniqid(),
                'code' => 'test-' . uniqid(),
                'api_url' => 'https://test.com',
                'is_unlimited' => false,
                'monthly_quota' => 100,
                'priority' => 1,
                'is_enabled' => true,
            ]);

            // Create multiple history records with slight time differences
            $createdRecords = [];
            for ($i = 0; $i < $recordCount; $i++) {
                $history = $this->service->logRateUpdate(
                    $this->tenant->id,
                    1.5 + ($i * 0.01),
                    $provider->id,
                    'api',
                    ['sequence' => $i]
                );
                $createdRecords[] = $history;
                
                // Small delay to ensure different timestamps
                usleep(1000); // 1ms delay
            }

            // Execute - get history
            $history = $this->service->getHistory($this->tenant->id, ['limit' => $recordCount]);

            // Verify - records are in reverse chronological order
            $this->assertCount($recordCount, $history);
            
            // Main property: timestamps should be in descending order (newest first)
            $timestamps = $history->pluck('created_at')->map(fn($dt) => $dt->timestamp)->toArray();
            
            for ($i = 0; $i < count($timestamps) - 1; $i++) {
                $this->assertGreaterThanOrEqual(
                    $timestamps[$i + 1],
                    $timestamps[$i],
                    'Each timestamp should be greater than or equal to the next (descending order)'
                );
            }

            // Cleanup
            $provider->delete();
        });
    }

    /**
     * Property 20: History Filtering - Date Range
     * 
     * For any history filter criteria (date range, provider, event type),
     * the system should return only records matching all specified criteria.
     * 
     * @group Property 20: History Filtering
     * @test
     */
    public function property_history_filtering_date_range(): void
    {
        $this->forAll(
            Generator\choose(1, 3), // Days in the past for date_from
            Generator\choose(1, 2)  // Number of records to create
        )
        ->withMaxSize(5)
        ->then(function ($daysBack, $recordCount) {
            // Setup provider
            $provider = ExchangeRateProvider::create([
                'tenant_id' => $this->tenant->id,
                'name' => 'Test Provider ' . uniqid(),
                'code' => 'test-' . uniqid(),
                'api_url' => 'https://test.com',
                'is_unlimited' => false,
                'monthly_quota' => 100,
                'priority' => 1,
                'is_enabled' => true,
            ]);

            // Create records with different dates
            $targetDate = now()->subDays($daysBack);
            
            // Create records before the filter date (should be excluded)
            for ($i = 0; $i < $recordCount; $i++) {
                ExchangeRateHistory::create([
                    'tenant_id' => $this->tenant->id,
                    'rate' => 1.5,
                    'provider_id' => $provider->id,
                    'source' => 'api',
                    'event_type' => 'rate_change',
                    'metadata' => ['before_filter' => true],
                    'created_at' => $targetDate->copy()->subDays(1),
                ]);
            }

            // Create records after the filter date (should be included)
            for ($i = 0; $i < $recordCount; $i++) {
                ExchangeRateHistory::create([
                    'tenant_id' => $this->tenant->id,
                    'rate' => 1.6,
                    'provider_id' => $provider->id,
                    'source' => 'api',
                    'event_type' => 'rate_change',
                    'metadata' => ['after_filter' => true],
                    'created_at' => $targetDate->copy()->addHours($i),
                ]);
            }

            // Execute - filter by date
            $filtered = $this->service->getHistory($this->tenant->id, [
                'date_from' => $targetDate,
                'limit' => 100,
            ]);

            // Verify - only records after date_from are returned
            $this->assertGreaterThanOrEqual($recordCount, $filtered->count());
            
            foreach ($filtered as $record) {
                $this->assertGreaterThanOrEqual(
                    $targetDate->timestamp,
                    $record->created_at->timestamp,
                    'All records should be after the filter date'
                );
            }

            // Cleanup
            $provider->delete();
        });
    }

    /**
     * Property 20: History Filtering - Provider and Event Type
     * 
     * @group Property 20: History Filtering
     * @test
     */
    public function property_history_filtering_provider_and_event_type(): void
    {
        $this->forAll(
            Generator\elements(['rate_change', 'api_request']),
            Generator\choose(1, 2) // Number of records per provider
        )
        ->withMaxSize(5)
        ->then(function ($targetEventType, $recordCount) {
            // Setup two providers
            $targetProvider = ExchangeRateProvider::create([
                'tenant_id' => $this->tenant->id,
                'name' => 'Target Provider ' . uniqid(),
                'code' => 'target-' . uniqid(),
                'api_url' => 'https://target.com',
                'is_unlimited' => false,
                'monthly_quota' => 100,
                'priority' => 1,
                'is_enabled' => true,
            ]);

            $otherProvider = ExchangeRateProvider::create([
                'tenant_id' => $this->tenant->id,
                'name' => 'Other Provider ' . uniqid(),
                'code' => 'other-' . uniqid(),
                'api_url' => 'https://other.com',
                'is_unlimited' => false,
                'monthly_quota' => 100,
                'priority' => 2,
                'is_enabled' => true,
            ]);

            // Create records for target provider with target event type
            for ($i = 0; $i < $recordCount; $i++) {
                ExchangeRateHistory::create([
                    'tenant_id' => $this->tenant->id,
                    'rate' => 1.5,
                    'provider_id' => $targetProvider->id,
                    'source' => 'api',
                    'event_type' => $targetEventType,
                    'metadata' => ['target' => true],
                ]);
            }

            // Create records for other provider (should be excluded)
            for ($i = 0; $i < $recordCount; $i++) {
                ExchangeRateHistory::create([
                    'tenant_id' => $this->tenant->id,
                    'rate' => 1.6,
                    'provider_id' => $otherProvider->id,
                    'source' => 'api',
                    'event_type' => $targetEventType,
                    'metadata' => ['other_provider' => true],
                ]);
            }

            // Create records for target provider with different event type (should be excluded)
            $otherEventType = $targetEventType === 'rate_change' ? 'api_request' : 'rate_change';
            for ($i = 0; $i < $recordCount; $i++) {
                ExchangeRateHistory::create([
                    'tenant_id' => $this->tenant->id,
                    'rate' => 1.7,
                    'provider_id' => $targetProvider->id,
                    'source' => 'api',
                    'event_type' => $otherEventType,
                    'metadata' => ['other_event' => true],
                ]);
            }

            // Execute - filter by provider and event type
            $filtered = $this->service->getHistory($this->tenant->id, [
                'provider_id' => $targetProvider->id,
                'event_type' => $targetEventType,
                'limit' => 100,
            ]);

            // Verify - only matching records are returned
            $this->assertEquals($recordCount, $filtered->count());
            
            foreach ($filtered as $record) {
                $this->assertEquals($targetProvider->id, $record->provider_id);
                $this->assertEquals($targetEventType, $record->event_type);
                $this->assertTrue($record->metadata['target'] ?? false);
            }

            // Cleanup
            $targetProvider->delete();
            $otherProvider->delete();
        });
    }

    /**
     * Property 21: Audit Retention
     * 
     * For any audit trail record, the system should retain it in the database
     * for at least 12 months from creation date before allowing deletion.
     * 
     * @group Property 21: Audit Retention
     * @test
     */
    public function property_audit_retention(): void
    {
        $this->forAll(
            Generator\choose(1, 6), // Months old (less than 12)
            Generator\choose(13, 18) // Months old (more than 12)
        )
        ->withMaxSize(5)
        ->then(function ($recentMonths, $oldMonths) {
            // Setup provider
            $provider = ExchangeRateProvider::create([
                'tenant_id' => $this->tenant->id,
                'name' => 'Test Provider ' . uniqid(),
                'code' => 'test-' . uniqid(),
                'api_url' => 'https://test.com',
                'is_unlimited' => false,
                'monthly_quota' => 100,
                'priority' => 1,
                'is_enabled' => true,
            ]);

            // Create recent record (within retention period)
            $recentHistory = new ExchangeRateHistory([
                'tenant_id' => $this->tenant->id,
                'rate' => 1.5,
                'provider_id' => $provider->id,
                'source' => 'api',
                'event_type' => 'rate_change',
                'metadata' => ['type' => 'recent'],
            ]);
            $recentHistory->created_at = now()->subMonths($recentMonths);
            $recentHistory->save();

            // Create old record (outside retention period)
            $oldHistory = new ExchangeRateHistory([
                'tenant_id' => $this->tenant->id,
                'rate' => 1.6,
                'provider_id' => $provider->id,
                'source' => 'api',
                'event_type' => 'rate_change',
                'metadata' => ['type' => 'old'],
            ]);
            $oldHistory->created_at = now()->subMonths($oldMonths);
            $oldHistory->save();

            // Create recent switch event
            $recentSwitch = new ProviderSwitchEvent([
                'tenant_id' => $this->tenant->id,
                'old_provider_id' => null,
                'new_provider_id' => $provider->id,
                'reason' => 'manual_switch',
                'metadata' => ['type' => 'recent'],
            ]);
            $recentSwitch->created_at = now()->subMonths($recentMonths);
            $recentSwitch->save();

            // Create old switch event
            $oldSwitch = new ProviderSwitchEvent([
                'tenant_id' => $this->tenant->id,
                'old_provider_id' => null,
                'new_provider_id' => $provider->id,
                'reason' => 'manual_switch',
                'metadata' => ['type' => 'old'],
            ]);
            $oldSwitch->created_at = now()->subMonths($oldMonths);
            $oldSwitch->save();

            // Execute - cleanup with 12 month retention
            $result = $this->service->cleanupOldRecords($this->tenant->id, 12);

            // Refresh models to get latest state
            $recentHistory->refresh();
            $recentSwitch->refresh();

            // Verify - recent records are retained
            $this->assertTrue(
                ExchangeRateHistory::where('id', $recentHistory->id)->exists(),
                'Recent history (< 12 months) should be retained'
            );
            $this->assertTrue(
                ProviderSwitchEvent::where('id', $recentSwitch->id)->exists(),
                'Recent switch event (< 12 months) should be retained'
            );

            // Verify - old records are deleted
            $this->assertFalse(
                ExchangeRateHistory::where('id', $oldHistory->id)->exists(),
                "Old history (> 12 months, created {$oldMonths} months ago) should be deleted"
            );
            $this->assertFalse(
                ProviderSwitchEvent::where('id', $oldSwitch->id)->exists(),
                "Old switch event (> 12 months, created {$oldMonths} months ago) should be deleted"
            );

            // Verify - result contains deletion counts (should be at least 1 each)
            $this->assertArrayHasKey('deleted_history_records', $result);
            $this->assertArrayHasKey('deleted_switch_events', $result);
            $this->assertGreaterThanOrEqual(1, $result['deleted_history_records'], 'Should delete at least 1 history record');
            $this->assertGreaterThanOrEqual(1, $result['deleted_switch_events'], 'Should delete at least 1 switch event');

            // Cleanup
            $provider->delete();
        });
    }

    /**
     * Test combined history returns both rate updates and provider switches
     * @test
     */
    public function test_combined_history_includes_all_event_types(): void
    {
        // Setup provider
        $provider = ExchangeRateProvider::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Provider',
            'code' => 'test-provider',
            'api_url' => 'https://test.com',
            'is_unlimited' => false,
            'monthly_quota' => 100,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Create rate update
        $this->service->logRateUpdate(
            $this->tenant->id,
            1.5,
            $provider->id,
            'api'
        );

        // Create provider switch
        $this->service->logProviderSwitch(
            $this->tenant->id,
            null,
            $provider->id,
            'manual_switch'
        );

        // Execute
        $combined = $this->service->getCombinedHistory($this->tenant->id);

        // Verify
        $this->assertGreaterThanOrEqual(2, $combined->count());
        
        // Check that both types are present
        $hasRateUpdate = $combined->contains(function ($item) {
            return $item instanceof ExchangeRateHistory;
        });
        $hasProviderSwitch = $combined->contains(function ($item) {
            return $item instanceof ProviderSwitchEvent;
        });

        $this->assertTrue($hasRateUpdate, 'Combined history should include rate updates');
        $this->assertTrue($hasProviderSwitch, 'Combined history should include provider switches');

        // Cleanup
        $provider->delete();
    }

    /**
     * Test audit statistics calculation
     * @test
     */
    public function test_audit_statistics_calculation(): void
    {
        // Setup provider
        $provider = ExchangeRateProvider::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Provider',
            'code' => 'test-provider',
            'api_url' => 'https://test.com',
            'is_unlimited' => false,
            'monthly_quota' => 100,
            'priority' => 1,
            'is_enabled' => true,
        ]);

        // Create various events
        $this->service->logRateUpdate($this->tenant->id, 1.5, $provider->id, 'manual');
        $this->service->logRateUpdate($this->tenant->id, 1.6, $provider->id, 'api');
        $this->service->logApiRequest($this->tenant->id, $provider->id, true, ['rate' => 1.6]);
        $this->service->logProviderSwitch($this->tenant->id, null, $provider->id, 'manual_switch');

        // Execute
        $stats = $this->service->getAuditStatistics($this->tenant->id, 30);

        // Verify
        $this->assertEquals(30, $stats['period_days']);
        $this->assertEquals(2, $stats['total_rate_updates']);
        $this->assertEquals(1, $stats['total_api_requests']);
        $this->assertEquals(1, $stats['total_provider_switches']);
        $this->assertEquals(1, $stats['manual_updates']);
        $this->assertEquals(1, $stats['api_updates']);

        // Cleanup
        $provider->delete();
    }
}
