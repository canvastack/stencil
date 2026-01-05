<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\ProductFormConfiguration;

class FixFormConfigurationTenantIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:fix-form-configuration-tenant-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix tenant_id values in product_form_configurations table (convert UUID to integer ID)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔧 Fixing tenant_id values in product_form_configurations...');
        $this->newLine();

        $configs = DB::table('product_form_configurations')
            ->whereNotNull('tenant_id')
            ->get();

        if ($configs->count() === 0) {
            $this->info('No configurations found.');
            return 0;
        }

        $this->info("Found {$configs->count()} configuration(s) to process.");
        $this->newLine();

        $updated = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($configs as $config) {
            $currentTenantId = $config->tenant_id;
            
            if (is_numeric($currentTenantId)) {
                $this->line("  Skipping config #{$config->id} - tenant_id already integer ({$currentTenantId})");
                $skipped++;
                continue;
            }

            $tenant = DB::table('tenants')->where('uuid', $currentTenantId)->first();
            
            if (!$tenant) {
                $this->error("  ❌ Config #{$config->id} - Tenant not found for UUID: {$currentTenantId}");
                $errors++;
                continue;
            }

            DB::table('product_form_configurations')
                ->where('id', $config->id)
                ->update(['tenant_id' => $tenant->id]);

            $this->info("  ✅ Config #{$config->id} - Updated tenant_id: {$currentTenantId} → {$tenant->id}");
            $updated++;
        }

        $this->newLine();
        $this->info("Summary:");
        $this->info("  - Updated: {$updated}");
        $this->info("  - Skipped: {$skipped}");
        $this->info("  - Errors: {$errors}");
        $this->newLine();

        if ($updated > 0) {
            $this->info('🎉 Successfully fixed tenant_id values!');
            $this->info('   Clearing cache...');
            
            \Illuminate\Support\Facades\Cache::flush();
            
            $this->info('✅ Cache cleared!');
        }

        return 0;
    }
}
