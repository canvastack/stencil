<?php

namespace Tests\Unit\Application\Product;

use Tests\TestCase;
use App\Application\Product\UseCases\CreateProductCategoryUseCase;
use App\Application\Product\Commands\CreateProductCategoryCommand;
use App\Domain\Product\Repositories\ProductCategoryRepositoryInterface;
use App\Domain\Product\Entities\ProductCategory;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Product\ValueObjects\ProductCategoryName;
use App\Domain\Product\ValueObjects\ProductCategorySlug;
use App\Domain\Product\Enums\ProductMaterial;
use App\Domain\Product\Enums\ProductQuality;
use Mockery;

class CreateProductCategoryUseCaseTest extends TestCase
{
    private CreateProductCategoryUseCase $useCase;
    private ProductCategoryRepositoryInterface $repository;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->repository = Mockery::mock(ProductCategoryRepositoryInterface::class);
        $this->useCase = new CreateProductCategoryUseCase($this->repository);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_creates_root_category_successfully(): void
    {
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Etching Products',
            slug: 'etching-products',
            description: 'All etching related products'
        );

        // Mock repository expectations
        $this->repository
            ->shouldReceive('findBySlug')
            ->with('987e6543-e21c-34d5-b678-123456789012', 'etching-products')
            ->once()
            ->andReturn(null); // No existing category with this slug

        $this->repository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductCategory $category) {
                $this->assertEquals('Etching Products', $category->getName()->getValue());
                $this->assertEquals('etching-products', $category->getSlug()->getValue());
                $this->assertEquals('All etching related products', $category->getDescription());
                $this->assertTrue($category->isActive());
                $this->assertEquals(0, $category->getLevel());
                $this->assertNull($category->getParentId());
                return $category;
            });

        $this->repository
            ->shouldReceive('updateCategoryHierarchy')
            ->once()
            ->withArgs(function ($categoryId) {
                return $categoryId instanceof \App\Domain\Shared\ValueObjects\Uuid;
            });

        $result = $this->useCase->execute($command);

        $this->assertInstanceOf(ProductCategory::class, $result);
        $this->assertEquals('Etching Products', $result->getName()->getValue());
        $this->assertEquals('etching-products', $result->getSlug()->getValue());
    }

    /** @test */
    public function it_creates_child_category_successfully(): void
    {
        $parentId = '123e4567-e89b-12d3-a456-426614174000';
        
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Akrilik Products',
            slug: 'akrilik',
            description: 'Akrilik etching products',
            parentId: $parentId
        );

        $parentCategory = $this->createMockParentCategory();

        // Mock repository expectations
        $this->repository
            ->shouldReceive('findBySlug')
            ->with('987e6543-e21c-34d5-b678-123456789012', 'akrilik')
            ->once()
            ->andReturn(null);

        $this->repository
            ->shouldReceive('findByUuid')
            ->with($parentId)
            ->once()
            ->andReturn($parentCategory);

        $this->repository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductCategory $category) use ($parentId) {
                $this->assertEquals('Akrilik Products', $category->getName()->getValue());
                $this->assertEquals('akrilik', $category->getSlug()->getValue());
                $this->assertEquals(1, $category->getLevel());
                $this->assertEquals($parentId, $category->getParentId());
                $this->assertEquals('etching-products/akrilik', $category->getPath());
                return $category;
            });

        $this->repository
            ->shouldReceive('updateCategoryHierarchy')
            ->once()
            ->withArgs(function ($categoryId) {
                return $categoryId instanceof \App\Domain\Shared\ValueObjects\Uuid;
            });

        $result = $this->useCase->execute($command);

        $this->assertInstanceOf(ProductCategory::class, $result);
        $this->assertEquals('Akrilik Products', $result->getName()->getValue());
        $this->assertEquals(1, $result->getLevel());
    }

    /** @test */
    public function it_throws_exception_when_slug_already_exists(): void
    {
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Etching Products',
            slug: 'etching-products'
        );

        $existingCategory = $this->createMockRootCategory();

        $this->repository
            ->shouldReceive('findBySlug')
            ->with('987e6543-e21c-34d5-b678-123456789012', 'etching-products')
            ->once()
            ->andReturn($existingCategory);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Category with slug "etching-products" already exists in this tenant');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_parent_not_found(): void
    {
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Child Category',
            slug: 'child-category',
            parentId: 'non-existent-parent-id'
        );

        $this->repository
            ->shouldReceive('findBySlug')
            ->with('987e6543-e21c-34d5-b678-123456789012', 'child-category')
            ->once()
            ->andReturn(null);

        $this->repository
            ->shouldReceive('findByUuid')
            ->with('non-existent-parent-id')
            ->once()
            ->andReturn(null);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Parent category not found');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_creates_category_with_allowed_materials(): void
    {
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Metal Products',
            slug: 'metal-products',
            allowedMaterials: ['kuningan', 'tembaga', 'stainless_steel']
        );

        $this->repository
            ->shouldReceive('findBySlug')
            ->once()
            ->andReturn(null);

        $this->repository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductCategory $category) {
                $materials = $category->getAllowedMaterials();
                $this->assertContains(ProductMaterial::KUNINGAN, $materials);
                $this->assertContains(ProductMaterial::TEMBAGA, $materials);
                $this->assertContains(ProductMaterial::STAINLESS_STEEL, $materials);
                $this->assertNotContains(ProductMaterial::AKRILIK, $materials);
                return $category;
            });

        $this->repository
            ->shouldReceive('updateCategoryHierarchy')
            ->once()
            ->withArgs(function ($categoryId) {
                return $categoryId instanceof \App\Domain\Shared\ValueObjects\Uuid;
            });

        $result = $this->useCase->execute($command);

        $this->assertInstanceOf(ProductCategory::class, $result);
    }

    /** @test */
    public function it_creates_category_with_quality_levels(): void
    {
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Premium Products',
            slug: 'premium-products',
            qualityLevels: ['tinggi', 'premium']
        );

        $this->repository
            ->shouldReceive('findBySlug')
            ->once()
            ->andReturn(null);

        $this->repository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductCategory $category) {
                $qualities = $category->getQualityLevels();
                $this->assertContains(ProductQuality::TINGGI, $qualities);
                $this->assertContains(ProductQuality::PREMIUM, $qualities);
                $this->assertNotContains(ProductQuality::STANDARD, $qualities);
                return $category;
            });

        $this->repository
            ->shouldReceive('updateCategoryHierarchy')
            ->once()
            ->withArgs(function ($categoryId) {
                return $categoryId instanceof \App\Domain\Shared\ValueObjects\Uuid;
            });

        $result = $this->useCase->execute($command);

        $this->assertInstanceOf(ProductCategory::class, $result);
    }

    /** @test */
    public function it_creates_category_with_customization_options(): void
    {
        $customizationOptions = [
            'thickness' => ['2mm', '3mm', '5mm'],
            'finish' => ['glossy', 'matte'],
            'custom_text' => true,
            'logo_upload' => true
        ];

        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Custom Products',
            slug: 'custom-products',
            customizationOptions: $customizationOptions
        );

        $this->repository
            ->shouldReceive('findBySlug')
            ->once()
            ->andReturn(null);

        $this->repository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductCategory $category) use ($customizationOptions) {
                $options = $category->getCustomizationOptions();
                $this->assertEquals($customizationOptions, $options);
                $this->assertTrue($category->hasCustomizationOption('thickness'));
                $this->assertTrue($category->hasCustomizationOption('custom_text'));
                return $category;
            });

        $this->repository
            ->shouldReceive('updateCategoryHierarchy')
            ->once()
            ->withArgs(function ($categoryId) {
                return $categoryId instanceof \App\Domain\Shared\ValueObjects\Uuid;
            });

        $result = $this->useCase->execute($command);

        $this->assertInstanceOf(ProductCategory::class, $result);
    }

    /** @test */
    public function it_creates_category_with_seo_information(): void
    {
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Etching Products',
            slug: 'etching-products',
            seoTitle: 'Professional Etching Products | PT CEX',
            seoDescription: 'High-quality etching products for all your needs',
            seoKeywords: ['etching', 'laser', 'engraving', 'custom']
        );

        $this->repository
            ->shouldReceive('findBySlug')
            ->once()
            ->andReturn(null);

        $this->repository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductCategory $category) {
                $this->assertEquals('Professional Etching Products | PT CEX', $category->getSeoTitle());
                $this->assertEquals('High-quality etching products for all your needs', $category->getSeoDescription());
                $this->assertEquals(['etching', 'laser', 'engraving', 'custom'], $category->getSeoKeywords());
                return $category;
            });

        $this->repository
            ->shouldReceive('updateCategoryHierarchy')
            ->once()
            ->withArgs(function ($categoryId) {
                return $categoryId instanceof \App\Domain\Shared\ValueObjects\Uuid;
            });

        $result = $this->useCase->execute($command);

        $this->assertInstanceOf(ProductCategory::class, $result);
    }

    /** @test */
    public function it_creates_category_with_pricing_configuration(): void
    {
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Premium Products',
            slug: 'premium-products',
            baseMarkupPercentage: 35.50,
            requiresQuote: true
        );

        $this->repository
            ->shouldReceive('findBySlug')
            ->once()
            ->andReturn(null);

        $this->repository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductCategory $category) {
                $this->assertEquals(35.50, $category->getBaseMarkupPercentage());
                $this->assertTrue($category->requiresQuote());
                return $category;
            });

        $this->repository
            ->shouldReceive('updateCategoryHierarchy')
            ->once()
            ->withArgs(function ($categoryId) {
                return $categoryId instanceof \App\Domain\Shared\ValueObjects\Uuid;
            });

        $result = $this->useCase->execute($command);

        $this->assertInstanceOf(ProductCategory::class, $result);
    }

    /** @test */
    public function it_validates_invalid_material_values(): void
    {
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Test Category',
            slug: 'test-category',
            allowedMaterials: ['invalid_material', 'kuningan']
        );

        $this->repository
            ->shouldReceive('findBySlug')
            ->once()
            ->andReturn(null);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid material: invalid_material');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_validates_invalid_quality_values(): void
    {
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Test Category',
            slug: 'test-category',
            qualityLevels: ['invalid_quality', 'standard']
        );

        $this->repository
            ->shouldReceive('findBySlug')
            ->once()
            ->andReturn(null);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid quality: invalid_quality');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_validates_markup_percentage_range(): void
    {
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Test Category',
            slug: 'test-category',
            baseMarkupPercentage: 150.00
        );

        $this->repository
            ->shouldReceive('findBySlug')
            ->once()
            ->andReturn(null);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Markup percentage must be between 0 and 100');

        $this->useCase->execute($command);
    }

    /** @test */
    public function it_creates_featured_category(): void
    {
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Featured Products',
            slug: 'featured-products',
            isFeatured: true
        );

        $this->repository
            ->shouldReceive('findBySlug')
            ->once()
            ->andReturn(null);

        $this->repository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductCategory $category) {
                $this->assertTrue($category->isFeatured());
                return $category;
            });

        $this->repository
            ->shouldReceive('updateCategoryHierarchy')
            ->once()
            ->withArgs(function ($categoryId) {
                return $categoryId instanceof \App\Domain\Shared\ValueObjects\Uuid;
            });

        $result = $this->useCase->execute($command);

        $this->assertTrue($result->isFeatured());
    }

    /** @test */
    public function it_creates_hidden_menu_category(): void
    {
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Hidden Category',
            slug: 'hidden-category',
            showInMenu: false
        );

        $this->repository
            ->shouldReceive('findBySlug')
            ->once()
            ->andReturn(null);

        $this->repository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductCategory $category) {
                $this->assertFalse($category->showInMenu());
                return $category;
            });

        $this->repository
            ->shouldReceive('updateCategoryHierarchy')
            ->once()
            ->withArgs(function ($categoryId) {
                return $categoryId instanceof \App\Domain\Shared\ValueObjects\Uuid;
            });

        $result = $this->useCase->execute($command);

        $this->assertFalse($result->showInMenu());
    }

    /** @test */
    public function it_creates_category_with_media_information(): void
    {
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Visual Category',
            slug: 'visual-category',
            image: 'category-image.jpg',
            icon: 'category-icon.svg',
            colorScheme: '#FF5722'
        );

        $this->repository
            ->shouldReceive('findBySlug')
            ->once()
            ->andReturn(null);

        $this->repository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductCategory $category) {
                $this->assertEquals('category-image.jpg', $category->getImage());
                $this->assertEquals('category-icon.svg', $category->getIcon());
                $this->assertEquals('#FF5722', $category->getColorScheme());
                return $category;
            });

        $this->repository
            ->shouldReceive('updateCategoryHierarchy')
            ->once()
            ->withArgs(function ($categoryId) {
                return $categoryId instanceof \App\Domain\Shared\ValueObjects\Uuid;
            });

        $result = $this->useCase->execute($command);

        $this->assertEquals('category-image.jpg', $result->getImage());
    }

    /** @test */
    public function it_creates_category_with_custom_sort_order(): void
    {
        $command = new CreateProductCategoryCommand(
            tenantId: '987e6543-e21c-34d5-b678-123456789012',
            name: 'Sorted Category',
            slug: 'sorted-category',
            sortOrder: 100
        );

        $this->repository
            ->shouldReceive('findBySlug')
            ->once()
            ->andReturn(null);

        $this->repository
            ->shouldReceive('save')
            ->once()
            ->andReturnUsing(function (ProductCategory $category) {
                $this->assertEquals(100, $category->getSortOrder());
                return $category;
            });

        $this->repository
            ->shouldReceive('updateCategoryHierarchy')
            ->once()
            ->withArgs(function ($categoryId) {
                return $categoryId instanceof \App\Domain\Shared\ValueObjects\Uuid;
            });

        $result = $this->useCase->execute($command);

        $this->assertEquals(100, $result->getSortOrder());
    }

    private function createMockRootCategory(): ProductCategory
    {
        $id = new Uuid('123e4567-e89b-12d3-a456-426614174000');
        $tenantId = new Uuid('987e6543-e21c-34d5-b678-123456789012');
        $name = new ProductCategoryName('Etching Products');
        $slug = new ProductCategorySlug('etching-products');

        return new ProductCategory($id, $tenantId, $name, $slug);
    }

    private function createMockParentCategory(): ProductCategory
    {
        $category = $this->createMockRootCategory();
        $category->setPath('etching-products');
        return $category;
    }
}