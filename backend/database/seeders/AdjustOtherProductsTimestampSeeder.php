<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;

class AdjustOtherProductsTimestampSeeder extends Seeder
{
    /**
     * Adjust timestamps for non-PT CEX products to be OLDER than PT CEX products
     * Strategy:
     * - PT CEX products: Last 30 days (newest)
     * - Other products: 31-365 days ago (older)
     */
    public function run(): void
    {
        $this->command->info('🔄 Adjusting timestamps for non-PT CEX products...');

        $tenant = TenantEloquentModel::where('slug', 'etchinx')->first();

        if (!$tenant) {
            $this->command->error('❌ Custom Etching Xenial tenant not found!');
            return;
        }

        // Get PT CEX product SKUs (they start with CEX-)
        $ptCexProducts = Product::where('tenant_id', $tenant->id)
            ->where('sku', 'LIKE', 'CEX-%')
            ->pluck('id');

        $this->command->info("📌 Found {$ptCexProducts->count()} PT CEX products (will keep their timestamps)");

        // Get all other products for this tenant
        $otherProducts = Product::where('tenant_id', $tenant->id)
            ->whereNotIn('id', $ptCexProducts)
            ->get();

        $this->command->info("📦 Found {$otherProducts->count()} other products (will adjust timestamps)");

        if ($otherProducts->isEmpty()) {
            $this->command->info("✅ No other products to adjust!");
            return;
        }

        $updated = 0;
        
        // Distribute other products from 31 days ago to 365 days ago
        $totalOtherProducts = $otherProducts->count();
        
        foreach ($otherProducts as $index => $product) {
            // Calculate days ago: 31 to 365 days
            // First product = 365 days ago (oldest)
            // Last product = 31 days ago (just before PT CEX products)
            $daysAgo = 365 - (int)(($index / $totalOtherProducts) * (365 - 31));
            
            $createdAt = Carbon::now()
                ->subDays($daysAgo)
                ->subHours(rand(0, 23))
                ->subMinutes(rand(0, 59));
            
            $updatedAt = $createdAt->copy()
                ->addDays(rand(0, min($daysAgo, 30)))
                ->addHours(rand(0, 23));

            $product->created_at = $createdAt;
            $product->updated_at = $updatedAt;
            $product->save();
            
            $updated++;
        }

        $this->command->info("✅ Successfully adjusted timestamps for {$updated} products!");
        $this->command->info("📅 Other products now range from 365 days ago to 31 days ago");
        $this->command->info("📅 PT CEX products remain in last 30 days (newest)");
        $this->command->info("🎯 PT CEX products will now appear FIRST when sorted by created_at DESC");
    }
}
