<?php

namespace App\Contracts;

use Illuminate\Support\Collection;

interface PluginRepositoryInterface
{
    public function findByTenant(string $tenantId): Collection;
    
    public function findByName(string $tenantId, string $pluginName): ?object;
    
    public function isInstalled(string $tenantId, string $pluginName): bool;
    
    public function install(array $data): object;
    
    public function uninstall(string $tenantId, string $pluginName): bool;
    
    public function updateStatus(string $tenantId, string $pluginName, string $status): bool;
    
    public function recordMigration(string $tenantId, string $pluginName, string $migration): void;
}
