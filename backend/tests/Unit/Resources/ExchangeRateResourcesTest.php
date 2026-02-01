<?php

namespace Tests\Unit\Resources;

use App\Http\Resources\ExchangeRate\ExchangeRateHistoryResource;
use App\Http\Resources\ExchangeRate\ExchangeRateProviderResource;
use App\Http\Resources\ExchangeRate\ExchangeRateSettingResource;
use App\Http\Resources\ExchangeRate\QuotaStatusResource;
use App\Models\ApiQuotaTracking;
use App\Models\ExchangeRateHistory;
use App\Models\ExchangeRateProvider;
use App\Models\ExchangeRateSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class ExchangeRateResourcesTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function exchange_rate_setting_resource_formats_data_correctly()
    {
        $setting = ExchangeRateSetting::factory()->create([
            'mode' => 'manual',
            'manual_rate' => 15000.50,
            'current_rate' => 15000.50,
            'auto_update_enabled' => false,
        ]);

        $resource = new ExchangeRateSettingResource($setting);
        $request = Request::create('/test', 'GET');
        $data = $resource->toArray($request);

        $this->assertEquals($setting->uuid, $data['uuid']);
        $this->assertEquals($setting->uuid, $data['id']); // UUID exposed as 'id'
        $this->assertEquals('manual', $data['mode']);
        $this->assertTrue($data['is_manual_mode']);
        $this->assertFalse($data['is_auto_mode']);
        $this->assertEquals(15000.50, $data['manual_rate']);
        $this->assertFalse($data['auto_update_enabled']);
    }

    /** @test */
    public function exchange_rate_provider_resource_formats_quota_status()
    {
        $provider = ExchangeRateProvider::factory()->create([
            'name' => 'Test Provider',
            'monthly_quota' => 1000,
            'is_unlimited' => false,
            'warning_threshold' => 50,
            'critical_threshold' => 20,
        ]);

        $quota = ApiQuotaTracking::factory()->create([
            'provider_id' => $provider->id,
            'quota_limit' => 1000,
            'requests_made' => 950,
            'year' => now()->year,
            'month' => now()->month,
        ]);

        $provider->refresh();
        $resource = new ExchangeRateProviderResource($provider);
        $request = Request::create('/test', 'GET');
        $data = $resource->toArray($request);

        $this->assertEquals($provider->uuid, $data['uuid']);
        $this->assertEquals('Test Provider', $data['name']);
        $this->assertEquals(50, $data['quota_status']['remaining']);
        $this->assertEquals(950, $data['quota_status']['used']);
        $this->assertTrue($data['quota_status']['is_at_warning']);
        $this->assertFalse($data['quota_status']['is_exhausted']);
    }

    /** @test */
    public function exchange_rate_history_resource_formats_timestamps()
    {
        $provider = ExchangeRateProvider::factory()->create();
        
        $history = ExchangeRateHistory::factory()->create([
            'rate' => 15250.75,
            'source' => 'api',
            'event_type' => 'rate_change', // Use valid enum value
            'provider_id' => $provider->id,
        ]);

        $history->load('provider');
        $resource = new ExchangeRateHistoryResource($history);
        $request = Request::create('/test', 'GET');
        $data = $resource->toArray($request);

        $this->assertEquals($history->uuid, $data['uuid']);
        $this->assertEquals(15250.75, $data['rate']);
        $this->assertEquals('api', $data['source']);
        $this->assertEquals('rate_change', $data['event_type']);
        $this->assertNotNull($data['created_at']);
        $this->assertNotNull($data['created_at_human']);
        $this->assertNotNull($data['created_at_formatted']);
        $this->assertArrayHasKey('provider', $data);
    }

    /** @test */
    public function quota_status_resource_calculates_indicators_correctly()
    {
        $provider = ExchangeRateProvider::factory()->create([
            'warning_threshold' => 50,
            'critical_threshold' => 20,
        ]);

        // Test warning level
        $quota = ApiQuotaTracking::factory()->create([
            'provider_id' => $provider->id,
            'quota_limit' => 1000,
            'requests_made' => 960, // 40 remaining - warning level
            'year' => now()->year,
            'month' => now()->month,
        ]);

        $quota->load('provider');
        $resource = new QuotaStatusResource($quota);
        $request = Request::create('/test', 'GET');
        $data = $resource->toArray($request);

        $this->assertEquals(40, $data['remaining_quota']);
        $this->assertEquals('warning', $data['status']['level']);
        $this->assertEquals('orange', $data['status']['color']);
        $this->assertTrue($data['status']['is_at_warning']);
        $this->assertFalse($data['status']['is_at_critical']);
        $this->assertFalse($data['status']['is_exhausted']);
        $this->assertArrayHasKey('next_reset_date', $data['reset']);
    }

    /** @test */
    public function quota_status_resource_handles_critical_level()
    {
        $provider = ExchangeRateProvider::factory()->create([
            'warning_threshold' => 50,
            'critical_threshold' => 20,
        ]);

        $quota = ApiQuotaTracking::factory()->create([
            'provider_id' => $provider->id,
            'quota_limit' => 1000,
            'requests_made' => 990, // 10 remaining - critical level
            'year' => now()->year,
            'month' => now()->month,
        ]);

        $quota->load('provider');
        $resource = new QuotaStatusResource($quota);
        $request = Request::create('/test', 'GET');
        $data = $resource->toArray($request);

        $this->assertEquals(10, $data['remaining_quota']);
        $this->assertEquals('critical', $data['status']['level']);
        $this->assertEquals('red', $data['status']['color']);
        $this->assertTrue($data['status']['is_at_critical']);
        $this->assertFalse($data['status']['is_exhausted']);
    }

    /** @test */
    public function quota_status_resource_handles_exhausted_quota()
    {
        $provider = ExchangeRateProvider::factory()->create();

        $quota = ApiQuotaTracking::factory()->create([
            'provider_id' => $provider->id,
            'quota_limit' => 1000,
            'requests_made' => 1000, // 0 remaining - exhausted
            'year' => now()->year,
            'month' => now()->month,
        ]);

        $quota->load('provider');
        $resource = new QuotaStatusResource($quota);
        $request = Request::create('/test', 'GET');
        $data = $resource->toArray($request);

        $this->assertEquals(0, $data['remaining_quota']);
        $this->assertEquals('exhausted', $data['status']['level']);
        $this->assertEquals('gray', $data['status']['color']);
        $this->assertTrue($data['status']['is_exhausted']);
    }

    /** @test */
    public function resources_hide_internal_ids_by_default()
    {
        $setting = ExchangeRateSetting::factory()->create();
        $provider = ExchangeRateProvider::factory()->create([
            'code' => 'test_provider_' . uniqid(), // Ensure unique code
        ]);
        $history = ExchangeRateHistory::factory()->create();
        $quota = ApiQuotaTracking::factory()->create();

        $request = Request::create('/test', 'GET');

        $settingData = (new ExchangeRateSettingResource($setting))->toArray($request);
        $providerData = (new ExchangeRateProviderResource($provider))->toArray($request);
        $historyData = (new ExchangeRateHistoryResource($history))->toArray($request);
        $quotaData = (new QuotaStatusResource($quota))->toArray($request);

        // All should expose UUID as 'id'
        $this->assertEquals($setting->uuid, $settingData['id']);
        $this->assertEquals($provider->uuid, $providerData['id']);
        $this->assertEquals($history->uuid, $historyData['id']);
        $this->assertEquals($quota->uuid, $quotaData['id']);

        // Internal IDs should not be present without permission
        // The when() method with false condition should not include the key at all
        $this->assertFalse(array_key_exists('_internal_id', $settingData), 'Setting resource should not have _internal_id');
        $this->assertFalse(array_key_exists('_internal_id', $providerData), 'Provider resource should not have _internal_id');
        $this->assertFalse(array_key_exists('_internal_id', $historyData), 'History resource should not have _internal_id');
        $this->assertFalse(array_key_exists('_internal_id', $quotaData), 'Quota resource should not have _internal_id');
    }
}
