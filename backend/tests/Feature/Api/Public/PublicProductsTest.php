<?php

namespace Tests\Feature\Api\Public;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerReview;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

class PublicProductsTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        
        $uniqueSuffix = uniqid();
        $this->tenant = TenantEloquentModel::create([
            'uuid' => Str::uuid(),
            'name' => 'PublicProductsTest Company ' . $uniqueSuffix,
            'slug' => 'publicproductstest-' . $uniqueSuffix,
            'status' => 'active',
            'subscription_status' => 'active'
        ]);
    }

    /** @test */
    public function it_returns_paginated_products(): void
    {
        for ($i = 1; $i <= 25; $i++) {
            Product::create([
                'uuid' => Str::uuid(),
                'tenant_id' => $this->tenant->id,
                'name' => 'Product ' . $i,
                'slug' => 'product-' . $i,
                'sku' => 'PRD-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'price' => 100000,
                'currency' => 'IDR',
                'status' => 'published',
                'production_type' => 'vendor',
                'stock_quantity' => 10
            ]);
        }

        $response = $this->getJson('/api/v1/public/products?per_page=12');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => ['id', 'name', 'slug', 'price']
                     ],
                     'meta' => ['total', 'current_page', 'last_page', 'per_page']
                 ])
                 ->assertJsonPath('meta.total', 25)
                 ->assertJsonPath('meta.current_page', 1)
                 ->assertJsonPath('meta.last_page', 3)
                 ->assertJsonCount(12, 'data');
    }

    /** @test */
    public function it_filters_products_by_search(): void
    {
        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Stainless Steel Etching',
            'slug' => 'stainless-steel-etching',
            'sku' => 'PRD-001',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Glass Etching Award',
            'slug' => 'glass-etching-award',
            'sku' => 'PRD-002',
            'price' => 150000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Custom Trophy',
            'slug' => 'custom-trophy',
            'sku' => 'PRD-003',
            'price' => 200000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        $response = $this->getJson('/api/v1/public/products?search=etching');

        $response->assertStatus(200)
                 ->assertJsonCount(2, 'data');
    }

    /** @test */
    public function it_filters_products_by_type(): void
    {
        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Metal Product 1',
            'slug' => 'metal-product-1',
            'sku' => 'PRD-001',
            'type' => 'physical',
            'business_type' => 'metal_etching',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Glass Product 1',
            'slug' => 'glass-product-1',
            'sku' => 'PRD-002',
            'type' => 'physical',
            'business_type' => 'glass_etching',
            'price' => 150000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Metal Product 2',
            'slug' => 'metal-product-2',
            'sku' => 'PRD-003',
            'type' => 'physical',
            'business_type' => 'metal_etching',
            'price' => 200000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        $response = $this->getJson("/api/v1/public/{$this->tenant->slug}/products?type=metal_etching");

        $response->assertStatus(200)
                 ->assertJsonCount(2, 'data');
    }

    /** @test */
    public function it_sorts_products_by_name(): void
    {
        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Zebra Product',
            'slug' => 'zebra-product',
            'sku' => 'PRD-001',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Alpha Product',
            'slug' => 'alpha-product',
            'sku' => 'PRD-002',
            'price' => 150000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Beta Product',
            'slug' => 'beta-product',
            'sku' => 'PRD-003',
            'price' => 200000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        $response = $this->getJson('/api/v1/public/products?sort=name-asc');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('Alpha Product', $data[0]['name']);
        $this->assertEquals('Zebra Product', $data[2]['name']);
    }

    /** @test */
    public function it_sorts_products_by_price(): void
    {
        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Expensive Product',
            'slug' => 'expensive-product',
            'sku' => 'PRD-001',
            'price' => 500000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Cheap Product',
            'slug' => 'cheap-product',
            'sku' => 'PRD-002',
            'price' => 50000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Medium Product',
            'slug' => 'medium-product',
            'sku' => 'PRD-003',
            'price' => 250000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        $response = $this->getJson('/api/v1/public/products?sort=price-asc');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals('Cheap Product', $data[0]['name']);
        $this->assertEquals('Expensive Product', $data[2]['name']);
    }

    /** @test */
    public function it_only_returns_published_products(): void
    {
        for ($i = 1; $i <= 5; $i++) {
            Product::create([
                'uuid' => Str::uuid(),
                'tenant_id' => $this->tenant->id,
                'name' => 'Published Product ' . $i,
                'slug' => 'published-product-' . $i,
                'sku' => 'PUB-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'price' => 100000,
                'currency' => 'IDR',
                'status' => 'published',
                'production_type' => 'vendor',
                'stock_quantity' => 10
            ]);
        }

        for ($i = 1; $i <= 3; $i++) {
            Product::create([
                'uuid' => Str::uuid(),
                'tenant_id' => $this->tenant->id,
                'name' => 'Draft Product ' . $i,
                'slug' => 'draft-product-' . $i,
                'sku' => 'DFT-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'price' => 100000,
                'currency' => 'IDR',
                'status' => 'draft',
                'production_type' => 'vendor',
                'stock_quantity' => 10
            ]);
        }

        for ($i = 1; $i <= 2; $i++) {
            Product::create([
                'uuid' => Str::uuid(),
                'tenant_id' => $this->tenant->id,
                'name' => 'Archived Product ' . $i,
                'slug' => 'archived-product-' . $i,
                'sku' => 'ARC-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'price' => 100000,
                'currency' => 'IDR',
                'status' => 'archived',
                'production_type' => 'vendor',
                'stock_quantity' => 10
            ]);
        }

        $response = $this->getJson('/api/v1/public/products');

        $response->assertStatus(200);
        $this->assertEquals(5, $response->json('meta.total'));
    }

    /** @test */
    public function it_filters_by_minimum_rating(): void
    {
        $product1 = Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'High Rated Product',
            'slug' => 'high-rated-product',
            'sku' => 'PRD-001',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        CustomerReview::factory()->count(10)->create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $product1->id,
            'rating' => 5,
            'is_approved' => true
        ]);

        $product2 = Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Low Rated Product',
            'slug' => 'low-rated-product',
            'sku' => 'PRD-002',
            'price' => 150000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        CustomerReview::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $product2->id,
            'rating' => 2,
            'is_approved' => true
        ]);

        $product3 = Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Medium Rated Product',
            'slug' => 'medium-rated-product',
            'sku' => 'PRD-003',
            'price' => 200000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        CustomerReview::factory()->count(8)->create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $product3->id,
            'rating' => 4,
            'is_approved' => true
        ]);

        $response = $this->getJson('/api/v1/public/products?min_rating=4.0');

        $response->assertStatus(200)
                 ->assertJsonCount(2, 'data');
        
        $productIds = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertContains((string) $product1->uuid, $productIds);
        $this->assertContains((string) $product3->uuid, $productIds);
        $this->assertNotContains((string) $product2->uuid, $productIds);
    }

    /** @test */
    public function it_filters_by_stock_availability(): void
    {
        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'In Stock Product',
            'slug' => 'in-stock-product',
            'sku' => 'PRD-001',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Out of Stock Product',
            'slug' => 'out-of-stock-product',
            'sku' => 'PRD-002',
            'price' => 150000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 0
        ]);

        $response = $this->getJson('/api/v1/public/products?in_stock=1');

        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data');
        
        $this->assertEquals('In Stock Product', $response->json('data.0.name'));
    }

    /** @test */
    public function it_filters_by_price_range(): void
    {
        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Cheap Product',
            'slug' => 'cheap-product',
            'sku' => 'PRD-001',
            'price' => 50000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Medium Product',
            'slug' => 'medium-product',
            'sku' => 'PRD-002',
            'price' => 250000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Expensive Product',
            'slug' => 'expensive-product',
            'sku' => 'PRD-003',
            'price' => 500000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        $response = $this->getJson('/api/v1/public/products?price_min=1000&price_max=3000');

        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data');
        
        $this->assertEquals('Medium Product', $response->json('data.0.name'));
    }

    /** @test */
    public function it_exposes_uuid_not_integer_id(): void
    {
        $product = Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Product',
            'slug' => 'test-product',
            'sku' => 'PRD-001',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10
        ]);

        $response = $this->getJson('/api/v1/public/products');

        $response->assertStatus(200);
        $data = $response->json('data.0');
        
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
            $data['id']
        );
        
        $this->assertArrayNotHasKey('integer_id', $data);
        $this->assertArrayNotHasKey('tenant_id', $data);
    }

    /** @test */
    public function it_filters_by_featured_status(): void
    {
        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Featured Product',
            'slug' => 'featured-product',
            'sku' => 'PRD-001',
            'price' => 100000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10,
            'featured' => true
        ]);

        Product::create([
            'uuid' => Str::uuid(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Regular Product',
            'slug' => 'regular-product',
            'sku' => 'PRD-002',
            'price' => 150000,
            'currency' => 'IDR',
            'status' => 'published',
            'production_type' => 'vendor',
            'stock_quantity' => 10,
            'featured' => false
        ]);

        $response = $this->getJson('/api/v1/public/products?featured=1');

        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data');
        
        $this->assertEquals('Featured Product', $response->json('data.0.name'));
    }

    /** @test */
    public function it_returns_empty_array_when_no_products_found(): void
    {
        $response = $this->getJson('/api/v1/public/products?search=nonexistent');

        $response->assertStatus(200)
                 ->assertJsonCount(0, 'data')
                 ->assertJsonPath('meta.total', 0);
    }

    /** @test */
    public function it_validates_pagination_parameters(): void
    {
        $response = $this->getJson('/api/v1/public/products?per_page=0');

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['per_page']);
    }

    /** @test */
    public function it_validates_rating_parameter(): void
    {
        $response = $this->getJson('/api/v1/public/products?min_rating=6');

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['min_rating']);
    }
}
