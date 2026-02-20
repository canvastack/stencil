<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\ApprovalSettings;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;

class ApprovalSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🔧 Seeding Approval Settings...');
        
        $tenants = TenantEloquentModel::all();
        
        foreach ($tenants as $tenant) {
            // Check if settings already exist
            $existing = ApprovalSettings::where('tenant_id', $tenant->id)->first();
            
            if ($existing) {
                $this->command->info("   ℹ️  Settings already exist for {$tenant->name}, skipping...");
                continue;
            }
            
            // Create default settings using the model's getDefaults() method
            ApprovalSettings::create(array_merge(
                ['tenant_id' => $tenant->id],
                ApprovalSettings::getDefaults()
            ));
            
            $this->command->info("   ✅ Created approval settings for {$tenant->name}");
        }
        
        $this->command->info('✅ Approval Settings seeded successfully!');
        $this->command->info("   Total: " . ApprovalSettings::count() . " settings created");
    }
}
