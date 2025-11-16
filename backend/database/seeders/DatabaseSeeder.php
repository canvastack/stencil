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
        
        // Seed Platform Data (Account A - Platform Owners & Demo Tenant)
        $this->command->info('📊 Seeding Platform Foundation...');
        $this->call(PlatformSeeder::class);
        
        $this->command->info('✅ Multi-Tenant Database Seeding Completed!');
        $this->command->info('');
        $this->command->info('📋 Summary:');
        $this->command->info('- Platform Accounts: 2 accounts');
        $this->command->info('- Demo Business Tenant: 1 tenant');
        $this->command->info('- Demo Tenant Users: 3 users');
        $this->command->info('- Platform Roles: 3 roles');
        $this->command->info('- Tenant Roles: 4 roles');
        $this->command->info('');
        $this->command->info('🔐 Default Login Credentials:');
        $this->command->info('Platform Super Admin: admin@canvastencil.com / SuperAdmin2024!');
        $this->command->info('Platform Manager: manager@canvastencil.com / Manager2024!');
        $this->command->info('Demo Tenant Admin: admin@demo-etching.com / DemoAdmin2024!');
        $this->command->info('Demo Tenant Manager: manager@demo-etching.com / DemoManager2024!');
        $this->command->info('Demo Tenant Sales: sales@demo-etching.com / DemoSales2024!');
    }
}
