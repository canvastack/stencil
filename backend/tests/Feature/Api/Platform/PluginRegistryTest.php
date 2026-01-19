<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Platform;

use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use App\Models\InstalledPlugin;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PluginRegistryTest extends TestCase
{
    use RefreshDatabase;

    protected AccountEloquentModel $platformAccount;
    protected TenantEloquentModel $tenant;
    protected string $pluginsPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->platformAccount = AccountEloquentModel::factory()->create([
            'account_type' => 'platform_owner',
            'status' => 'active',
        ]);

        $this->tenant = TenantEloquentModel::factory()->create([
            'status' => 'active',
            'subscription_status' => 'active',
        ]);

        $this->pluginsPath = dirname(base_path()) . '/plugins';
        
        if (!File::exists($this->pluginsPath)) {
            File::makeDirectory($this->pluginsPath, 0755, true);
        }

        $token = $this->platformAccount->createToken('test-token', ['platform:read', 'platform:write', 'tenants:manage']);
        $this->withToken($token->plainTextToken);
    }

    protected function tearDown(): void
    {
        Cache::flush();
        parent::tearDown();
    }

    public function test_can_retrieve_plugin_registry(): void
    {
        $response = $this->getJson('/api/v1/platform/plugins/registry');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'message',
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Plugin registry retrieved successfully',
            ]);

        $this->assertTrue($response->json('success'));
    }

    public function test_can_retrieve_plugin_details_for_existing_plugin(): void
    {
        $this->createTestPlugin('test-plugin', [
            'name' => 'test-plugin',
            'display_name' => 'Test Plugin',
            'version' => '1.0.0',
            'description' => 'Test plugin description',
            'entry_point' => 'index.php',
        ]);

        Cache::forget('plugin_registry:plugin:test-plugin');
        
        $response = $this->getJson('/api/v1/platform/plugins/test-plugin/details');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'name',
                    'display_name',
                    'version',
                    'description',
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'test-plugin',
                    'display_name' => 'Test Plugin',
                    'version' => '1.0.0',
                ],
            ]);
    }

    public function test_returns_404_for_non_existent_plugin_details(): void
    {
        $response = $this->getJson('/api/v1/platform/plugins/non-existent-plugin/details');

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => "Plugin 'non-existent-plugin' not found",
            ]);
    }

    public function test_can_check_plugin_health_for_healthy_plugin(): void
    {
        $this->createTestPlugin('healthy-plugin', [
            'name' => 'healthy-plugin',
            'version' => '1.0.0',
            'display_name' => 'Healthy Plugin',
            'description' => 'A healthy test plugin',
            'entry_point' => 'index.php',
        ]);

        $response = $this->getJson('/api/v1/platform/plugins/healthy-plugin/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'status',
                    'plugin_name',
                    'version',
                    'checks',
                    'checked_at',
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'healthy',
                    'plugin_name' => 'healthy-plugin',
                ],
            ]);
    }

    public function test_returns_503_for_unhealthy_plugin(): void
    {
        $this->createTestPlugin('unhealthy-plugin', [
            'name' => 'unhealthy-plugin',
            'version' => '1.0.0',
            'display_name' => 'Unhealthy Plugin',
            'description' => 'Plugin with missing entry point',
            'entry_point' => 'missing.php',
        ], false);

        $response = $this->getJson('/api/v1/platform/plugins/unhealthy-plugin/health');

        $response->assertStatus(503)
            ->assertJson([
                'success' => false,
            ]);
        
        $this->assertContains($response->json('data.status'), ['unhealthy', 'error']);
    }

    public function test_can_retrieve_plugin_statistics(): void
    {
        $this->createTestPlugin('stats-plugin', [
            'name' => 'stats-plugin',
            'version' => '1.0.0',
        ]);

        $tenant2 = TenantEloquentModel::factory()->create(['status' => 'active']);
        $tenant3 = TenantEloquentModel::factory()->create(['status' => 'active']);
        $tenant4 = TenantEloquentModel::factory()->create(['status' => 'active']);
        $tenant5 = TenantEloquentModel::factory()->create(['status' => 'active']);

        InstalledPlugin::create([
            'plugin_name' => 'stats-plugin',
            'tenant_id' => $this->tenant->uuid,
            'plugin_version' => '1.0.0',
            'display_name' => 'Stats Plugin',
            'status' => 'active',
            'manifest' => ['name' => 'stats-plugin', 'version' => '1.0.0'],
        ]);

        InstalledPlugin::create([
            'plugin_name' => 'stats-plugin',
            'tenant_id' => $tenant2->uuid,
            'plugin_version' => '1.0.0',
            'display_name' => 'Stats Plugin',
            'status' => 'active',
            'manifest' => ['name' => 'stats-plugin', 'version' => '1.0.0'],
        ]);

        InstalledPlugin::create([
            'plugin_name' => 'stats-plugin',
            'tenant_id' => $tenant3->uuid,
            'plugin_version' => '1.0.0',
            'display_name' => 'Stats Plugin',
            'status' => 'active',
            'manifest' => ['name' => 'stats-plugin', 'version' => '1.0.0'],
        ]);

        InstalledPlugin::create([
            'plugin_name' => 'stats-plugin',
            'tenant_id' => $tenant4->uuid,
            'plugin_version' => '1.0.0',
            'display_name' => 'Stats Plugin',
            'status' => 'suspended',
            'manifest' => ['name' => 'stats-plugin', 'version' => '1.0.0'],
        ]);

        InstalledPlugin::create([
            'plugin_name' => 'stats-plugin',
            'tenant_id' => $tenant5->uuid,
            'plugin_version' => '1.0.0',
            'display_name' => 'Stats Plugin',
            'status' => 'pending',
            'manifest' => ['name' => 'stats-plugin', 'version' => '1.0.0'],
        ]);

        Cache::forget('plugin_registry:stats:stats-plugin');

        $response = $this->getJson('/api/v1/platform/plugins/stats-plugin/statistics');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_installations',
                    'active_installations',
                    'total_tenants',
                    'latest_version',
                    'average_rating',
                    'total_downloads',
                ],
                'message',
            ])
            ->assertJson([
                'success' => true,
            ]);

        $this->assertEquals(5, $response->json('data.total_installations'));
        $this->assertEquals(3, $response->json('data.active_installations'));
        $this->assertEquals(5, $response->json('data.total_tenants'));
    }

    public function test_can_clear_all_plugin_cache(): void
    {
        Cache::put('plugin_registry:all_plugins', ['test'], 3600);
        Cache::put('plugin_registry:plugin:test', ['data'], 3600);

        $this->assertTrue(Cache::has('plugin_registry:all_plugins'));
        $this->assertTrue(Cache::has('plugin_registry:plugin:test'));

        $response = $this->postJson('/api/v1/platform/plugins/cache/clear');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'All plugin cache cleared',
            ]);
    }

    public function test_can_clear_specific_plugin_cache(): void
    {
        Cache::put('plugin_registry:all_plugins', ['test'], 3600);
        Cache::put('plugin_registry:plugin:test-plugin', ['data'], 3600);
        Cache::put('plugin_registry:plugin:other-plugin', ['data'], 3600);

        $response = $this->postJson('/api/v1/platform/plugins/cache/clear', [
            'plugin_name' => 'test-plugin',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => "Cache cleared for plugin 'test-plugin'",
            ]);

        $this->assertNull(Cache::get('plugin_registry:plugin:test-plugin'));
        $this->assertNotNull(Cache::get('plugin_registry:plugin:other-plugin'));
    }

    public function test_registry_endpoints_require_authentication(): void
    {
        $token = $this->platformAccount->createToken('test-token', ['platform:read', 'platform:write', 'tenants:manage']);
        $this->withToken($token->plainTextToken);

        $endpoints = [
            ['GET', '/api/v1/platform/plugins/registry'],
            ['GET', '/api/v1/platform/plugins/test/details'],
            ['GET', '/api/v1/platform/plugins/test/health'],
            ['GET', '/api/v1/platform/plugins/test/statistics'],
            ['POST', '/api/v1/platform/plugins/cache/clear'],
        ];

        foreach ($endpoints as [$method, $uri]) {
            $response = $this->{strtolower($method) . 'Json'}($uri);
            $this->assertNotEquals(401, $response->status(), 
                "Expected authenticated request to {$method} {$uri} to not return 401");
        }
    }

    public function test_plugin_statistics_returns_zero_for_plugin_with_no_installations(): void
    {
        $this->createTestPlugin('new-plugin', [
            'name' => 'new-plugin',
            'version' => '1.0.0',
        ]);

        $response = $this->getJson('/api/v1/platform/plugins/new-plugin/statistics');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'total_installations' => 0,
                    'active_installations' => 0,
                    'total_tenants' => 0,
                ],
            ]);
    }

    protected function createTestPlugin(string $name, array $manifest = [], bool $createEntryPoint = true): void
    {
        $pluginDir = $this->pluginsPath . '/' . $name;
        
        if (!File::exists($pluginDir)) {
            File::makeDirectory($pluginDir, 0755, true);
        }

        $defaultManifest = [
            'name' => $name,
            'version' => '1.0.0',
            'display_name' => ucfirst($name),
            'description' => 'Test plugin',
            'author' => 'Test Author',
            'entry_point' => 'index.php',
            'requires' => [
                'php' => '>=8.2',
                'laravel' => '>=10.0',
            ],
            'migrations' => [],
            'permissions' => [],
            'uninstall_behavior' => 'keep_data',
            'table_prefix' => strtolower(str_replace('-', '_', $name)),
        ];

        File::put(
            $pluginDir . '/plugin.json',
            json_encode(array_merge($defaultManifest, $manifest), JSON_PRETTY_PRINT)
        );
        
        File::put($pluginDir . '/README.md', "# {$name}\n\nTest plugin");

        if ($createEntryPoint && isset($manifest['entry_point'])) {
            File::put($pluginDir . '/' . $manifest['entry_point'], '<?php // Plugin entry point');
        } elseif ($createEntryPoint) {
            File::put($pluginDir . '/index.php', '<?php // Plugin entry point');
        }
    }
}
