<?php

namespace Tests\Unit\Application\TenantConfiguration;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Application\TenantConfiguration\Services\UrlAccessAnalyticsService;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantUrlConfigurationEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UrlAccessAnalyticEloquentModel;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class UrlAccessAnalyticsServiceTest extends TestCase
{
    use RefreshDatabase;

    private UrlAccessAnalyticsService $service;
    private TenantEloquentModel $tenant;
    private TenantUrlConfigurationEloquentModel $urlConfig;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(UrlAccessAnalyticsService::class);

        $this->tenant = TenantEloquentModel::factory()->create();
        
        $this->urlConfig = TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'is_primary' => true,
            'subdomain' => 'test-tenant',
        ]);
    }

    public function test_can_track_url_access(): void
    {
        $data = [
            'tenant_uuid' => $this->tenant->uuid,
            'url_config_uuid' => $this->urlConfig->uuid,
            'accessed_url' => 'https://test-tenant.stencil.canvastack.com/products',
            'url_pattern_used' => 'subdomain',
            'ip_address' => '192.168.1.100',
            'user_agent' => 'Mozilla/5.0',
            'referrer' => 'https://google.com',
            'http_status_code' => 200,
            'response_time_ms' => 45,
        ];

        $this->service->trackAccess($data);

        $this->assertDatabaseHas('url_access_analytics', [
            'tenant_id' => $this->tenant->id,
            'url_pattern_used' => 'subdomain',
            'http_status_code' => 200,
        ]);
    }

    public function test_track_access_handles_missing_tenant_gracefully(): void
    {
        $data = [
            'tenant_uuid' => '00000000-0000-0000-0000-000000000000',
            'accessed_url' => 'https://test.com',
            'url_pattern_used' => 'subdomain',
        ];

        $this->service->trackAccess($data);

        $this->assertDatabaseCount('url_access_analytics', 0);
    }

    public function test_can_get_access_overview(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(10)->create([
            'tenant_id' => $this->tenant->id,
            'http_status_code' => 200,
        ]);

        UrlAccessAnalyticEloquentModel::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'http_status_code' => 404,
        ]);

        $overview = $this->service->getAccessOverview($this->tenant->uuid, '30days');

        $this->assertEquals(12, $overview['total_access']);
        $this->assertEquals(10, $overview['successful_access']);
        $this->assertEquals(2, $overview['failed_access']);
        $this->assertEquals(83.33, $overview['success_rate']);
    }

    public function test_access_overview_returns_empty_for_non_existent_tenant(): void
    {
        $overview = $this->service->getAccessOverview('00000000-0000-0000-0000-000000000000', '30days');

        $this->assertEquals(0, $overview['total_access']);
        $this->assertEquals(0, $overview['unique_visitors']);
    }

    public function test_can_get_access_trends_by_day(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'accessed_at' => now()->subDays(1),
        ]);

        UrlAccessAnalyticEloquentModel::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'accessed_at' => now(),
        ]);

        $trends = $this->service->getAccessTrends($this->tenant->uuid, '7days', 'day');

        $this->assertIsArray($trends);
        $this->assertGreaterThan(0, count($trends));
    }

    public function test_can_get_geographic_distribution(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'country_code' => 'ID',
            'city' => 'Jakarta',
        ]);

        UrlAccessAnalyticEloquentModel::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'country_code' => 'US',
            'city' => 'New York',
        ]);

        $distribution = $this->service->getGeographicDistribution($this->tenant->uuid, '30days');

        $this->assertArrayHasKey('by_country', $distribution);
        $this->assertArrayHasKey('by_city', $distribution);
        $this->assertCount(2, $distribution['by_country']);
    }

    public function test_can_get_url_config_performance(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(10)->create([
            'tenant_id' => $this->tenant->id,
            'url_config_id' => $this->urlConfig->id,
            'http_status_code' => 200,
            'response_time_ms' => 50,
        ]);

        UrlAccessAnalyticEloquentModel::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'url_config_id' => $this->urlConfig->id,
            'http_status_code' => 500,
            'response_time_ms' => 150,
        ]);

        $performance = $this->service->getUrlConfigPerformance($this->tenant->uuid, '30days');

        $this->assertCount(1, $performance);
        $this->assertEquals($this->urlConfig->uuid, $performance[0]['url_config_uuid']);
        $this->assertEquals(12, $performance[0]['access_count']);
        $this->assertEquals(83.33, $performance[0]['success_rate']);
    }

    public function test_can_get_top_referrers(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(10)->create([
            'tenant_id' => $this->tenant->id,
            'referrer' => 'https://google.com',
        ]);

        UrlAccessAnalyticEloquentModel::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'referrer' => 'https://facebook.com',
        ]);

        $referrers = $this->service->getTopReferrers($this->tenant->uuid, '30days', 10);

        $this->assertCount(2, $referrers);
        $this->assertEquals('https://google.com', $referrers[0]['referrer']);
        $this->assertEquals(10, $referrers[0]['access_count']);
    }

    public function test_can_get_device_stats(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(10)->create([
            'tenant_id' => $this->tenant->id,
            'user_agent' => 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        ]);

        UrlAccessAnalyticEloquentModel::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ]);

        $deviceStats = $this->service->getDeviceStats($this->tenant->uuid, '30days');

        $this->assertEquals(15, $deviceStats['total_analyzed']);
        $this->assertArrayHasKey('device_distribution', $deviceStats);
        $this->assertArrayHasKey('device_percentages', $deviceStats);
    }

    public function test_geo_location_handles_localhost_ip(): void
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getGeoLocation');
        $method->setAccessible(true);

        $result = $method->invoke($this->service, '127.0.0.1');

        $this->assertEquals('LOCAL', $result['country_code']);
        $this->assertEquals('localhost', $result['city']);
    }

    public function test_geo_location_caches_results(): void
    {
        Http::fake([
            'ip-api.com/*' => Http::response([
                'status' => 'success',
                'countryCode' => 'ID',
                'city' => 'Jakarta',
            ], 200),
        ]);

        Cache::shouldReceive('remember')
            ->once()
            ->andReturn(['country_code' => 'ID', 'city' => 'Jakarta']);

        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('getGeoLocation');
        $method->setAccessible(true);

        $result = $method->invoke($this->service, '103.28.152.1');

        $this->assertEquals('ID', $result['country_code']);
    }

    public function test_detect_device_type_identifies_mobile(): void
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('detectDeviceType');
        $method->setAccessible(true);

        $userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
        $result = $method->invoke($this->service, $userAgent);

        $this->assertEquals('mobile', $result);
    }

    public function test_detect_device_type_identifies_desktop(): void
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('detectDeviceType');
        $method->setAccessible(true);

        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
        $result = $method->invoke($this->service, $userAgent);

        $this->assertEquals('desktop', $result);
    }

    public function test_detect_device_type_identifies_tablet(): void
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('detectDeviceType');
        $method->setAccessible(true);

        $userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';
        $result = $method->invoke($this->service, $userAgent);

        $this->assertEquals('tablet', $result);
    }

    public function test_detect_device_type_identifies_bot(): void
    {
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('detectDeviceType');
        $method->setAccessible(true);

        $userAgent = 'Googlebot/2.1';
        $result = $method->invoke($this->service, $userAgent);

        $this->assertEquals('bot', $result);
    }

    public function test_caching_improves_performance_for_overview(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(100)->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $startTime1 = microtime(true);
        $overview1 = $this->service->getAccessOverview($this->tenant->uuid, '30days');
        $duration1 = microtime(true) - $startTime1;

        $startTime2 = microtime(true);
        $overview2 = $this->service->getAccessOverview($this->tenant->uuid, '30days');
        $duration2 = microtime(true) - $startTime2;

        $this->assertEquals($overview1, $overview2);
        $this->assertLessThan($duration1, $duration2);
    }

    public function test_caching_improves_performance_for_url_config_performance(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(100)->create([
            'tenant_id' => $this->tenant->id,
            'url_config_id' => $this->urlConfig->id,
        ]);

        $startTime1 = microtime(true);
        $perf1 = $this->service->getUrlConfigPerformance($this->tenant->uuid, '30days');
        $duration1 = microtime(true) - $startTime1;

        $startTime2 = microtime(true);
        $perf2 = $this->service->getUrlConfigPerformance($this->tenant->uuid, '30days');
        $duration2 = microtime(true) - $startTime2;

        $this->assertEquals($perf1, $perf2);
        $this->assertLessThan($duration1, $duration2);
    }

    public function test_access_trends_groups_by_hour(): void
    {
        for ($i = 0; $i < 3; $i++) {
            UrlAccessAnalyticEloquentModel::factory()->create([
                'tenant_id' => $this->tenant->id,
                'accessed_at' => now()->subHours($i),
            ]);
        }

        $trends = $this->service->getAccessTrends($this->tenant->uuid, 'today', 'hour');

        $this->assertIsArray($trends);
    }

    public function test_access_trends_groups_by_week(): void
    {
        for ($i = 0; $i < 3; $i++) {
            UrlAccessAnalyticEloquentModel::factory()->create([
                'tenant_id' => $this->tenant->id,
                'accessed_at' => now()->subWeeks($i),
            ]);
        }

        $trends = $this->service->getAccessTrends($this->tenant->uuid, '90days', 'week');

        $this->assertIsArray($trends);
    }

    public function test_access_trends_groups_by_month(): void
    {
        for ($i = 0; $i < 3; $i++) {
            UrlAccessAnalyticEloquentModel::factory()->create([
                'tenant_id' => $this->tenant->id,
                'accessed_at' => now()->subMonths($i),
            ]);
        }

        $trends = $this->service->getAccessTrends($this->tenant->uuid, '1year', 'month');

        $this->assertIsArray($trends);
    }

    public function test_geographic_distribution_limits_countries_to_20(): void
    {
        $countryCodes = ['ID', 'US', 'SG', 'MY', 'TH', 'PH', 'VN', 'JP', 'KR', 'CN', 'IN', 'AU', 'GB', 'DE', 'FR', 'CA', 'BR', 'MX', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI'];
        
        for ($i = 0; $i < 25; $i++) {
            UrlAccessAnalyticEloquentModel::factory()->create([
                'tenant_id' => $this->tenant->id,
                'country_code' => $countryCodes[$i],
            ]);
        }

        $distribution = $this->service->getGeographicDistribution($this->tenant->uuid, '30days');

        $this->assertLessThanOrEqual(20, count($distribution['by_country']));
    }

    public function test_geographic_distribution_limits_cities_to_10(): void
    {
        for ($i = 0; $i < 15; $i++) {
            UrlAccessAnalyticEloquentModel::factory()->create([
                'tenant_id' => $this->tenant->id,
                'city' => 'City' . $i,
            ]);
        }

        $distribution = $this->service->getGeographicDistribution($this->tenant->uuid, '30days');

        $this->assertLessThanOrEqual(10, count($distribution['by_city']));
    }
}
