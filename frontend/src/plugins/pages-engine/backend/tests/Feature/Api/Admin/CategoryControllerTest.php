<?php

namespace Plugins\PagesEngine\Tests\Feature\Api\Admin;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentCategoryEloquentModel;
use Plugins\PagesEngine\Infrastructure\Persistence\Eloquent\ContentTypeEloquentModel;

class CategoryControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected TenantEloquentModel $tenant;
    protected ContentTypeEloquentModel $contentType;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenant = TenantEloquentModel::factory()->create();
        
        // Set the permissions team ID for Spatie Permission multi-tenant support
        $this->app[\Spatie\Permission\PermissionRegistrar::class]
            ->setPermissionsTeamId($this->tenant->id);
        
        $this->adminUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        Permission::create(['name' => 'pages:categories:view', 'guard_name' => 'api', 'tenant_id' => $this->tenant->id]);
        Permission::create(['name' => 'pages:categories:create', 'guard_name' => 'api', 'tenant_id' => $this->tenant->id]);
        Permission::create(['name' => 'pages:categories:update', 'guard_name' => 'api', 'tenant_id' => $this->tenant->id]);
        Permission::create(['name' => 'pages:categories:delete', 'guard_name' => 'api', 'tenant_id' => $this->tenant->id]);
        Permission::create(['name' => 'pages:categories:reorder', 'guard_name' => 'api', 'tenant_id' => $this->tenant->id]);

        $role = Role::create(['name' => 'admin', 'tenant_id' => $this->tenant->id, 'guard_name' => 'api']);
        $role->givePermissionTo([
            'pages:categories:view',
            'pages:categories:create',
            'pages:categories:update',
            'pages:categories:delete',
            'pages:categories:reorder',
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

    public function test_can_list_categories(): void
    {
        ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'name' => 'Test Category',
            'slug' => 'test-category',
            'path' => 'test-category',
            'level' => 0,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/cms/admin/categories');

        if ($response->status() !== 200) {
            echo "\n\nError: " . $response->json('message') . "\n";
            echo "Status: " . $response->status() . "\n\n";
        }

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['uuid', 'name', 'slug']
                ],
            ]);
    }

    public function test_can_get_category_tree(): void
    {
        $parent = ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'name' => 'Parent Category',
            'slug' => 'parent-category',
            'path' => 'parent-category',
            'level' => 0,
        ]);

        ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'name' => 'Child Category',
            'slug' => 'child-category',
            'parent_id' => $parent->uuid,
            'path' => 'parent-category/child-category',
            'level' => 1,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/cms/admin/categories/tree');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['uuid', 'name', 'slug', 'children']
                ],
            ]);
    }

    public function test_can_get_category_tree_filtered_by_content_type(): void
    {
        $otherContentType = ContentTypeEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'name' => 'Page',
            'slug' => 'page',
            'is_active' => true,
        ]);

        ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'name' => 'Blog Category',
            'slug' => 'blog-category',
            'path' => 'blog-category',
            'level' => 0,
        ]);

        ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $otherContentType->uuid,
            'name' => 'Page Category',
            'slug' => 'page-category',
            'path' => 'page-category',
            'level' => 0,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/cms/admin/categories/tree/' . $this->contentType->uuid);

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    public function test_can_create_category(): void
    {
        $data = [
            'content_type_uuid' => $this->contentType->uuid,
            'name' => 'New Category',
            'slug' => 'new-category',
            'description' => 'Category description',
            'is_active' => true,
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/cms/admin/categories', $data);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => ['uuid', 'name', 'slug'],
            ]);

        $this->assertDatabaseHas('canplug_pagen_categories', [
            'name' => 'New Category',
            'slug' => 'new-category',
            'tenant_id' => $this->tenant->id,
        ]);
    }

    public function test_can_create_nested_category(): void
    {
        $parent = ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'name' => 'Parent',
            'slug' => 'parent',
            'path' => 'parent',
            'level' => 0,
        ]);

        $data = [
            'content_type_uuid' => $this->contentType->uuid,
            'parent_uuid' => $parent->uuid,
            'name' => 'Child',
            'slug' => 'child',
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/cms/admin/categories', $data);

        $response->assertStatus(201);

        $this->assertDatabaseHas('canplug_pagen_categories', [
            'name' => 'Child',
            'parent_id' => $parent->uuid,
            'level' => 1,
        ]);
    }

    public function test_can_show_category(): void
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

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/cms/admin/categories/' . $category->uuid);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['uuid', 'name', 'slug'],
            ]);
    }

    public function test_can_update_category(): void
    {
        $category = ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'name' => 'Old Name',
            'slug' => 'old-name',
            'path' => 'old-name',
            'level' => 0,
        ]);

        $data = [
            'name' => 'New Name',
            'slug' => 'new-name',
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson('/api/cms/admin/categories/' . $category->uuid, $data);

        $response->assertStatus(200);

        $this->assertDatabaseHas('canplug_pagen_categories', [
            'uuid' => $category->uuid,
            'name' => 'New Name',
            'slug' => 'new-name',
        ]);
    }

    public function test_can_delete_category(): void
    {
        $category = ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'name' => 'To Delete',
            'slug' => 'to-delete',
            'path' => 'to-delete',
            'level' => 0,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->deleteJson('/api/cms/admin/categories/' . $category->uuid);

        $response->assertStatus(204);

        $this->assertDatabaseMissing('canplug_pagen_categories', [
            'uuid' => $category->uuid,
        ]);
    }

    public function test_can_move_category(): void
    {
        $parent1 = ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'name' => 'Parent 1',
            'slug' => 'parent-1',
            'path' => 'parent-1',
            'level' => 0,
        ]);

        $parent2 = ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'name' => 'Parent 2',
            'slug' => 'parent-2',
            'path' => 'parent-2',
            'level' => 0,
        ]);

        $child = ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'name' => 'Child',
            'slug' => 'child',
            'parent_id' => $parent1->uuid,
            'path' => 'parent-1/child',
            'level' => 1,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson('/api/cms/admin/categories/' . $child->uuid . '/move', [
                'parent_uuid' => $parent2->uuid,
            ]);

        $response->assertStatus(200);

        $child->refresh();
        $this->assertEquals($parent2->uuid, $child->parent_id);
    }

    public function test_can_reorder_categories(): void
    {
        $category1 = ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'name' => 'Category 1',
            'slug' => 'category-1',
            'path' => 'category-1',
            'level' => 0,
            'sort_order' => 1,
        ]);

        $category2 = ContentCategoryEloquentModel::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'content_type_id' => $this->contentType->uuid,
            'name' => 'Category 2',
            'slug' => 'category-2',
            'path' => 'category-2',
            'level' => 0,
            'sort_order' => 2,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->putJson('/api/cms/admin/categories/reorder', [
                'order' => [
                    ['uuid' => $category2->uuid, 'sort_order' => 1],
                    ['uuid' => $category1->uuid, 'sort_order' => 2],
                ],
            ]);

        $response->assertStatus(200);
    }

    public function test_requires_authentication(): void
    {
        $response = $this->getJson('/api/cms/admin/categories');

        $response->assertStatus(401);
    }

    public function test_requires_permission(): void
    {
        // Ensure we're in the correct permission context for this tenant
        $this->app[\Spatie\Permission\PermissionRegistrar::class]
            ->setPermissionsTeamId($this->tenant->id);
        
        $userWithoutPermission = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->actingAs($userWithoutPermission, 'sanctum')
            ->getJson('/api/cms/admin/categories');

        $response->assertStatus(403);
    }
}
