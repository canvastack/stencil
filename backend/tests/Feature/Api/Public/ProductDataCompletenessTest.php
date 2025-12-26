<?php

namespace Tests\Feature\Api\Public;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

class ProductDataCompletenessTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private ProductCategory $category;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenant = TenantEloquentModel::create([
            'uuid' => Str::uuid(),
            'name' => 'Test Company',
            'slug' => 'test-company',
            'status' => 'active',
            'subscription_status' => 'active'
        ]);

        $this->category = ProductCategory::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Metal Etching',
            'slug' => 'metal-etching',
            'status' => 'active'
        ]);
    }

    private function tenantRoute(string $path): string
    {
        return "/api/v1/public/{$this->tenant->slug}{$path}";
    }

    /** @test */
    public function product_resource_returns_uuid_not_integer_id(): void
    {
        $product = Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Test Product',
            'slug' => 'test-product',
            'sku' => 'PRD-001',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'internal',
            'stock_quantity' => 10
        ]);

        $response = $this->getJson($this->tenantRoute("/products/slug/{$product->slug}"));

        $response->assertStatus(200);
        
        $data = $response->json('data') ?? $response->json();
        
        $this->assertTrue(Str::isUuid($data['id']));
        $this->assertEquals($product->uuid, $data['id']);
        $this->assertEquals($product->uuid, $data['uuid']);
        
        $this->assertArrayNotHasKey('_internal_id', $data);
    }

    /** @test */
    public function product_list_returns_uuid_as_id_field(): void
    {
        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Product 1',
            'slug' => 'product-1',
            'sku' => 'PRD-001',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'internal',
            'stock_quantity' => 10
        ]);

        $response = $this->getJson($this->tenantRoute('/products'));

        $response->assertStatus(200);
        
        $products = $response->json('data');
        $this->assertNotEmpty($products);
        
        foreach ($products as $product) {
            $this->assertArrayHasKey('id', $product);
            $this->assertTrue(Str::isUuid($product['id']), 'ID field should be UUID string');
            $this->assertArrayNotHasKey('_internal_id', $product, 'Internal ID should not be exposed to public');
        }
    }

    /** @test */
    public function type_filter_returns_products_with_matching_business_type(): void
    {
        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Metal Product 1',
            'slug' => 'metal-product-1',
            'sku' => 'PRD-001',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'business_type' => 'metal_etching',
            'production_type' => 'internal',
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Metal Product 2',
            'slug' => 'metal-product-2',
            'sku' => 'PRD-002',
            'price' => 150000,
            'currency' => 'IDR',
            'status' => 'published',
            'business_type' => 'metal_etching',
            'production_type' => 'internal',
            'stock_quantity' => 5
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Glass Product',
            'slug' => 'glass-product',
            'sku' => 'PRD-003',
            'price' => 200000,
            'currency' => 'IDR',
            'status' => 'published',
            'business_type' => 'glass_etching',
            'production_type' => 'internal',
            'stock_quantity' => 8
        ]);

        $response = $this->getJson($this->tenantRoute('/products?type=metal_etching'));

        $response->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }

    /** @test */
    public function size_filter_returns_products_with_matching_size(): void
    {
        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Small Product',
            'slug' => 'small-product',
            'sku' => 'PRD-001',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'internal',
            'available_sizes' => ['small', 'medium'],
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Large Product',
            'slug' => 'large-product',
            'sku' => 'PRD-002',
            'price' => 200000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'internal',
            'available_sizes' => ['large', 'extra-large'],
            'stock_quantity' => 5
        ]);

        $response = $this->getJson($this->tenantRoute('/products?size=large'));

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Large Product', $response->json('data.0.name'));
    }

    /** @test */
    public function category_filter_returns_correct_products(): void
    {
        $awardCategory = ProductCategory::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Awards',
            'slug' => 'awards',
            'status' => 'active'
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Metal Etching',
            'slug' => 'metal-etching',
            'sku' => 'PRD-001',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'internal',
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $awardCategory->id,
            'name' => 'Trophy Award',
            'slug' => 'trophy-award',
            'sku' => 'PRD-002',
            'price' => 200000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'internal',
            'stock_quantity' => 5
        ]);

        $response = $this->getJson($this->tenantRoute("/products?category={$awardCategory->slug}"));

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Trophy Award', $response->json('data.0.name'));
    }

    /** @test */
    public function product_resource_includes_all_required_fields(): void
    {
        $product = Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Complete Product',
            'slug' => 'complete-product',
            'sku' => 'PRD-001',
            'description' => 'Short description',
            'long_description' => 'Long detailed description',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'business_type' => 'metal_etching',
            'production_type' => 'internal',
            'quality_levels' => ['standard', 'premium', 'luxury'],
            'available_materials' => ['steel', 'brass', 'copper'],
            'available_sizes' => ['small', 'medium', 'large'],
            'lead_time' => '7-10 hari kerja',
            'min_order_quantity' => 10,
            'max_order_quantity' => 1000,
            'customizable' => true,
            'featured' => true,
            'stock_quantity' => 100
        ]);

        $response = $this->getJson($this->tenantRoute("/products/slug/{$product->slug}"));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'uuid',
                    'name',
                    'slug',
                    'description',
                    'longDescription',
                    'price',
                    'currency',
                    'productionType',
                    'materials' => [
                        'qualityLevels',
                        'availableMaterials',
                    ],
                    'ordering' => [
                        'leadTime',
                        'minOrderQuantity',
                        'maxOrderQuantity',
                    ],
                    'customization' => [
                        'customizable',
                    ],
                    'marketing' => [
                        'featured',
                    ],
                ],
            ]);

        $this->assertEquals($product->uuid, $response->json('data.id'));
        $this->assertIsArray($response->json('data.materials.qualityLevels'));
        $this->assertCount(3, $response->json('data.materials.qualityLevels'));
        $this->assertIsArray($response->json('data.materials.availableMaterials'));
        $this->assertCount(3, $response->json('data.materials.availableMaterials'));
        $this->assertEquals('7-10 hari kerja', $response->json('data.ordering.leadTime'));
        $this->assertTrue($response->json('data.customization.customizable'));
        $this->assertTrue($response->json('data.marketing.featured'));
    }

    /** @test */
    public function material_filter_returns_products_with_matching_material(): void
    {
        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Steel Product',
            'slug' => 'steel-product',
            'sku' => 'PRD-001',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'internal',
            'available_materials' => ['steel', 'aluminum'],
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Brass Product',
            'slug' => 'brass-product',
            'sku' => 'PRD-002',
            'price' => 150000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'internal',
            'available_materials' => ['brass', 'copper'],
            'stock_quantity' => 5
        ]);

        $response = $this->getJson($this->tenantRoute('/products?material=brass'));

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Brass Product', $response->json('data.0.name'));
    }

    /** @test */
    public function multiple_filters_work_together(): void
    {
        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Metal Large Steel',
            'slug' => 'metal-large-steel',
            'sku' => 'PRD-001',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'business_type' => 'metal_etching',
            'production_type' => 'internal',
            'available_materials' => ['steel'],
            'available_sizes' => ['large'],
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Metal Small Brass',
            'slug' => 'metal-small-brass',
            'sku' => 'PRD-002',
            'price' => 150000,
            'currency' => 'IDR',
            'status' => 'published',
            'business_type' => 'metal_etching',
            'production_type' => 'internal',
            'available_materials' => ['brass'],
            'available_sizes' => ['small'],
            'stock_quantity' => 5
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Glass Large Steel',
            'slug' => 'glass-large-steel',
            'sku' => 'PRD-003',
            'price' => 200000,
            'currency' => 'IDR',
            'status' => 'published',
            'business_type' => 'glass_etching',
            'production_type' => 'internal',
            'available_materials' => ['steel'],
            'available_sizes' => ['large'],
            'stock_quantity' => 8
        ]);

        $response = $this->getJson($this->tenantRoute('/products?type=metal_etching&size=large&material=steel'));

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('Metal Large Steel', $response->json('data.0.name'));
    }

    /** @test */
    public function search_works_with_product_name_and_description(): void
    {
        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Stainless Steel Engraving',
            'slug' => 'stainless-steel-engraving',
            'sku' => 'PRD-001',
            'description' => 'High quality laser engraving on stainless steel',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'internal',
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'category_id' => $this->category->id,
            'name' => 'Glass Award',
            'slug' => 'glass-award',
            'sku' => 'PRD-002',
            'description' => 'Beautiful glass with engraving option',
            'price' => 150000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'internal',
            'stock_quantity' => 5
        ]);

        $response = $this->getJson($this->tenantRoute('/products?search=engraving'));

        $response->assertStatus(200);
        $this->assertGreaterThanOrEqual(2, count($response->json('data')));
    }
}
