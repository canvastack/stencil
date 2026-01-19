<?php

namespace Plugins\PagesEngine\Tests\Feature\Api\Admin;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Spatie\Permission\Models\Role;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentCommentEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentTypeEloquentModel;

class CommentControllerTest extends TestCase
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
            'pages:comments:view',
            'pages:comments:moderate',
            'pages:comments:approve',
            'pages:comments:reject',
            'pages:comments:spam',
            'pages:comments:delete',
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

    public function test_can_list_comments(): void
    {
        ContentCommentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_id' => $this->content->uuid,
            'author_name' => 'John Doe',
            'author_email' => 'john@example.com',
            'comment_text' => 'Great article!',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/cms/admin/comments');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['uuid', 'author_name', 'comment_text', 'status']
                ],
                'meta'
            ]);
    }

    public function test_can_filter_comments_by_status(): void
    {
        ContentCommentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_id' => $this->content->uuid,
            'author_name' => 'Jane Doe',
            'author_email' => 'jane@example.com',
            'comment_text' => 'Nice post!',
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/cms/admin/comments?status=approved');

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data', 'meta']);
    }

    public function test_can_approve_comment(): void
    {
        $comment = ContentCommentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_id' => $this->content->uuid,
            'author_name' => 'John Doe',
            'author_email' => 'john@example.com',
            'comment_text' => 'Great article!',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/cms/admin/comments/{$comment->uuid}/approve");

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Comment approved successfully']);
    }

    public function test_can_reject_comment(): void
    {
        $comment = ContentCommentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_id' => $this->content->uuid,
            'author_name' => 'John Doe',
            'author_email' => 'john@example.com',
            'comment_text' => 'Test comment',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/cms/admin/comments/{$comment->uuid}/reject");

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Comment rejected successfully']);
    }

    public function test_can_mark_comment_as_spam(): void
    {
        $comment = ContentCommentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_id' => $this->content->uuid,
            'author_name' => 'Spammer',
            'author_email' => 'spam@example.com',
            'comment_text' => 'Buy this product!',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/cms/admin/comments/{$comment->uuid}/spam");

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Comment marked as spam successfully']);
    }

    public function test_can_delete_comment(): void
    {
        $comment = ContentCommentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_id' => $this->content->uuid,
            'author_name' => 'John Doe',
            'author_email' => 'john@example.com',
            'comment_text' => 'Delete me',
            'status' => 'spam',
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->deleteJson("/api/cms/admin/comments/{$comment->uuid}");

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'message' => 'Comment deleted successfully']);
    }

    public function test_can_bulk_approve_comments(): void
    {
        $comment1 = ContentCommentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_id' => $this->content->uuid,
            'author_name' => 'User 1',
            'author_email' => 'user1@example.com',
            'comment_text' => 'Comment 1',
            'status' => 'pending',
        ]);

        $comment2 = ContentCommentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_id' => $this->content->uuid,
            'author_name' => 'User 2',
            'author_email' => 'user2@example.com',
            'comment_text' => 'Comment 2',
            'status' => 'pending',
        ]);

        $data = ['uuids' => [$comment1->uuid, $comment2->uuid]];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/cms/admin/comments/bulk-approve', $data);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_can_bulk_delete_comments(): void
    {
        $comment1 = ContentCommentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_id' => $this->content->uuid,
            'author_name' => 'Spammer 1',
            'author_email' => 'spam1@example.com',
            'comment_text' => 'Spam 1',
            'status' => 'spam',
        ]);

        $comment2 = ContentCommentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_id' => $this->content->uuid,
            'author_name' => 'Spammer 2',
            'author_email' => 'spam2@example.com',
            'comment_text' => 'Spam 2',
            'status' => 'spam',
        ]);

        $data = ['uuids' => [$comment1->uuid, $comment2->uuid]];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/cms/admin/comments/bulk-delete', $data);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_requires_authentication(): void
    {
        $response = $this->getJson('/api/cms/admin/comments');
        $response->assertStatus(401);
    }

    public function test_requires_permission(): void
    {
        $userWithoutPermission = User::factory()->create(['tenant_id' => $this->tenantId]);
        
        $response = $this->actingAs($userWithoutPermission, 'sanctum')
            ->getJson('/api/cms/admin/comments');

        $response->assertStatus(403);
    }
}
