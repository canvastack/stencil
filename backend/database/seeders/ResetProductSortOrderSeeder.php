<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Infrastructure\Persistence\Eloquent\Models\Product;

class ResetProductSortOrderSeeder extends Seeder
{
    /**
     * Reset all products sort_order to 0 (default state)
     * This allows the system to use created_at DESC as default ordering
     * Admin can manually reorder products later, which will set sort_order > 0
     */
    public function run(): void
    {
        $this->command->info('🔄 Resetting all product sort_order to 0 (default state)...');
        
        $updated = DB::table('products')->update(['sort_order' => 0]);
        
        $this->command->info("✅ Successfully reset sort_order for {$updated} products!");
        $this->command->info("📌 Products will now display by created_at DESC (newest first) by default");
        $this->command->info("📌 Admin can manually reorder products using drag-and-drop UI");
    }
}
