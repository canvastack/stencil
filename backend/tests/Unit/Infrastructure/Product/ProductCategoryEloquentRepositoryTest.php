<?php

namespace Tests\Unit\Infrastructure\Product;

use Tests\TestCase;
use App\Infrastructure\Persistence\Repositories\Product\ProductCategoryEloquentRepository;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory as ProductCategoryModel;
use App\Domain\Product\Entities\ProductCategory;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Product\ValueObjects\ProductCategoryName;
use App\Domain\Product\ValueObjects\ProductCategorySlug;
use App\Domain\Product\Enums\ProductMaterial;
use App\Domain\Product\Enums\ProductQuality;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\Eloquent\Collection;

class ProductCategoryEloquentRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private ProductCategoryEloquentRepository $repository;
    private string $tenantId;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->repository = new ProductCategoryEloquentRepository();
        $this->tenantId = '987e6543-e21c-34d5-b678-123456789012';
        
        // Set up test tenant context
        app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);
    }

    /** @test */
    public function it_can_save_product_category(): void
    {
        $category = $this->createTestCategory();

        $savedCategory = $this->repository->save($category);

        $this->assertInstanceOf(ProductCategory::class, $savedCategory);
        $this->assertEquals($category->getName()->getValue(), $savedCategory->getName()->getValue());
        $this->assertEquals($category->getSlug()->getValue(), $savedCategory->getSlug()->getValue());

        // Verify in database
        $this->assertDatabaseHas('product_categories', [
            'tenant_id' => 1, // Using integer ID for database
            'uuid' => $category->getId()->getValue(),
            'name' => 'Etching Products',
            'slug' => 'etching-products',
            'is_active' => true,
            'level' => 0,
        ]);
    }

    /** @test */
    public function it_can_find_category_by_id(): void
    {
        $category = $this->createTestCategory();
        $savedCategory = $this->repository->save($category);

        $foundCategory = $this->repository->findById($savedCategory->getId()->getValue());

        $this->assertInstanceOf(ProductCategory::class, $foundCategory);
        $this->assertEquals($savedCategory->getId(), $foundCategory->getId());
        $this->assertEquals($savedCategory->getName()->getValue(), $foundCategory->getName()->getValue());
    }

    /** @test */
    public function it_returns_null_when_category_not_found_by_id(): void
    {
        $foundCategory = $this->repository->findById('non-existent-uuid');

        $this->assertNull($foundCategory);
    }

    /** @test */
    public function it_can_find_category_by_slug(): void
    {
        $category = $this->createTestCategory();
        $this->repository->save($category);

        $foundCategory = $this->repository->findBySlug($this->tenantId, 'etching-products');

        $this->assertInstanceOf(ProductCategory::class, $foundCategory);
        $this->assertEquals('etching-products', $foundCategory->getSlug()->getValue());
    }

    /** @test */
    public function it_returns_null_when_category_not_found_by_slug(): void
    {
        $foundCategory = $this->repository->findBySlug($this->tenantId, 'non-existent-slug');

        $this->assertNull($foundCategory);
    }

    /** @test */
    public function it_can_find_root_categories(): void
    {
        // Create root categories
        $rootCategory1 = $this->createTestCategory('Root Category 1', 'root-category-1');
        $rootCategory2 = $this->createTestCategory('Root Category 2', 'root-category-2');
        $this->repository->save($rootCategory1);
        $this->repository->save($rootCategory2);

        // Create child category
        $childCategory = $this->createTestCategory('Child Category', 'child-category');
        $childCategory->setParent($rootCategory1->getId(), 1, 'root-category-1/child-category');
        $this->repository->save($childCategory);

        $rootCategories = $this->repository->findRootCategories($this->tenantId);

        $this->assertCount(2, $rootCategories);
        $this->assertEquals(0, $rootCategories[0]->getLevel());
        $this->assertEquals(0, $rootCategories[1]->getLevel());
    }

    /** @test */
    public function it_can_find_children_categories(): void
    {
        // Create parent category
        $parentCategory = $this->createTestCategory();
        $savedParent = $this->repository->save($parentCategory);

        // Create child categories
        $child1 = $this->createTestCategory('Child 1', 'child-1');
        $child1->setParent($savedParent->getId(), 1, 'etching-products/child-1');
        $this->repository->save($child1);

        $child2 = $this->createTestCategory('Child 2', 'child-2');
        $child2->setParent($savedParent->getId(), 1, 'etching-products/child-2');
        $this->repository->save($child2);

        $children = $this->repository->findChildren($savedParent->getId()->getValue());

        $this->assertCount(2, $children);
        $this->assertEquals(1, $children[0]->getLevel());
        $this->assertEquals(1, $children[1]->getLevel());
    }

    /** @test */
    public function it_can_find_active_categories(): void
    {
        // Create active category
        $activeCategory = $this->createTestCategory('Active Category', 'active-category');
        $this->repository->save($activeCategory);

        // Create inactive category
        $inactiveCategory = $this->createTestCategory('Inactive Category', 'inactive-category');
        $inactiveCategory->deactivate();
        $this->repository->save($inactiveCategory);

        $activeCategories = $this->repository->findActiveCategories($this->tenantId);

        $this->assertCount(1, $activeCategories);
        $this->assertTrue($activeCategories[0]->isActive());
    }

    /** @test */
    public function it_can_find_featured_categories(): void
    {
        // Create featured category
        $featuredCategory = $this->createTestCategory('Featured Category', 'featured-category');
        $featuredCategory->setAsFeatured();
        $this->repository->save($featuredCategory);

        // Create regular category
        $regularCategory = $this->createTestCategory('Regular Category', 'regular-category');
        $this->repository->save($regularCategory);

        $featuredCategories = $this->repository->findFeaturedCategories($this->tenantId);

        $this->assertCount(1, $featuredCategories);
        $this->assertTrue($featuredCategories[0]->isFeatured());
    }

    /** @test */
    public function it_can_find_categories_by_material(): void
    {
        $category1 = $this->createTestCategory('Akrilik Category', 'akrilik-category');
        $category1->setAllowedMaterials([ProductMaterial::AKRILIK, ProductMaterial::KUNINGAN]);
        $this->repository->save($category1);

        $category2 = $this->createTestCategory('Metal Category', 'metal-category');
        $category2->setAllowedMaterials([ProductMaterial::KUNINGAN, ProductMaterial::TEMBAGA]);
        $this->repository->save($category2);

        $akrlikCategories = $this->repository->findByMaterial($this->tenantId, ProductMaterial::AKRILIK);
        $kuninganCategories = $this->repository->findByMaterial($this->tenantId, ProductMaterial::KUNINGAN);

        $this->assertCount(1, $akrlikCategories);
        $this->assertCount(2, $kuninganCategories);
    }

    /** @test */
    public function it_can_find_categories_by_level(): void
    {
        // Create root category
        $rootCategory = $this->createTestCategory();
        $savedRoot = $this->repository->save($rootCategory);

        // Create level 1 categories
        $level1Category1 = $this->createTestCategory('Level 1-1', 'level1-1');
        $level1Category1->setParent($savedRoot->getId(), 1, 'etching-products/level1-1');
        $this->repository->save($level1Category1);

        $level1Category2 = $this->createTestCategory('Level 1-2', 'level1-2');
        $level1Category2->setParent($savedRoot->getId(), 1, 'etching-products/level1-2');
        $this->repository->save($level1Category2);

        $level0Categories = $this->repository->findByLevel($this->tenantId, 0);
        $level1Categories = $this->repository->findByLevel($this->tenantId, 1);

        $this->assertCount(1, $level0Categories);
        $this->assertCount(2, $level1Categories);
    }

    /** @test */
    public function it_can_search_categories_by_name(): void
    {
        $category1 = $this->createTestCategory('Etching Products', 'etching-products');
        $this->repository->save($category1);

        $category2 = $this->createTestCategory('Laser Cutting', 'laser-cutting');
        $this->repository->save($category2);

        $category3 = $this->createTestCategory('Etching Services', 'etching-services');
        $this->repository->save($category3);

        $searchResults = $this->repository->searchByName($this->tenantId, 'etching');

        $this->assertCount(2, $searchResults);
    }

    /** @test */
    public function it_can_count_categories_by_tenant(): void
    {
        $category1 = $this->createTestCategory('Category 1', 'category-1');
        $this->repository->save($category1);

        $category2 = $this->createTestCategory('Category 2', 'category-2');
        $this->repository->save($category2);

        $count = $this->repository->countByTenant($this->tenantId);

        $this->assertEquals(2, $count);
    }

    /** @test */
    public function it_can_check_if_slug_exists(): void
    {
        $category = $this->createTestCategory();
        $this->repository->save($category);

        $exists = $this->repository->slugExists($this->tenantId, 'etching-products');
        $notExists = $this->repository->slugExists($this->tenantId, 'non-existent-slug');

        $this->assertTrue($exists);
        $this->assertFalse($notExists);
    }

    /** @test */
    public function it_can_get_category_hierarchy(): void
    {
        // Create hierarchy: Root > Level1 > Level2
        $rootCategory = $this->createTestCategory('Root', 'root');
        $savedRoot = $this->repository->save($rootCategory);

        $level1Category = $this->createTestCategory('Level 1', 'level-1');
        $level1Category->setParent($savedRoot->getId(), 1, 'root/level-1');
        $savedLevel1 = $this->repository->save($level1Category);

        $level2Category = $this->createTestCategory('Level 2', 'level-2');
        $level2Category->setParent($savedLevel1->getId(), 2, 'root/level-1/level-2');
        $this->repository->save($level2Category);

        $hierarchy = $this->repository->getCategoryHierarchy($this->tenantId);

        $this->assertCount(1, $hierarchy); // One root category
        $this->assertCount(1, $hierarchy[0]['children']); // One child in root
        $this->assertCount(1, $hierarchy[0]['children'][0]['children']); // One grandchild
    }

    /** @test */
    public function it_can_delete_category(): void
    {
        $category = $this->createTestCategory();
        $savedCategory = $this->repository->save($category);

        $deleted = $this->repository->delete($savedCategory->getId()->getValue());

        $this->assertTrue($deleted);
        $this->assertNull($this->repository->findById($savedCategory->getId()->getValue()));
    }

    /** @test */
    public function it_returns_false_when_deleting_non_existent_category(): void
    {
        $deleted = $this->repository->delete('non-existent-uuid');

        $this->assertFalse($deleted);
    }

    /** @test */
    public function it_can_update_category(): void
    {
        $category = $this->createTestCategory();
        $savedCategory = $this->repository->save($category);

        // Update category
        $newName = new ProductCategoryName('Updated Name');
        $newSlug = new ProductCategorySlug('updated-slug');
        $savedCategory->updateBasicInfo($newName, $newSlug, 'Updated description');

        $updatedCategory = $this->repository->save($savedCategory);

        $this->assertEquals('Updated Name', $updatedCategory->getName()->getValue());
        $this->assertEquals('updated-slug', $updatedCategory->getSlug()->getValue());
        $this->assertEquals('Updated description', $updatedCategory->getDescription());
    }

    /** @test */
    public function it_maintains_tenant_isolation(): void
    {
        // Create category for current tenant
        $category1 = $this->createTestCategory();
        $this->repository->save($category1);

        // Switch to different tenant context
        app()->instance('currentTenant', (object) ['id' => 2, 'uuid' => 'different-tenant-uuid']);
        
        // Create category for different tenant
        $category2 = $this->createTestCategory('Different Tenant Category', 'different-tenant-category');
        $this->repository->save($category2);

        // Switch back to original tenant
        app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => $this->tenantId]);

        $categories = $this->repository->findActiveCategories($this->tenantId);

        // Should only find category for current tenant
        $this->assertCount(1, $categories);
        $this->assertEquals('Etching Products', $categories[0]->getName()->getValue());
    }

    /** @test */
    public function it_can_find_categories_with_pagination(): void
    {
        // Create multiple categories
        for ($i = 1; $i <= 15; $i++) {
            $category = $this->createTestCategory("Category {$i}", "category-{$i}");
            $this->repository->save($category);
        }

        $paginatedResult = $this->repository->findPaginated($this->tenantId, 1, 10);

        $this->assertCount(10, $paginatedResult['data']);
        $this->assertEquals(15, $paginatedResult['total']);
        $this->assertEquals(2, $paginatedResult['total_pages']);
        $this->assertEquals(1, $paginatedResult['current_page']);
    }

    /** @test */
    public function it_can_find_categories_with_sorting(): void
    {
        $category1 = $this->createTestCategory('Z Category', 'z-category');
        $category1->updateSortOrder(30);
        $this->repository->save($category1);

        $category2 = $this->createTestCategory('A Category', 'a-category');
        $category2->updateSortOrder(10);
        $this->repository->save($category2);

        $category3 = $this->createTestCategory('M Category', 'm-category');
        $category3->updateSortOrder(20);
        $this->repository->save($category3);

        $sortedCategories = $this->repository->findAllSorted($this->tenantId, 'sort_order', 'asc');

        $this->assertEquals('A Category', $sortedCategories[0]->getName()->getValue());
        $this->assertEquals('M Category', $sortedCategories[1]->getName()->getValue());
        $this->assertEquals('Z Category', $sortedCategories[2]->getName()->getValue());
    }

    private function createTestCategory(string $name = 'Etching Products', string $slug = 'etching-products'): ProductCategory
    {
        $id = new Uuid(\Ramsey\Uuid\Uuid::uuid4()->toString());
        $tenantId = new Uuid($this->tenantId);
        $categoryName = new ProductCategoryName($name);
        $categorySlug = new ProductCategorySlug($slug);

        return new ProductCategory($id, $tenantId, $categoryName, $categorySlug);
    }
}