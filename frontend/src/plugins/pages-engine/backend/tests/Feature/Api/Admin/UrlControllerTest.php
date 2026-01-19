<?php

namespace Plugins\PagesEngine\Tests\Feature\Api\Admin;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Spatie\Permission\Models\Role;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentTypeEloquentModel;

class UrlControllerTest extends TestCase
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
            'pages:urls:manage',
        ]);
        
        $this->adminUser->assignRole($role);
        
        $contentType = ContentTypeEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Blog Post',
            'slug' => 'blog-post',
            'default_url_pattern' => '/blog/{slug}',
            'is_active' => true,
        ]);
        
        $this->content = ContentEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $contentType->uuid,
            'author_id' => $this->adminUser->uuid,
            'title' => 'Test Post',
            'slug' => 'test-post',
            'content' => ['blocks' => []],
            'status' => 'published',
        ]);
    }

    public function test_can_build_url_for_content(): void
    {
        $data = ['content_uuid' => $this->content->uuid];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/cms/admin/urls/build', $data);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['url']]);
    }

    public function test_build_url_requires_content_uuid(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/cms/admin/urls/build', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['content_uuid']);
    }

    public function test_can_preview_url_with_pattern(): void
    {
        $data = [
            'url_pattern' => '/blog/{year}/{month}/{slug}',
            'content_data' => [
                'year' => '2026',
                'month' => '01',
                'slug' => 'my-awesome-post',
            ],
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/cms/admin/urls/preview', $data);

        $response->assertStatus(200)
            ->assertJson(['success' => true])
            ->assertJsonStructure(['data' => ['preview_url']]);
    }

    public function test_preview_url_requires_pattern_and_data(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/cms/admin/urls/preview', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['url_pattern', 'content_data']);
    }

    public function test_requires_authentication(): void
    {
        $response = $this->postJson('/api/cms/admin/urls/build', ['content_uuid' => $this->content->uuid]);
        $response->assertStatus(401);
    }

    public function test_requires_permission(): void
    {
        $userWithoutPermission = User::factory()->create(['tenant_id' => $this->tenantId]);
        
        $response = $this->actingAs($userWithoutPermission, 'sanctum')
            ->postJson('/api/cms/admin/urls/build', ['content_uuid' => $this->content->uuid]);

        $response->assertStatus(403);
    }
}
