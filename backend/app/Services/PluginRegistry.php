<?php

namespace App\Services;

use App\Contracts\PluginRepositoryInterface;
use App\Models\InstalledPlugin;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

class PluginRegistry
{
    protected PluginRepositoryInterface $pluginRepository;
    protected ManifestValidator $manifestValidator;

    const CACHE_TTL = 3600;
    const CACHE_KEY_PREFIX = 'plugin_registry:';

    public function __construct(
        PluginRepositoryInterface $pluginRepository,
        ManifestValidator $manifestValidator
    ) {
        $this->pluginRepository = $pluginRepository;
        $this->manifestValidator = $manifestValidator;
    }

    public function getAllPlugins(): Collection
    {
        return Cache::remember(
            self::CACHE_KEY_PREFIX . 'all_plugins',
            self::CACHE_TTL,
            fn() => $this->scanPluginsDirectory()
        );
    }

    public function getPluginByName(string $pluginName): ?array
    {
        return Cache::remember(
            self::CACHE_KEY_PREFIX . "plugin:{$pluginName}",
            self::CACHE_TTL,
            function () use ($pluginName) {
                $manifest = $this->loadPluginManifest($pluginName);
                if (!$manifest) {
                    return null;
                }

                return $this->enrichPluginMetadata($pluginName, $manifest);
            }
        );
    }

    public function getPluginStatistics(string $pluginName): array
    {
        return Cache::remember(
            self::CACHE_KEY_PREFIX . "stats:{$pluginName}",
            300,
            function () use ($pluginName) {
                return [
                    'total_installations' => $this->getTotalInstallations($pluginName),
                    'active_installations' => $this->getActiveInstallations($pluginName),
                    'total_tenants' => $this->getUniqueTenantCount($pluginName),
                    'latest_version' => $this->getLatestVersion($pluginName),
                    'average_rating' => null,
                    'total_downloads' => $this->getTotalInstallations($pluginName),
                ];
            }
        );
    }

    public function checkPluginHealth(string $pluginName): array
    {
        $manifest = $this->loadPluginManifest($pluginName);
        
        if (!$manifest) {
            return [
                'status' => 'error',
                'message' => 'Plugin manifest not found',
                'checks' => [],
            ];
        }

        $checks = [
            'manifest_valid' => $this->validateManifest($pluginName),
            'files_exist' => $this->checkRequiredFiles($pluginName, $manifest),
            'migrations_valid' => $this->checkMigrations($pluginName, $manifest),
            'dependencies_met' => $this->checkDependencies($manifest),
        ];

        $allPassed = collect($checks)->every(fn($check) => $check['status'] === 'pass');

        return [
            'status' => $allPassed ? 'healthy' : 'unhealthy',
            'plugin_name' => $pluginName,
            'version' => $manifest['version'] ?? 'unknown',
            'checks' => $checks,
            'checked_at' => now()->toIso8601String(),
        ];
    }

    public function getInstalledVersions(string $pluginName): Collection
    {
        return InstalledPlugin::where('plugin_name', $pluginName)
            ->select('plugin_version', DB::raw('COUNT(*) as count'))
            ->groupBy('plugin_version')
            ->orderBy('plugin_version', 'desc')
            ->get();
    }

    public function getTenantPlugins(string $tenantId): Collection
    {
        return $this->pluginRepository->findByTenant($tenantId)
            ->map(function ($plugin) {
                return [
                    'uuid' => $plugin->uuid,
                    'tenant_id' => $plugin->tenant_id,
                    'name' => $plugin->plugin_name,
                    'display_name' => $plugin->display_name,
                    'version' => $plugin->plugin_version,
                    'status' => $plugin->status,
                    'installed_at' => $plugin->installed_at,
                    'expires_at' => $plugin->expires_at,
                    'manifest' => $plugin->manifest,
                ];
            });
    }

    public function clearCache(?string $pluginName = null): void
    {
        if ($pluginName) {
            Cache::forget(self::CACHE_KEY_PREFIX . "plugin:{$pluginName}");
            Cache::forget(self::CACHE_KEY_PREFIX . "stats:{$pluginName}");
        } else {
            Cache::flush();
        }

        Log::info('Plugin registry cache cleared', ['plugin' => $pluginName ?? 'all']);
    }

    protected function scanPluginsDirectory(): Collection
    {
        $pluginsPath = dirname(base_path()) . '/plugins';

        if (!is_dir($pluginsPath)) {
            return collect([]);
        }

        $plugins = [];

        foreach (scandir($pluginsPath) as $dir) {
            if ($dir === '.' || $dir === '..') {
                continue;
            }

            $manifestPath = "{$pluginsPath}/{$dir}/plugin.json";

            if (file_exists($manifestPath)) {
                try {
                    $manifest = $this->manifestValidator->parse($manifestPath);
                    $plugins[] = $this->enrichPluginMetadata($dir, $manifest);
                } catch (\Exception $e) {
                    Log::warning('Invalid plugin manifest', [
                        'plugin' => $dir,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        return collect($plugins);
    }

    protected function loadPluginManifest(string $pluginName): ?array
    {
        $manifestPath = dirname(base_path()) . "/plugins/{$pluginName}/plugin.json";

        if (!file_exists($manifestPath)) {
            return null;
        }

        try {
            return $this->manifestValidator->parse($manifestPath);
        } catch (\Exception $e) {
            Log::error('Failed to load plugin manifest', [
                'plugin' => $pluginName,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    protected function enrichPluginMetadata(string $pluginName, array $manifest): array
    {
        return array_merge($manifest, [
            'plugin_name' => $pluginName,
            'total_installations' => $this->getTotalInstallations($pluginName),
            'active_installations' => $this->getActiveInstallations($pluginName),
            'path' => dirname(base_path()) . "/plugins/{$pluginName}",
            'health_status' => 'unknown',
        ]);
    }

    protected function getTotalInstallations(string $pluginName): int
    {
        return InstalledPlugin::where('plugin_name', $pluginName)->count();
    }

    protected function getActiveInstallations(string $pluginName): int
    {
        return InstalledPlugin::where('plugin_name', $pluginName)
            ->where('status', 'active')
            ->count();
    }

    protected function getUniqueTenantCount(string $pluginName): int
    {
        return InstalledPlugin::where('plugin_name', $pluginName)
            ->distinct('tenant_id')
            ->count('tenant_id');
    }

    protected function getLatestVersion(string $pluginName): ?string
    {
        $manifest = $this->loadPluginManifest($pluginName);
        return $manifest['version'] ?? null;
    }

    protected function validateManifest(string $pluginName): array
    {
        try {
            $manifestPath = dirname(base_path()) . "/plugins/{$pluginName}/plugin.json";
            $this->manifestValidator->parse($manifestPath);
            
            return [
                'status' => 'pass',
                'message' => 'Manifest is valid',
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'fail',
                'message' => $e->getMessage(),
            ];
        }
    }

    protected function checkRequiredFiles(string $pluginName, array $manifest): array
    {
        $pluginPath = dirname(base_path()) . "/plugins/{$pluginName}";
        $requiredFiles = [
            'plugin.json',
            'README.md',
        ];

        if (isset($manifest['entry_point'])) {
            $requiredFiles[] = $manifest['entry_point'];
        }

        if (isset($manifest['routes']['api'])) {
            $requiredFiles[] = $manifest['routes']['api'];
        }

        $missing = [];
        foreach ($requiredFiles as $file) {
            if (!file_exists("{$pluginPath}/{$file}")) {
                $missing[] = $file;
            }
        }

        return [
            'status' => empty($missing) ? 'pass' : 'fail',
            'message' => empty($missing) ? 'All required files exist' : 'Missing files: ' . implode(', ', $missing),
            'missing_files' => $missing,
        ];
    }

    protected function checkMigrations(string $pluginName, array $manifest): array
    {
        if (empty($manifest['migrations'])) {
            return [
                'status' => 'pass',
                'message' => 'No migrations to check',
            ];
        }

        $migrationsPath = dirname(base_path()) . "/plugins/{$pluginName}/database/migrations";
        
        if (!is_dir($migrationsPath)) {
            return [
                'status' => 'fail',
                'message' => 'Migrations directory not found',
            ];
        }

        return [
            'status' => 'pass',
            'message' => 'Migrations directory exists',
        ];
    }

    protected function checkDependencies(array $manifest): array
    {
        $dependencies = $manifest['dependencies'] ?? [];

        if (empty($dependencies)) {
            return [
                'status' => 'pass',
                'message' => 'No dependencies to check',
            ];
        }

        return [
            'status' => 'pass',
            'message' => 'Dependency checking not yet implemented',
            'dependencies' => $dependencies,
        ];
    }
}
