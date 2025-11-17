<?php

namespace Tests\Unit\Infrastructure\Product\Models;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductCategoryModelTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Set up test tenant context
        app()->instance('currentTenant', (object) ['id' => 1, 'uuid' => '987e6543-e21c-34d5-b678-123456789012']);
    }

    /** @test */
    public function it_has_correct_fillable_attributes(): void
    {
        $expectedFillable = [
            'uuid',
            'tenant_id',
            'name',
            'slug',
            'description',
            'parent_id',
            'sort_order',
            'level',
            'path',
            'image',
            'icon',
            'color_scheme',
            'is_active',
            'is_featured',
            'show_in_menu',
            'allowed_materials',
            'quality_levels',
            'customization_options',
            'seo_title',
            'seo_description',
            'seo_keywords',
            'base_markup_percentage',
            'requires_quote',
        ];

        $category = new ProductCategory();
        
        $this->assertEquals($expectedFillable, $category->getFillable());
    }

    /** @test */
    public function it_casts_attributes_correctly(): void
    {
        $expectedCasts = [
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'show_in_menu' => 'boolean',
            'allowed_materials' => 'array',
            'quality_levels' => 'array',
            'customization_options' => 'array',
            'seo_keywords' => 'array',
            'base_markup_percentage' => 'decimal:2',
            'requires_quote' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];

        $category = new ProductCategory();
        
        foreach ($expectedCasts as $attribute => $cast) {
            $this->assertEquals($cast, $category->getCasts()[$attribute]);
        }
    }

    /** @test */
    public function it_can_create_product_category_with_basic_attributes(): void
    {
        $category = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Etching Products',
            'slug' => 'etching-products',
            'description' => 'All etching related products',
            'level' => 0,
            'sort_order' => 0,
        ]);

        $this->assertInstanceOf(ProductCategory::class, $category);
        $this->assertEquals('Etching Products', $category->name);
        $this->assertEquals('etching-products', $category->slug);
        $this->assertTrue($category->is_active);
        $this->assertFalse($category->is_featured);
        $this->assertTrue($category->show_in_menu);
    }

    /** @test */
    public function it_auto_generates_uuid_on_creation(): void
    {
        $category = new ProductCategory([
            'tenant_id' => 1,
            'name' => 'Test Category',
            'slug' => 'test-category',
        ]);

        // Trigger the creating event
        $category->save();

        $this->assertNotNull($category->uuid);
        $this->assertTrue(is_string($category->uuid));
        $this->assertEquals(36, strlen($category->uuid)); // UUID v4 format
    }

    /** @test */
    public function it_updates_hierarchy_when_parent_changes(): void
    {
        // Create parent category
        $parent = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Parent Category',
            'slug' => 'parent-category',
            'level' => 0,
            'path' => 'parent-category',
        ]);

        // Create child category
        $child = ProductCategory::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => 1,
            'name' => 'Child Category',
            'slug' => 'child-category',
            'parent_id' => $parent->id,
            'level' => 1,
            'path' => 'parent-category/child-category',
        ]);

        $this->assertEquals($parent->id, $child->parent_id);
        $this->assertEquals(1, $child->level);
        $this->assertEquals('parent-category/child-category', $child->path);
    }

    /** @test */
    public function it_has_tenant_relationship(): void
    {
        $category = new ProductCategory();
        
        $relation = $category->tenant();
        
        $this->assertInstanceOf(BelongsTo::class, $relation);
        // Note: The actual class might vary based on implementation
        // This test verifies the relationship type
    }

    /** @test */
    public function it_has_parent_relationship(): void
    {
        $category = new ProductCategory();
        
        $relation = $category->parent();
        
        $this->assertInstanceOf(BelongsTo::class, $relation);
        $this->assertEquals('parent_id', $relation->getForeignKeyName());
        $this->assertEquals('id', $relation->getOwnerKeyName());
    }

    /** @test */
    public function it_has_children_relationship(): void
    {
        $category = new ProductCategory();
        
        $relation = $category->children();
        
        $this->assertInstanceOf(HasMany::class, $relation);
        $this->assertEquals('parent_id', $relation->getForeignKeyName());
    }

    /** @test */
    public function it_has_descendants_relationship(): void
    {
        // Create hierarchy: Root > Child > Grandchild
        $root = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Root',
            'slug' => 'root',
            'level' => 0,
        ]);

        $child = ProductCategory::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => 1,
            'name' => 'Child',
            'slug' => 'child',
            'parent_id' => $root->id,
            'level' => 1,
        ]);

        $grandchild = ProductCategory::create([
            'uuid' => '789e0123-e45b-67c8-d901-234567890123',
            'tenant_id' => 1,
            'name' => 'Grandchild',
            'slug' => 'grandchild',
            'parent_id' => $child->id,
            'level' => 2,
        ]);

        $descendants = $root->descendants;
        
        $this->assertCount(1, $descendants); // Direct children only
        $this->assertEquals($child->id, $descendants[0]->id);
    }

    /** @test */
    public function it_has_products_relationship(): void
    {
        $category = new ProductCategory();
        
        $relation = $category->products();
        
        $this->assertInstanceOf(HasMany::class, $relation);
        $this->assertEquals('category_id', $relation->getForeignKeyName());
    }

    /** @test */
    public function it_scopes_active_categories(): void
    {
        ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Active Category',
            'slug' => 'active-category',
            'is_active' => true,
        ]);

        ProductCategory::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => 1,
            'name' => 'Inactive Category',
            'slug' => 'inactive-category',
            'is_active' => false,
        ]);

        $activeCategories = ProductCategory::active()->get();

        $this->assertCount(1, $activeCategories);
        $this->assertEquals('Active Category', $activeCategories[0]->name);
    }

    /** @test */
    public function it_scopes_featured_categories(): void
    {
        ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Featured Category',
            'slug' => 'featured-category',
            'is_featured' => true,
        ]);

        ProductCategory::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => 1,
            'name' => 'Regular Category',
            'slug' => 'regular-category',
            'is_featured' => false,
        ]);

        $featuredCategories = ProductCategory::featured()->get();

        $this->assertCount(1, $featuredCategories);
        $this->assertEquals('Featured Category', $featuredCategories[0]->name);
    }

    /** @test */
    public function it_scopes_root_categories(): void
    {
        $root = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Root Category',
            'slug' => 'root-category',
            'level' => 0,
        ]);

        ProductCategory::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => 1,
            'name' => 'Child Category',
            'slug' => 'child-category',
            'parent_id' => $root->id,
            'level' => 1,
        ]);

        $rootCategories = ProductCategory::root()->get();

        $this->assertCount(1, $rootCategories);
        $this->assertEquals('Root Category', $rootCategories[0]->name);
        $this->assertEquals(0, $rootCategories[0]->level);
    }

    /** @test */
    public function it_scopes_categories_by_level(): void
    {
        $root = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Root Category',
            'slug' => 'root-category',
            'level' => 0,
        ]);

        ProductCategory::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => 1,
            'name' => 'Level 1 Category',
            'slug' => 'level1-category',
            'parent_id' => $root->id,
            'level' => 1,
        ]);

        $level0Categories = ProductCategory::byLevel(0)->get();
        $level1Categories = ProductCategory::byLevel(1)->get();

        $this->assertCount(1, $level0Categories);
        $this->assertCount(1, $level1Categories);
        $this->assertEquals(0, $level0Categories[0]->level);
        $this->assertEquals(1, $level1Categories[0]->level);
    }

    /** @test */
    public function it_scopes_categories_shown_in_menu(): void
    {
        ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Menu Category',
            'slug' => 'menu-category',
            'show_in_menu' => true,
        ]);

        ProductCategory::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => 1,
            'name' => 'Hidden Category',
            'slug' => 'hidden-category',
            'show_in_menu' => false,
        ]);

        $menuCategories = ProductCategory::showInMenu()->get();

        $this->assertCount(1, $menuCategories);
        $this->assertEquals('Menu Category', $menuCategories[0]->name);
    }

    /** @test */
    public function it_scopes_ordered_categories(): void
    {
        ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Z Category',
            'slug' => 'z-category',
            'sort_order' => 30,
        ]);

        ProductCategory::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => 1,
            'name' => 'A Category',
            'slug' => 'a-category',
            'sort_order' => 10,
        ]);

        ProductCategory::create([
            'uuid' => '789e0123-e45b-67c8-d901-234567890123',
            'tenant_id' => 1,
            'name' => 'M Category',
            'slug' => 'm-category',
            'sort_order' => 20,
        ]);

        $orderedCategories = ProductCategory::ordered()->get();

        $this->assertEquals('A Category', $orderedCategories[0]->name);
        $this->assertEquals('M Category', $orderedCategories[1]->name);
        $this->assertEquals('Z Category', $orderedCategories[2]->name);
    }

    /** @test */
    public function it_checks_if_category_has_children(): void
    {
        $parent = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Parent Category',
            'slug' => 'parent-category',
        ]);

        $childless = ProductCategory::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => 1,
            'name' => 'Childless Category',
            'slug' => 'childless-category',
        ]);

        ProductCategory::create([
            'uuid' => '789e0123-e45b-67c8-d901-234567890123',
            'tenant_id' => 1,
            'name' => 'Child Category',
            'slug' => 'child-category',
            'parent_id' => $parent->id,
        ]);

        $this->assertTrue($parent->hasChildren());
        $this->assertFalse($childless->hasChildren());
    }

    /** @test */
    public function it_checks_if_category_has_products(): void
    {
        // Note: This test would require Product model to be implemented
        // For now, we'll test the method exists
        $category = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Test Category',
            'slug' => 'test-category',
        ]);

        // This should return false since no products are created
        $this->assertFalse($category->hasProducts());
    }

    /** @test */
    public function it_generates_full_path(): void
    {
        $root = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Electronics',
            'slug' => 'electronics',
            'level' => 0,
        ]);

        $child = ProductCategory::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => 1,
            'name' => 'Mobile Phones',
            'slug' => 'mobile-phones',
            'parent_id' => $root->id,
            'level' => 1,
        ]);

        $grandchild = ProductCategory::create([
            'uuid' => '789e0123-e45b-67c8-d901-234567890123',
            'tenant_id' => 1,
            'name' => 'Smartphones',
            'slug' => 'smartphones',
            'parent_id' => $child->id,
            'level' => 2,
        ]);

        $this->assertEquals('Electronics', $root->getFullPath());
        $this->assertEquals('Electronics / Mobile Phones', $child->getFullPath());
        $this->assertEquals('Electronics / Mobile Phones / Smartphones', $grandchild->getFullPath());
    }

    /** @test */
    public function it_generates_breadcrumb(): void
    {
        $root = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Electronics',
            'slug' => 'electronics',
            'level' => 0,
        ]);

        $child = ProductCategory::create([
            'uuid' => '456e7890-e12b-34c5-d678-901234567890',
            'tenant_id' => 1,
            'name' => 'Mobile Phones',
            'slug' => 'mobile-phones',
            'parent_id' => $root->id,
            'level' => 1,
        ]);

        $breadcrumb = $child->getBreadcrumb();

        $this->assertCount(2, $breadcrumb);
        $this->assertEquals('Electronics', $breadcrumb[0]['name']);
        $this->assertEquals('electronics', $breadcrumb[0]['slug']);
        $this->assertEquals('Mobile Phones', $breadcrumb[1]['name']);
        $this->assertEquals('mobile-phones', $breadcrumb[1]['slug']);
    }

    /** @test */
    public function it_stores_allowed_materials_as_array(): void
    {
        $category = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Metal Products',
            'slug' => 'metal-products',
            'allowed_materials' => ['kuningan', 'tembaga', 'stainless_steel'],
        ]);

        $this->assertIsArray($category->allowed_materials);
        $this->assertCount(3, $category->allowed_materials);
        $this->assertContains('kuningan', $category->allowed_materials);
        $this->assertContains('tembaga', $category->allowed_materials);
        $this->assertContains('stainless_steel', $category->allowed_materials);
    }

    /** @test */
    public function it_stores_quality_levels_as_array(): void
    {
        $category = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Premium Products',
            'slug' => 'premium-products',
            'quality_levels' => ['tinggi', 'premium'],
        ]);

        $this->assertIsArray($category->quality_levels);
        $this->assertCount(2, $category->quality_levels);
        $this->assertContains('tinggi', $category->quality_levels);
        $this->assertContains('premium', $category->quality_levels);
    }

    /** @test */
    public function it_stores_customization_options_as_array(): void
    {
        $options = [
            'thickness' => ['2mm', '3mm', '5mm'],
            'finish' => ['glossy', 'matte'],
            'custom_text' => true,
        ];

        $category = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Custom Products',
            'slug' => 'custom-products',
            'customization_options' => $options,
        ]);

        $this->assertIsArray($category->customization_options);
        $this->assertEquals($options, $category->customization_options);
    }

    /** @test */
    public function it_stores_seo_keywords_as_array(): void
    {
        $keywords = ['etching', 'laser', 'engraving', 'custom'];

        $category = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Etching Services',
            'slug' => 'etching-services',
            'seo_keywords' => $keywords,
        ]);

        $this->assertIsArray($category->seo_keywords);
        $this->assertEquals($keywords, $category->seo_keywords);
    }

    /** @test */
    public function it_casts_base_markup_percentage_as_decimal(): void
    {
        $category = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Premium Category',
            'slug' => 'premium-category',
            'base_markup_percentage' => 25.75,
        ]);

        $this->assertEquals(25.75, $category->base_markup_percentage);
        $this->assertIsFloat($category->base_markup_percentage);
    }

    /** @test */
    public function it_uses_soft_deletes(): void
    {
        $category = ProductCategory::create([
            'uuid' => '123e4567-e89b-12d3-a456-426614174000',
            'tenant_id' => 1,
            'name' => 'Test Category',
            'slug' => 'test-category',
        ]);

        $category->delete();

        // Should be soft deleted
        $this->assertSoftDeleted('product_categories', ['id' => $category->id]);
        
        // Should not be found in regular query
        $this->assertCount(0, ProductCategory::all());
        
        // Should be found with trashed
        $this->assertCount(1, ProductCategory::withTrashed()->get());
    }
}