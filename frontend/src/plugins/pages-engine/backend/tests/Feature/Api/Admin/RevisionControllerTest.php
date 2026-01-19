<?php

namespace Plugins\PagesEngine\Tests\Feature\Api\Admin;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Spatie\Permission\Models\Role;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentRevisionEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentTypeEloquentModel;

class RevisionControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected TenantEloquentModel $tenant;
    protected ContentEloquentModel $content;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenant = TenantEloquentModel::factory()->create();
        
        $this->adminUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $role = Role::create(['name' => 'admin', 'tenant_id' => $this->tenant->id, 'guard_name' => 'api']);
        $role->givePermissionTo([
            'pages:revisions:view',
            'pages:revisions:restore',
        ]);
        
        $this->adminUser->assignRole($role);
        
        $contentType = ContentTypeEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Blog Post',
            'slug' => 'blog-post',
            'is_active' => true,
        ]);
        
        $this->content = ContentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $contentType->uuid,
            'author_id' => $this->adminUser->uuid,
            'title' => 'Test Content',
            'slug' => 'test-content',
            'content' => ['blocks' => []],
            'status' => 'published',
        ]);
    }

    public function test_can_list_revisions_for_content(): void
    {
        ContentRevisionEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'content_id' => $this->content->uuid,
            'title' => 'Revision 1',
            'content' => ['blocks' => []],
            'created_by' => $this->adminUser->uuid,
            'change_summary' => 'Initial version',
        ]);

        ContentRevisionEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'content_id' => $this->content->uuid,
            'title' => 'Revision 2',
            'content' => ['blocks' => []],
            'created_by' => $this->adminUser->uuid,
            'change_summary' => 'Updated content',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/cms/admin/revisions/content/{$this->content->uuid}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['uuid', 'title', 'created_by']
                ],
                'meta'
            ]);
    }

    public function test_can_show_revision(): void
    {
        $revision = ContentRevisionEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'content_id' => $this->content->uuid,
            'title' => 'Test Revision',
            'content' => ['blocks' => [['type' => 'paragraph', 'data' => ['text' => 'Test content']]]],
            'created_by' => $this->adminUser->uuid,
            'change_summary' => 'Test revision',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/cms/admin/revisions/{$revision->uuid}");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['uuid', 'title', 'content']]);
    }

    public function test_can_revert_to_revision(): void
    {
        $revision = ContentRevisionEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'content_id' => $this->content->uuid,
            'title' => 'Old Version',
            'content' => ['blocks' => [['type' => 'paragraph', 'data' => ['text' => 'Old content']]]],
            'created_by' => $this->adminUser->uuid,
            'change_summary' => 'Old version to revert to',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/cms/admin/revisions/{$revision->uuid}/revert");

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Content reverted to revision successfully']);
    }

    public function test_requires_authentication(): void
    {
        $response = $this->getJson("/api/cms/admin/revisions/content/{$this->content->uuid}");
        $response->assertStatus(401);
    }

    public function test_requires_permission(): void
    {
        $userWithoutPermission = User::factory()->create(['tenant_id' => $this->tenantId]);
        
        $response = $this->actingAs($userWithoutPermission, 'sanctum')
            ->getJson("/api/cms/admin/revisions/content/{$this->content->uuid}");

        $response->assertStatus(403);
    }
}
