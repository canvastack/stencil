<?php

namespace Tests\Unit\Infrastructure\Product;

use Tests\TestCase;
use App\Infrastructure\Persistence\Repositories\Product\ProductVariantEloquentRepository;
use App\Infrastructure\Persistence\Eloquent\Models\ProductVariant as ProductVariantModel;
use App\Domain\Product\Entities\ProductVariant;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Product\Enums\ProductMaterial;
use App\Domain\Product\Enums\ProductQuality;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProductVariantEloquentRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private ProductVariantEloquentRepository $repository;
    private string $tenantId;
    private string $categoryId;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->repository = new ProductVariantEloquentRepository();
        $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
        $this->categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        // Set up test tenant context
        app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);
    }

    /** @test */
    public function it_can_save_product_variant(): void
    {
        $variant = $this->createTestVariant();

        $savedVariant = $this->repository->save($variant);

        $this->assertInstanceOf(ProductVariant::class, $savedVariant);
        $this->assertEquals($variant->getMaterial(), $savedVariant->getMaterial());
        $this->assertEquals($variant->getQuality(), $savedVariant->getQuality());
        $this->assertEquals($variant->getSku(), $savedVariant->getSku());

        // Verify in database
        $this->assertDatabaseHas('product_variants', [
            'tenant_id' => 1, // Using integer ID for database
            'uuid' => $variant->getId()->getValue(),
            'material' => 'akrilik',
            'quality' => 'standard',
            'sku' => 'akrilik-standard',
            'is_active' => true,
        ]);
    }

    /** @test */
    public function it_can_find_variant_by_id(): void
    {
        $variant = $this->createTestVariant();
        $savedVariant = $this->repository->save($variant);

        $foundVariant = $this->repository->findById($savedVariant->getId()->getValue());

        $this->assertInstanceOf(ProductVariant::class, $foundVariant);
        $this->assertEquals($savedVariant->getId(), $foundVariant->getId());
        $this->assertEquals($savedVariant->getMaterial(), $foundVariant->getMaterial());
        $this->assertEquals($savedVariant->getQuality(), $foundVariant->getQuality());
    }

    /** @test */
    public function it_returns_null_when_variant_not_found_by_id(): void
    {
        $foundVariant = $this->repository->findById('non-existent-uuid');

        $this->assertNull($foundVariant);
    }

    /** @test */
    public function it_can_find_variant_by_sku(): void
    {
        $variant = $this->createTestVariant();
        $this->repository->save($variant);

        $foundVariant = $this->repository->findBySku($this->tenantId, 'akrilik-standard');

        $this->assertInstanceOf(ProductVariant::class, $foundVariant);
        $this->assertEquals('akrilik-standard', $foundVariant->getSku());
    }

    /** @test */
    public function it_returns_null_when_variant_not_found_by_sku(): void
    {
        $foundVariant = $this->repository->findBySku($this->tenantId, 'non-existent-sku');

        $this->assertNull($foundVariant);
    }

    /** @test */
    public function it_can_find_variant_by_category_material_quality(): void
    {
        $variant = $this->createTestVariant();
        $this->repository->save($variant);

        $foundVariant = $this->repository->findByCategoryMaterialQuality(
            $this->tenantId,
            $this->categoryId,
            ProductMaterial::AKRILIK,
            ProductQuality::STANDARD
        );

        $this->assertInstanceOf(ProductVariant::class, $foundVariant);
        $this->assertEquals(ProductMaterial::AKRILIK, $foundVariant->getMaterial());
        $this->assertEquals(ProductQuality::STANDARD, $foundVariant->getQuality());
    }

    /** @test */
    public function it_can_find_variants_by_category(): void
    {
        // Create multiple variants for same category
        $variant1 = $this->createTestVariant(ProductMaterial::AKRILIK, ProductQuality::STANDARD);
        $variant2 = $this->createTestVariant(ProductMaterial::KUNINGAN, ProductQuality::TINGGI);
        $this->repository->save($variant1);
        $this->repository->save($variant2);

        $variants = $this->repository->findByCategory($this->categoryId);

        $this->assertCount(2, $variants);
        $this->assertEquals($this->categoryId, $variants[0]->getCategoryId()->getValue());
        $this->assertEquals($this->categoryId, $variants[1]->getCategoryId()->getValue());
    }

    /** @test */
    public function it_can_find_variants_by_material(): void
    {
        $variant1 = $this->createTestVariant(ProductMaterial::AKRILIK, ProductQuality::STANDARD);
        $variant2 = $this->createTestVariant(ProductMaterial::AKRILIK, ProductQuality::TINGGI);
        $variant3 = $this->createTestVariant(ProductMaterial::KUNINGAN, ProductQuality::STANDARD);
        $this->repository->save($variant1);
        $this->repository->save($variant2);
        $this->repository->save($variant3);

        $akrlikVariants = $this->repository->findByMaterial($this->tenantId, ProductMaterial::AKRILIK);
        $kuninganVariants = $this->repository->findByMaterial($this->tenantId, ProductMaterial::KUNINGAN);

        $this->assertCount(2, $akrlikVariants);
        $this->assertCount(1, $kuninganVariants);
        $this->assertEquals(ProductMaterial::AKRILIK, $akrlikVariants[0]->getMaterial());
        $this->assertEquals(ProductMaterial::KUNINGAN, $kuninganVariants[0]->getMaterial());
    }

    /** @test */
    public function it_can_find_variants_by_quality(): void
    {
        $variant1 = $this->createTestVariant(ProductMaterial::AKRILIK, ProductQuality::STANDARD);
        $variant2 = $this->createTestVariant(ProductMaterial::KUNINGAN, ProductQuality::STANDARD);
        $variant3 = $this->createTestVariant(ProductMaterial::TEMBAGA, ProductQuality::TINGGI);
        $this->repository->save($variant1);
        $this->repository->save($variant2);
        $this->repository->save($variant3);

        $standardVariants = $this->repository->findByQuality($this->tenantId, ProductQuality::STANDARD);
        $tinggiVariants = $this->repository->findByQuality($this->tenantId, ProductQuality::TINGGI);

        $this->assertCount(2, $standardVariants);
        $this->assertCount(1, $tinggiVariants);
        $this->assertEquals(ProductQuality::STANDARD, $standardVariants[0]->getQuality());
        $this->assertEquals(ProductQuality::TINGGI, $tinggiVariants[0]->getQuality());
    }

    /** @test */
    public function it_can_find_active_variants(): void
    {
        $activeVariant = $this->createTestVariant(ProductMaterial::AKRILIK, ProductQuality::STANDARD);
        $this->repository->save($activeVariant);

        $inactiveVariant = $this->createTestVariant(ProductMaterial::KUNINGAN, ProductQuality::TINGGI);
        $inactiveVariant->deactivate();
        $this->repository->save($inactiveVariant);

        $activeVariants = $this->repository->findActiveVariants($this->tenantId);

        $this->assertCount(1, $activeVariants);
        $this->assertTrue($activeVariants[0]->isActive());
    }

    /** @test */
    public function it_can_find_variants_in_stock(): void
    {
        $inStockVariant = $this->createTestVariant(ProductMaterial::AKRILIK, ProductQuality::STANDARD);
        $inStockVariant->updateStock(50);
        $this->repository->save($inStockVariant);

        $outOfStockVariant = $this->createTestVariant(ProductMaterial::KUNINGAN, ProductQuality::TINGGI);
        $outOfStockVariant->updateStock(0);
        $this->repository->save($outOfStockVariant);

        $inStockVariants = $this->repository->findInStock($this->tenantId);

        $this->assertCount(1, $inStockVariants);
        $this->assertTrue($inStockVariants[0]->hasStock());
    }

    /** @test */
    public function it_can_find_low_stock_variants(): void
    {
        $normalStockVariant = $this->createTestVariant(ProductMaterial::AKRILIK, ProductQuality::STANDARD);
        $normalStockVariant->setLowStockThreshold(10);
        $normalStockVariant->updateStock(50);
        $this->repository->save($normalStockVariant);

        $lowStockVariant = $this->createTestVariant(ProductMaterial::KUNINGAN, ProductQuality::TINGGI);
        $lowStockVariant->setLowStockThreshold(10);
        $lowStockVariant->updateStock(5);
        $this->repository->save($lowStockVariant);

        $lowStockVariants = $this->repository->findLowStock($this->tenantId);

        $this->assertCount(1, $lowStockVariants);
        $this->assertTrue($lowStockVariants[0]->isLowStock());
    }

    /** @test */
    public function it_can_find_variants_by_price_range(): void
    {
        $cheapVariant = $this->createTestVariant(ProductMaterial::AKRILIK, ProductQuality::STANDARD);
        $cheapVariant->updatePricing(50000.00, 65000.00, 75000.00);
        $this->repository->save($cheapVariant);

        $expensiveVariant = $this->createTestVariant(ProductMaterial::KUNINGAN, ProductQuality::PREMIUM);
        $expensiveVariant->updatePricing(200000.00, 260000.00, 300000.00);
        $this->repository->save($expensiveVariant);

        $midRangeVariants = $this->repository->findByPriceRange($this->tenantId, 60000.00, 100000.00);
        $highEndVariants = $this->repository->findByPriceRange($this->tenantId, 250000.00, 350000.00);

        $this->assertCount(1, $midRangeVariants);
        $this->assertCount(1, $highEndVariants);
        $this->assertEquals(65000.00, $midRangeVariants[0]->getSellingPrice());
        $this->assertEquals(260000.00, $highEndVariants[0]->getSellingPrice());
    }

    /** @test */
    public function it_can_update_stock_quantity(): void
    {
        $variant = $this->createTestVariant();
        $savedVariant = $this->repository->save($variant);

        $updated = $this->repository->updateStock($savedVariant->getId()->getValue(), 100);

        $this->assertTrue($updated);
        
        $updatedVariant = $this->repository->findById($savedVariant->getId()->getValue());
        $this->assertEquals(100, $updatedVariant->getStockQuantity());
    }

    /** @test */
    public function it_can_increase_stock(): void
    {
        $variant = $this->createTestVariant();
        $variant->updateStock(50);
        $savedVariant = $this->repository->save($variant);

        $updated = $this->repository->increaseStock($savedVariant->getId()->getValue(), 30);

        $this->assertTrue($updated);
        
        $updatedVariant = $this->repository->findById($savedVariant->getId()->getValue());
        $this->assertEquals(80, $updatedVariant->getStockQuantity());
    }

    /** @test */
    public function it_can_decrease_stock(): void
    {
        $variant = $this->createTestVariant();
        $variant->updateStock(50);
        $savedVariant = $this->repository->save($variant);

        $updated = $this->repository->decreaseStock($savedVariant->getId()->getValue(), 20);

        $this->assertTrue($updated);
        
        $updatedVariant = $this->repository->findById($savedVariant->getId()->getValue());
        $this->assertEquals(30, $updatedVariant->getStockQuantity());
    }

    /** @test */
    public function it_can_update_pricing(): void
    {
        $variant = $this->createTestVariant();
        $savedVariant = $this->repository->save($variant);

        $updated = $this->repository->updatePricing(
            $savedVariant->getId()->getValue(),
            100000.00,
            130000.00,
            150000.00
        );

        $this->assertTrue($updated);
        
        $updatedVariant = $this->repository->findById($savedVariant->getId()->getValue());
        $this->assertEquals(100000.00, $updatedVariant->getBasePrice());
        $this->assertEquals(130000.00, $updatedVariant->getSellingPrice());
        $this->assertEquals(150000.00, $updatedVariant->getRetailPrice());
    }

    /** @test */
    public function it_can_count_variants_by_tenant(): void
    {
        $variant1 = $this->createTestVariant(ProductMaterial::AKRILIK, ProductQuality::STANDARD);
        $variant2 = $this->createTestVariant(ProductMaterial::KUNINGAN, ProductQuality::TINGGI);
        $this->repository->save($variant1);
        $this->repository->save($variant2);

        $count = $this->repository->countByTenant($this->tenantId);

        $this->assertEquals(2, $count);
    }

    /** @test */
    public function it_can_count_variants_by_category(): void
    {
        $variant1 = $this->createTestVariant(ProductMaterial::AKRILIK, ProductQuality::STANDARD);
        $variant2 = $this->createTestVariant(ProductMaterial::KUNINGAN, ProductQuality::TINGGI);
        $this->repository->save($variant1);
        $this->repository->save($variant2);

        $count = $this->repository->countByCategory($this->categoryId);

        $this->assertEquals(2, $count);
    }

    /** @test */
    public function it_can_check_if_sku_exists(): void
    {
        $variant = $this->createTestVariant();
        $this->repository->save($variant);

        $exists = $this->repository->skuExists($this->tenantId, 'akrilik-standard');
        $notExists = $this->repository->skuExists($this->tenantId, 'non-existent-sku');

        $this->assertTrue($exists);
        $this->assertFalse($notExists);
    }

    /** @test */
    public function it_can_delete_variant(): void
    {
        $variant = $this->createTestVariant();
        $savedVariant = $this->repository->save($variant);

        $deleted = $this->repository->delete($savedVariant->getId()->getValue());

        $this->assertTrue($deleted);
        $this->assertNull($this->repository->findById($savedVariant->getId()->getValue()));
    }

    /** @test */
    public function it_returns_false_when_deleting_non_existent_variant(): void
    {
        $deleted = $this->repository->delete('non-existent-uuid');

        $this->assertFalse($deleted);
    }

    /** @test */
    public function it_maintains_tenant_isolation(): void
    {
        // Create variant for current tenant
        $variant1 = $this->createTestVariant();
        $this->repository->save($variant1);

        // Switch to different tenant context
        app()->instance('currentTenant', (object) ['id' => 2, 'uuid' => 'different-tenant-uuid']);
        
        // Create variant for different tenant
        $variant2 = $this->createTestVariant(ProductMaterial::KUNINGAN, ProductQuality::TINGGI);
        $this->repository->save($variant2);

        // Switch back to original tenant
        app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

        $variants = $this->repository->findActiveVariants($this->tenantId);

        // Should only find variant for current tenant
        $this->assertCount(1, $variants);
        $this->assertEquals(ProductMaterial::AKRILIK, $variants[0]->getMaterial());
    }

    /** @test */
    public function it_can_find_variants_with_pagination(): void
    {
        // Create multiple variants
        for ($i = 0; $i < 15; $i++) {
            $materials = [ProductMaterial::AKRILIK, ProductMaterial::KUNINGAN, ProductMaterial::TEMBAGA];
            $qualities = [ProductQuality::STANDARD, ProductQuality::TINGGI, ProductQuality::PREMIUM];
            
            $variant = $this->createTestVariant($materials[$i % 3], $qualities[$i % 3]);
            $variant->setCustomSku("variant-sku-{$i}");
            $this->repository->save($variant);
        }

        $paginatedResult = $this->repository->findPaginated($this->tenantId, 1, 10);

        $this->assertCount(10, $paginatedResult['data']);
        $this->assertEquals(15, $paginatedResult['total']);
        $this->assertEquals(2, $paginatedResult['total_pages']);
        $this->assertEquals(1, $paginatedResult['current_page']);
    }

    /** @test */
    public function it_can_find_variants_with_sorting(): void
    {
        $variant1 = $this->createTestVariant(ProductMaterial::AKRILIK, ProductQuality::STANDARD);
        $variant1->updatePricing(300000.00, 390000.00, 450000.00);
        $this->repository->save($variant1);

        $variant2 = $this->createTestVariant(ProductMaterial::KUNINGAN, ProductQuality::TINGGI);
        $variant2->updatePricing(100000.00, 130000.00, 150000.00);
        $variant2->setCustomSku('kuningan-tinggi-custom');
        $this->repository->save($variant2);

        $variant3 = $this->createTestVariant(ProductMaterial::TEMBAGA, ProductQuality::PREMIUM);
        $variant3->updatePricing(200000.00, 260000.00, 300000.00);
        $variant3->setCustomSku('tembaga-premium-custom');
        $this->repository->save($variant3);

        $sortedByPrice = $this->repository->findAllSorted($this->tenantId, 'selling_price', 'asc');

        $this->assertEquals(130000.00, $sortedByPrice[0]->getSellingPrice());
        $this->assertEquals(260000.00, $sortedByPrice[1]->getSellingPrice());
        $this->assertEquals(390000.00, $sortedByPrice[2]->getSellingPrice());
    }

    /** @test */
    public function it_can_search_variants(): void
    {
        $variant1 = $this->createTestVariant(ProductMaterial::AKRILIK, ProductQuality::STANDARD);
        $this->repository->save($variant1);

        $variant2 = $this->createTestVariant(ProductMaterial::KUNINGAN, ProductQuality::TINGGI);
        $variant2->setCustomSku('special-kuningan-001');
        $this->repository->save($variant2);

        // Search by SKU
        $searchResults = $this->repository->search($this->tenantId, 'special-kuningan');

        $this->assertCount(1, $searchResults);
        $this->assertEquals('special-kuningan-001', $searchResults[0]->getSku());
    }

    /** @test */
    public function it_can_get_stock_summary(): void
    {
        $variant1 = $this->createTestVariant(ProductMaterial::AKRILIK, ProductQuality::STANDARD);
        $variant1->updateStock(100);
        $this->repository->save($variant1);

        $variant2 = $this->createTestVariant(ProductMaterial::KUNINGAN, ProductQuality::TINGGI);
        $variant2->updateStock(50);
        $variant2->setCustomSku('kuningan-tinggi-custom');
        $this->repository->save($variant2);

        $stockSummary = $this->repository->getStockSummary($this->tenantId);

        $this->assertEquals(150, $stockSummary['total_stock']);
        $this->assertEquals(2, $stockSummary['variant_count']);
        $this->assertEquals(75.0, $stockSummary['average_stock']);
    }

    private function createTestVariant(
        ProductMaterial $material = ProductMaterial::AKRILIK,
        ProductQuality $quality = ProductQuality::STANDARD
    ): ProductVariant {
        $id = new Uuid(\Ramsey\Uuid\Uuid::uuid4()->toString());
        $tenantId = new Uuid($this->tenantId);
        $categoryId = new Uuid($this->categoryId);

        return new ProductVariant($id, $tenantId, $categoryId, $material, $quality);
    }
}