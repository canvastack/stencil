<?php

namespace App\Services;

use App\Contracts\PluginRepositoryInterface;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;

class PluginLoader
{
    protected PluginRepositoryInterface $pluginRepository;

    public function __construct(PluginRepositoryInterface $pluginRepository)
    {
        $this->pluginRepository = $pluginRepository;
    }

    public function bootForTenant(string $tenantId): void
    {
        $plugins = $this->pluginRepository->findByTenant($tenantId);

        foreach ($plugins as $plugin) {
            if ($plugin->status !== 'active') {
                continue;
            }

            $this->bootPlugin($plugin);
        }
    }

    protected function bootPlugin($plugin): void
    {
        $manifest = $plugin->manifest;
        $pluginName = $plugin->plugin_name;

        $this->loadRoutes($pluginName, $manifest);
        $this->loadServiceProviders($pluginName, $manifest);

        Log::debug("Plugin booted", [
            'plugin_name' => $pluginName,
            'tenant_id' => $plugin->tenant_id,
        ]);
    }

    protected function loadRoutes(string $pluginName, array $manifest): void
    {
        $routes = $manifest['routes'] ?? [];

        if (isset($routes['api'])) {
            // Plugins are in project root, not backend/plugins
            $apiRoutePath = dirname(base_path()) . "/plugins/{$pluginName}/{$routes['api']}";
            if (file_exists($apiRoutePath)) {
                Route::prefix('api')
                    ->middleware(['api', 'tenant.context'])
                    ->group($apiRoutePath);

                Log::debug("API routes loaded", ['plugin' => $pluginName]);
            }
        }

        if (isset($routes['web'])) {
            // Plugins are in project root, not backend/plugins
            $webRoutePath = dirname(base_path()) . "/plugins/{$pluginName}/{$routes['web']}";
            if (file_exists($webRoutePath)) {
                Route::middleware(['web', 'tenant.context'])
                    ->group($webRoutePath);

                Log::debug("Web routes loaded", ['plugin' => $pluginName]);
            }
        }
    }

    protected function loadServiceProviders(string $pluginName, array $manifest): void
    {
        $providers = $manifest['service_providers'] ?? [];

        foreach ($providers as $providerClass) {
            // Plugins are in project root, not backend/plugins
            $providerPath = dirname(base_path()) . "/plugins/{$pluginName}/src/Providers/{$providerClass}.php";

            if (file_exists($providerPath)) {
                require_once $providerPath;

                if (class_exists($providerClass)) {
                    app()->register($providerClass);

                    Log::debug("Service provider registered", [
                        'plugin' => $pluginName,
                        'provider' => $providerClass,
                    ]);
                }
            }
        }
    }

    public function loadPermissions(string $pluginName): array
    {
        // Plugins are in project root, not backend/plugins
        $manifestPath = dirname(base_path()) . "/plugins/{$pluginName}/plugin.json";

        if (!file_exists($manifestPath)) {
            return [];
        }

        $manifest = json_decode(file_get_contents($manifestPath), true);

        return $manifest['permissions'] ?? [];
    }
}
