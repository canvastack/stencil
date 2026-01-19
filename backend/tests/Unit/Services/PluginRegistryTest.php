<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Contracts\PluginRepositoryInterface;
use App\Models\InstalledPlugin;
use App\Services\ManifestValidator;
use App\Services\PluginRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class PluginRegistryTest extends TestCase
{
    use RefreshDatabase;

    protected PluginRegistry $pluginRegistry;
    protected PluginRepositoryInterface $pluginRepository;
    protected ManifestValidator $manifestValidator;
    protected string $pluginsPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pluginRepository = app(PluginRepositoryInterface::class);
        $this->manifestValidator = app(ManifestValidator::class);
        $this->pluginRegistry = new PluginRegistry(
            $this->pluginRepository,
            $this->manifestValidator
        );

        $this->pluginsPath = dirname(base_path()) . '/plugins';
        
        if (!File::exists($this->pluginsPath)) {
            File::makeDirectory($this->pluginsPath, 0755, true);
        }
        
        Cache::flush();
    }

    protected function tearDown(): void
    {
        Cache::flush();
        $this->cleanupTestPlugins();
        parent::tearDown();
    }

    public function test_get_all_plugins_returns_collection(): void
    {
        $plugins = $this->pluginRegistry->getAllPlugins();

        $this->assertInstanceOf(\Illuminate\Support\Collection::class, $plugins);
    }

    public function test_get_all_plugins_caches_results(): void
    {
        $this->pluginRegistry->getAllPlugins();

        $this->assertTrue(Cache::has('plugin_registry:all_plugins'));
    }

    public function test_get_plugin_by_name_returns_plugin_data(): void
    {
        $this->createTestPlugin('test-plugin', [
            'name' => 'test-plugin',
            'display_name' => 'Test Plugin',
            'version' => '1.0.0',
            'description' => 'Test description',
        ]);

        $plugin = $this->pluginRegistry->getPluginByName('test-plugin');

        $this->assertIsArray($plugin);
        $this->assertEquals('test-plugin', $plugin['name']);
        $this->assertEquals('Test Plugin', $plugin['display_name']);
        $this->assertEquals('1.0.0', $plugin['version']);
    }

    public function test_get_plugin_by_name_returns_null_for_non_existent_plugin(): void
    {
        $plugin = $this->pluginRegistry->getPluginByName('non-existent-plugin');

        $this->assertNull($plugin);
    }

    public function test_get_plugin_by_name_caches_results(): void
    {
        $this->createTestPlugin('cached-plugin', [
            'name' => 'cached-plugin',
            'version' => '1.0.0',
        ]);

        $this->pluginRegistry->getPluginByName('cached-plugin');

        $this->assertTrue(Cache::has('plugin_registry:plugin:cached-plugin'));
    }

    public function test_get_plugin_statistics_returns_correct_structure(): void
    {
        $this->createTestPlugin('stats-plugin', [
            'name' => 'stats-plugin',
            'version' => '1.0.0',
        ]);

        $stats = $this->pluginRegistry->getPluginStatistics('stats-plugin');

        $this->assertIsArray($stats);
        $this->assertArrayHasKey('total_installations', $stats);
        $this->assertArrayHasKey('active_installations', $stats);
        $this->assertArrayHasKey('total_tenants', $stats);
        $this->assertArrayHasKey('latest_version', $stats);
        $this->assertArrayHasKey('average_rating', $stats);
        $this->assertArrayHasKey('total_downloads', $stats);
    }

    public function test_get_plugin_statistics_counts_installations_correctly(): void
    {
        InstalledPlugin::factory()->count(5)->create([
            'plugin_name' => 'popular-plugin',
            'status' => 'active',
        ]);

        InstalledPlugin::factory()->count(3)->create([
            'plugin_name' => 'popular-plugin',
            'status' => 'suspended',
        ]);

        $stats = $this->pluginRegistry->getPluginStatistics('popular-plugin');

        $this->assertEquals(8, $stats['total_installations']);
        $this->assertEquals(5, $stats['active_installations']);
    }

    public function test_get_plugin_statistics_caches_results(): void
    {
        $this->createTestPlugin('stats-cache-plugin', [
            'name' => 'stats-cache-plugin',
            'version' => '1.0.0',
        ]);

        $this->pluginRegistry->getPluginStatistics('stats-cache-plugin');

        $this->assertTrue(Cache::has('plugin_registry:stats:stats-cache-plugin'));
    }

    public function test_check_plugin_health_returns_healthy_for_valid_plugin(): void
    {
        $this->createTestPlugin('healthy-plugin', [
            'name' => 'healthy-plugin',
            'version' => '1.0.0',
            'entry_point' => 'index.php',
            'description' => 'Test plugin',
        ]);

        $health = $this->pluginRegistry->checkPluginHealth('healthy-plugin');

        $this->assertEquals('healthy', $health['status']);
        $this->assertEquals('healthy-plugin', $health['plugin_name']);
        $this->assertEquals('1.0.0', $health['version']);
        $this->assertArrayHasKey('checks', $health);
        $this->assertArrayHasKey('checked_at', $health);
    }

    public function test_check_plugin_health_returns_error_for_missing_manifest(): void
    {
        $health = $this->pluginRegistry->checkPluginHealth('non-existent-plugin');

        $this->assertEquals('error', $health['status']);
        $this->assertEquals('Plugin manifest not found', $health['message']);
        $this->assertArrayHasKey('checks', $health);
    }

    public function test_check_plugin_health_validates_manifest(): void
    {
        $this->createTestPlugin('test-health-plugin', [
            'name' => 'test-health-plugin',
            'version' => '1.0.0',
            'entry_point' => 'index.php',
        ]);

        $health = $this->pluginRegistry->checkPluginHealth('test-health-plugin');

        $this->assertArrayHasKey('manifest_valid', $health['checks']);
        $this->assertArrayHasKey('files_exist', $health['checks']);
        $this->assertArrayHasKey('migrations_valid', $health['checks']);
        $this->assertArrayHasKey('dependencies_met', $health['checks']);
    }

    public function test_check_plugin_health_detects_missing_entry_point(): void
    {
        $this->createTestPlugin('missing-entry-plugin', [
            'name' => 'missing-entry-plugin',
            'version' => '1.0.0',
            'entry_point' => 'missing.php',
        ], false);

        $health = $this->pluginRegistry->checkPluginHealth('missing-entry-plugin');

        $this->assertEquals('unhealthy', $health['status']);
        $this->assertEquals('fail', $health['checks']['files_exist']['status']);
    }

    public function test_clear_cache_clears_all_plugin_caches(): void
    {
        Cache::put('plugin_registry:all_plugins', ['test'], 3600);
        Cache::put('plugin_registry:plugin:test', ['data'], 3600);
        Cache::put('plugin_registry:stats:test', ['stats'], 3600);

        $this->pluginRegistry->clearCache();

        $this->assertFalse(Cache::has('plugin_registry:all_plugins'));
        $this->assertFalse(Cache::has('plugin_registry:plugin:test'));
        $this->assertFalse(Cache::has('plugin_registry:stats:test'));
    }

    public function test_clear_cache_clears_specific_plugin_cache(): void
    {
        Cache::put('plugin_registry:plugin:plugin1', ['data'], 3600);
        Cache::put('plugin_registry:stats:plugin1', ['stats'], 3600);
        Cache::put('plugin_registry:plugin:plugin2', ['data'], 3600);

        $this->pluginRegistry->clearCache('plugin1');

        $this->assertFalse(Cache::has('plugin_registry:plugin:plugin1'));
        $this->assertFalse(Cache::has('plugin_registry:stats:plugin1'));
        $this->assertTrue(Cache::has('plugin_registry:plugin:plugin2'));
    }

    public function test_get_installed_versions_returns_collection(): void
    {
        InstalledPlugin::factory()->create([
            'plugin_name' => 'versioned-plugin',
            'plugin_version' => '1.0.0',
        ]);

        InstalledPlugin::factory()->create([
            'plugin_name' => 'versioned-plugin',
            'plugin_version' => '1.1.0',
        ]);

        $versions = $this->pluginRegistry->getInstalledVersions('versioned-plugin');

        $this->assertInstanceOf(\Illuminate\Support\Collection::class, $versions);
        $this->assertGreaterThanOrEqual(2, $versions->count());
    }

    public function test_get_tenant_plugins_filters_by_tenant(): void
    {
        $tenant1 = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::factory()->create();
        $tenant2 = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::factory()->create();

        InstalledPlugin::factory()->create([
            'tenant_id' => $tenant1->uuid,
            'plugin_name' => 'plugin-one',
        ]);

        InstalledPlugin::factory()->create([
            'tenant_id' => $tenant1->uuid,
            'plugin_name' => 'plugin-two',
        ]);

        InstalledPlugin::factory()->create([
            'tenant_id' => $tenant1->uuid,
            'plugin_name' => 'plugin-three',
        ]);

        InstalledPlugin::factory()->count(2)->create([
            'tenant_id' => $tenant2->uuid,
        ]);

        $tenant1Plugins = $this->pluginRegistry->getTenantPlugins($tenant1->uuid);

        $this->assertEquals(3, $tenant1Plugins->count());
        $this->assertTrue($tenant1Plugins->every(fn($p) => $p['tenant_id'] === $tenant1->uuid));
    }

    protected function createTestPlugin(string $name, array $manifest = [], bool $createEntryPoint = true): void
    {
        $pluginDir = dirname(base_path()) . '/plugins/' . $name;
        
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

    protected function cleanupTestPlugins(): void
    {
        $testPlugins = [
            'test-plugin',
            'cached-plugin',
            'stats-plugin',
            'stats-cache-plugin',
            'healthy-plugin',
            'test-health-plugin',
            'missing-entry-plugin',
        ];

        foreach ($testPlugins as $plugin) {
            $pluginDir = $this->pluginsPath . '/' . $plugin;
            if (File::exists($pluginDir)) {
                File::deleteDirectory($pluginDir);
            }
        }
    }
}
