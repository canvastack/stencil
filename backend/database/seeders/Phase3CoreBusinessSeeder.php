<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\CustomerEloquentModel;
use App\Infrastructure\Persistence\Eloquent\OrderEloquentModel;
use App\Infrastructure\Persistence\Eloquent\VendorEloquentModel;
use Carbon\Carbon;

class Phase3CoreBusinessSeeder extends Seeder
{
    private array $materials = [
        'Acrylic' => ['Clear', 'Black', 'White', 'Colored', 'Frosted'],
        'Metal' => ['Stainless Steel', 'Aluminum', 'Brass', 'Copper', 'Bronze'],
        'Wood' => ['Mahogany', 'Oak', 'Teak', 'Pine', 'Walnut'],
        'Glass' => ['Clear Glass', 'Tempered Glass', 'Frosted Glass', 'Colored Glass'],
        'Composite' => ['MDF', 'Plywood', 'Chipboard', 'Fiberboard'],
    ];

    private array $qualityLevels = [
        'Standard' => ['price_multiplier' => 1.0, 'description' => 'Good quality for general use'],
        'Premium' => ['price_multiplier' => 1.5, 'description' => 'High quality with superior finish'],
        'Professional' => ['price_multiplier' => 2.0, 'description' => 'Professional grade materials'],
        'Luxury' => ['price_multiplier' => 3.0, 'description' => 'Luxury grade with exceptional finish'],
    ];

    public function run(): void
    {
        $this->command->info('🚀 Phase 3: Core Business Logic Seeding Started...');
        
        $tenants = TenantEloquentModel::all();
        
        foreach ($tenants as $tenant) {
            $this->command->info("   📊 Processing Tenant: {$tenant->name}");
            
            $categories = $this->seedProductCategories($tenant);
            $this->command->info("      ✅ Created " . count($categories) . " product categories with hierarchy");
            
            $this->seedProducts($tenant, $categories);
            $this->command->info("      ✅ Created 50+ products with detailed specifications");
        }
        
        $this->command->info('✅ Phase 3 Core Business Seeding Completed!');
    }

    private function seedProductCategories($tenant): array
    {
        // Skip if already exists
        $existingCount = ProductCategory::where('tenant_id', $tenant->id)->count();
        if ($existingCount > 0) {
            $this->command->info("      ℹ️  Categories already exist for {$tenant->name}, skipping...");
            return ProductCategory::where('tenant_id', $tenant->id)->get()->all();
        }
        
        $categoriesData = [
            [
                'name' => 'Custom Engraving & Etching',
                'description' => 'Professional laser engraving and etching services',
                'children' => [
                    ['name' => 'Metal Engraving', 'description' => 'Precision engraving on metal'],
                    ['name' => 'Glass Etching', 'description' => 'Glass etching for awards'],
                    ['name' => 'Acrylic Engraving', 'description' => 'Acrylic engraving for signage'],
                ]
            ],
            [
                'name' => 'Awards & Trophies',
                'description' => 'Custom awards and recognition items',
                'children' => [
                    ['name' => 'Corporate Awards', 'description' => 'Professional corporate awards'],
                    ['name' => 'Sports Trophies', 'description' => 'Championship trophies'],
                ]
            ],
        ];

        $categories = [];
        foreach ($categoriesData as $catData) {
            $parent = ProductCategory::create([
                'tenant_id' => $tenant->id,
                'name' => $catData['name'],
                'slug' => Str::slug($catData['name']),
                'description' => $catData['description'],
            ]);
            $categories[] = $parent;

            if (isset($catData['children'])) {
                foreach ($catData['children'] as $childData) {
                    $child = ProductCategory::create([
                        'tenant_id' => $tenant->id,
                        'parent_id' => $parent->id,
                        'name' => $childData['name'],
                        'slug' => Str::slug($childData['name']),
                        'description' => $childData['description'],
                    ]);
                    $categories[] = $child;
                }
            }
        }

        return $categories;
    }

    private function seedProducts($tenant, $categories): void
    {
        // Skip if tenant already has phase 3 products
        $existingProducts = Product::where('tenant_id', $tenant->id)
            ->whereJsonContains('metadata->phase', 'phase_3')
            ->count();
        if ($existingProducts >= 50) {
            return;
        }

        $productTemplates = [
            'Custom Engraved %s %s',
            'Premium %s %s',
            'Professional %s %s',
            'Elegant %s %s',
        ];

        $items = [
            'Plaque', 'Trophy', 'Award', 'Sign', 'Display', 'Frame', 
            'Box', 'Holder', 'Stand', 'Plate', 'Tag', 'Label',
        ];

        $subcategories = [
            'Corporate Recognition', 'Employee Awards', 'Customer Appreciation',
        ];

        $backgroundColors = ['#FFFFFF', '#F5F5F5', '#E8E8E8'];

        $productsCreated = 0;
        $targetProducts = 50;

        while ($productsCreated < $targetProducts) {
            $category = $categories[array_rand($categories)];
            $template = $productTemplates[array_rand($productTemplates)];
            $materialType = array_rand($this->materials);
            $material = $this->materials[$materialType][array_rand($this->materials[$materialType])];
            $item = $items[array_rand($items)];

            $name = sprintf($template, $material, $item);
            $basePrice = rand(75000, 500000);
            $vendorPrice = (int) ($basePrice * 0.6);
            
            // Build comprehensive metadata
            $metadata = [
                'created_by' => 'seeder',
                'phase' => 'phase_3',
                'last_updated' => Carbon::now()->toDateTimeString(),
                'version' => '2.0',
                
                // Product details
                'material' => $material,
                'material_type' => $materialType,
                'size' => '30x40',
                'available_sizes' => ['10x15', '15x20', '20x30', '25x35', '30x40', 'custom'],
                'available_materials' => $this->materials[$materialType],
                'quality_levels' => array_keys($this->qualityLevels),
                
                // Form configuration
                'subcategory' => $subcategories[array_rand($subcategories)],
                'product_type' => ['metal', 'glass', 'award'][rand(0, 2)],
                'bahan' => strtolower(str_replace(' ', '-', $material)),
                'kualitas' => ['Standard', 'Premium'][rand(0, 1)],
                'ketebalan' => ['3mm', '5mm', '8mm'][rand(0, 2)],
                'ukuran' => '30x40',
                'warna_background' => $backgroundColors[array_rand($backgroundColors)],
                
                // Business logic
                'price_unit' => 'piece',
                'business_type' => 'general',
                'production_type' => ['internal', 'vendor'][rand(0, 1)],
                'min_order_quantity' => rand(1, 5),
                'max_order_quantity' => rand(100, 1000),
                'lead_time' => rand(3, 14) . ' working days',
                
                // Features and specs
                'features' => [
                    'Premium ' . $material . ' material',
                    'Professional laser engraving',
                    'Customizable design',
                ],
                'specifications' => [
                    'Material' => $material,
                    'Finish' => 'Polished',
                    'Thickness' => '8mm',
                ],
                
                // Customization
                'customizable' => true,
                'custom_options' => [
                    ['name' => 'Engraving Text', 'type' => 'text', 'required' => true],
                    ['name' => 'Size', 'type' => 'select', 'options' => ['Small', 'Medium', 'Large']],
                ],
                'requires_quote' => false,
                
                // Engagement metrics
                'featured' => false,
                'view_count' => rand(50, 500),
                'average_rating' => 4.5,
                'review_count' => rand(5, 50),
            ];

            $product = Product::create([
                'tenant_id' => $tenant->id,
                // uuid auto-generated by DB
                'name' => $name,
                'sku' => 'SKU-' . strtoupper(Str::random(8)),
                'slug' => Str::slug($name) . '-' . Str::random(4),
                'description' => "High-quality {$name} made from premium {$material}. Perfect for corporate awards and recognition programs.",
                
                'price' => $basePrice,
                'currency' => 'IDR',
                'vendor_price' => $vendorPrice,
                'markup_percentage' => round((($basePrice - $vendorPrice) / $vendorPrice) * 100),
                
                'status' => 'published',
                'type' => 'physical',
                
                'stock_quantity' => rand(10, 100),
                'low_stock_threshold' => 10,
                'track_inventory' => true,
                
                'images' => [
                    'https://via.placeholder.com/800x600?text=Product+Image+1',
                    'https://via.placeholder.com/800x600?text=Product+Image+2',
                ],
                'tags' => ['custom', 'professional', strtolower($material), strtolower($item)],
                'categories' => [$category->name],
                
                'seo_title' => $name . ' | ' . $tenant->name,
                'seo_description' => substr("High-quality {$name} made from premium {$material}.", 0, 155),
                
                'metadata' => $metadata,
                'dimensions' => [
                    'width' => rand(10, 30),
                    'height' => rand(10, 30),
                    'depth' => rand(5, 15),
                    'unit' => 'cm',
                    'weight' => rand(200, 1500),
                    'weight_unit' => 'grams',
                ],
            ]);

            $productsCreated++;
        }
    }
}
