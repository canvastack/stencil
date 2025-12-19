<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\ProductVariant;

class ProductVariantSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('📦 Seeding Product Variants...');

        $tenants = TenantEloquentModel::all();
        $totalVariants = 0;

        foreach ($tenants as $tenant) {
            $this->command->info("   Processing tenant: {$tenant->name}");
            
            $products = Product::where('tenant_id', $tenant->id)->get();
            
            if ($products->isEmpty()) {
                $this->command->warn("   No products found for {$tenant->name} - skipping variants");
                continue;
            }

            $variantCount = 0;
            
            foreach ($products as $product) {
                $numberOfVariants = $this->getVariantCountForProduct($product);
                
                for ($i = 0; $i < $numberOfVariants; $i++) {
                    $this->createVariant($tenant, $product, $i);
                    $variantCount++;
                }
            }

            $totalVariants += $variantCount;
            $this->command->info("   ✓ Created {$variantCount} variants for {$tenant->name}");
        }

        $this->command->info("✅ Product variants seeded successfully!");
        $this->command->info("📈 Total variants created: {$totalVariants}");
        
        $variantsByTenant = ProductVariant::selectRaw('tenant_id, count(*) as count')
            ->groupBy('tenant_id')
            ->get();
            
        $this->command->info("📊 Variants per tenant:");
        foreach ($variantsByTenant as $stat) {
            $tenant = TenantEloquentModel::find($stat->tenant_id);
            $this->command->info("   - {$tenant->name}: {$stat->count} variants");
        }
    }

    private function getVariantCountForProduct(Product $product): int
    {
        $baseCount = rand(2, 5);
        
        if ($product->featured || str_contains(strtolower($product->name), 'premium')) {
            return $baseCount + rand(1, 3);
        }
        
        if (str_contains(strtolower($product->name), 'standard')) {
            return max(2, $baseCount - 1);
        }

        return $baseCount;
    }

    private function createVariant($tenant, $product, $index): void
    {
        $materials = ['Akrilik', 'Kuningan', 'Tembaga', 'Stainless Steel', 'Aluminum'];
        $qualities = ['Standard', 'Tinggi', 'Premium'];
        $thicknesses = [1, 1.5, 2, 3, 5, 8, 10];
        
        $colors = [
            'Hitam' => '#000000',
            'Putih' => '#FFFFFF',
            'Merah' => '#FF0000',
            'Biru' => '#0000FF',
            'Hijau' => '#00FF00',
            'Kuning' => '#FFFF00',
            'Silver' => '#C0C0C0',
            'Gold' => '#FFD700',
            'Bronze' => '#CD7F32',
            'Transparan' => '#FFFFFF00'
        ];

        $material = $materials[array_rand($materials)];
        $quality = $qualities[array_rand($qualities)];
        $thickness = $thicknesses[array_rand($thicknesses)];
        $colorName = array_rand($colors);
        $colorHex = $colors[$colorName];

        $sku = strtoupper(substr($tenant->slug, 0, 3)) 
             . '-' . strtoupper(substr($material, 0, 3))
             . '-' . str_pad($product->id, 4, '0', STR_PAD_LEFT)
             . '-' . str_pad($index + 1, 2, '0', STR_PAD_LEFT);

        $name = "{$material} {$quality} {$thickness}mm {$colorName}";

        $basePrice = $this->calculateBasePrice($material, $quality, $thickness);
        $costPrice = $basePrice * 0.6;
        $sellingPrice = $basePrice * 1.3;
        $retailPrice = $basePrice * 1.5;

        $priceAdjustment = rand(-20000, 50000);
        $vendorPrice = (int) ($costPrice + rand(-10000, 10000));

        $stockQuantity = rand(0, 200);
        $lowStockThreshold = rand(5, 20);

        $isDefault = $index === 0;
        $isActive = rand(0, 10) > 1;

        $leadTimeDays = rand(1, 14);
        $weight = $this->calculateWeight($material, $thickness);

        $dimensions = [
            'width' => rand(50, 500),
            'height' => rand(50, 500),
            'depth' => $thickness
        ];

        $etchingSpecs = [
            'max_detail_level' => ['fine', 'medium', 'coarse'][rand(0, 2)],
            'recommended_font_size' => rand(8, 24) . 'pt',
            'surface_finish' => ['matte', 'glossy', 'brushed'][rand(0, 2)],
            'edge_treatment' => ['polished', 'beveled', 'straight'][rand(0, 2)]
        ];

        $customFields = [
            'supplier_code' => 'SUP-' . rand(1000, 9999),
            'batch_number' => 'BATCH-' . date('Y') . '-' . rand(100, 999),
            'certification' => rand(0, 5) > 2 ? 'ISO-9001' : null,
            'origin_country' => ['Indonesia', 'China', 'Japan', 'Korea'][rand(0, 3)]
        ];

        $images = [
            "/images/variants/{$material}-{$thickness}mm-1.jpg",
            "/images/variants/{$material}-{$thickness}mm-2.jpg",
            "/images/variants/{$material}-{$colorName}-1.jpg"
        ];

        $specialNotes = $this->generateSpecialNotes($material, $quality, $thickness);

        ProductVariant::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'sku' => $sku
            ],
            [
                'product_id' => $product->id,
                'category_id' => $product->category_id,
                'name' => $name,
                'material' => $material,
                'quality' => $quality,
                'thickness' => $thickness,
                'color' => $colorName,
                'color_hex' => $colorHex,
                'dimensions' => $dimensions,
                'price_adjustment' => $priceAdjustment,
                'markup_percentage' => rand(20, 50) / 10,
                'vendor_price' => $vendorPrice,
                'base_price' => $basePrice,
                'selling_price' => $sellingPrice,
                'retail_price' => $retailPrice,
                'cost_price' => $costPrice,
                'stock_quantity' => $stockQuantity,
                'low_stock_threshold' => $lowStockThreshold,
                'track_inventory' => true,
                'allow_backorder' => rand(0, 10) > 7,
                'is_active' => $isActive,
                'is_default' => $isDefault,
                'sort_order' => $index,
                'lead_time_days' => $leadTimeDays,
                'lead_time_note' => "Production lead time: {$leadTimeDays} working days",
                'images' => $images,
                'custom_fields' => $customFields,
                'special_notes' => $specialNotes,
                'weight' => $weight,
                'length' => $dimensions['width'],
                'width' => $dimensions['height'],
                'shipping_dimensions' => [
                    'length' => $dimensions['width'],
                    'width' => $dimensions['height'],
                    'height' => $dimensions['depth'],
                    'unit' => 'mm'
                ],
                'etching_specifications' => $etchingSpecs,
                'created_at' => Carbon::now()->subDays(rand(7, 180)),
                'updated_at' => Carbon::now()->subDays(rand(0, 7))
            ]
        );
    }

    private function calculateBasePrice(string $material, string $quality, float $thickness): float
    {
        $materialPrices = [
            'Akrilik' => 50000,
            'Kuningan' => 120000,
            'Tembaga' => 100000,
            'Stainless Steel' => 150000,
            'Aluminum' => 80000
        ];

        $qualityMultipliers = [
            'Standard' => 1.0,
            'Tinggi' => 1.4,
            'Premium' => 1.8
        ];

        $baseMaterialPrice = $materialPrices[$material] ?? 75000;
        $qualityMultiplier = $qualityMultipliers[$quality] ?? 1.0;
        $thicknessMultiplier = 1 + ($thickness / 10);

        return round($baseMaterialPrice * $qualityMultiplier * $thicknessMultiplier, -3);
    }

    private function calculateWeight(string $material, float $thickness): float
    {
        $densities = [
            'Akrilik' => 1.18,
            'Kuningan' => 8.4,
            'Tembaga' => 8.96,
            'Stainless Steel' => 7.9,
            'Aluminum' => 2.7
        ];

        $density = $densities[$material] ?? 5.0;
        
        $area = rand(50, 500) * rand(50, 500) / 1000000;
        $volume = $area * ($thickness / 1000);
        
        return round($volume * $density * 1000, 2);
    }

    private function generateSpecialNotes(string $material, string $quality, float $thickness): ?string
    {
        if (rand(0, 10) < 4) {
            return null;
        }

        $notes = [
            "Recommended for {$material} {$quality} grade applications. Thickness {$thickness}mm provides excellent durability.",
            "Premium {$material} material with {$quality} quality certification. Ideal for professional etching work.",
            "High-precision {$thickness}mm {$material} suitable for detailed engraving and etching projects.",
            "This {$quality} quality {$material} variant offers superior finish and longevity.",
            "Custom manufacturing available upon request. Lead time may vary based on quantity."
        ];

        return $notes[array_rand($notes)];
    }
}
