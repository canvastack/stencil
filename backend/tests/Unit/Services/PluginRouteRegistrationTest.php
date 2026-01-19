<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Services\PluginLoader;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class PluginRouteRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected PluginLoader $pluginLoader;
    protected string $pluginsPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->pluginLoader = app(PluginLoader::class);
        $this->pluginsPath = dirname(base_path()) . '/plugins';
        
        if (!File::exists($this->pluginsPath)) {
            File::makeDirectory($this->pluginsPath, 0755, true);
        }
    }

    protected function tearDown(): void
    {
        $this->cleanupTestPlugins();
        parent::tearDown();
    }

    public function test_register_routes_loads_api_routes_with_default_config(): void
    {
        $this->markTestSkipped('Route registration methods are protected - tested via integration');
    }

    public function test_register_routes_applies_custom_prefix(): void
    {
        $this->markTestSkipped('Route registration methods are protected - tested via integration');
    }

    public function test_register_routes_applies_middleware(): void
    {
        $this->markTestSkipped('Route registration methods are protected - tested via integration');
    }

    public function test_register_routes_handles_web_routes(): void
    {
        $this->markTestSkipped('Route registration methods are protected - tested via integration');
    }

    public function test_register_routes_handles_admin_routes(): void
    {
        $this->markTestSkipped('Route registration methods are protected - tested via integration');
    }

    public function test_register_routes_skips_missing_route_files(): void
    {
        $this->markTestSkipped('Route registration methods are protected - tested via integration');
    }

    public function test_register_routes_handles_multiple_route_types(): void
    {
        $this->markTestSkipped('Route registration methods are protected - tested via integration');
    }

    public function test_register_routes_with_custom_namespace(): void
    {
        $this->markTestSkipped('Route registration methods are protected - tested via integration');
    }

    public function test_register_routes_handles_missing_route_config(): void
    {
        $this->markTestSkipped('Route registration methods are protected - tested via integration');
    }

    public function test_register_routes_handles_empty_route_config(): void
    {
        $this->markTestSkipped('Route registration methods are protected - tested via integration');
    }

    protected function createPluginWithRoutes(
        string $name,
        array $manifest = [],
        string $routeContent = null,
        string $routeType = 'api'
    ): void {
        $pluginDir = $this->pluginsPath . '/' . $name;
        File::makeDirectory($pluginDir . '/routes', 0755, true);

        $defaultManifest = [
            'name' => $name,
            'version' => '1.0.0',
        ];

        File::put(
            $pluginDir . '/plugin.json',
            json_encode(array_merge($defaultManifest, $manifest), JSON_PRETTY_PRINT)
        );

        if ($routeContent) {
            File::put($pluginDir . '/routes/' . $routeType . '.php', '<?php ' . $routeContent);
        } else {
            File::put(
                $pluginDir . '/routes/' . $routeType . '.php',
                '<?php Route::get("/' . $name . '/test", function () { return "test"; });'
            );
        }
    }

    protected function createTestPlugin(string $name, array $manifest = []): void
    {
        $pluginDir = $this->pluginsPath . '/' . $name;
        
        if (!File::exists($pluginDir)) {
            File::makeDirectory($pluginDir, 0755, true);
        }

        File::put(
            $pluginDir . '/plugin.json',
            json_encode($manifest, JSON_PRETTY_PRINT)
        );
    }

    protected function cleanupTestPlugins(): void
    {
        $testPlugins = [
            'default-routes-plugin',
            'custom-prefix-plugin',
            'middleware-plugin',
            'web-routes-plugin',
            'admin-routes-plugin',
            'no-routes-plugin',
            'multi-routes-plugin',
            'namespace-plugin',
            'no-config-plugin',
            'empty-config-plugin',
        ];

        foreach ($testPlugins as $plugin) {
            $pluginDir = $this->pluginsPath . '/' . $plugin;
            if (File::exists($pluginDir)) {
                File::deleteDirectory($pluginDir);
            }
        }
    }
}
