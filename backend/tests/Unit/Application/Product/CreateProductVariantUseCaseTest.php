<?php

namespace Tests\Unit\Application\Product;

use Tests\TestCase;
use App\Application\Product\UseCases\CreateProductVariantUseCase;
use App\Application\Product\Commands\CreateProductVariantCommand;
use App\Domain\Product\Repositories\ProductVariantRepositoryInterface;
use App\Domain\Product\Repositories\ProductCategoryRepositoryInterface;
use App\Domain\Product\Repositories\ProductRepositoryInterface;
use App\Domain\Product\Entities\ProductVariant;
use App\Domain\Product\Entities\ProductCategory;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Product\ValueObjects\ProductCategoryName;
use App\Domain\Product\ValueObjects\ProductCategorySlug;
use App\Domain\Product\Enums\ProductMaterial;
use App\Domain\Product\Enums\ProductQuality;
use Mockery;

class CreateProductVariantUseCaseTest extends TestCase
{
    private CreateProductVariantUseCase $useCase;
    private ProductRepositoryInterface $productRepository;
    private ProductVariantRepositoryInterface $variantRepository;
    private ProductCategoryRepositoryInterface $categoryRepository;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->productRepository = Mockery::mock(ProductRepositoryInterface::class);
        $this->variantRepository = Mockery::mock(ProductVariantRepositoryInterface::class);
        $this->categoryRepository = Mockery::mock(ProductCategoryRepositoryInterface::class);
        $this->useCase = new CreateProductVariantUseCase(
            $this->categoryRepository,
            $this->variantRepository
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_creates_product_variant_successfully(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'akrilik',
            quality: 'standard'
        );

        $mockCategory = $this->createMockCategory($categoryId);

        // Mock repository expectations
        $this->categoryRepository
            ->shouldReceive('findById')
            ->withArgs(function ($categoryIdArg) {
                return $categoryIdArg instanceof \App\Domain\Shared\ValueObjects\Uuid;
            })
            ->once()
            ->andReturn($mockCategory);

        $this->variantRepository
            ->shouldReceive('findByCategoryMaterialQuality')
            ->withArgs(function ($categoryIdArg, $materialArg, $qualityArg) {
                return $categoryIdArg instanceof \App\Domain\Shared\ValueObjects\UuidValueObject &&
                       $materialArg === ProductMaterial::AKRILIK &&
                       $qualityArg === ProductQuality::STANDARD;
            })
            ->once()
            ->andReturn(null); // No existing variant

        $this->variantRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductVariant $variant) use ($categoryId) {
                $this->assertEquals($categoryId, $variant->getCategoryId()->getValue());
                $this->assertEquals(ProductMaterial::AKRILIK, $variant->getMaterial());
                $this->assertEquals(ProductQuality::STANDARD, $variant->getQuality());
                $this->assertEquals('akrilik-standard', $variant->getSku());
                $this->assertTrue($variant->isActive());
                return $variant;
            });

        $result = $this->useCase->execute($command);

        $this->assertInstanceOf(ProductVariant::class, $result);
        $this->assertEquals(ProductMaterial::AKRILIK, $result->getMaterial());
        $this->assertEquals(ProductQuality::STANDARD, $result->getQuality());
    }

    /** @test */
    public function it_creates_variant_with_pricing_information(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'kuningan',
            quality: 'tinggi',
            basePrice: 150000.00,
            sellingPrice: 195000.00,
            retailPrice: 225000.00
        );

        $mockCategory = $this->createMockCategory($categoryId);

        $this->categoryRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockCategory);

        $this->variantRepository
            ->shouldReceive('findByCategoryMaterialQuality')
            ->once()
            ->andReturn(null);

        $this->variantRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductVariant $variant) {
                $this->assertEquals(150000.00, $variant->getBasePrice());
                $this->assertEquals(195000.00, $variant->getSellingPrice());
                $this->assertEquals(225000.00, $variant->getRetailPrice());
                $this->assertEquals(30.00, $variant->getProfitMarginPercentage()); // (195k-150k)/150k * 100
                return $variant;
            });

        $result = $this->useCase->execute($command);

        $this->assertEquals(150000.00, $result->getBasePrice());
        $this->assertEquals(30.00, $result->getProfitMarginPercentage());
    }

    /** @test */
    public function it_creates_variant_with_stock_information(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'aluminum',
            quality: 'premium',
            stockQuantity: 100,
            lowStockThreshold: 10
        );

        $mockCategory = $this->createMockCategory($categoryId);

        $this->categoryRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockCategory);

        $this->variantRepository
            ->shouldReceive('findByCategoryMaterialQuality')
            ->once()
            ->andReturn(null);

        $this->variantRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductVariant $variant) {
                $this->assertEquals(100, $variant->getStockQuantity());
                $this->assertEquals(10, $variant->getLowStockThreshold());
                $this->assertTrue($variant->hasStock());
                $this->assertFalse($variant->isLowStock());
                return $variant;
            });

        $result = $this->useCase->execute($command);

        $this->assertEquals(100, $result->getStockQuantity());
        $this->assertFalse($result->isLowStock());
    }

    /** @test */
    public function it_creates_variant_with_dimensions(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'stainless_steel',
            quality: 'standard',
            length: 100.0,
            width: 150.0,
            thickness: 3.0,
            weight: 1200.5
        );

        $mockCategory = $this->createMockCategory($categoryId);

        $this->categoryRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockCategory);

        $this->variantRepository
            ->shouldReceive('findByCategoryMaterialQuality')
            ->once()
            ->andReturn(null);

        $this->variantRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductVariant $variant) {
                $this->assertEquals(100.0, $variant->getLength());
                $this->assertEquals(150.0, $variant->getWidth());
                $this->assertEquals(3.0, $variant->getThickness());
                $this->assertEquals(1200.5, $variant->getWeight());
                $this->assertEquals(30000.0, $variant->getArea()); // 100 * 150 * 2 (both sides)
                $this->assertEquals(90000.0, $variant->getVolume()); // 100 * 150 * 3 * 2 (both sides)
                return $variant;
            });

        $result = $this->useCase->execute($command);

        $this->assertEquals(100.0, $result->getLength());
        $this->assertEquals(30000.0, $result->getArea()); // 100 * 150 * 2 (both sides)
    }

    /** @test */
    public function it_creates_variant_with_custom_sku(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'tembaga',
            quality: 'premium',
            customSku: 'CUSTOM-TEMBAGA-001'
        );

        $mockCategory = $this->createMockCategory($categoryId);

        $this->categoryRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockCategory);

        $this->variantRepository
            ->shouldReceive('findByCategoryMaterialQuality')
            ->once()
            ->andReturn(null);

        $this->variantRepository
            ->shouldReceive('isSkuExists')
            ->with(Mockery::any(), 'CUSTOM-TEMBAGA-001')
            ->once()
            ->andReturn(false); // SKU is unique

        $this->variantRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductVariant $variant) {
                $this->assertEquals('CUSTOM-TEMBAGA-001', $variant->getSku());
                return $variant;
            });

        $result = $this->useCase->execute($command);

        $this->assertEquals('CUSTOM-TEMBAGA-001', $result->getSku());
    }

    /** @test */
    public function it_creates_variant_with_etching_specifications(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        $etchingSpecs = [
            'finish' => 'glossy',
            'edge_treatment' => 'polished',
            'engraving_depth' => '0.5mm',
            'color_fill' => 'black'
        ];
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'akrilik',
            quality: 'premium',
            etchingSpecifications: $etchingSpecs
        );

        $mockCategory = $this->createMockCategory($categoryId);

        $this->categoryRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockCategory);

        $this->variantRepository
            ->shouldReceive('findByCategoryMaterialQuality')
            ->once()
            ->andReturn(null);

        $this->variantRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductVariant $variant) use ($etchingSpecs) {
                $this->assertEquals($etchingSpecs, $variant->getEtchingSpecifications());
                $this->assertEquals('glossy', $variant->getEtchingSpecification('finish'));
                $this->assertEquals('polished', $variant->getEtchingSpecification('edge_treatment'));
                return $variant;
            });

        $result = $this->useCase->execute($command);

        $this->assertEquals('glossy', $result->getEtchingSpecification('finish'));
    }

    /** @test */
    public function it_throws_exception_when_category_not_found(): void
    {
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: '999e9999-e99e-49e9-9999-999999999999',
            material: 'akrilik',
            quality: 'standard'
        );

        $this->categoryRepository
            ->shouldReceive('findById')
            ->with(Mockery::type(Uuid::class))
            ->once()
            ->andReturn(null);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Category not found');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_variant_already_exists(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'akrilik',
            quality: 'standard'
        );

        $mockCategory = $this->createMockCategory($categoryId);
        $existingVariant = $this->createMockVariant();

        $this->categoryRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockCategory);

        $this->variantRepository
            ->shouldReceive('findByCategoryMaterialQuality')
            ->withArgs(function ($categoryIdArg, $materialArg, $qualityArg) {
                return $categoryIdArg instanceof \App\Domain\Shared\ValueObjects\UuidValueObject &&
                       $materialArg === ProductMaterial::AKRILIK &&
                       $qualityArg === ProductQuality::STANDARD;
            })
            ->once()
            ->andReturn($existingVariant);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Variant with this material and quality already exists for this category');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_custom_sku_already_exists(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'akrilik',
            quality: 'standard',
            customSku: 'EXISTING-SKU-001'
        );

        $mockCategory = $this->createMockCategory($categoryId);
        $existingVariant = $this->createMockVariant();

        $this->categoryRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockCategory);

        $this->variantRepository
            ->shouldReceive('findByCategoryMaterialQuality')
            ->withArgs(function ($categoryIdArg, $materialArg, $qualityArg) {
                return $categoryIdArg instanceof \App\Domain\Shared\ValueObjects\UuidValueObject &&
                       $materialArg === ProductMaterial::AKRILIK &&
                       $qualityArg === ProductQuality::STANDARD;
            })
            ->once()
            ->andReturn(null);

        $this->variantRepository
            ->shouldReceive('isSkuExists')
            ->with(Mockery::any(), 'EXISTING-SKU-001')
            ->once()
            ->andReturn(true); // SKU already exists

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage("SKU 'EXISTING-SKU-001' already exists");

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_validates_invalid_material(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'invalid_material',
            quality: 'standard'
        );

        $mockCategory = $this->createMockCategory($categoryId);

        $this->categoryRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockCategory);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid material: invalid_material');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_validates_invalid_quality(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'akrilik',
            quality: 'invalid_quality'
        );

        $mockCategory = $this->createMockCategory($categoryId);

        $this->categoryRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockCategory);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid quality: invalid_quality');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_validates_negative_dimensions(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'akrilik',
            quality: 'standard',
            length: -10.0,
            width: 20.0,
            thickness: 2.0
        );

        $mockCategory = $this->createMockCategory($categoryId);

        $this->categoryRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockCategory);

        $this->variantRepository
            ->shouldReceive('findByCategoryMaterialQuality')
            ->withArgs(function ($categoryIdArg, $materialArg, $qualityArg) {
                return $categoryIdArg instanceof \App\Domain\Shared\ValueObjects\UuidValueObject &&
                       $materialArg === ProductMaterial::AKRILIK &&
                       $qualityArg === ProductQuality::STANDARD;
            })
            ->once()
            ->andReturn(null);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Length must be positive');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_validates_negative_weight(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'akrilik',
            quality: 'standard',
            weight: -100.0
        );

        $mockCategory = $this->createMockCategory($categoryId);

        $this->categoryRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockCategory);

        $this->variantRepository
            ->shouldReceive('findByCategoryMaterialQuality')
            ->withArgs(function ($categoryIdArg, $materialArg, $qualityArg) {
                return $categoryIdArg instanceof \App\Domain\Shared\ValueObjects\UuidValueObject &&
                       $materialArg === ProductMaterial::AKRILIK &&
                       $qualityArg === ProductQuality::STANDARD;
            })
            ->once()
            ->andReturn(null);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Weight must be positive');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_validates_negative_stock(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'akrilik',
            quality: 'standard',
            stockQuantity: -10
        );

        $mockCategory = $this->createMockCategory($categoryId);

        $this->categoryRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockCategory);

        $this->variantRepository
            ->shouldReceive('findByCategoryMaterialQuality')
            ->withArgs(function ($categoryIdArg, $materialArg, $qualityArg) {
                return $categoryIdArg instanceof \App\Domain\Shared\ValueObjects\UuidValueObject &&
                       $materialArg === ProductMaterial::AKRILIK &&
                       $qualityArg === ProductQuality::STANDARD;
            })
            ->once()
            ->andReturn(null);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Stock quantity must be non-negative');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_validates_invalid_pricing(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'akrilik',
            quality: 'standard',
            basePrice: -1000.00
        );

        $mockCategory = $this->createMockCategory($categoryId);

        $this->categoryRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockCategory);

        $this->variantRepository
            ->shouldReceive('findByCategoryMaterialQuality')
            ->withArgs(function ($categoryIdArg, $materialArg, $qualityArg) {
                return $categoryIdArg instanceof \App\Domain\Shared\ValueObjects\UuidValueObject &&
                       $materialArg === ProductMaterial::AKRILIK &&
                       $qualityArg === ProductQuality::STANDARD;
            })
            ->once()
            ->andReturn(null);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Base price must be non-negative');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_calculates_price_with_material_and_quality_multipliers(): void
    {
        $categoryId = '456e7890-e12b-34c5-d678-901234567890';
        
        $command = new CreateProductVariantCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            categoryId: $categoryId,
            material: 'kuningan', // 1.8x multiplier
            quality: 'premium',   // 1.7x multiplier
            basePrice: 100000.00
        );

        $mockCategory = $this->createMockCategory($categoryId);

        $this->categoryRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockCategory);

        $this->variantRepository
            ->shouldReceive('findByCategoryMaterialQuality')
            ->once()
            ->andReturn(null);

        $this->variantRepository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductVariant $variant) {
                // Base price with multipliers: 100,000 * 1.8 * 1.7 = 306,000
                $expectedPrice = $variant->calculatePriceWithMultipliers(100000.00);
                $this->assertEquals(306000.00, $expectedPrice);
                return $variant;
            });

        $result = $this->useCase->execute($command);

        $this->assertEquals(ProductMaterial::KUNINGAN, $result->getMaterial());
        $this->assertEquals(ProductQuality::PREMIUM, $result->getQuality());
    }

    private function createMockCategory(string $categoryId): ProductCategory
    {
        $id = new Uuid($categoryId);
        $tenantId = new Uuid('987e6543-e21c-34d5-b678-123456789012');
        $name = new ProductCategoryName('Test Category');
        $slug = new ProductCategorySlug('test-category');

        return new ProductCategory($id, $tenantId, $name, $slug);
    }

    private function createMockVariant(): ProductVariant
    {
        $id = new Uuid('789e0123-e45b-67c8-d901-234567890123');
        $tenantId = new Uuid('987e6543-e21c-34d5-b678-123456789012');
        $categoryId = new Uuid('456e7890-e12b-34c5-d678-901234567890');

        return new ProductVariant($id, $tenantId, $categoryId, ProductMaterial::AKRILIK, ProductQuality::STANDARD);
    }
}