<?php

namespace Plugins\PagesEngine\Tests\Feature\Api\Public;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CategoryControllerTest extends TestCase
{
    use RefreshDatabase;

    protected string $tenantId;
    protected $contentType;
    protected $category;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenantId = \Ramsey\Uuid\Uuid::uuid4()->toString();
        
        $this->contentType = \PagesEngine\Infrastructure\Persistence\ContentTypeModel::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        $this->category = \PagesEngine\Infrastructure\Persistence\CategoryModel::factory()->create([
            'tenant_id' => $this->tenantId,
            'content_type_id' => $this->contentType->id,
        ]);
    }

    public function test_can_list_public_categories(): void
    {
        $response = $this->getJson('/api/cms/public/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['uuid', 'name', 'slug']
                ],
                'meta' => ['current_page', 'total', 'per_page']
            ]);
    }

    public function test_can_filter_categories_by_content_type(): void
    {
        $response = $this->getJson("/api/cms/public/categories?content_type={$this->contentType->uuid}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_can_get_category_tree(): void
    {
        $response = $this->getJson('/api/cms/public/categories/tree');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => []
            ]);
    }

    public function test_can_get_category_tree_for_content_type(): void
    {
        $response = $this->getJson("/api/cms/public/categories/tree?content_type={$this->contentType->uuid}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_can_show_category_by_slug(): void
    {
        $response = $this->getJson("/api/cms/public/categories/{$this->category->slug}");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['uuid', 'name', 'slug']]);
    }

    public function test_returns_404_for_nonexistent_category(): void
    {
        $response = $this->getJson('/api/cms/public/categories/nonexistent-slug');

        $response->assertStatus(404)
            ->assertJson(['success' => false]);
    }

    public function test_categories_list_supports_pagination(): void
    {
        \PagesEngine\Infrastructure\Persistence\CategoryModel::factory()->count(30)->create([
            'tenant_id' => $this->tenantId,
            'content_type_id' => $this->contentType->id,
        ]);

        $response = $this->getJson('/api/cms/public/categories?per_page=10&page=1');

        $response->assertStatus(200)
            ->assertJsonStructure(['meta' => ['current_page', 'total', 'per_page']])
            ->assertJsonPath('meta.per_page', 10);
    }
}
