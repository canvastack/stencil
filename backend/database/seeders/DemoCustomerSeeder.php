<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Infrastructure\Persistence\Eloquent\CustomerEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Carbon\Carbon;

class DemoCustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * Creates demo customer accounts for testing the customer quote workflow.
     */
    public function run(): void
    {
        $this->command->info('👤 Creating Demo Customer Accounts...');
        
        $tenants = TenantEloquentModel::all();
        
        if ($tenants->isEmpty()) {
            $this->command->error('❌ No tenants found. Please run tenant seeders first.');
            return;
        }
        
        foreach ($tenants as $tenant) {
            $this->createDemoCustomers($tenant);
            $this->command->info("   ✅ Created demo customers for {$tenant->name}");
        }
        
        $this->command->info('✅ Demo customer accounts created successfully!');
        $this->displayCredentials();
    }
    
    /**
     * Create demo customers for a tenant
     */
    private function createDemoCustomers($tenant): void
    {
        $demoCustomers = [
            [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'email' => 'customer@demo.com',
                'phone' => '+62812345678',
                'company_name' => 'Demo Company Ltd',
                'customer_type' => 'business',
                'account_type' => 'verified',
                'password' => 'password',
                'description' => 'Demo verified customer account for testing',
            ],
            [
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'email' => 'jane.smith@example.com',
                'phone' => '+62823456789',
                'company_name' => 'Smith Industries',
                'customer_type' => 'business',
                'account_type' => 'verified',
                'password' => 'password',
                'description' => 'Demo verified customer - high trust score',
            ],
            [
                'first_name' => 'Bob',
                'last_name' => 'Johnson',
                'email' => 'bob.johnson@example.com',
                'phone' => '+62834567890',
                'company_name' => null,
                'customer_type' => 'individual',
                'account_type' => 'registered',
                'password' => 'password',
                'description' => 'Demo registered customer - not yet verified',
            ],
            [
                'first_name' => 'Alice',
                'last_name' => 'Williams',
                'email' => 'alice.williams@example.com',
                'phone' => '+62845678901',
                'company_name' => null,
                'customer_type' => 'individual',
                'account_type' => 'guest',
                'password' => null,
                'description' => 'Demo guest customer - no authentication',
            ],
        ];
        
        foreach ($demoCustomers as $customerData) {
            // Check if customer already exists
            $existing = CustomerEloquentModel::where('tenant_id', $tenant->id)
                ->where('email', $customerData['email'])
                ->first();
                
            if ($existing) {
                $this->command->info("   ℹ️  Customer {$customerData['email']} already exists, skipping...");
                continue;
            }
            
            $this->createCustomer($tenant, $customerData);
        }
    }
    
    /**
     * Create a single customer
     */
    private function createCustomer($tenant, $data): void
    {
        $verifiedAt = $data['account_type'] === 'verified' 
            ? Carbon::now()->subDays(rand(30, 180)) 
            : null;
            
        $lastLoginAt = in_array($data['account_type'], ['verified', 'registered'])
            ? Carbon::now()->subDays(rand(0, 7))
            : null;
        
        CustomerEloquentModel::create([
            'uuid' => Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'name' => $data['first_name'] . ' ' . $data['last_name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'status' => 'active',
            'customer_type' => $data['customer_type'],
            'company_name' => $data['company_name'],
            'company' => $data['company_name'],
            'address' => $this->generateAddress(),
            'city' => 'Jakarta',
            'province' => 'DKI Jakarta',
            'postal_code' => '12345',
            'tags' => json_encode(['demo', 'test']),
            'metadata' => json_encode([
                'country' => 'Indonesia',
                'description' => $data['description'],
            ]),
            'notes' => $data['description'],
            'total_orders' => $data['account_type'] === 'verified' ? rand(5, 20) : 0,
            'total_spent' => $data['account_type'] === 'verified' ? rand(5000000, 50000000) : 0,
            'last_order_date' => $data['account_type'] === 'verified' ? Carbon::now()->subDays(rand(1, 30)) : null,
            
            // Authentication fields
            'account_type' => $data['account_type'],
            'password_hash' => $data['password'] ? Hash::make($data['password']) : null,
            'email_verified_at' => $verifiedAt,
            'registration_token' => $data['account_type'] === 'registered' ? Str::uuid()->toString() : null,
            'last_login_at' => $lastLoginAt,
            'login_count' => $data['account_type'] === 'verified' ? rand(10, 50) : rand(0, 5),
            'failed_login_attempts' => 0,
            'locked_until' => null,
            
            // Timestamps
            'created_at' => Carbon::now()->subDays(rand(30, 365)),
            'updated_at' => Carbon::now(),
        ]);
    }
    
    /**
     * Generate random address
     */
    private function generateAddress(): string
    {
        $streets = [
            'Jl. Sudirman',
            'Jl. Thamrin',
            'Jl. Gatot Subroto',
            'Jl. Kuningan',
            'Jl. Rasuna Said',
        ];
        
        return $streets[array_rand($streets)] . ' No. ' . rand(1, 100);
    }
    
    /**
     * Display demo credentials
     */
    private function displayCredentials(): void
    {
        $this->command->info('');
        $this->command->info('📋 Demo Customer Credentials:');
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('');
        
        $this->command->info('1️⃣  VERIFIED CUSTOMER (Full Access)');
        $this->command->info('   Email: customer@demo.com');
        $this->command->info('   Password: password');
        $this->command->info('   Type: Business (Demo Company Ltd)');
        $this->command->info('   Status: ✅ Email Verified');
        $this->command->info('   Use for: Testing full customer portal features');
        $this->command->info('');
        
        $this->command->info('2️⃣  VERIFIED CUSTOMER (High Trust)');
        $this->command->info('   Email: jane.smith@example.com');
        $this->command->info('   Password: password');
        $this->command->info('   Type: Business (Smith Industries)');
        $this->command->info('   Status: ✅ Email Verified, High Trust Score');
        $this->command->info('   Use for: Testing auto-approval workflow');
        $this->command->info('');
        
        $this->command->info('3️⃣  REGISTERED CUSTOMER (Not Verified)');
        $this->command->info('   Email: bob.johnson@example.com');
        $this->command->info('   Password: password');
        $this->command->info('   Type: Individual');
        $this->command->info('   Status: ⚠️  Not Verified');
        $this->command->info('   Use for: Testing manual approval workflow');
        $this->command->info('');
        
        $this->command->info('4️⃣  GUEST CUSTOMER (No Account)');
        $this->command->info('   Email: alice.williams@example.com');
        $this->command->info('   Password: N/A (Guest)');
        $this->command->info('   Type: Individual');
        $this->command->info('   Status: 👤 Guest (No Authentication)');
        $this->command->info('   Use for: Testing guest order flow');
        $this->command->info('');
        
        $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->command->info('');
        $this->command->info('🔗 Login URL: http://localhost:5173/customer/login');
        $this->command->info('🏪 Storefront: http://localhost:5173/etchinx');
        $this->command->info('');
    }
}
