<?php

namespace Tests\Feature\Authentication;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\RoleEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class TenantAuthenticationFlowTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private UserEloquentModel $adminUser;
    private UserEloquentModel $managerUser;
    private UserEloquentModel $salesUser;
    private RoleEloquentModel $adminRole;
    private RoleEloquentModel $managerRole;
    private RoleEloquentModel $salesRole;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = TenantEloquentModel::create([
            'name' => 'Demo Etching Business',
            'slug' => 'demo-etching',
            'status' => 'active',
            'subscription_status' => 'active',
            'trial_ends_at' => now()->addDays(30),
            'subscription_ends_at' => now()->addYear()
        ]);

        // Create tenant roles
        $this->adminRole = RoleEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Admin',
            'slug' => 'admin',
            'description' => 'Full tenant access',
            'abilities' => [
                'dashboard.read',
                'products.create',
                'products.read',
                'products.update',
                'products.delete',
                'orders.create',
                'orders.read',
                'orders.update',
                'orders.delete',
                'customers.create',
                'customers.read',
                'customers.update',
                'customers.delete',
                'users.create',
                'users.read',
                'users.update',
                'users.delete'
            ]
        ]);

        $this->managerRole = RoleEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Manager',
            'slug' => 'manager',
            'description' => 'Management access',
            'abilities' => [
                'dashboard.read',
                'products.read',
                'products.update',
                'orders.read',
                'orders.update',
                'customers.read',
                'customers.update'
            ]
        ]);

        $this->salesRole = RoleEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Sales',
            'slug' => 'sales',
            'description' => 'Sales access',
            'abilities' => [
                'dashboard.read',
                'products.read',
                'orders.create',
                'orders.read',
                'customers.read',
                'customers.create'
            ]
        ]);

        // Create tenant users
        $this->adminUser = UserEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Tenant Admin',
            'email' => 'admin@demo-etching.com',
            'password' => Hash::make('DemoAdmin2024!'),
            'status' => 'active'
        ]);

        $this->managerUser = UserEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Tenant Manager',
            'email' => 'manager@demo-etching.com',
            'password' => Hash::make('DemoManager2024!'),
            'status' => 'active'
        ]);

        $this->salesUser = UserEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Sales User',
            'email' => 'sales@demo-etching.com',
            'password' => Hash::make('DemoSales2024!'),
            'status' => 'active'
        ]);

        // Assign roles
        $this->adminUser->roles()->attach($this->adminRole->id);
        $this->managerUser->roles()->attach($this->managerRole->id);
        $this->salesUser->roles()->attach($this->salesRole->id);
    }

    /** @test */
    public function complete_tenant_authentication_flow_works()
    {
        // 1. Login
        $loginResponse = $this->postJson('/api/v1/tenant/login', [
            'email' => 'admin@demo-etching.com',
            'password' => 'DemoAdmin2024!',
            'tenant_id' => $this->tenant->id
        ]);

        $loginResponse->assertStatus(200)
                    ->assertJsonStructure([
                        'token',
                        'user' => [
                            'id',
                            'name',
                            'email',
                            'status',
                            'permissions'
                        ],
                        'tenant' => [
                            'id',
                            'name',
                            'slug',
                            'status',
                            'subscription_status'
                        ]
                    ]);

        $token = $loginResponse->json('token');
        $this->assertNotEmpty($token);

        // 2. Verify tenant context
        $tenant = $loginResponse->json('tenant');
        $this->assertEquals($this->tenant->id, $tenant['id']);
        $this->assertEquals('demo-etching', $tenant['slug']);

        // 3. Access protected resource
        $meResponse = $this->getJson('/api/v1/tenant/me', [
            'Authorization' => 'Bearer ' . $token
        ]);

        $meResponse->assertStatus(200)
                  ->assertJsonStructure([
                      'user',
                      'tenant',
                      'permissions'
                  ]);

        // 4. Verify permissions
        $permissions = $meResponse->json('permissions');
        $this->assertContains('products.create', $permissions);
        $this->assertContains('orders.delete', $permissions);

        // 5. Logout
        $logoutResponse = $this->postJson('/api/v1/tenant/logout', [], [
            'Authorization' => 'Bearer ' . $token
        ]);

        $logoutResponse->assertStatus(200)
                      ->assertJson(['message' => 'Successfully logged out']);
    }

    /** @test */
    public function manager_has_limited_permissions()
    {
        $loginResponse = $this->postJson('/api/v1/tenant/login', [
            'email' => 'manager@demo-etching.com',
            'password' => 'DemoManager2024!',
            'tenant_id' => $this->tenant->id
        ]);

        $loginResponse->assertStatus(200);
        $permissions = $loginResponse->json('user.permissions');

        // Should have limited permissions
        $this->assertContains('products.read', $permissions);
        $this->assertContains('products.update', $permissions);
        $this->assertContains('orders.read', $permissions);

        // Should not have create/delete permissions
        $this->assertNotContains('products.create', $permissions);
        $this->assertNotContains('products.delete', $permissions);
        $this->assertNotContains('orders.create', $permissions);
        $this->assertNotContains('orders.delete', $permissions);
        $this->assertNotContains('users.create', $permissions);
    }

    /** @test */
    public function sales_user_has_minimal_permissions()
    {
        $loginResponse = $this->postJson('/api/v1/tenant/login', [
            'email' => 'sales@demo-etching.com',
            'password' => 'DemoSales2024!',
            'tenant_id' => $this->tenant->id
        ]);

        $loginResponse->assertStatus(200);
        $permissions = $loginResponse->json('user.permissions');

        // Should have sales-specific permissions
        $this->assertContains('products.read', $permissions);
        $this->assertContains('orders.create', $permissions);
        $this->assertContains('customers.read', $permissions);
        $this->assertContains('customers.create', $permissions);

        // Should not have management permissions
        $this->assertNotContains('products.create', $permissions);
        $this->assertNotContains('products.update', $permissions);
        $this->assertNotContains('products.delete', $permissions);
        $this->assertNotContains('users.create', $permissions);
    }

    /** @test */
    public function cross_tenant_authentication_is_prevented()
    {
        // Create another tenant
        $otherTenant = TenantEloquentModel::create([
            'name' => 'Other Company',
            'slug' => 'other-company',
            'status' => 'active',
            'subscription_status' => 'active'
        ]);

        // Try to login to wrong tenant
        $response = $this->postJson('/api/v1/tenant/login', [
            'email' => 'admin@demo-etching.com',
            'password' => 'DemoAdmin2024!',
            'tenant_id' => $otherTenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function inactive_tenant_prevents_login()
    {
        $this->tenant->update(['status' => 'inactive']);

        $response = $this->postJson('/api/v1/tenant/login', [
            'email' => 'admin@demo-etching.com',
            'password' => 'DemoAdmin2024!',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function expired_subscription_prevents_login()
    {
        $this->tenant->update([
            'subscription_status' => 'expired',
            'subscription_ends_at' => now()->subDays(1)
        ]);

        $response = $this->postJson('/api/v1/tenant/login', [
            'email' => 'admin@demo-etching.com',
            'password' => 'DemoAdmin2024!',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function trial_period_allows_login()
    {
        $this->tenant->update([
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->addDays(7)
        ]);

        $response = $this->postJson('/api/v1/tenant/login', [
            'email' => 'admin@demo-etching.com',
            'password' => 'DemoAdmin2024!',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function expired_trial_prevents_login()
    {
        $this->tenant->update([
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->subDays(1)
        ]);

        $response = $this->postJson('/api/v1/tenant/login', [
            'email' => 'admin@demo-etching.com',
            'password' => 'DemoAdmin2024!',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function context_based_login_works()
    {
        // Mock tenant context middleware
        $this->app->instance('tenant.context', $this->tenant);

        $response = $this->postJson('/api/v1/tenant/context-login', [
            'email' => 'admin@demo-etching.com',
            'password' => 'DemoAdmin2024!'
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'token',
                    'user',
                    'tenant'
                ]);

        $this->assertEquals($this->tenant->id, $response->json('tenant.id'));
    }

    /** @test */
    public function rate_limiting_is_per_tenant()
    {
        // Create another tenant for comparison
        $otherTenant = TenantEloquentModel::create([
            'name' => 'Other Tenant',
            'slug' => 'other-tenant',
            'status' => 'active',
            'subscription_status' => 'active'
        ]);

        $otherUser = UserEloquentModel::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Other User',
            'email' => 'user@other-tenant.com',
            'password' => Hash::make('password123'),
            'status' => 'active'
        ]);

        // Make 5 failed attempts for our tenant
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/tenant/login', [
                'email' => 'admin@demo-etching.com',
                'password' => 'wrong-password',
                'tenant_id' => $this->tenant->id
            ]);
        }

        // 6th attempt for our tenant should be blocked
        $blockedResponse = $this->postJson('/api/v1/tenant/login', [
            'email' => 'admin@demo-etching.com',
            'password' => 'wrong-password',
            'tenant_id' => $this->tenant->id
        ]);

        $blockedResponse->assertStatus(422);
        $this->assertStringContainsString('Too many login attempts', 
            $blockedResponse->json('errors.email.0')
        );

        // But other tenant should still work
        $otherResponse = $this->postJson('/api/v1/tenant/login', [
            'email' => 'user@other-tenant.com',
            'password' => 'password123',
            'tenant_id' => $otherTenant->id
        ]);

        $otherResponse->assertStatus(200);
    }

    /** @test */
    public function inactive_user_cannot_login()
    {
        $this->adminUser->update(['status' => 'inactive']);

        $response = $this->postJson('/api/v1/tenant/login', [
            'email' => 'admin@demo-etching.com',
            'password' => 'DemoAdmin2024!',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function suspended_user_cannot_login()
    {
        $this->adminUser->update(['status' => 'suspended']);

        $response = $this->postJson('/api/v1/tenant/login', [
            'email' => 'admin@demo-etching.com',
            'password' => 'DemoAdmin2024!',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function last_login_timestamp_is_updated()
    {
        $originalTime = $this->adminUser->last_login_at;

        $response = $this->postJson('/api/v1/tenant/login', [
            'email' => 'admin@demo-etching.com',
            'password' => 'DemoAdmin2024!',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(200);

        $this->adminUser->refresh();
        $this->assertNotEquals($originalTime, $this->adminUser->last_login_at);
        $this->assertNotNull($this->adminUser->last_login_at);
    }

    /** @test */
    public function user_with_multiple_roles_gets_combined_permissions()
    {
        // Assign multiple roles to user
        $this->adminUser->roles()->attach($this->managerRole->id);
        $this->adminUser->roles()->attach($this->salesRole->id);

        $response = $this->postJson('/api/v1/tenant/login', [
            'email' => 'admin@demo-etching.com',
            'password' => 'DemoAdmin2024!',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(200);
        $permissions = $response->json('user.permissions');

        // Should have all permissions from all roles (unique)
        $this->assertContains('products.create', $permissions); // Admin
        $this->assertContains('products.read', $permissions); // All roles
        $this->assertContains('orders.create', $permissions); // Sales
        $this->assertContains('users.create', $permissions); // Admin only
    }

    protected function tearDown(): void
    {
        if ($this->tenant) {
            RateLimiter::clear("tenant-login:{$this->tenant->id}:127.0.0.1");
        }
        parent::tearDown();
    }
}