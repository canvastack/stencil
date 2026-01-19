<?php

namespace Plugins\PagesEngine\Tests\Feature\Api\Public;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ContentControllerTest extends TestCase
{
    use RefreshDatabase;

    protected string $tenantId;
    protected $contentType;
    protected $category;
    protected $tag;
    protected $content;

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

        $this->tag = \PagesEngine\Infrastructure\Persistence\TagModel::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        $this->content = \PagesEngine\Infrastructure\Persistence\ContentModel::factory()->create([
            'tenant_id' => $this->tenantId,
            'content_type_id' => $this->contentType->id,
            'status' => 'published',
        ]);
    }

    public function test_can_list_published_contents(): void
    {
        $response = $this->getJson('/api/cms/public/contents');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['uuid', 'title', 'slug', 'status']
                ],
                'meta' => ['current_page', 'total', 'per_page']
            ]);
    }

    public function test_can_search_contents(): void
    {
        $response = $this->getJson('/api/cms/public/contents/search?q=test');

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['meta' => ['query']]);
    }

    public function test_search_requires_query_parameter(): void
    {
        $response = $this->getJson('/api/cms/public/contents/search');

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['q']);
    }

    public function test_can_show_published_content_by_slug(): void
    {
        $response = $this->getJson("/api/cms/public/contents/{$this->content->slug}");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['uuid', 'title', 'slug', 'body']]);
    }

    public function test_returns_404_for_unpublished_content(): void
    {
        $unpublishedContent = \PagesEngine\Infrastructure\Persistence\ContentModel::factory()->create([
            'tenant_id' => $this->tenantId,
            'content_type_id' => $this->contentType->id,
            'status' => 'draft',
        ]);

        $response = $this->getJson("/api/cms/public/contents/{$unpublishedContent->slug}");

        $response->assertStatus(404);
    }

    public function test_can_filter_contents_by_category(): void
    {
        $response = $this->getJson("/api/cms/public/contents/category/{$this->category->slug}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_can_filter_contents_by_tag(): void
    {
        $response = $this->getJson("/api/cms/public/contents/tag/{$this->tag->slug}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_can_filter_contents_by_content_type(): void
    {
        $response = $this->getJson("/api/cms/public/contents/type/{$this->contentType->slug}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_contents_list_supports_pagination(): void
    {
        \PagesEngine\Infrastructure\Persistence\ContentModel::factory()->count(30)->create([
            'tenant_id' => $this->tenantId,
            'content_type_id' => $this->contentType->id,
            'status' => 'published',
        ]);

        $response = $this->getJson('/api/cms/public/contents?per_page=15&page=1');

        $response->assertStatus(200)
            ->assertJsonStructure(['meta' => ['current_page', 'total', 'per_page']])
            ->assertJsonPath('meta.per_page', 15);
    }
}
