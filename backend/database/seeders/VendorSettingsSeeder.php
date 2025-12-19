<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Infrastructure\Persistence\Eloquent\Models\Setting;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Support\Facades\DB;

class VendorSettingsSeeder extends Seeder
{
    public function run(): void
    {
        // Get first tenant for seeding (development purposes)
        $tenant = TenantEloquentModel::first();
        
        if (!$tenant) {
            $this->command->error('No tenant found! Please create a tenant first.');
            return;
        }
        
        $this->command->info("Seeding vendor settings for tenant: {$tenant->name} (UUID: {$tenant->uuid}, ID: {$tenant->id})");
        
        // Set current tenant in app container for BelongsToTenant trait
        app()->instance('tenant.current', $tenant);
        
        $vendorSettings = [
            [
                'key' => 'vendor.company_size.large_threshold',
                'value' => '100',
                'type' => 'integer',
                'category' => 'vendor',
                'label' => 'Large Vendor Threshold',
                'description' => 'Minimum total orders for a vendor to be classified as "Large"',
                'is_public' => false,
                'is_editable' => true,
                'validation_rules' => json_encode(['min' => 1, 'max' => 10000]),
            ],
            [
                'key' => 'vendor.company_size.medium_threshold',
                'value' => '20',
                'type' => 'integer',
                'category' => 'vendor',
                'label' => 'Medium Vendor Threshold',
                'description' => 'Minimum total orders for a vendor to be classified as "Medium"',
                'is_public' => false,
                'is_editable' => true,
                'validation_rules' => json_encode(['min' => 1, 'max' => 1000]),
            ],
            [
                'key' => 'vendor.approval.min_rating',
                'value' => '4.5',
                'type' => 'float',
                'category' => 'vendor',
                'label' => 'Minimum Rating for Auto-Approval',
                'description' => 'Minimum vendor rating (0-5) required for automatic approval of orders',
                'is_public' => false,
                'is_editable' => true,
                'validation_rules' => json_encode(['min' => 0, 'max' => 5, 'step' => 0.1]),
            ],
            [
                'key' => 'vendor.payment.default_terms',
                'value' => '30',
                'type' => 'integer',
                'category' => 'vendor',
                'label' => 'Default Payment Terms',
                'description' => 'Default payment terms in days for new vendors',
                'is_public' => false,
                'is_editable' => true,
                'validation_rules' => json_encode(['min' => 0, 'max' => 365]),
            ],
            [
                'key' => 'vendor.lead_time.max_days',
                'value' => '60',
                'type' => 'integer',
                'category' => 'vendor',
                'label' => 'Maximum Lead Time',
                'description' => 'Maximum acceptable lead time in days for vendor orders',
                'is_public' => false,
                'is_editable' => true,
                'validation_rules' => json_encode(['min' => 1, 'max' => 365]),
            ],
        ];

        foreach ($vendorSettings as $setting) {
            Setting::withoutGlobalScope('tenant')->updateOrCreate(
                [
                    'tenant_id' => $tenant->id,  // Use tenant ID, not UUID
                    'key' => $setting['key']
                ],
                $setting // tenant_id will be auto-filled by BelongsToTenant trait
            );
        }

        $this->command->info('Vendor settings seeded successfully!');
    }
}
