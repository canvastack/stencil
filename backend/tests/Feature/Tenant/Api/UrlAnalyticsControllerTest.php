<?php

namespace Tests\Feature\Tenant\Api;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantUrlConfigurationEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UrlAccessAnalyticEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;

class UrlAnalyticsControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private TenantEloquentModel $tenant;
    private TenantUrlConfigurationEloquentModel $urlConfig;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = TenantEloquentModel::factory()->create();

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        setPermissionsTeamId($this->tenant->id);

        Permission::firstOrCreate([
            'name' => 'settings.analytics.view',
            'guard_name' => 'api',
        ]);

        $this->user->givePermissionTo('settings.analytics.view');

        $this->urlConfig = TenantUrlConfigurationEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_pattern' => 'subdomain',
            'subdomain' => 'test-analytics',
            'is_primary' => true,
        ]);

        Sanctum::actingAs($this->user);
    }

    public function test_can_get_analytics_overview(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(10)->create([
            'tenant_id' => $this->tenant->id,
            'http_status_code' => 200,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/overview');

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'period',
                'start_date',
                'end_date',
                'total_access',
                'unique_visitors',
                'successful_access',
                'failed_access',
                'success_rate',
                'average_response_time_ms',
                'access_by_pattern',
            ],
        ]);
        
        $this->assertEquals(10, $response->json('data.total_access'));
    }

    public function test_can_get_analytics_overview_with_custom_period(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'accessed_at' => now()->subDays(5),
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/overview?period=7days');

        $response->assertOk();
        $this->assertEquals('7days', $response->json('data.period'));
    }

    public function test_overview_requires_valid_period(): void
    {
        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/overview?period=invalid');

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['period']);
    }

    public function test_can_get_access_trends(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(10)->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/trends');

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'period',
                'group_by',
                'trends',
            ],
        ]);
    }

    public function test_can_get_trends_grouped_by_hour(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'accessed_at' => now(),
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/trends?group_by=hour');

        $response->assertOk();
        $this->assertEquals('hour', $response->json('data.group_by'));
    }

    public function test_trends_requires_valid_group_by(): void
    {
        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/trends?group_by=invalid');

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['group_by']);
    }

    public function test_can_get_geographic_distribution(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'country_code' => 'ID',
            'city' => 'Jakarta',
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/geographic');

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'period',
                'distribution' => [
                    'by_country',
                    'by_city',
                ],
            ],
        ]);
    }

    public function test_can_get_url_config_performance(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(10)->create([
            'tenant_id' => $this->tenant->id,
            'url_config_id' => $this->urlConfig->id,
            'http_status_code' => 200,
            'response_time_ms' => 50,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/url-config-performance');

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'period',
                'configurations',
            ],
        ]);

        $configurations = $response->json('data.configurations');
        $this->assertCount(1, $configurations);
        $this->assertEquals($this->urlConfig->uuid, $configurations[0]['url_config_uuid']);
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

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/referrers');

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'period',
                'limit',
                'referrers',
            ],
        ]);

        $referrers = $response->json('data.referrers');
        $this->assertCount(2, $referrers);
        $this->assertEquals('https://google.com', $referrers[0]['referrer']);
    }

    public function test_can_get_referrers_with_custom_limit(): void
    {
        for ($i = 0; $i < 30; $i++) {
            UrlAccessAnalyticEloquentModel::factory()->create([
                'tenant_id' => $this->tenant->id,
                'referrer' => "https://referrer{$i}.com",
            ]);
        }

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/referrers?limit=10');

        $response->assertOk();
        $this->assertEquals(10, $response->json('data.limit'));
        $this->assertCount(10, $response->json('data.referrers'));
    }

    public function test_referrers_limit_must_be_between_1_and_100(): void
    {
        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/referrers?limit=150');

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['limit']);
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

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/devices');

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'period',
                'stats' => [
                    'total_analyzed',
                    'device_distribution',
                    'device_percentages',
                ],
            ],
        ]);

        $this->assertEquals(15, $response->json('data.stats.total_analyzed'));
    }

    public function test_requires_authentication(): void
    {
        auth()->forgetGuards();
        
        $response = $this->getJson('/api/v1/tenant/url-analytics/overview');

        $response->assertUnauthorized();
    }

    public function test_requires_permission(): void
    {
        $this->user->revokePermissionTo('settings.analytics.view');
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
        $this->user = $this->user->fresh();

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/overview');

        $response->assertForbidden();
    }

    public function test_uses_authenticated_user_tenant_context(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->getJson('/api/v1/tenant/url-analytics/overview');

        $response->assertOk();
        $response->assertJson([
            'success' => true,
        ]);
        $this->assertEquals(5, $response->json('data.total_access'));
    }

    public function test_isolates_analytics_by_tenant(): void
    {
        $otherTenant = TenantEloquentModel::factory()->create();

        UrlAccessAnalyticEloquentModel::factory()->count(10)->create([
            'tenant_id' => $this->tenant->id,
        ]);

        UrlAccessAnalyticEloquentModel::factory()->count(5)->create([
            'tenant_id' => $otherTenant->id,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/overview');

        $response->assertOk();
        $this->assertEquals(10, $response->json('data.total_access'));
    }

    public function test_overview_returns_correct_success_rate(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->count(80)->create([
            'tenant_id' => $this->tenant->id,
            'http_status_code' => 200,
        ]);

        UrlAccessAnalyticEloquentModel::factory()->count(20)->create([
            'tenant_id' => $this->tenant->id,
            'http_status_code' => 404,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/overview');

        $response->assertOk();
        $this->assertEquals(80.0, $response->json('data.success_rate'));
    }

    public function test_performance_includes_response_time_metrics(): void
    {
        UrlAccessAnalyticEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_config_id' => $this->urlConfig->id,
            'response_time_ms' => 10,
        ]);

        UrlAccessAnalyticEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'url_config_id' => $this->urlConfig->id,
            'response_time_ms' => 100,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->getJson('/api/v1/tenant/url-analytics/url-config-performance');

        $response->assertOk();
        $configurations = $response->json('data.configurations');
        
        $this->assertArrayHasKey('avg_response_time', $configurations[0]);
        $this->assertArrayHasKey('min_response_time', $configurations[0]);
        $this->assertArrayHasKey('max_response_time', $configurations[0]);
        
        $this->assertEquals(55.0, $configurations[0]['avg_response_time']);
        $this->assertEquals(10.0, $configurations[0]['min_response_time']);
        $this->assertEquals(100.0, $configurations[0]['max_response_time']);
    }
}
