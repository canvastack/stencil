<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class CustomerStatsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🔄 Synchronizing customer statistics...');
        
        // Run the sync command for all tenants
        Artisan::call('customers:sync-total-spent');
        
        $output = Artisan::output();
        $this->command->info($output);
        
        $this->command->info('✅ Customer statistics synchronized successfully!');
    }
}