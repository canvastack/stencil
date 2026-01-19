<?php

namespace Plugins\PagesEngine\Tests\Feature\Api\Admin;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Spatie\Permission\Models\Role;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentTypeEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentCategoryEloquentModel;

class ContentControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected TenantEloquentModel $tenant;
    protected ContentTypeEloquentModel $contentType;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenant = TenantEloquentModel::factory()->create();
        
        $this->adminUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $role = Role::create(['name' => 'admin', 'tenant_id' => $this->tenant->id, 'guard_name' => 'api']);
        $role->givePermissionTo([
            'pages:contents:view',
            'pages:contents:create',
            'pages:contents:update',
            'pages:contents:delete',
            'pages:contents:publish',
            'pages:contents:schedule',
        ]);
        
        $this->adminUser->assignRole($role);
        
        $this->contentType = ContentTypeEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Blog Post',
            'slug' => 'blog-post',
            'is_active' => true,
        ]);
    }

    public function test_can_list_contents(): void
    {
        ContentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'author_id' => $this->adminUser->uuid,
            'title' => 'Test Content',
            'slug' => 'test-content',
            'content' => ['blocks' => []],
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/cms/admin/contents');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['uuid', 'title', 'slug', 'status']
                ],
                'meta'
            ]);
    }

    public function test_can_create_content(): void
    {
        $data = [
            'content_type_uuid' => $this->contentType->uuid,
            'title' => 'New Blog Post',
            'slug' => 'new-blog-post',
            'content' => ['blocks' => [['type' => 'paragraph', 'data' => ['text' => 'Hello world']]]],
            'excerpt' => 'A short excerpt',
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/cms/admin/contents', $data);

        $response->assertStatus(201)
            ->assertJsonStructure(['success', 'data' => ['uuid', 'title', 'slug'], 'message'])
            ->assertJson(['success' => true]);
        
        $this->assertDatabaseHas('canplug_pagen_contents', [
            'slug' => 'new-blog-post',
            'tenant_id' => $this->tenant->id,
        ]);
    }

    public function test_can_show_content(): void
    {
        $content = ContentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'author_id' => $this->adminUser->uuid,
            'title' => 'Show Test',
            'slug' => 'show-test',
            'content' => ['blocks' => []],
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/cms/admin/contents/{$content->uuid}");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['uuid', 'title', 'slug']]);
    }

    public function test_can_update_content(): void
    {
        $content = ContentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'author_id' => $this->adminUser->uuid,
            'title' => 'Original Title',
            'slug' => 'original-title',
            'content' => ['blocks' => []],
            'status' => 'draft',
        ]);

        $data = [
            'content_type_uuid' => $this->contentType->uuid,
            'title' => 'Updated Title',
            'slug' => 'updated-title',
            'content' => ['blocks' => [['type' => 'paragraph', 'data' => ['text' => 'Updated content']]]],
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/cms/admin/contents/{$content->uuid}", $data);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_can_delete_content(): void
    {
        $content = ContentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'author_id' => $this->adminUser->uuid,
            'title' => 'Delete Test',
            'slug' => 'delete-test',
            'content' => ['blocks' => []],
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->deleteJson("/api/cms/admin/contents/{$content->uuid}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_can_publish_content(): void
    {
        $content = ContentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'author_id' => $this->adminUser->uuid,
            'title' => 'Publish Test',
            'slug' => 'publish-test',
            'content' => ['blocks' => []],
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/cms/admin/contents/{$content->uuid}/publish");

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Content published successfully']);
    }

    public function test_can_unpublish_content(): void
    {
        $content = ContentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'author_id' => $this->adminUser->uuid,
            'title' => 'Unpublish Test',
            'slug' => 'unpublish-test',
            'content' => ['blocks' => []],
            'status' => 'published',
            'published_at' => now(),
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/cms/admin/contents/{$content->uuid}/unpublish");

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Content unpublished successfully']);
    }

    public function test_can_schedule_content(): void
    {
        $content = ContentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'author_id' => $this->adminUser->uuid,
            'title' => 'Schedule Test',
            'slug' => 'schedule-test',
            'content' => ['blocks' => []],
            'status' => 'draft',
        ]);

        $scheduledAt = now()->addDays(7)->toIso8601String();
        $data = ['scheduled_at' => $scheduledAt];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/cms/admin/contents/{$content->uuid}/schedule", $data);

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Content scheduled successfully']);
    }

    public function test_can_archive_content(): void
    {
        $content = ContentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'author_id' => $this->adminUser->uuid,
            'title' => 'Archive Test',
            'slug' => 'archive-test',
            'content' => ['blocks' => []],
            'status' => 'published',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/cms/admin/contents/{$content->uuid}/archive");

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Content archived successfully']);
    }

    public function test_can_get_contents_by_type(): void
    {
        ContentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'author_id' => $this->adminUser->uuid,
            'title' => 'Type Filter Test',
            'slug' => 'type-filter-test',
            'content' => ['blocks' => []],
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/cms/admin/contents/by-type/{$this->contentType->uuid}");

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data', 'meta']);
    }

    public function test_can_get_contents_by_category(): void
    {
        $category = ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'name' => 'Test Category',
            'slug' => 'test-category',
            'path' => 'test-category',
            'level' => 0,
        ]);

        $content = ContentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'author_id' => $this->adminUser->uuid,
            'title' => 'Category Filter Test',
            'slug' => 'category-filter-test',
            'content' => ['blocks' => []],
            'status' => 'draft',
        ]);

        $content->categories()->attach($category->uuid);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/cms/admin/contents/by-category/{$category->uuid}");

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data', 'meta']);
    }

    public function test_can_get_contents_by_status(): void
    {
        ContentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'author_id' => $this->adminUser->uuid,
            'title' => 'Status Filter Test',
            'slug' => 'status-filter-test',
            'content' => ['blocks' => []],
            'status' => 'published',
            'published_at' => now(),
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/cms/admin/contents/by-status/published');

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data', 'meta']);
    }

    public function test_can_get_contents_by_author(): void
    {
        ContentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'author_id' => $this->adminUser->uuid,
            'title' => 'Author Filter Test',
            'slug' => 'author-filter-test',
            'content' => ['blocks' => []],
            'status' => 'draft',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/cms/admin/contents/by-author/{$this->adminUser->uuid}");

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data', 'meta']);
    }

    public function test_requires_authentication(): void
    {
        $response = $this->getJson('/api/cms/admin/contents');
        $response->assertStatus(401);
    }

    public function test_requires_permission(): void
    {
        $userWithoutPermission = User::factory()->create(['tenant_id' => $this->tenantId]);
        
        $response = $this->actingAs($userWithoutPermission, 'sanctum')
            ->getJson('/api/cms/admin/contents');

        $response->assertStatus(403);
    }
}
