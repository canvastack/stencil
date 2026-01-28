<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;

class ProductCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenants = TenantEloquentModel::all();
        
        $this->command->info("📊 Seeding product categories for {$tenants->count()} tenants...");

        foreach ($tenants as $tenant) {
            $this->command->info("   Processing categories for: {$tenant->name}");
            $this->seedCategoriesForTenant($tenant);
        }

        $this->command->info('✅ Product categories seeded successfully!');
        
        // Summary
        $totalCategories = ProductCategory::count();
        $this->command->info("📈 Total Categories Created: {$totalCategories}");
    }

    private function seedCategoriesForTenant($tenant): void
    {
        // Skip if tenant already has categories
        $existingCategories = ProductCategory::where('tenant_id', $tenant->id)->count();
        if ($existingCategories > 0) {
            return; // Already has categories
        }

        $businessType = $tenant->settings['business_type'] ?? 'general';
        
        // Define categories based on business type
        $categoryDefinitions = $this->getCategoryDefinitions($businessType);
        
        $sortOrder = 1;
        foreach ($categoryDefinitions as $categoryData) {
            $this->createCategory($tenant, $categoryData, $sortOrder++);
        }
    }

    private function getCategoryDefinitions($businessType): array
    {
        $definitions = [
            'etching' => [
                [
                    'name' => 'Awards & Trophies',
                    'description' => 'Custom engraved awards and trophies for achievements',
                    'color' => '#ff8000',
                    'business_type' => 'award_plaque',
                    'is_featured' => true,
                    'children' => [
                        ['name' => 'Corporate Awards', 'description' => 'Professional corporate recognition awards', 'business_type' => 'award_plaque'],
                        ['name' => 'Sports Trophies', 'description' => 'Athletic competition awards and trophies', 'business_type' => 'award_plaque'],
                        ['name' => 'Academic Awards', 'description' => 'Educational achievement recognition', 'business_type' => 'award_plaque']
                    ]
                ],
                [
                    'name' => 'Glass Etching',
                    'description' => 'Precision laser etched glass products',
                    'color' => '#4a90e2',
                    'business_type' => 'glass_etching',
                    'is_featured' => true,
                    'children' => [
                        ['name' => 'Decorative Glass', 'description' => 'Artistic etched glass panels and decorations', 'business_type' => 'glass_etching'],
                        ['name' => 'Functional Glass', 'description' => 'Practical etched glass items for daily use', 'business_type' => 'glass_etching'],
                        ['name' => 'Architectural Glass', 'description' => 'Building and structural glass etching', 'business_type' => 'glass_etching']
                    ]
                ],
                [
                    'name' => 'Metal Engraving',
                    'description' => 'High-quality metal etching and engraving',
                    'color' => '#f5a623',
                    'business_type' => 'metal_etching',
                    'is_featured' => true,
                    'children' => [
                        ['name' => 'Steel Engraving', 'description' => 'Durable steel plate and sheet engraving', 'business_type' => 'metal_etching'],
                        ['name' => 'Aluminum Etching', 'description' => 'Lightweight aluminum etching services', 'business_type' => 'metal_etching'],
                        ['name' => 'Brass & Copper', 'description' => 'Premium brass and copper engraving', 'business_type' => 'metal_etching']
                    ]
                ],
                [
                    'name' => 'Custom Plaques',
                    'description' => 'Personalized plaques for various occasions',
                    'color' => '#7b68ee',
                    'business_type' => 'award_plaque',
                    'is_featured' => false,
                    'children' => [
                        ['name' => 'Memorial Plaques', 'description' => 'Commemorative and memorial plaques', 'business_type' => 'award_plaque'],
                        ['name' => 'Name Plates', 'description' => 'Professional name plates and door signs', 'business_type' => 'signage'],
                        ['name' => 'Information Plaques', 'description' => 'Informational and directional signage', 'business_type' => 'signage']
                    ]
                ],
                [
                    'name' => 'Signage Solutions',
                    'description' => 'Commercial and industrial signage',
                    'color' => '#50e3c2',
                    'business_type' => 'signage',
                    'is_featured' => false,
                    'children' => [
                        ['name' => 'Indoor Signs', 'description' => 'Interior building signage solutions', 'business_type' => 'signage'],
                        ['name' => 'Outdoor Signs', 'description' => 'Weather-resistant outdoor signage', 'business_type' => 'signage'],
                        ['name' => 'Safety Signs', 'description' => 'Industrial safety and warning signs', 'business_type' => 'signage']
                    ]
                ],
                [
                    'name' => 'Industrial Etching',
                    'description' => 'Technical and industrial etching services',
                    'color' => '#d0021b',
                    'business_type' => 'industrial_etching',
                    'is_featured' => false,
                    'children' => [
                        ['name' => 'Circuit Boards', 'description' => 'Electronic circuit board etching', 'business_type' => 'industrial_etching'],
                        ['name' => 'Industrial Plates', 'description' => 'Manufacturing and equipment plates', 'business_type' => 'industrial_etching'],
                        ['name' => 'Technical Drawings', 'description' => 'Engineering diagram etching', 'business_type' => 'industrial_etching']
                    ]
                ]
            ],
            'electronics_retail' => [
                ['name' => 'Smartphones', 'description' => 'Latest mobile devices and accessories', 'color' => '#007AFF', 'business_type' => 'electronics'],
                ['name' => 'Laptops & Computers', 'description' => 'Computing devices and peripherals', 'color' => '#34C759', 'business_type' => 'electronics'],
                ['name' => 'Audio & Video', 'description' => 'Entertainment and multimedia devices', 'color' => '#FF9500', 'business_type' => 'electronics'],
                ['name' => 'Gaming', 'description' => 'Gaming consoles and accessories', 'color' => '#AF52DE', 'business_type' => 'electronics'],
                ['name' => 'Smart Home', 'description' => 'Home automation and IoT devices', 'color' => '#FF2D92', 'business_type' => 'electronics'],
                ['name' => 'Accessories', 'description' => 'Cables, cases, and other accessories', 'color' => '#00D2FF', 'business_type' => 'electronics']
            ],
            'fashion_retail' => [
                ['name' => 'Men\'s Fashion', 'description' => 'Clothing and accessories for men', 'color' => '#1D4ED8', 'business_type' => 'fashion'],
                ['name' => 'Women\'s Fashion', 'description' => 'Clothing and accessories for women', 'color' => '#EC4899', 'business_type' => 'fashion'],
                ['name' => 'Shoes & Footwear', 'description' => 'All types of footwear', 'color' => '#059669', 'business_type' => 'fashion'],
                ['name' => 'Bags & Luggage', 'description' => 'Bags, purses, and travel luggage', 'color' => '#D97706', 'business_type' => 'fashion'],
                ['name' => 'Jewelry & Watches', 'description' => 'Fashion jewelry and timepieces', 'color' => '#7C2D12', 'business_type' => 'fashion'],
                ['name' => 'Sportswear', 'description' => 'Athletic and fitness clothing', 'color' => '#0891B2', 'business_type' => 'fashion']
            ],
            'food_beverage' => [
                ['name' => 'Beverages', 'description' => 'Hot and cold drinks', 'color' => '#0EA5E9', 'business_type' => 'food_beverage'],
                ['name' => 'Snacks', 'description' => 'Quick bites and finger foods', 'color' => '#F59E0B', 'business_type' => 'food_beverage'],
                ['name' => 'Main Dishes', 'description' => 'Complete meal options', 'color' => '#DC2626', 'business_type' => 'food_beverage'],
                ['name' => 'Desserts', 'description' => 'Sweet treats and desserts', 'color' => '#EC4899', 'business_type' => 'food_beverage'],
                ['name' => 'Healthy Options', 'description' => 'Nutritious and diet-friendly choices', 'color' => '#059669', 'business_type' => 'food_beverage'],
                ['name' => 'Breakfast', 'description' => 'Morning meal options', 'color' => '#D97706', 'business_type' => 'food_beverage']
            ],
            'automotive_service' => [
                ['name' => 'Engine Parts', 'description' => 'Engine components and accessories', 'color' => '#DC2626', 'business_type' => 'automotive'],
                ['name' => 'Tires & Wheels', 'description' => 'Tire and wheel solutions', 'color' => '#1F2937', 'business_type' => 'automotive'],
                ['name' => 'Electrical', 'description' => 'Automotive electrical components', 'color' => '#2563EB', 'business_type' => 'automotive'],
                ['name' => 'Interior', 'description' => 'Interior accessories and parts', 'color' => '#7C2D12', 'business_type' => 'automotive'],
                ['name' => 'Exterior', 'description' => 'Exterior accessories and styling', 'color' => '#059669', 'business_type' => 'automotive'],
                ['name' => 'Maintenance', 'description' => 'Service and maintenance items', 'color' => '#F59E0B', 'business_type' => 'automotive']
            ],
            'home_decor' => [
                ['name' => 'Furniture', 'description' => 'Home and office furniture', 'color' => '#7C2D12', 'business_type' => 'home_decor'],
                ['name' => 'Lighting', 'description' => 'Interior and exterior lighting', 'color' => '#F59E0B', 'business_type' => 'home_decor'],
                ['name' => 'Decorative Items', 'description' => 'Art, plants, and decorations', 'color' => '#EC4899', 'business_type' => 'home_decor'],
                ['name' => 'Textiles', 'description' => 'Curtains, rugs, and soft furnishings', 'color' => '#0891B2', 'business_type' => 'home_decor'],
                ['name' => 'Storage', 'description' => 'Organizational and storage solutions', 'color' => '#059669', 'business_type' => 'home_decor'],
                ['name' => 'Kitchen & Dining', 'description' => 'Kitchen accessories and tableware', 'color' => '#DC2626', 'business_type' => 'home_decor']
            ]
        ];

        return $definitions[$businessType] ?? $definitions['etching'];
    }

    private function createCategory($tenant, $categoryData, $sortOrder, $parentId = null, $level = 0): void
    {
        $slug = Str::slug($categoryData['name']);
        $originalSlug = $slug;
        $counter = 1;
        
        // Ensure unique slug within tenant
        while (ProductCategory::where('tenant_id', $tenant->id)->where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        $path = $parentId ? 
            ProductCategory::find($parentId)->path . '/' . $slug : 
            $slug;

        $category = ProductCategory::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $tenant->id,
            'name' => $categoryData['name'],
            'slug' => $slug,
            'description' => $categoryData['description'] ?? null,
            'business_type' => $categoryData['business_type'] ?? null,
            'parent_id' => $parentId,
            'sort_order' => $sortOrder,
            'level' => $level,
            'path' => $path,
            'color_scheme' => $categoryData['color'] ?? '#ff8000',
            'is_active' => true,
            'is_featured' => $categoryData['is_featured'] ?? false,
            'show_in_menu' => true
        ]);

        // Create children if they exist
        if (isset($categoryData['children'])) {
            $childSortOrder = 1;
            foreach ($categoryData['children'] as $childData) {
                $this->createCategory(
                    $tenant, 
                    $childData, 
                    $childSortOrder++, 
                    $category->id, 
                    $level + 1
                );
            }
        }
    }
}