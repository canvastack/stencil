<?php

namespace App\Services;

use App\Contracts\PluginRepositoryInterface;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Permission;

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
        $this->registerPermissions($pluginName, $manifest, $plugin->tenant_id);

        Log::debug("Plugin booted", [
            'plugin_name' => $pluginName,
            'tenant_id' => $plugin->tenant_id,
        ]);
    }

    protected function loadRoutes(string $pluginName, array $manifest): void
    {
        $routes = $manifest['routes'] ?? [];

        if (isset($routes['api'])) {
            $this->loadApiRoutes($pluginName, $routes['api'], $manifest);
        }

        if (isset($routes['web'])) {
            $this->loadWebRoutes($pluginName, $routes['web'], $manifest);
        }

        if (isset($routes['admin'])) {
            $this->loadAdminRoutes($pluginName, $routes['admin'], $manifest);
        }
    }

    protected function loadApiRoutes(string $pluginName, string $routeFile, array $manifest): void
    {
        $apiRoutePath = dirname(base_path()) . "/plugins/{$pluginName}/{$routeFile}";
        
        if (!file_exists($apiRoutePath)) {
            return;
        }

        $routeConfig = $manifest['route_config']['api'] ?? [];
        $prefix = $routeConfig['prefix'] ?? 'api';
        $middleware = $routeConfig['middleware'] ?? ['api', 'tenant.context'];
        $namespace = $routeConfig['namespace'] ?? null;

        $routeGroup = Route::prefix($prefix)->middleware($middleware);

        if ($namespace) {
            $routeGroup->namespace($namespace);
        }

        $routeGroup->group($apiRoutePath);

        Log::debug("API routes loaded", [
            'plugin' => $pluginName,
            'prefix' => $prefix,
            'middleware' => $middleware,
        ]);
    }

    protected function loadWebRoutes(string $pluginName, string $routeFile, array $manifest): void
    {
        $webRoutePath = dirname(base_path()) . "/plugins/{$pluginName}/{$routeFile}";
        
        if (!file_exists($webRoutePath)) {
            return;
        }

        $routeConfig = $manifest['route_config']['web'] ?? [];
        $middleware = $routeConfig['middleware'] ?? ['web', 'tenant.context'];

        Route::middleware($middleware)->group($webRoutePath);

        Log::debug("Web routes loaded", [
            'plugin' => $pluginName,
            'middleware' => $middleware,
        ]);
    }

    protected function loadAdminRoutes(string $pluginName, string $routeFile, array $manifest): void
    {
        $adminRoutePath = dirname(base_path()) . "/plugins/{$pluginName}/{$routeFile}";
        
        if (!file_exists($adminRoutePath)) {
            return;
        }

        $routeConfig = $manifest['route_config']['admin'] ?? [];
        $prefix = $routeConfig['prefix'] ?? 'admin';
        $middleware = $routeConfig['middleware'] ?? ['api', 'auth:sanctum', 'tenant.context'];

        Route::prefix($prefix)
            ->middleware($middleware)
            ->group($adminRoutePath);

        Log::debug("Admin routes loaded", [
            'plugin' => $pluginName,
            'prefix' => $prefix,
        ]);
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

    protected function registerPermissions(string $pluginName, array $manifest, string $tenantId): void
    {
        $permissions = $manifest['permissions'] ?? [];

        if (empty($permissions)) {
            Log::debug("No permissions to register", ['plugin' => $pluginName]);
            return;
        }

        try {
            \Spatie\Permission\PermissionRegistrar::setPermissionsTeamId($tenantId);

            foreach ($permissions as $permissionName) {
                $existingPermission = Permission::where('name', $permissionName)
                    ->where('guard_name', 'api')
                    ->where('tenant_id', $tenantId)
                    ->first();

                if (!$existingPermission) {
                    Permission::create([
                        'name' => $permissionName,
                        'guard_name' => 'api',
                        'tenant_id' => $tenantId,
                    ]);

                    Log::debug("Permission registered", [
                        'plugin' => $pluginName,
                        'permission' => $permissionName,
                        'tenant_id' => $tenantId,
                    ]);
                }
            }

            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            Log::info("Plugin permissions registered", [
                'plugin' => $pluginName,
                'count' => count($permissions),
                'tenant_id' => $tenantId,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to register plugin permissions", [
                'plugin' => $pluginName,
                'tenant_id' => $tenantId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    public function unregisterPermissions(string $pluginName, string $tenantId): void
    {
        $permissions = $this->loadPermissions($pluginName);

        if (empty($permissions)) {
            return;
        }

        try {
            \Spatie\Permission\PermissionRegistrar::setPermissionsTeamId($tenantId);

            foreach ($permissions as $permissionName) {
                $permission = Permission::where('name', $permissionName)
                    ->where('guard_name', 'api')
                    ->where('tenant_id', $tenantId)
                    ->first();

                if ($permission) {
                    $permission->delete();

                    Log::debug("Permission unregistered", [
                        'plugin' => $pluginName,
                        'permission' => $permissionName,
                        'tenant_id' => $tenantId,
                    ]);
                }
            }

            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            Log::info("Plugin permissions unregistered", [
                'plugin' => $pluginName,
                'count' => count($permissions),
                'tenant_id' => $tenantId,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to unregister plugin permissions", [
                'plugin' => $pluginName,
                'tenant_id' => $tenantId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
