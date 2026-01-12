<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CreateTenantSchemas extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenants:create-schemas';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create PostgreSQL schemas for all existing tenants';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== Creating Tenant Schemas ===');
        $this->newLine();
        
        // Get all tenants
        $tenants = DB::table('tenants')->get();
        
        $this->info("Found {$tenants->count()} tenants");
        $this->newLine();
        
        foreach ($tenants as $tenant) {
            $this->line("Tenant ID: {$tenant->id}, UUID: {$tenant->uuid}");
            
            // Construct schema name
            $schemaName = 'tenant_' . $tenant->uuid;
            
            $this->line("  Creating schema: {$schemaName}");
            
            try {
                // Create schema with quoted identifier to handle hyphens
                DB::statement("CREATE SCHEMA IF NOT EXISTS \"{$schemaName}\"");
                
                $this->info("  ✅ Schema created successfully");
                
            } catch (\Exception $e) {
                $this->error("  ❌ Error: {$e->getMessage()}");
            }
            
            $this->newLine();
        }
        
        // Verify schemas created
        $this->info('=== Verifying Schemas ===');
        $schemas = DB::select("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%' ORDER BY schema_name");
        
        foreach ($schemas as $schema) {
            $this->info("  ✅ {$schema->schema_name}");
        }
        
        $this->newLine();
        $this->info('=== Done ===');
        
        return 0;
    }
}
