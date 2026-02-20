<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Infrastructure\Persistence\Eloquent\CustomerEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Carbon\Carbon;

class CustomerAuthenticationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder updates existing customers with authentication fields
     * to support the customer quote workflow.
     */
    public function run(): void
    {
        $this->command->info('🔐 Updating Customers with Authentication Fields...');
        
        $tenants = TenantEloquentModel::all();
        
        foreach ($tenants as $tenant) {
            $customers = CustomerEloquentModel::where('tenant_id', $tenant->id)->get();
            
            if ($customers->isEmpty()) {
                $this->command->info("   ℹ️  No customers found for {$tenant->name}, skipping...");
                continue;
            }
            
            $this->updateCustomersWithAuth($tenant, $customers);
            $this->command->info("   ✅ Updated {$customers->count()} customers for {$tenant->name}");
        }
        
        $this->command->info('✅ Customer authentication fields updated successfully!');
        
        // Summary
        $guestCount = CustomerEloquentModel::where('account_type', 'guest')->count();
        $registeredCount = CustomerEloquentModel::where('account_type', 'registered')->count();
        $verifiedCount = CustomerEloquentModel::where('account_type', 'verified')->count();
        
        $this->command->info("📊 Authentication Summary:");
        $this->command->info("   - Guest Customers: {$guestCount}");
        $this->command->info("   - Registered Customers: {$registeredCount}");
        $this->command->info("   - Verified Customers: {$verifiedCount}");
    }
    
    /**
     * Update customers with authentication fields
     */
    private function updateCustomersWithAuth($tenant, $customers): void
    {
        foreach ($customers as $customer) {
            // Skip if already has authentication data
            if ($customer->account_type && $customer->account_type !== 'guest') {
                continue;
            }
            
            // Determine account type distribution:
            // 40% guest, 30% registered, 30% verified
            $rand = rand(1, 100);
            
            if ($rand <= 40) {
                // Guest customer - no authentication
                $this->updateAsGuest($customer);
            } elseif ($rand <= 70) {
                // Registered but not verified
                $this->updateAsRegistered($customer);
            } else {
                // Verified customer
                $this->updateAsVerified($customer);
            }
        }
    }
    
    /**
     * Update customer as guest (no authentication)
     */
    private function updateAsGuest($customer): void
    {
        $customer->update([
            'account_type' => 'guest',
            'password_hash' => null,
            'email_verified_at' => null,
            'registration_token' => null,
            'last_login_at' => null,
            'login_count' => 0,
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);
    }
    
    /**
     * Update customer as registered (has password but not verified)
     */
    private function updateAsRegistered($customer): void
    {
        $customer->update([
            'account_type' => 'registered',
            'password_hash' => Hash::make('password'), // Default password for testing
            'email_verified_at' => null,
            'registration_token' => Str::uuid()->toString(),
            'last_login_at' => rand(0, 10) > 5 ? Carbon::now()->subDays(rand(1, 30)) : null,
            'login_count' => rand(0, 5),
            'failed_login_attempts' => rand(0, 2),
            'locked_until' => null,
        ]);
    }
    
    /**
     * Update customer as verified (full account)
     */
    private function updateAsVerified($customer): void
    {
        $verifiedAt = Carbon::now()->subDays(rand(1, 180));
        $lastLoginAt = Carbon::now()->subDays(rand(0, 30));
        
        $customer->update([
            'account_type' => 'verified',
            'password_hash' => Hash::make('password'), // Default password for testing
            'email_verified_at' => $verifiedAt,
            'registration_token' => null, // Token consumed after verification
            'last_login_at' => $lastLoginAt,
            'login_count' => rand(5, 50),
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);
    }
}
