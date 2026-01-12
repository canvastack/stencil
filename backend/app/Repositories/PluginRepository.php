<?php

namespace App\Repositories;

use App\Contracts\PluginRepositoryInterface;
use App\Models\InstalledPlugin;
use Illuminate\Support\Collection;

class PluginRepository implements PluginRepositoryInterface
{
    public function findByTenant(string $tenantId): Collection
    {
        return InstalledPlugin::where('tenant_id', $tenantId)
            ->orderBy('installed_at', 'desc')
            ->get();
    }

    public function findByName(string $tenantId, string $pluginName): ?InstalledPlugin
    {
        return InstalledPlugin::where('tenant_id', $tenantId)
            ->where('plugin_name', $pluginName)
            ->first();
    }

    public function isInstalled(string $tenantId, string $pluginName): bool
    {
        return InstalledPlugin::where('tenant_id', $tenantId)
            ->where('plugin_name', $pluginName)
            ->exists();
    }

    public function install(array $data): InstalledPlugin
    {
        return InstalledPlugin::create($data);
    }

    public function uninstall(string $tenantId, string $pluginName): bool
    {
        return InstalledPlugin::where('tenant_id', $tenantId)
            ->where('plugin_name', $pluginName)
            ->delete();
    }

    public function updateStatus(string $tenantId, string $pluginName, string $status): bool
    {
        return InstalledPlugin::where('tenant_id', $tenantId)
            ->where('plugin_name', $pluginName)
            ->update(['status' => $status]);
    }

    public function recordMigration(string $tenantId, string $pluginName, string $migration): void
    {
        $plugin = $this->findByName($tenantId, $pluginName);
        if ($plugin) {
            $plugin->markMigrationRun($migration);
        }
    }
}
