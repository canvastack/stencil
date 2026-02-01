<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ExchangeRateSetting;
use App\Models\ExchangeRateProvider;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Ramsey\Uuid\Uuid;

class ExchangeRateSettingSeeder extends Seeder
{
    /**
     * Seed default exchange rate settings for all tenants
     * 
     * This seeder creates default settings with auto mode enabled and
     * the first provider (highest priority) set as active.
     * 
     * Requirements: 1.1
     */
    public function run(): void
    {
        $tenants = Tenant::all();
        
        if ($tenants->isEmpty()) {
            $this->command->warn('No tenants found. Skipping exchange rate settings seeding.');
            return;
        }

        $settingsCreated = 0;

        foreach ($tenants as $tenant) {
            // Get the first provider (highest priority) for this tenant
            $firstProvider = ExchangeRateProvider::where('tenant_id', $tenant->id)
                ->orderBy('priority', 'asc')
                ->first();

            if (!$firstProvider) {
                $this->command->warn("No providers found for tenant {$tenant->name}. Skipping settings creation.");
                continue;
            }

            // Check if settings already exist for this tenant
            $existingSetting = ExchangeRateSetting::where('tenant_id', $tenant->id)->first();
            
            if ($existingSetting) {
                $this->command->info("Settings already exist for tenant {$tenant->name}. Skipping.");
                continue;
            }

            ExchangeRateSetting::create([
                'uuid' => Uuid::uuid4()->toString(),
                'tenant_id' => $tenant->id,
                'mode' => 'auto',
                'manual_rate' => null,
                'current_rate' => null, // Will be populated on first API fetch
                'active_provider_id' => $firstProvider->id,
                'auto_update_enabled' => true,
                'auto_update_time' => '00:00:00',
                'last_updated_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $settingsCreated++;
        }

        $this->command->info("Created {$settingsCreated} exchange rate settings across {$tenants->count()} tenant(s)");
    }
}
