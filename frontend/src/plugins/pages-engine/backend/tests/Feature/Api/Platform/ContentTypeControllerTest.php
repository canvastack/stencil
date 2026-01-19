<?php

namespace Plugins\PagesEngine\Tests\Feature\Api\Platform;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Spatie\Permission\Models\Role;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentTypeEloquentModel;

class ContentTypeControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $platformUser;
    protected TenantEloquentModel $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenant = TenantEloquentModel::factory()->create();
        
        $this->platformUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $role = Role::create(['name' => 'platform-admin', 'tenant_id' => $this->tenant->id, 'guard_name' => 'api']);
        $role->givePermissionTo([
            'platform.content-types.view',
            'platform.content-types.create',
        ]);
        
        $this->platformUser->assignRole($role);
    }

    public function test_can_list_platform_content_types(): void
    {
        ContentTypeEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => null,
            'name' => 'Platform Blog',
            'slug' => 'platform-blog',
            'scope' => 'platform',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->platformUser, 'sanctum')
            ->getJson('/api/cms/platform/content-types');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['uuid', 'name', 'slug', 'is_active']
                ]
            ]);
    }

    public function test_can_filter_by_active_status(): void
    {
        ContentTypeEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => null,
            'name' => 'Active Type',
            'slug' => 'active-type',
            'scope' => 'platform',
            'is_active' => true,
        ]);

        ContentTypeEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => null,
            'name' => 'Inactive Type',
            'slug' => 'inactive-type',
            'scope' => 'platform',
            'is_active' => false,
        ]);

        $response = $this->actingAs($this->platformUser, 'sanctum')
            ->getJson('/api/cms/platform/content-types?is_active=1');

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data']);
    }

    public function test_can_create_platform_content_type(): void
    {
        $data = [
            'name' => 'News Article',
            'slug' => 'news-article',
            'description' => 'Platform-level news article content type',
            'default_url_pattern' => '/news/{slug}',
            'is_commentable' => true,
            'is_categorizable' => true,
            'is_taggable' => true,
            'is_revisioned' => true,
        ];

        $response = $this->actingAs($this->platformUser, 'sanctum')
            ->postJson('/api/cms/platform/content-types', $data);

        $response->assertStatus(201)
            ->assertJsonStructure(['success', 'data' => ['uuid', 'name', 'slug'], 'message'])
            ->assertJson(['success' => true]);
        
        $this->assertDatabaseHas('canplug_pagen_content_types', [
            'slug' => 'news-article',
            'tenant_id' => null,
            'scope' => 'platform',
        ]);
    }

    public function test_requires_authentication(): void
    {
        $response = $this->getJson('/api/cms/platform/content-types');
        $response->assertStatus(401);
    }

    public function test_requires_permission(): void
    {
        $userWithoutPermission = User::factory()->create(['tenant_id' => $this->tenant->id]);
        
        $response = $this->actingAs($userWithoutPermission, 'sanctum')
            ->getJson('/api/cms/platform/content-types');

        $response->assertStatus(403);
    }
}
