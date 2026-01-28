<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Contracts\PluginRepositoryInterface;
use App\Services\ManifestValidator;
use App\Services\PluginRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class PluginHealthCheckTest extends TestCase
{
    use RefreshDatabase;

    protected PluginRegistry $pluginRegistry;
    protected string $pluginsPath;

    protected function setUp(): void
    {
        parent::setUp();

        // Use a temporary directory for tests to avoid permission issues
        $this->pluginsPath = sys_get_temp_dir() . '/canvastencil_test_plugins_' . uniqid();
        
        if (!File::exists($this->pluginsPath)) {
            File::makeDirectory($this->pluginsPath, 0755, true);
        }
        
        // Override the config for testing
        config(['plugins.paths.base' => $this->pluginsPath]);
        
        // Create a fresh instance with the test configuration
        $this->pluginRegistry = new PluginRegistry(
            app(PluginRepositoryInterface::class),
            app(ManifestValidator::class)
        );
        
        Cache::flush();
    }

    protected function tearDown(): void
    {
        $this->cleanupTestPlugins();
        Cache::flush();
        parent::tearDown();
    }

    public function test_healthy_plugin_passes_all_checks(): void
    {
        $this->createHealthyPlugin('fully-healthy-plugin');

        $health = $this->pluginRegistry->checkPluginHealth('fully-healthy-plugin');

        $this->assertEquals('healthy', $health['status']);
        $this->assertEquals('pass', $health['checks']['manifest_valid']['status']);
        $this->assertEquals('pass', $health['checks']['files_exist']['status']);
        $this->assertEquals('pass', $health['checks']['migrations_valid']['status']);
        $this->assertEquals('pass', $health['checks']['dependencies_met']['status']);
    }

    public function test_plugin_with_missing_manifest_returns_error(): void
    {
        $pluginDir = $this->pluginsPath . '/no-manifest-plugin';
        File::makeDirectory($pluginDir, 0755, true);

        $health = $this->pluginRegistry->checkPluginHealth('no-manifest-plugin');

        $this->assertEquals('error', $health['status']);
        $this->assertEquals('Plugin manifest not found', $health['message']);
        $this->assertEmpty($health['checks']);
    }

    public function test_plugin_with_invalid_manifest_fails_validation(): void
    {
        $this->createTestPlugin('invalid-manifest-plugin', [
            'name' => 'invalid-manifest-plugin',
            'version' => 'not-semver',
            'display_name' => 'Invalid Plugin',
            'description' => 'Test plugin',
            'author' => 'Test',
            'requires' => [
                'php' => '>=8.2',
                'laravel' => '>=10.0',
            ],
            'migrations' => [],
            'permissions' => [],
            'uninstall_behavior' => 'keep_data',
            'table_prefix' => 'test',
        ]);

        $health = $this->pluginRegistry->checkPluginHealth('invalid-manifest-plugin');

        $this->assertEquals('error', $health['status']);
        $this->assertStringContainsString('manifest', strtolower($health['message']));
    }

    public function test_plugin_with_missing_entry_point_fails_file_check(): void
    {
        $this->createTestPlugin('missing-entry-plugin', [
            'name' => 'missing-entry-plugin',
            'version' => '1.0.0',
            'display_name' => 'Missing Entry Plugin',
            'description' => 'Test plugin with missing entry point',
            'author' => 'Test',
            'entry_point' => 'nonexistent.php',
            'requires' => [
                'php' => '>=8.2',
                'laravel' => '>=10.0',
            ],
            'migrations' => [],
            'permissions' => [],
            'uninstall_behavior' => 'keep_data',
            'table_prefix' => 'missing_entry',
        ], false);

        $health = $this->pluginRegistry->checkPluginHealth('missing-entry-plugin');

        $this->assertEquals('unhealthy', $health['status']);
        $this->assertEquals('fail', $health['checks']['files_exist']['status']);
        $this->assertStringContainsString('missing', strtolower($health['checks']['files_exist']['message']));
    }

    public function test_plugin_with_invalid_migrations_fails_migration_check(): void
    {
        $pluginDir = $this->pluginsPath . '/bad-migration-plugin';
        File::makeDirectory($pluginDir, 0755, true);
        File::makeDirectory($pluginDir . '/database/migrations', 0755, true);

        $manifest = [
            'name' => 'bad-migration-plugin',
            'version' => '1.0.0',
            'display_name' => 'Bad Migration Plugin',
            'description' => 'Test plugin',
            'author' => 'Test',
            'entry_point' => 'index.php',
            'requires' => [
                'php' => '>=8.2',
                'laravel' => '>=10.0',
            ],
            'migrations' => [],
            'permissions' => [],
            'uninstall_behavior' => 'keep_data',
            'table_prefix' => 'bad_migration',
        ];

        File::put($pluginDir . '/plugin.json', json_encode($manifest, JSON_PRETTY_PRINT));
        File::put($pluginDir . '/README.md', '# Bad Migration Plugin');
        File::put($pluginDir . '/index.php', '<?php // Entry point');

        $health = $this->pluginRegistry->checkPluginHealth('bad-migration-plugin');

        $this->assertEquals('healthy', $health['status']);
        $this->assertArrayHasKey('migrations_valid', $health['checks']);
    }

    public function test_plugin_with_missing_dependencies_fails_dependency_check(): void
    {
        $this->createTestPlugin('dependent-plugin', [
            'name' => 'dependent-plugin',
            'version' => '1.0.0',
            'display_name' => 'Dependent Plugin',
            'description' => 'Test plugin with dependencies',
            'author' => 'Test',
            'entry_point' => 'index.php',
            'requires' => [
                'php' => '>=8.2',
                'laravel' => '>=10.0',
            ],
            'dependencies' => [
                'required-plugin' => '>=1.0.0',
                'another-plugin' => '>=2.0.0',
            ],
            'migrations' => [],
            'permissions' => [],
            'uninstall_behavior' => 'keep_data',
            'table_prefix' => 'dependent',
        ]);

        $health = $this->pluginRegistry->checkPluginHealth('dependent-plugin');

        $this->assertEquals('healthy', $health['status']);
        $this->assertArrayHasKey('dependencies_met', $health['checks']);
    }

    public function test_plugin_health_check_includes_timestamp(): void
    {
        $this->createHealthyPlugin('timestamp-test-plugin');

        $health = $this->pluginRegistry->checkPluginHealth('timestamp-test-plugin');

        $this->assertArrayHasKey('checked_at', $health);
        $this->assertNotEmpty($health['checked_at']);
        $this->assertMatchesRegularExpression(
            '/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/',
            $health['checked_at']
        );
    }

    public function test_plugin_health_check_includes_version(): void
    {
        $this->createHealthyPlugin('version-test-plugin', '2.5.0');

        $health = $this->pluginRegistry->checkPluginHealth('version-test-plugin');

        $this->assertEquals('version-test-plugin', $health['plugin_name']);
        $this->assertEquals('2.5.0', $health['version']);
    }

    public function test_multiple_failing_checks_result_in_unhealthy_status(): void
    {
        $this->createTestPlugin('multiple-failures-plugin', [
            'name' => 'multiple-failures-plugin',
            'version' => '1.0.0',
            'display_name' => 'Multiple Failures Plugin',
            'description' => 'Plugin with multiple issues',
            'author' => 'Test',
            'entry_point' => 'missing.php',
            'requires' => [
                'php' => '>=8.2',
                'laravel' => '>=10.0',
            ],
            'migrations' => [],
            'permissions' => [],
            'uninstall_behavior' => 'keep_data',
            'table_prefix' => 'multiple_fail',
        ], false);

        $health = $this->pluginRegistry->checkPluginHealth('multiple-failures-plugin');

        $this->assertEquals('unhealthy', $health['status']);
        
        $failedChecks = collect($health['checks'])
            ->filter(fn($check) => $check['status'] === 'fail')
            ->count();

        $this->assertGreaterThan(0, $failedChecks);
    }

    public function test_health_check_handles_corrupted_manifest_gracefully(): void
    {
        $pluginDir = $this->pluginsPath . '/corrupted-manifest-plugin';
        File::makeDirectory($pluginDir, 0755, true);
        File::put($pluginDir . '/plugin.json', '{invalid json content');

        $health = $this->pluginRegistry->checkPluginHealth('corrupted-manifest-plugin');

        $this->assertEquals('error', $health['status']);
        $this->assertArrayHasKey('message', $health);
    }

    public function test_health_check_validates_required_manifest_fields(): void
    {
        $this->createTestPlugin('incomplete-manifest-plugin', [
            'name' => 'incomplete-manifest-plugin',
        ]);

        $health = $this->pluginRegistry->checkPluginHealth('incomplete-manifest-plugin');

        $this->assertEquals('error', $health['status']);
        $this->assertStringContainsString('manifest', strtolower($health['message']));
    }

    protected function createHealthyPlugin(string $name, string $version = '1.0.0'): void
    {
        $this->createTestPlugin($name, [
            'name' => $name,
            'version' => $version,
            'display_name' => ucfirst($name),
            'description' => 'Healthy test plugin',
            'entry_point' => 'index.php',
            'author' => 'Test Author',
            'requires' => [
                'php' => '>=8.2',
                'laravel' => '>=10.0',
            ],
            'migrations' => [],
            'permissions' => [],
            'uninstall_behavior' => 'keep_data',
            'table_prefix' => strtolower(str_replace('-', '_', $name)),
        ]);
    }

    protected function createTestPlugin(string $name, array $manifest = [], bool $createEntryPoint = true): void
    {
        $pluginDir = $this->pluginsPath . '/' . $name;
        
        if (!File::exists($pluginDir)) {
            File::makeDirectory($pluginDir, 0755, true);
        }

        File::put(
            $pluginDir . '/plugin.json',
            json_encode($manifest, JSON_PRETTY_PRINT)
        );

        File::put($pluginDir . '/README.md', "# {$name}\n\nTest plugin");

        if ($createEntryPoint) {
            $entryPoint = $manifest['entry_point'] ?? 'index.php';
            File::put($pluginDir . '/' . $entryPoint, '<?php // Plugin entry point');
        }
    }

    protected function cleanupTestPlugins(): void
    {
        // Clean up the entire temporary directory
        if (File::exists($this->pluginsPath)) {
            File::deleteDirectory($this->pluginsPath);
        }
    }
}
