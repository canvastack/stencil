<?php

namespace Plugins\PagesEngine\Tests\Feature\Integration;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Spatie\Permission\Models\Role;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentTypeEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentCategoryEloquentModel;

class ContentWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $author;
    protected User $editor;
    protected TenantEloquentModel $tenant;
    protected ContentTypeEloquentModel $contentType;
    protected ContentCategoryEloquentModel $category;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenant = TenantEloquentModel::factory()->create();
        
        $this->author = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $this->editor = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $authorRole = Role::create(['name' => 'author', 'tenant_id' => $this->tenant->id, 'guard_name' => 'api']);
        $authorRole->givePermissionTo([
            'pages:contents:view',
            'pages:contents:create',
            'pages:contents:update',
            'pages:revisions:view',
        ]);
        
        $editorRole = Role::create(['name' => 'editor', 'tenant_id' => $this->tenant->id, 'guard_name' => 'api']);
        $editorRole->givePermissionTo([
            'pages:contents:view',
            'pages:contents:create',
            'pages:contents:update',
            'pages:contents:delete',
            'pages:contents:publish',
            'pages:contents:schedule',
            'pages:revisions:view',
            'pages:revisions:restore',
            'pages:urls:manage',
        ]);
        
        $this->author->assignRole($authorRole);
        $this->editor->assignRole($editorRole);
        
        $this->contentType = ContentTypeEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Blog Post',
            'slug' => 'blog-post',
            'default_url_pattern' => '/blog/{slug}',
            'is_active' => true,
        ]);
        
        $this->category = ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'name' => 'Technology',
            'slug' => 'technology',
            'path' => 'technology',
            'level' => 0,
        ]);
    }

    public function test_complete_content_creation_workflow(): void
    {
        $createData = [
            'content_type_uuid' => $this->contentType->uuid,
            'title' => 'My First Blog Post',
            'slug' => 'my-first-blog-post',
            'content' => [
                'blocks' => [
                    ['type' => 'paragraph', 'data' => ['text' => 'This is the introduction.']],
                    ['type' => 'paragraph', 'data' => ['text' => 'This is the main content.']],
                ]
            ],
            'excerpt' => 'A great introduction to blogging',
            'categories' => [$this->category->uuid],
        ];

        $createResponse = $this->actingAs($this->author, 'sanctum')
            ->postJson('/api/cms/admin/contents', $createData);

        $createResponse->assertStatus(201)
            ->assertJson(['success' => true]);
        
        $contentUuid = $createResponse->json('data.uuid');
        $this->assertNotEmpty($contentUuid);

        $showResponse = $this->actingAs($this->author, 'sanctum')
            ->getJson("/api/cms/admin/contents/{$contentUuid}");

        $showResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'uuid' => $contentUuid,
                    'title' => 'My First Blog Post',
                    'status' => 'draft',
                ]
            ]);

        $updateData = [
            'content_type_uuid' => $this->contentType->uuid,
            'title' => 'My Updated Blog Post',
            'slug' => 'my-updated-blog-post',
            'content' => [
                'blocks' => [
                    ['type' => 'paragraph', 'data' => ['text' => 'Updated introduction.']],
                    ['type' => 'paragraph', 'data' => ['text' => 'Updated main content.']],
                ]
            ],
            'categories' => [$this->category->uuid],
        ];

        $updateResponse = $this->actingAs($this->author, 'sanctum')
            ->putJson("/api/cms/admin/contents/{$contentUuid}", $updateData);

        $updateResponse->assertStatus(200)
            ->assertJson(['success' => true]);

        $publishResponse = $this->actingAs($this->editor, 'sanctum')
            ->postJson("/api/cms/admin/contents/{$contentUuid}/publish");

        $publishResponse->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('canplug_pagen_contents', [
            'uuid' => $contentUuid,
            'status' => 'published',
        ]);
    }

    public function test_content_revision_workflow(): void
    {
        $createData = [
            'content_type_uuid' => $this->contentType->uuid,
            'title' => 'Revision Test Post',
            'slug' => 'revision-test-post',
            'content' => ['blocks' => [['type' => 'paragraph', 'data' => ['text' => 'Original content']]]],
        ];

        $createResponse = $this->actingAs($this->author, 'sanctum')
            ->postJson('/api/cms/admin/contents', $createData);

        $contentUuid = $createResponse->json('data.uuid');

        $updateData = [
            'content_type_uuid' => $this->contentType->uuid,
            'title' => 'Revision Test Post - Updated',
            'slug' => 'revision-test-post',
            'content' => ['blocks' => [['type' => 'paragraph', 'data' => ['text' => 'Updated content']]]],
        ];

        $this->actingAs($this->author, 'sanctum')
            ->putJson("/api/cms/admin/contents/{$contentUuid}", $updateData);

        $revisionsResponse = $this->actingAs($this->author, 'sanctum')
            ->getJson("/api/cms/admin/revisions/content/{$contentUuid}");

        $revisionsResponse->assertStatus(200)
            ->assertJsonStructure(['success', 'data', 'meta']);

        $revisions = $revisionsResponse->json('data');
        $this->assertGreaterThan(0, count($revisions));
    }

    public function test_content_scheduling_workflow(): void
    {
        $createData = [
            'content_type_uuid' => $this->contentType->uuid,
            'title' => 'Scheduled Post',
            'slug' => 'scheduled-post',
            'content' => ['blocks' => [['type' => 'paragraph', 'data' => ['text' => 'Future content']]]],
        ];

        $createResponse = $this->actingAs($this->author, 'sanctum')
            ->postJson('/api/cms/admin/contents', $createData);

        $contentUuid = $createResponse->json('data.uuid');

        $scheduledAt = now()->addDays(3)->toIso8601String();
        $scheduleResponse = $this->actingAs($this->editor, 'sanctum')
            ->postJson("/api/cms/admin/contents/{$contentUuid}/schedule", [
                'scheduled_at' => $scheduledAt
            ]);

        $scheduleResponse->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('canplug_pagen_contents', [
            'uuid' => $contentUuid,
            'status' => 'scheduled',
        ]);
    }

    public function test_content_url_generation_workflow(): void
    {
        $createData = [
            'content_type_uuid' => $this->contentType->uuid,
            'title' => 'URL Test Post',
            'slug' => 'url-test-post',
            'content' => ['blocks' => []],
        ];

        $createResponse = $this->actingAs($this->author, 'sanctum')
            ->postJson('/api/cms/admin/contents', $createData);

        $contentUuid = $createResponse->json('data.uuid');

        $urlResponse = $this->actingAs($this->editor, 'sanctum')
            ->postJson('/api/cms/admin/urls/build', [
                'content_uuid' => $contentUuid
            ]);

        $urlResponse->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['url']]);
    }

    public function test_multi_user_collaboration_workflow(): void
    {
        $createData = [
            'content_type_uuid' => $this->contentType->uuid,
            'title' => 'Collaborative Post',
            'slug' => 'collaborative-post',
            'content' => ['blocks' => [['type' => 'paragraph', 'data' => ['text' => 'Author content']]]],
        ];

        $createResponse = $this->actingAs($this->author, 'sanctum')
            ->postJson('/api/cms/admin/contents', $createData);

        $contentUuid = $createResponse->json('data.uuid');

        $updateData = [
            'content_type_uuid' => $this->contentType->uuid,
            'title' => 'Collaborative Post - Edited',
            'slug' => 'collaborative-post',
            'content' => ['blocks' => [['type' => 'paragraph', 'data' => ['text' => 'Editor updated content']]]],
        ];

        $updateResponse = $this->actingAs($this->editor, 'sanctum')
            ->putJson("/api/cms/admin/contents/{$contentUuid}", $updateData);

        $updateResponse->assertStatus(200);

        $publishResponse = $this->actingAs($this->editor, 'sanctum')
            ->postJson("/api/cms/admin/contents/{$contentUuid}/publish");

        $publishResponse->assertStatus(200);

        $this->assertDatabaseHas('canplug_pagen_contents', [
            'uuid' => $contentUuid,
            'status' => 'published',
        ]);
    }
}
