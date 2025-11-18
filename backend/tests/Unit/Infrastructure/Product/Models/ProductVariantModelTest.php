<?php

namespace Tests\Unit\Infrastructure\Product\Models;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\ProductVariant;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariantModelTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test tenant in database
        $this->tenant = Tenant::create([
            'uuid' => '987e6543-e21c-34d5-b678-123456789012',
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
            'status' => 'active',
            'subscription_status' => 'active',
        ]);
        
        // Set up test tenant context
        app()->instance('currentTenant', (object) ['id' => $this->tenant->id, 'uuid' => $this->tenant->uuid]);
    }

    /** @test */
    public function it_has_correct_fillable_attributes(): void
    {
        $expectedFillable = [
            'uuid',
            'tenant_id',
            'product_id',
            'category_id',
            'name',
            'sku',
            'material',
            'quality',
            'thickness',
            'color',
            'color_hex',
            'dimensions',
            'price_adjustment',
            'markup_percentage',
            'vendor_price',
            'stock_quantity',
            'low_stock_threshold',
            'track_inventory',
            'allow_backorder',
            'is_active',
            'is_default',
            'sort_order',
            'lead_time_days',
            'lead_time_note',
            'images',
            'custom_fields',
            'special_notes',
            'weight',
            'shipping_dimensions',
            'etching_specifications',
            'base_price',
            'selling_price',
            'retail_price',
            'cost_price',
            'length',
            'width',
        ];

        $variant = new ProductVariant();
        
        $this->assertEquals($expectedFillable, $variant->getFillable());
    }

    /** @test */
    public function it_casts_attributes_correctly(): void
    {
        $expectedCasts = [
            'dimensions' => 'array',
            'price_adjustment' => 'integer',
            'markup_percentage' => 'float',
            'vendor_price' => 'integer',
            'stock_quantity' => 'integer',
            'low_stock_threshold' => 'integer',
            'track_inventory' => 'boolean',
            'allow_backorder' => 'boolean',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'sort_order' => 'integer',
            'lead_time_days' => 'integer',
            'images' => 'array',
            'custom_fields' => 'array',
            'weight' => 'float',
            'thickness' => 'float',
            'shipping_dimensions' => 'array',
            'etching_specifications' => 'array',
            'base_price' => 'float',
            'selling_price' => 'float',
            'retail_price' => 'float',
            'cost_price' => 'float',
            'length' => 'float',
            'width' => 'float',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];

        $variant = new ProductVariant();
        
        foreach ($expectedCasts as $attribute => $cast) {
            $this->assertEquals($cast, $variant->getCasts()[$attribute]);
        }
    }

    /** @test */
    public function it_can_create_product_variant_with_basic_attributes(): void
    {
        $product = $this->createTestProduct();

        $variant = ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'name' => 'Akrilik Standard Variant',
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'akrilik-standard',
            'stock_quantity' => 0,
        ]);

        $this->assertInstanceOf(ProductVariant::class, $variant);
        $this->assertEquals('Akrilik', $variant->material);
        $this->assertEquals('Standard', $variant->quality);
        $this->assertEquals('akrilik-standard', $variant->sku);
        $this->assertTrue($variant->is_active);
        $this->assertEquals(0, $variant->stock_quantity);
    }

    /** @test */
    public function it_auto_generates_uuid_on_creation(): void
    {
        $product = $this->createTestProduct();

        $variant = new ProductVariant([
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Kuningan',
            'quality' => 'Tinggi',
            'sku' => 'kuningan-tinggi',
        ]);

        // Trigger the creating event
        $variant->save();

        $this->assertNotNull($variant->uuid);
        $this->assertTrue(is_string($variant->uuid));
        $this->assertEquals(36, strlen($variant->uuid)); // UUID v4 format
    }

    /** @test */
    public function it_has_tenant_relationship(): void
    {
        $variant = new ProductVariant();
        
        $relation = $variant->tenant();
        
        $this->assertInstanceOf(BelongsTo::class, $relation);
    }

    /** @test */
    public function it_has_category_relationship(): void
    {
        $variant = new ProductVariant();
        
        $relation = $variant->category();
        
        $this->assertInstanceOf(BelongsTo::class, $relation);
        $this->assertEquals('category_id', $relation->getForeignKeyName());
        $this->assertEquals('id', $relation->getOwnerKeyName());
    }

    /** @test */
    public function it_scopes_active_variants(): void
    {
        $product = $this->createTestProduct();

        ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'active-variant',
            'is_active' => true,
        ]);

        ProductVariant::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Kuningan',
            'quality' => 'Tinggi',
            'sku' => 'inactive-variant',
            'is_active' => false,
        ]);

        $activeVariants = ProductVariant::active()->get();

        $this->assertCount(1, $activeVariants);
        $this->assertEquals('active-variant', $activeVariants[0]->sku);
    }

    /** @test */
    public function it_scopes_variants_by_material(): void
    {
        $product = $this->createTestProduct();

        ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'akrilik-variant',
        ]);

        ProductVariant::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Kuningan',
            'quality' => 'Tinggi',
            'sku' => 'kuningan-variant',
        ]);

        $akrlikVariants = ProductVariant::byMaterial('Akrilik')->get();
        $kuninganVariants = ProductVariant::byMaterial('Kuningan')->get();

        $this->assertCount(1, $akrlikVariants);
        $this->assertCount(1, $kuninganVariants);
        $this->assertEquals('Akrilik', $akrlikVariants[0]->material);
        $this->assertEquals('Kuningan', $kuninganVariants[0]->material);
    }

    /** @test */
    public function it_scopes_variants_by_quality(): void
    {
        $product = $this->createTestProduct();

        ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'standard-variant',
        ]);

        ProductVariant::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Kuningan',
            'quality' => 'Tinggi',
            'sku' => 'premium-variant',
        ]);

        $standardVariants = ProductVariant::byQuality('Standard')->get();
        $tinggiVariants = ProductVariant::byQuality('Tinggi')->get();

        $this->assertCount(1, $standardVariants);
        $this->assertCount(1, $tinggiVariants);
        $this->assertEquals('Standard', $standardVariants[0]->quality);
        $this->assertEquals('Tinggi', $tinggiVariants[0]->quality);
    }

    /** @test */
    public function it_scopes_variants_in_stock(): void
    {
        $product = $this->createTestProduct();

        ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'in-stock-variant',
            'stock_quantity' => 50,
        ]);

        ProductVariant::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Kuningan',
            'quality' => 'Tinggi',
            'sku' => 'out-of-stock-variant',
            'stock_quantity' => 0,
        ]);

        $inStockVariants = ProductVariant::inStock()->get();

        $this->assertCount(1, $inStockVariants);
        $this->assertEquals('in-stock-variant', $inStockVariants[0]->sku);
        $this->assertGreaterThan(0, $inStockVariants[0]->stock_quantity);
    }

    /** @test */
    public function it_scopes_variants_out_of_stock(): void
    {
        $product = $this->createTestProduct();

        ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'in-stock-variant',
            'stock_quantity' => 50,
        ]);

        ProductVariant::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Kuningan',
            'quality' => 'Tinggi',
            'sku' => 'out-of-stock-variant',
            'stock_quantity' => 0,
        ]);

        $outOfStockVariants = ProductVariant::outOfStock()->get();

        $this->assertCount(1, $outOfStockVariants);
        $this->assertEquals('out-of-stock-variant', $outOfStockVariants[0]->sku);
        $this->assertEquals(0, $outOfStockVariants[0]->stock_quantity);
    }

    /** @test */
    public function it_scopes_variants_low_stock(): void
    {
        $product = $this->createTestProduct();

        ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'normal-stock-variant',
            'stock_quantity' => 50,
            'low_stock_threshold' => 10,
        ]);

        ProductVariant::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Kuningan',
            'quality' => 'Tinggi',
            'sku' => 'low-stock-variant',
            'stock_quantity' => 5,
            'low_stock_threshold' => 10,
        ]);

        $lowStockVariants = ProductVariant::lowStock()->get();

        $this->assertCount(1, $lowStockVariants);
        $this->assertEquals('low-stock-variant', $lowStockVariants[0]->sku);
        $this->assertTrue($lowStockVariants[0]->stock_quantity <= $lowStockVariants[0]->low_stock_threshold);
    }

    /** @test */
    public function it_scopes_variants_by_price_range(): void
    {
        $product = $this->createTestProduct();

        ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'cheap-variant',
            'selling_price' => 50000.00,
        ]);

        ProductVariant::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Kuningan',
            'quality' => 'Tinggi',
            'sku' => 'expensive-variant',
            'selling_price' => 250000.00,
        ]);

        $midRangeVariants = ProductVariant::priceRange(45000.00, 75000.00)->get();
        $expensiveVariants = ProductVariant::priceRange(200000.00, 300000.00)->get();

        $this->assertCount(1, $midRangeVariants);
        $this->assertCount(1, $expensiveVariants);
        $this->assertEquals('cheap-variant', $midRangeVariants[0]->sku);
        $this->assertEquals('expensive-variant', $expensiveVariants[0]->sku);
    }

    /** @test */
    public function it_checks_if_variant_has_stock(): void
    {
        $product = $this->createTestProduct();

        $inStockVariant = ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'in-stock-variant',
            'stock_quantity' => 50,
        ]);

        $outOfStockVariant = ProductVariant::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Kuningan',
            'quality' => 'Tinggi',
            'sku' => 'out-of-stock-variant',
            'stock_quantity' => 0,
        ]);

        $this->assertTrue($inStockVariant->hasStock());
        $this->assertFalse($outOfStockVariant->hasStock());
    }

    /** @test */
    public function it_checks_if_variant_is_low_stock(): void
    {
        $product = $this->createTestProduct();

        $normalStockVariant = ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'normal-stock-variant',
            'stock_quantity' => 50,
            'low_stock_threshold' => 10,
        ]);

        $lowStockVariant = ProductVariant::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Kuningan',
            'quality' => 'Tinggi',
            'sku' => 'low-stock-variant',
            'stock_quantity' => 5,
            'low_stock_threshold' => 10,
        ]);

        $this->assertFalse($normalStockVariant->isLowStock());
        $this->assertTrue($lowStockVariant->isLowStock());
    }

    /** @test */
    public function it_calculates_profit_margin(): void
    {
        $product = $this->createTestProduct();

        $variant = ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'test-variant',
            'base_price' => 100000.00,
            'selling_price' => 130000.00,
        ]);

        $margin = $variant->getProfitMargin();
        $marginPercentage = $variant->getProfitMarginPercentage();

        $this->assertEquals(30000.00, $margin); // 130k - 100k
        $this->assertEquals(30.00, $marginPercentage); // (130k - 100k) / 100k * 100
    }

    /** @test */
    public function it_handles_zero_base_price_in_margin_calculation(): void
    {
        $product = $this->createTestProduct();

        $variant = ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'test-variant',
            'base_price' => 0.00,
            'selling_price' => 130000.00,
        ]);

        $marginPercentage = $variant->getProfitMarginPercentage();

        $this->assertEquals(0.00, $marginPercentage); // Should handle division by zero
    }

    /** @test */
    public function it_calculates_dimensions(): void
    {
        $product = $this->createTestProduct();

        $variant = ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'test-variant',
            'length' => 10.50,
            'width' => 15.25,
            'thickness' => 2.00,
        ]);

        $area = $variant->getArea();
        $volume = $variant->getVolume();

        $this->assertEquals(160.125, $area); // 10.50 * 15.25
        $this->assertEquals(320.25, $volume); // 10.50 * 15.25 * 2.00
    }

    /** @test */
    public function it_generates_display_name(): void
    {
        $product = $this->createTestProduct();

        $variant = ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Kuningan',
            'quality' => 'Tinggi',
            'sku' => 'kuningan-premium',
        ]);

        $displayName = $variant->getDisplayName();

        $this->assertEquals('Kuningan - Premium', $displayName);
    }

    /** @test */
    public function it_stores_etching_specifications_as_array(): void
    {
        $product = $this->createTestProduct();
        $specs = [
            'finish' => 'glossy',
            'edge_treatment' => 'polished',
            'engraving_depth' => '0.5mm',
            'color_fill' => 'black'
        ];

        $variant = ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Tinggi',
            'sku' => 'custom-variant',
            'etching_specifications' => $specs,
        ]);

        $this->assertIsArray($variant->etching_specifications);
        $this->assertEquals($specs, $variant->etching_specifications);
        $this->assertEquals('glossy', $variant->etching_specifications['finish']);
    }

    /** @test */
    public function it_casts_prices_as_decimal(): void
    {
        $product = $this->createTestProduct();

        $variant = ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'test-variant',
            'base_price' => 123456.78,
            'selling_price' => 150000.99,
            'retail_price' => 175000.50,
            'cost_price' => 100000.25,
        ]);

        $this->assertEquals(123456.78, $variant->base_price);
        $this->assertEquals(150000.99, $variant->selling_price);
        $this->assertEquals(175000.50, $variant->retail_price);
        $this->assertEquals(100000.25, $variant->cost_price);
        
        $this->assertIsFloat($variant->base_price);
        $this->assertIsFloat($variant->selling_price);
        $this->assertIsFloat($variant->retail_price);
        $this->assertIsFloat($variant->cost_price);
    }

    /** @test */
    public function it_casts_dimensions_as_decimal(): void
    {
        $product = $this->createTestProduct();

        $variant = ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'test-variant',
            'length' => 10.75,
            'width' => 15.25,
            'thickness' => 2.50,
            'weight' => 125.75,
        ]);

        $this->assertEquals(10.75, $variant->length);
        $this->assertEquals(15.25, $variant->width);
        $this->assertEquals(2.50, $variant->thickness);
        $this->assertEquals(125.75, $variant->weight);
        
        $this->assertIsFloat($variant->length);
        $this->assertIsFloat($variant->width);
        $this->assertIsFloat($variant->thickness);
        $this->assertIsFloat($variant->weight);
    }

    /** @test */
    public function it_uses_soft_deletes(): void
    {
        $product = $this->createTestProduct();

        $variant = ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'test-variant',
        ]);

        $variant->delete();

        // Should be soft deleted
        $this->assertSoftDeleted('product_variants', ['id' => $variant->id]);
        
        // Should not be found in regular query
        $this->assertCount(0, ProductVariant::all());
        
        // Should be found with trashed
        $this->assertCount(1, ProductVariant::withTrashed()->get());
    }

    /** @test */
    public function it_maintains_category_relationship(): void
    {
        $product = $this->createTestProduct();
        $category = ProductCategory::first();

        $variant = ProductVariant::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'category_id' => $category?->id,
            'material' => 'Akrilik',
            'quality' => 'Standard',
            'sku' => 'test-variant',
        ]);

        $this->assertNotNull($category);
        $this->assertEquals($category->id, $variant->category_id);
        $this->assertEquals($category->name, $variant->category->name);
    }

    private function createTestProduct(): Product
    {
        $category = ProductCategory::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Category',
            'slug' => 'test-category',
            'level' => 0,
            'sort_order' => 0,
        ]);

        return Product::create([
            'uuid' => '789e0123-e45b-67c8-d901-234567890123',
            'tenant_id' => $this->tenant->id,
            'category_id' => $category->id,
            'name' => 'Test Product',
            'sku' => 'TEST-PROD-001',
            'description' => 'Test product for variants',
            'price' => 10000, // 100.00 in cents
            'status' => 'published',
            'slug' => 'test-product',
        ]);
    }
}