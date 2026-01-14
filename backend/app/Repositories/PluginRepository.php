<?php

namespace App\Repositories;

use App\Contracts\PluginRepositoryInterface;
use App\Models\InstalledPlugin;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
        $uuid = (string) Str::uuid();
        $data['uuid'] = $uuid;
        $data['installed_at'] = now();
        $data['created_at'] = now();
        $data['updated_at'] = now();
        
        if (isset($data['manifest']) && is_array($data['manifest'])) {
            $data['manifest'] = json_encode($data['manifest']);
        }
        if (isset($data['migrations_run']) && is_array($data['migrations_run'])) {
            $data['migrations_run'] = json_encode($data['migrations_run']);
        }
        if (isset($data['settings']) && is_array($data['settings'])) {
            $data['settings'] = json_encode($data['settings']);
        }
        
        DB::table('installed_plugins')->insert($data);
        
        return InstalledPlugin::where('uuid', $uuid)->first();
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
