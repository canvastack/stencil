<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class VendorUserSeeder extends Seeder
{
    /**
     * Seed vendor user accounts for portal access
     * 
     * This seeder creates user accounts for vendors to access the vendor portal.
     * Each vendor user is linked to a vendor record and has account_type='vendor'.
     */
    public function run(): void
    {
        $this->command->info('👤 Seeding Vendor User Accounts...');

        // Get PT CEX tenant
        $tenant = DB::table('tenants')->where('id', 1)->first();
        
        if (!$tenant) {
            $this->command->warn('PT CEX tenant not found. Skipping VendorUserSeeder.');
            return;
        }

        // Get vendor with ID 133 (UD Grosir Utama)
        $vendor = DB::table('vendors')->where('id', 133)->first();
        
        if (!$vendor) {
            $this->command->warn('Vendor with ID 133 not found. Skipping VendorUserSeeder.');
            return;
        }

        // Check if user already exists
        $existingUser = DB::table('users')
            ->where('email', 'vendor@etchinx.com')
            ->first();

        if ($existingUser) {
            $this->command->info('Vendor user already exists. Updating...');
            
            // Update existing user
            DB::table('users')
                ->where('id', $existingUser->id)
                ->update([
                    'name' => $vendor->name,
                    'password' => Hash::make('VendorDemo2024!'),
                    'email_verified_at' => Carbon::now(),
                    'tenant_id' => $vendor->tenant_id,
                    'vendor_id' => $vendor->uuid,
                    'account_type' => 'vendor',
                    'updated_at' => Carbon::now(),
                ]);
            
            $userId = $existingUser->id;
            $this->command->info("✅ Updated existing vendor user (ID: {$userId})");
        } else {
            // Create new user
            $userId = DB::table('users')->insertGetId([
                'name' => $vendor->name,
                'email' => 'vendor@etchinx.com',
                'password' => Hash::make('VendorDemo2024!'),
                'email_verified_at' => Carbon::now(),
                'tenant_id' => $vendor->tenant_id,
                'vendor_id' => $vendor->uuid,
                'account_type' => 'vendor',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            
            $this->command->info("✅ Created new vendor user (ID: {$userId})");
        }

        // Ensure vendor has portal access enabled
        DB::table('vendors')
            ->where('id', $vendor->id)
            ->update([
                'status' => 'active',
                'portal_access_enabled' => true,
                'onboarding_status' => 'completed',
                'onboarding_completed_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);

        $this->command->info('✅ Vendor portal access enabled');
        $this->command->info('');
        $this->command->info('📋 Vendor User Credentials:');
        $this->command->info('   Email: vendor@etchinx.com');
        $this->command->info('   Password: VendorDemo2024!');
        $this->command->info('   Vendor: ' . $vendor->name);
        $this->command->info('   Tenant: PT CEX (ID: 1)');
    }
}
