<?php

namespace Plugins\PagesEngine\Tests\Feature\Api\Admin;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Spatie\Permission\Models\Role;

class ContentTypeControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected string $tenantId;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenantId = \Ramsey\Uuid\Uuid::uuid4()->toString();
        
        $this->adminUser = User::factory()->create([
            'tenant_id' => $this->tenantId,
            'account_type' => 'tenant',
        ]);

        $role = Role::create(['name' => 'admin', 'tenant_id' => $this->tenantId, 'guard_name' => 'api']);
        $role->givePermissionTo([
            'pages:content-types:view',
            'pages:content-types:create',
            'pages:content-types:update',
            'pages:content-types:delete',
        ]);
        
        $this->adminUser->assignRole($role);
    }

    public function test_can_list_content_types(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/cms/admin/content-types');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['uuid', 'name', 'slug', 'is_active']
                ],
                'meta' => ['current_page', 'total', 'per_page']
            ]);
    }

    public function test_can_create_content_type(): void
    {
        $data = [
            'name' => 'Blog Post',
            'slug' => 'blog-post',
            'description' => 'Standard blog post content type',
            'is_commentable' => true,
            'is_categorizable' => true,
            'is_taggable' => true,
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/cms/admin/content-types', $data);

        $response->assertStatus(201)
            ->assertJsonStructure(['success', 'data' => ['uuid', 'name', 'slug'], 'message'])
            ->assertJson(['success' => true]);
        
        $this->assertDatabaseHas('canplug_pagen_content_types', [
            'slug' => 'blog-post',
            'tenant_id' => $this->tenantId,
        ]);
    }

    public function test_can_show_content_type(): void
    {
        $contentType = \PagesEngine\Infrastructure\Persistence\ContentTypeModel::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/cms/admin/content-types/{$contentType->uuid}");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['uuid', 'name', 'slug']]);
    }

    public function test_can_update_content_type(): void
    {
        $contentType = \PagesEngine\Infrastructure\Persistence\ContentTypeModel::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        $data = ['name' => 'Updated Name'];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson("/api/cms/admin/content-types/{$contentType->uuid}", $data);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_can_delete_content_type(): void
    {
        $contentType = \PagesEngine\Infrastructure\Persistence\ContentTypeModel::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->deleteJson("/api/cms/admin/content-types/{$contentType->uuid}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_can_activate_content_type(): void
    {
        $contentType = \PagesEngine\Infrastructure\Persistence\ContentTypeModel::factory()->create([
            'tenant_id' => $this->tenantId,
            'is_active' => false,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/cms/admin/content-types/{$contentType->uuid}/activate");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_can_deactivate_content_type(): void
    {
        $contentType = \PagesEngine\Infrastructure\Persistence\ContentTypeModel::factory()->create([
            'tenant_id' => $this->tenantId,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/cms/admin/content-types/{$contentType->uuid}/deactivate");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_can_get_contents_count(): void
    {
        $contentType = \PagesEngine\Infrastructure\Persistence\ContentTypeModel::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson("/api/cms/admin/content-types/{$contentType->uuid}/contents/count");

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['uuid', 'name', 'contents_count']]);
    }

    public function test_requires_authentication(): void
    {
        $response = $this->getJson('/api/cms/admin/content-types');
        $response->assertStatus(401);
    }

    public function test_requires_permission(): void
    {
        $userWithoutPermission = User::factory()->create(['tenant_id' => $this->tenantId]);
        
        $response = $this->actingAs($userWithoutPermission, 'sanctum')
            ->getJson('/api/cms/admin/content-types');

        $response->assertStatus(403);
    }
}
