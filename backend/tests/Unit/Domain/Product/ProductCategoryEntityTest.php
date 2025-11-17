<?php

namespace Tests\Unit\Domain\Product;

use Tests\TestCase;
use App\Domain\Product\Entities\ProductCategory;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Product\ValueObjects\ProductCategoryName;
use App\Domain\Product\ValueObjects\ProductCategorySlug;
use App\Domain\Product\Enums\ProductMaterial;
use App\Domain\Product\Enums\ProductQuality;
use DateTime;
use InvalidArgumentException;

class ProductCategoryEntityTest extends TestCase
{
    /** @test */
    public function it_can_be_created_with_valid_data(): void
    {
        $id = new Uuid('123e4567-e89b-12d3-a456-426614174000');
        $tenantId = new Uuid('987e6543-e21c-34d5-b678-123456789012');
        $name = new ProductCategoryName('Etching Products');
        $slug = new ProductCategorySlug('etching-products');

        $category = new ProductCategory($id, $tenantId, $name, $slug);

        $this->assertEquals($id, $category->getId());
        $this->assertEquals($tenantId, $category->getTenantId());
        $this->assertEquals($name, $category->getName());
        $this->assertEquals($slug, $category->getSlug());
        $this->assertTrue($category->isActive());
        $this->assertFalse($category->isFeatured());
        $this->assertTrue($category->isShowInMenu());
        $this->assertEquals(0, $category->getLevel());
        $this->assertEquals(0, $category->getSortOrder());
        $this->assertNull($category->getParentId());
    }

    /** @test */
    public function it_can_be_created_as_child_category(): void
    {
        $parent = $this->createRootCategory();
        $child = $this->createChildCategory($parent->getId());

        $this->assertEquals($parent->getId(), $child->getParentId());
        $this->assertEquals(1, $child->getLevel());
        $this->assertEquals('etching-products/akrilik', $child->getPath());
        $this->assertTrue($child->hasParent());
        $this->assertFalse($child->isRoot());
    }

    /** @test */
    public function it_can_update_basic_information(): void
    {
        $category = $this->createRootCategory();
        $newName = new ProductCategoryName('Updated Category');
        $newSlug = new ProductCategorySlug('updated-category');
        $newDescription = 'Updated description for category';

        $category->updateBasicInfo($newName, $newSlug, $newDescription);

        $this->assertEquals($newName, $category->getName());
        $this->assertEquals($newSlug, $category->getSlug());
        $this->assertEquals($newDescription, $category->getDescription());
    }

    /** @test */
    public function it_can_be_activated_and_deactivated(): void
    {
        $category = $this->createRootCategory();
        
        $category->deactivate();
        $this->assertFalse($category->isActive());
        
        $category->activate();
        $this->assertTrue($category->isActive());
    }

    /** @test */
    public function it_can_be_featured_and_unfeatured(): void
    {
        $category = $this->createRootCategory();
        
        $category->setAsFeatured();
        $this->assertTrue($category->isFeatured());
        
        $category->removeFeatured();
        $this->assertFalse($category->isFeatured());
    }

    /** @test */
    public function it_can_toggle_menu_visibility(): void
    {
        $category = $this->createRootCategory();
        
        $category->hideFromMenu();
        $this->assertFalse($category->isShowInMenu());
        
        $category->enableInMenu();
        $this->assertTrue($category->isShowInMenu());
    }

    /** @test */
    public function it_can_set_allowed_materials(): void
    {
        $category = $this->createRootCategory();
        $materials = [ProductMaterial::AKRILIK, ProductMaterial::KUNINGAN];

        $category->setAllowedMaterials($materials);

        $this->assertEquals($materials, $category->getAllowedMaterials());
        $this->assertTrue($category->isMaterialAllowed(ProductMaterial::AKRILIK));
        $this->assertTrue($category->isMaterialAllowed(ProductMaterial::KUNINGAN));
        $this->assertFalse($category->isMaterialAllowed(ProductMaterial::TEMBAGA));
    }

    /** @test */
    public function it_can_set_quality_levels(): void
    {
        $category = $this->createRootCategory();
        $qualities = [ProductQuality::STANDARD, ProductQuality::TINGGI];

        $category->setQualityLevels($qualities);

        $this->assertEquals($qualities, $category->getQualityLevels());
        $this->assertTrue($category->isQualityAllowed(ProductQuality::STANDARD));
        $this->assertTrue($category->isQualityAllowed(ProductQuality::TINGGI));
        $this->assertFalse($category->isQualityAllowed(ProductQuality::PREMIUM));
    }

    /** @test */
    public function it_can_set_customization_options(): void
    {
        $category = $this->createRootCategory();
        $options = [
            'thickness' => ['2mm', '3mm', '5mm'],
            'finish' => ['glossy', 'matte'],
            'custom_text' => true,
            'logo_upload' => true
        ];

        $category->setCustomizationOptions($options);

        $this->assertEquals($options, $category->getCustomizationOptions());
        $this->assertTrue($category->hasCustomizationOption('thickness'));
        $this->assertTrue($category->hasCustomizationOption('custom_text'));
        $this->assertFalse($category->hasCustomizationOption('color'));
    }

    /** @test */
    public function it_can_update_sort_order(): void
    {
        $category = $this->createRootCategory();
        
        $category->updateSortOrder(100);
        
        $this->assertEquals(100, $category->getSortOrder());
    }

    /** @test */
    public function it_can_set_media_information(): void
    {
        $category = $this->createRootCategory();
        
        $category->setImage('category-image.jpg');
        $category->setIcon('category-icon.svg');
        $category->setColorScheme('#FF0000');

        $this->assertEquals('category-image.jpg', $category->getImage());
        $this->assertEquals('category-icon.svg', $category->getIcon());
        $this->assertEquals('#FF0000', $category->getColorScheme());
    }

    /** @test */
    public function it_can_set_seo_information(): void
    {
        $category = $this->createRootCategory();
        
        $category->setSeoTitle('SEO Title');
        $category->setSeoDescription('SEO Description');
        $category->setSeoKeywords(['keyword1', 'keyword2']);

        $this->assertEquals('SEO Title', $category->getSeoTitle());
        $this->assertEquals('SEO Description', $category->getSeoDescription());
        $this->assertEquals(['keyword1', 'keyword2'], $category->getSeoKeywords());
    }

    /** @test */
    public function it_can_set_pricing_configuration(): void
    {
        $category = $this->createRootCategory();
        
        $category->setBaseMarkupPercentage(25.50);
        $category->setRequiresQuote(true);

        $this->assertEquals(25.50, $category->getBaseMarkupPercentage());
        $this->assertTrue($category->requiresQuote());
    }

    /** @test */
    public function it_validates_markup_percentage_range(): void
    {
        $category = $this->createRootCategory();

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Markup percentage must be between 0 and 100');
        
        $category->setBaseMarkupPercentage(150.00);
    }

    /** @test */
    public function it_can_check_if_has_etching_materials(): void
    {
        $category = $this->createRootCategory();
        
        // No materials set
        $this->assertFalse($category->hasEtchingMaterials());
        
        // Set etching materials
        $category->setAllowedMaterials([ProductMaterial::AKRILIK, ProductMaterial::KUNINGAN]);
        $this->assertTrue($category->hasEtchingMaterials());
    }

    /** @test */
    public function it_can_get_hierarchy_path(): void
    {
        $parent = $this->createRootCategory();
        $child = $this->createChildCategory($parent->getId());
        
        $this->assertEquals('etching-products', $parent->getPath());
        $this->assertEquals('etching-products/akrilik', $child->getPath());
    }

    /** @test */
    public function it_can_convert_to_array(): void
    {
        $category = $this->createRootCategory();
        $category->setAllowedMaterials([ProductMaterial::AKRILIK]);
        $category->setQualityLevels([ProductQuality::STANDARD]);
        
        $array = $category->toArray();
        
        $this->assertIsArray($array);
        $this->assertArrayHasKey('id', $array);
        $this->assertArrayHasKey('tenant_id', $array);
        $this->assertArrayHasKey('name', $array);
        $this->assertArrayHasKey('slug', $array);
        $this->assertArrayHasKey('is_active', $array);
        $this->assertArrayHasKey('is_featured', $array);
        $this->assertArrayHasKey('level', $array);
        $this->assertArrayHasKey('allowed_materials', $array);
        $this->assertArrayHasKey('quality_levels', $array);
        $this->assertEquals('Etching Products', $array['name']);
        $this->assertEquals('etching-products', $array['slug']);
        $this->assertTrue($array['is_active']);
    }

    /** @test */
    public function it_generates_correct_breadcrumb(): void
    {
        $parent = $this->createRootCategory();
        $child = $this->createChildCategory($parent->getId());
        
        $breadcrumb = $child->getBreadcrumb();
        
        $this->assertIsArray($breadcrumb);
        $this->assertCount(2, $breadcrumb);
        $this->assertEquals('Etching Products', $breadcrumb[0]['name']);
        $this->assertEquals('Akrilik Products', $breadcrumb[1]['name']);
    }

    /** @test */
    public function it_validates_parent_relationship_prevents_circular_reference(): void
    {
        $parent = $this->createRootCategory();
        $child = $this->createChildCategory($parent->getId());

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot set circular parent relationship');
        
        $parent->setParent($child->getId(), 1, 'invalid/path');
    }

    private function createRootCategory(): ProductCategory
    {
        $id = new Uuid('123e4567-e89b-12d3-a456-426614174000');
        $tenantId = new Uuid('987e6543-e21c-34d5-b678-123456789012');
        $name = new ProductCategoryName('Etching Products');
        $slug = new ProductCategorySlug('etching-products');

        return new ProductCategory($id, $tenantId, $name, $slug);
    }

    private function createChildCategory(Uuid $parentId): ProductCategory
    {
        $id = new Uuid('456e7890-e12b-34c5-d678-901234567890');
        $tenantId = new Uuid('987e6543-e21c-34d5-b678-123456789012');
        $name = new ProductCategoryName('Akrilik Products');
        $slug = new ProductCategorySlug('akrilik');

        $category = new ProductCategory($id, $tenantId, $name, $slug);
        $category->setParent($parentId, 1, 'etching-products/akrilik');
        
        return $category;
    }
}