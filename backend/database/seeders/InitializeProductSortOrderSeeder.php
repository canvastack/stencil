<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Infrastructure\Persistence\Eloquent\Models\Product;

class InitializeProductSortOrderSeeder extends Seeder
{
    /**
     * Initialize sort_order for products that have 0 or null values
     * Based on created_at timestamp (oldest = 0, newest = highest)
     */
    public function run(): void
    {
        $this->command->info('🔄 Initializing product sort_order values...');
        
        // Get all tenants
        $tenants = DB::table('tenants')->pluck('id');
        
        $totalUpdated = 0;
        
        foreach ($tenants as $tenantId) {
            // Get products for this tenant ordered by created_at
            $products = Product::where('tenant_id', $tenantId)
                ->orderBy('created_at', 'asc')
                ->orderBy('id', 'asc')
                ->get();
            
            if ($products->isEmpty()) {
                continue;
            }
            
            $this->command->info("  Processing {$products->count()} products for tenant ID: {$tenantId}");
            
            // Assign sort_order based on creation order
            foreach ($products as $index => $product) {
                $product->sort_order = $index;
                $product->save();
                $totalUpdated++;
            }
        }
        
        $this->command->info("✅ Successfully initialized sort_order for {$totalUpdated} products!");
    }
}
