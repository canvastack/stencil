<?php

namespace App\Services;

use App\Contracts\PluginRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

class PluginMigrator
{
    protected PluginRepositoryInterface $pluginRepository;

    public function __construct(PluginRepositoryInterface $pluginRepository)
    {
        $this->pluginRepository = $pluginRepository;
    }

    public function migrateUp(string $tenantId, string $pluginName, array $manifest): void
    {
        $migrations = $manifest['migrations'] ?? [];

        if (empty($migrations)) {
            return;
        }

        $this->switchToTenantSchema($tenantId);

        foreach ($migrations as $migrationPath) {
            if ($this->isMigrationRun($tenantId, $pluginName, $migrationPath)) {
                continue;
            }

            $this->runMigration($tenantId, $pluginName, $migrationPath);
        }

        $this->switchToPublicSchema();
    }

    public function migrateDown(string $tenantId, string $pluginName, array $manifest): void
    {
        $migrations = $manifest['migrations'] ?? [];

        if (empty($migrations)) {
            return;
        }

        $this->switchToTenantSchema($tenantId);

        foreach (array_reverse($migrations) as $migrationPath) {
            $this->rollbackMigration($tenantId, $pluginName, $migrationPath);
        }

        $this->switchToPublicSchema();
    }

    protected function runMigration(string $tenantId, string $pluginName, string $migrationPath): void
    {
        // Plugins are in project root, not backend/plugins
        $fullPath = dirname(base_path()) . "/plugins/{$pluginName}/{$migrationPath}";

        if (!file_exists($fullPath)) {
            throw new \RuntimeException("Migration file not found: {$fullPath}");
        }

        // For anonymous migrations (return new class extends Migration), include returns the instance
        // For named class migrations, we need to instantiate by class name
        $migration = include $fullPath;
        
        if (!is_object($migration)) {
            // Not an anonymous migration, need to instantiate by class name
            $className = $this->getMigrationClassName($fullPath);
            $migration = new $className();
        }

        $isDuplicate = false;

        try {
            DB::transaction(function () use ($migration, $tenantId, $pluginName, $migrationPath, &$isDuplicate) {
                // Ensure we're in the correct tenant schema before running migration
                $this->switchToTenantSchema($tenantId);
                
                try {
                    $migration->up();
                } catch (\Illuminate\Database\QueryException $e) {
                    // Check if error is due to duplicate table/object
                    if (str_contains($e->getMessage(), 'already exists') || 
                        str_contains($e->getMessage(), 'sudah ada') ||
                        $e->getCode() === '42P07') {
                        // Table/object already exists - mark as duplicate and rollback transaction
                        $isDuplicate = true;
                        \Illuminate\Support\Facades\Log::warning("Migration skipped - object already exists", [
                            'tenant_id' => $tenantId,
                            'plugin_name' => $pluginName,
                            'migration' => $migrationPath,
                            'error' => $e->getMessage(),
                        ]);
                        // Throw to rollback this transaction cleanly
                        throw $e;
                    } else {
                        // Re-throw other database errors
                        throw $e;
                    }
                }
                
                // Switch to public schema to update installed_plugins table (landlord table)
                $this->switchToPublicSchema();
                $this->pluginRepository->recordMigration($tenantId, $pluginName, $migrationPath);
            });
        } catch (\Illuminate\Database\QueryException $e) {
            // If it's a duplicate error, ignore and record migration separately
            if (!$isDuplicate) {
                throw $e;
            }
        }

        // If migration was duplicate, record it in a separate transaction
        if ($isDuplicate) {
            DB::transaction(function () use ($tenantId, $pluginName, $migrationPath) {
                $this->switchToPublicSchema();
                $this->pluginRepository->recordMigration($tenantId, $pluginName, $migrationPath);
            });
        }
    }

    protected function rollbackMigration(string $tenantId, string $pluginName, string $migrationPath): void
    {
        // Plugins are in project root, not backend/plugins
        $fullPath = dirname(base_path()) . "/plugins/{$pluginName}/{$migrationPath}";

        if (!file_exists($fullPath)) {
            return;
        }

        // For anonymous migrations (return new class extends Migration), include returns the instance
        // For named class migrations, we need to instantiate by class name
        $migration = include $fullPath;
        
        if (!is_object($migration)) {
            // Not an anonymous migration, need to instantiate by class name
            $className = $this->getMigrationClassName($fullPath);
            $migration = new $className();
        }

        DB::transaction(function () use ($migration, $tenantId) {
            // Ensure we're in the correct tenant schema before rolling back migration
            $this->switchToTenantSchema($tenantId);
            
            $migration->down();
        });
    }

    protected function getMigrationClassName(string $filePath): string
    {
        $content = file_get_contents($filePath);

        if (preg_match('/class\s+(\w+)\s+extends\s+Migration/', $content, $matches)) {
            return $matches[1];
        }

        if (preg_match('/return new class extends Migration/', $content)) {
            return 'AnonymousMigration';
        }

        throw new \RuntimeException("Could not determine migration class name from: {$filePath}");
    }

    protected function isMigrationRun(string $tenantId, string $pluginName, string $migrationPath): bool
    {
        // Switch back to public schema to query installed_plugins table (landlord table)
        $this->switchToPublicSchema();
        
        $plugin = $this->pluginRepository->findByName($tenantId, $pluginName);

        // Switch back to tenant schema for migration execution
        $this->switchToTenantSchema($tenantId);

        if (!$plugin) {
            return false;
        }

        return $plugin->isMigrationRun($migrationPath);
    }

    protected function switchToTenantSchema(string $tenantId): void
    {
        // First switch to public schema to query tenants table (landlord table)
        DB::statement('SET search_path TO public');
        
        $tenant = DB::table('tenants')->where('uuid', $tenantId)->first();

        if (!$tenant) {
            throw new \RuntimeException("Tenant not found: {$tenantId}");
        }

        // Use schema_name from tenants table if available, otherwise construct from UUID
        $schemaName = $tenant->schema_name ?? ('tenant_' . $tenant->uuid);
        
        // Quote schema name to handle special characters (hyphens, etc.)
        // Include 'public' schema in search path so migrations can reference landlord tables (e.g., tenants)
        DB::statement("SET search_path TO \"{$schemaName}\", public");
    }

    protected function switchToPublicSchema(): void
    {
        DB::statement('SET search_path TO public');
    }
}
