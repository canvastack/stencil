<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ExchangeRateProvider;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Ramsey\Uuid\Uuid;

class ExchangeRateProviderSeeder extends Seeder
{
    /**
     * Seed default exchange rate providers for all tenants
     * 
     * This seeder creates the four default API providers with their respective
     * quotas and priorities as specified in the requirements:
     * 1. exchangerate-api.com (1500 quota, priority 1)
     * 2. currencyapi.com (300 quota, priority 2)
     * 3. frankfurter.app (unlimited, priority 3)
     * 4. fawazahmed0 (unlimited, priority 4)
     * 
     * Requirements: 2.1, 2.2, 2.3, 2.4
     */
    public function run(): void
    {
        $tenants = Tenant::all();
        
        if ($tenants->isEmpty()) {
            $this->command->warn('No tenants found. Skipping exchange rate provider seeding.');
            return;
        }

        $providersCreated = 0;
        $providersSkipped = 0;

        foreach ($tenants as $tenant) {
            // Check if providers already exist for this tenant
            $existingCount = ExchangeRateProvider::where('tenant_id', $tenant->id)->count();
            
            if ($existingCount > 0) {
                $this->command->info("Providers already exist for tenant {$tenant->name}. Skipping.");
                $providersSkipped += $existingCount;
                continue;
            }

            $providers = [
                [
                    'uuid' => Uuid::uuid4()->toString(),
                    'tenant_id' => $tenant->id,
                    'name' => 'ExchangeRate-API',
                    'code' => "exchangerate-api-{$tenant->id}",
                    'api_url' => 'https://v6.exchangerate-api.com/v6',
                    'api_key' => null, // To be configured by admin
                    'requires_api_key' => true,
                    'is_unlimited' => false,
                    'monthly_quota' => 1500,
                    'priority' => 1,
                    'is_enabled' => true,
                    'warning_threshold' => 50,
                    'critical_threshold' => 20,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'uuid' => Uuid::uuid4()->toString(),
                    'tenant_id' => $tenant->id,
                    'name' => 'CurrencyAPI',
                    'code' => "currencyapi-{$tenant->id}",
                    'api_url' => 'https://api.currencyapi.com/v3',
                    'api_key' => null, // To be configured by admin
                    'requires_api_key' => true,
                    'is_unlimited' => false,
                    'monthly_quota' => 300,
                    'priority' => 2,
                    'is_enabled' => true,
                    'warning_threshold' => 50,
                    'critical_threshold' => 20,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'uuid' => Uuid::uuid4()->toString(),
                    'tenant_id' => $tenant->id,
                    'name' => 'Frankfurter',
                    'code' => "frankfurter-{$tenant->id}",
                    'api_url' => 'https://api.frankfurter.app',
                    'api_key' => null,
                    'requires_api_key' => false,
                    'is_unlimited' => true,
                    'monthly_quota' => 0, // 0 indicates unlimited
                    'priority' => 3,
                    'is_enabled' => true,
                    'warning_threshold' => 100, // Set to 100 for unlimited providers
                    'critical_threshold' => 50, // Set to 50 for unlimited providers
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'uuid' => Uuid::uuid4()->toString(),
                    'tenant_id' => $tenant->id,
                    'name' => 'Fawazahmed0',
                    'code' => "fawazahmed0-{$tenant->id}",
                    'api_url' => 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1',
                    'api_key' => null,
                    'requires_api_key' => false,
                    'is_unlimited' => true,
                    'monthly_quota' => 0, // 0 indicates unlimited
                    'priority' => 4,
                    'is_enabled' => true,
                    'warning_threshold' => 100, // Set to 100 for unlimited providers
                    'critical_threshold' => 50, // Set to 50 for unlimited providers
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ];

            foreach ($providers as $providerData) {
                ExchangeRateProvider::create($providerData);
                $providersCreated++;
            }
        }

        if ($providersSkipped > 0) {
            $this->command->info("Skipped {$providersSkipped} existing providers");
        }
        $this->command->info("Created {$providersCreated} exchange rate providers across {$tenants->count()} tenant(s)");
    }
}
