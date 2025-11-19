<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🌱 Starting Multi-Tenant Database Seeding...');
        
        // Seed Platform Data (Account A - Platform Owners & Demo Tenants)
        $this->command->info('📊 Seeding Platform Foundation...');
        $this->call(PlatformSeeder::class);
        
        // Seed Additional Tenants & Business Data
        $this->command->info('🏢 Seeding Multi-Tenant Business Data...');
        $this->call(MultiTenantBusinessSeeder::class);
        
        // Seed Tenant Business Data (Customers, Products, Orders, etc.)
        $this->command->info('📈 Seeding Tenant Business Operations...');
        $this->call(TenantDataSeeder::class);
        
        // Seed Phase 3 Core Business Logic Data
        $this->command->info('🚀 Seeding Phase 3 Core Business Logic...');
        $this->call(Phase3CoreBusinessSeeder::class);
        
        $this->command->info('✅ Multi-Tenant Database Seeding Completed!');
        $this->command->info('');
        $this->command->info('📊 Final Summary:');
        $this->command->info('- Platform Accounts: 2 accounts');
        $this->command->info('- Total Tenants: 6+ tenants (Demo + Additional)');
        $this->command->info('- Total Users: 50+ users across all tenants');
        $this->command->info('- Total Customers: 200+ customers');
        $this->command->info('- Total Products: 300+ products (Phase 3 enhanced)');
        $this->command->info('- Product Categories: 20+ categories with hierarchy');
        $this->command->info('- Total Orders: 400+ orders (with realistic workflows)');
        $this->command->info('- Total Vendors: 50+ vendors');
        $this->command->info('- Platform Roles: 3 roles');
        $this->command->info('- Tenant Roles: 4 roles per tenant');
        $this->command->info('');
        $this->command->info('🔐 Default Login Credentials:');
        $this->command->info('Platform Super Admin: admin@canvastencil.com / SuperAdmin2024!');
        $this->command->info('Platform Manager: manager@canvastencil.com / Manager2024!');
        $this->command->info('Demo Tenant Admin: admin@demo-etching.com / DemoAdmin2024!');
        $this->command->info('Demo Tenant Manager: manager@demo-etching.com / DemoManager2024!');
        $this->command->info('Demo Tenant Sales: sales@demo-etching.com / DemoSales2024!');
    }
}
