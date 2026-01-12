<?php

namespace App\Services;

use App\Contracts\PluginRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PluginManager
{
    protected PluginRepositoryInterface $pluginRepository;
    protected ManifestValidator $manifestValidator;
    protected PluginMigrator $pluginMigrator;

    public function __construct(
        PluginRepositoryInterface $pluginRepository,
        ManifestValidator $manifestValidator,
        PluginMigrator $pluginMigrator
    ) {
        $this->pluginRepository = $pluginRepository;
        $this->manifestValidator = $manifestValidator;
        $this->pluginMigrator = $pluginMigrator;
    }

    public function install(string $tenantId, string $pluginName, ?string $installedBy = null): bool
    {
        if ($this->isInstalled($tenantId, $pluginName)) {
            throw new \RuntimeException("Plugin '{$pluginName}' is already installed for this tenant");
        }

        $manifest = $this->loadManifest($pluginName);

        try {
            DB::beginTransaction();

            $plugin = $this->pluginRepository->install([
                'tenant_id' => $tenantId,
                'plugin_name' => $manifest['name'],
                'plugin_version' => $manifest['version'],
                'display_name' => $manifest['display_name'],
                'status' => 'active',
                'manifest' => $manifest,
                'migrations_run' => [],
                'settings' => [],
                'installed_by' => $installedBy,
            ]);

            $this->pluginMigrator->migrateUp($tenantId, $pluginName, $manifest);

            $this->runSeeders($tenantId, $pluginName, $manifest);

            DB::commit();

            Log::info("Plugin installed successfully", [
                'tenant_id' => $tenantId,
                'plugin_name' => $pluginName,
                'version' => $manifest['version'],
            ]);

            return true;
        } catch (\Exception $e) {
            DB::rollBack();

            $this->pluginRepository->updateStatus($tenantId, $pluginName, 'error');

            Log::error("Plugin installation failed", [
                'tenant_id' => $tenantId,
                'plugin_name' => $pluginName,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function uninstall(string $tenantId, string $pluginName, bool $deleteData = false): bool
    {
        if (!$this->isInstalled($tenantId, $pluginName)) {
            throw new \RuntimeException("Plugin '{$pluginName}' is not installed for this tenant");
        }

        $plugin = $this->pluginRepository->findByName($tenantId, $pluginName);
        $manifest = $plugin->manifest;

        $uninstallBehavior = $manifest['uninstall_behavior'] ?? 'keep_data';

        if ($deleteData || $uninstallBehavior === 'delete_data') {
            $this->pluginMigrator->migrateDown($tenantId, $pluginName, $manifest);
        }

        try {
            DB::beginTransaction();

            $this->pluginRepository->uninstall($tenantId, $pluginName);

            DB::commit();

            Log::info("Plugin uninstalled successfully", [
                'tenant_id' => $tenantId,
                'plugin_name' => $pluginName,
                'delete_data' => $deleteData,
            ]);

            return true;
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error("Plugin uninstallation failed", [
                'tenant_id' => $tenantId,
                'plugin_name' => $pluginName,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function enable(string $tenantId, string $pluginName): bool
    {
        return $this->pluginRepository->updateStatus($tenantId, $pluginName, 'active');
    }

    public function disable(string $tenantId, string $pluginName): bool
    {
        return $this->pluginRepository->updateStatus($tenantId, $pluginName, 'disabled');
    }

    public function isInstalled(string $tenantId, string $pluginName): bool
    {
        return $this->pluginRepository->isInstalled($tenantId, $pluginName);
    }

    public function getInstalled(string $tenantId)
    {
        return $this->pluginRepository->findByTenant($tenantId);
    }

    protected function loadManifest(string $pluginName): array
    {
        // Plugins are in project root, not backend/plugins
        $manifestPath = dirname(base_path()) . "/plugins/{$pluginName}/plugin.json";

        return $this->manifestValidator->parse($manifestPath);
    }

    protected function runSeeders(string $tenantId, string $pluginName, array $manifest): void
    {
        $seeders = $manifest['seeders'] ?? [];

        if (empty($seeders)) {
            return;
        }

        foreach ($seeders as $seederClass) {
            // Plugins are in project root, not backend/plugins
            $seederPath = dirname(base_path()) . "/plugins/{$pluginName}/database/seeders/{$seederClass}.php";

            if (file_exists($seederPath)) {
                require_once $seederPath;

                $seederInstance = new $seederClass();
                $seederInstance->run();

                Log::info("Seeder executed", [
                    'tenant_id' => $tenantId,
                    'plugin_name' => $pluginName,
                    'seeder' => $seederClass,
                ]);
            }
        }
    }

    public function installApprovedPlugin($plugin): void
    {
        $tenantId = $plugin->tenant_id;
        $pluginName = $plugin->plugin_name;
        $manifest = $plugin->manifest;

        // Check if plugin folder exists
        $pluginPath = dirname(base_path()) . "/plugins/{$pluginName}";
        if (!is_dir($pluginPath)) {
            Log::warning("Plugin folder not found, skipping installation", [
                'tenant_id' => $tenantId,
                'plugin_name' => $pluginName,
                'expected_path' => $pluginPath,
            ]);
            return;
        }

        try {
            $this->pluginMigrator->migrateUp($tenantId, $pluginName, $manifest);

            $this->runSeeders($tenantId, $pluginName, $manifest);

            Log::info("Approved plugin installed successfully", [
                'tenant_id' => $tenantId,
                'plugin_name' => $pluginName,
                'plugin_uuid' => $plugin->uuid,
            ]);
        } catch (\Exception $e) {
            Log::error("Approved plugin installation failed", [
                'tenant_id' => $tenantId,
                'plugin_name' => $pluginName,
                'plugin_uuid' => $plugin->uuid,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function getAvailablePlugins(): array
    {
        // Plugins are in project root (canvastencil/plugins), not backend/plugins
        $pluginsPath = dirname(base_path()) . '/plugins';

        if (!is_dir($pluginsPath)) {
            return [];
        }

        $available = [];

        foreach (scandir($pluginsPath) as $dir) {
            if ($dir === '.' || $dir === '..') {
                continue;
            }

            $manifestPath = "{$pluginsPath}/{$dir}/plugin.json";

            if (file_exists($manifestPath)) {
                try {
                    $manifest = $this->manifestValidator->parse($manifestPath);
                    $available[] = [
                        'name' => $manifest['name'],
                        'display_name' => $manifest['display_name'],
                        'version' => $manifest['version'],
                        'description' => $manifest['description'],
                        'author' => $manifest['author'],
                    ];
                } catch (\Exception $e) {
                    Log::warning("Invalid plugin manifest", [
                        'plugin' => $dir,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        return $available;
    }
}
