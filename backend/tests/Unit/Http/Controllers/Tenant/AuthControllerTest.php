<?php

namespace Tests\Unit\Http\Controllers\Tenant;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\RoleEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private UserEloquentModel $user;
    private RoleEloquentModel $role;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = TenantEloquentModel::create([
            'name' => 'Test Company',
            'slug' => 'test-company',
            'status' => 'active',
            'subscription_status' => 'active',
            'trial_ends_at' => now()->addDays(30),
            'subscription_ends_at' => now()->addYear()
        ]);

        // Create user
        $this->user = UserEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test User',
            'email' => 'user@test.com',
            'password' => Hash::make('password123'),
            'status' => 'active'
        ]);

        // Create role
        $this->role = RoleEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Admin',
            'slug' => 'admin',
            'description' => 'Administrator',
            'abilities' => ['read', 'write', 'delete']
        ]);

        $this->user->roles()->attach($this->role->id);
    }

    /** @test */
    public function it_can_authenticate_tenant_user_with_valid_credentials()
    {
        $response = $this->postJson('/api/tenant/login', [
            'email' => 'user@test.com',
            'password' => 'password123',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'access_token',
                    'token_type',
                    'expires_in',
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'status'
                    ],
                    'tenant' => [
                        'id',
                        'name',
                        'slug',
                        'status',
                        'subscription_status'
                    ],
                    'permissions',
                    'roles',
                    'account_type'
                ]);

        $this->assertEquals('Bearer', $response->json('token_type'));
        $this->assertEquals('tenant', $response->json('account_type'));
        $this->assertEquals(8 * 60 * 60, $response->json('expires_in')); // 8 hours
    }

    /** @test */
    public function it_rejects_invalid_credentials()
    {
        $response = $this->postJson('/api/tenant/login', [
            'email' => 'user@test.com',
            'password' => 'wrong-password',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_rejects_non_existent_user()
    {
        $response = $this->postJson('/api/tenant/login', [
            'email' => 'nonexistent@test.com',
            'password' => 'password123',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_rejects_user_from_wrong_tenant()
    {
        $otherTenant = TenantEloquentModel::create([
            'name' => 'Other Company',
            'slug' => 'other-company',
            'status' => 'active',
            'subscription_status' => 'active'
        ]);

        $response = $this->postJson('/api/tenant/login', [
            'email' => 'user@test.com',
            'password' => 'password123',
            'tenant_id' => $otherTenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_rejects_inactive_tenant()
    {
        $this->tenant->update(['status' => 'inactive']);

        $response = $this->postJson('/api/tenant/login', [
            'email' => 'user@test.com',
            'password' => 'password123',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_rejects_expired_subscription()
    {
        $this->tenant->update([
            'subscription_status' => 'expired',
            'subscription_ends_at' => now()->subDays(1)
        ]);

        $response = $this->postJson('/api/tenant/login', [
            'email' => 'user@test.com',
            'password' => 'password123',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_rejects_inactive_user()
    {
        $this->user->update(['status' => 'inactive']);

        $response = $this->postJson('/api/tenant/login', [
            'email' => 'user@test.com',
            'password' => 'password123',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_validates_required_fields()
    {
        $response = $this->postJson('/api/tenant/login', []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email', 'password', 'tenant_id']);
    }

    /** @test */
    public function it_validates_email_format()
    {
        $response = $this->postJson('/api/tenant/login', [
            'email' => 'invalid-email',
            'password' => 'password123',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_enforces_rate_limiting_per_tenant()
    {
        // Make 5 failed login attempts
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/tenant/login', [
                'email' => 'user@test.com',
                'password' => 'wrong-password',
                'tenant_id' => $this->tenant->id
            ]);
        }

        // 6th attempt should be rate limited
        $response = $this->postJson('/api/tenant/login', [
            'email' => 'user@test.com',
            'password' => 'wrong-password',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
        
        $error = $response->json('errors.email.0');
        $this->assertStringContainsString('Too many login attempts', $error);
    }

    /** @test */
    public function it_can_logout_successfully()
    {
        // First authenticate
        $loginResponse = $this->postJson('/api/tenant/login', [
            'email' => 'user@test.com',
            'password' => 'password123',
            'tenant_id' => $this->tenant->id
        ]);

        $token = $loginResponse->json('access_token');

        // Then logout
        $response = $this->postJson('/api/tenant/logout', [], [
            'Authorization' => 'Bearer ' . $token
        ]);

        $response->assertStatus(200)
                ->assertJson(['message' => 'Successfully logged out']);
    }

    /** @test */
    public function it_can_get_authenticated_user_info()
    {
        // First authenticate
        $loginResponse = $this->postJson('/api/tenant/login', [
            'email' => 'user@test.com',
            'password' => 'password123',
            'tenant_id' => $this->tenant->id
        ]);

        $token = $loginResponse->json('access_token');

        // Get user info
        $response = $this->getJson('/api/tenant/me', [
            'Authorization' => 'Bearer ' . $token
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'status'
                    ],
                    'tenant' => [
                        'id',
                        'name',
                        'slug',
                        'status'
                    ],
                    'permissions',
                    'roles'
                ]);
    }

    /** @test */
    public function it_includes_user_permissions_in_response()
    {
        $response = $this->postJson('/api/tenant/login', [
            'email' => 'user@test.com',
            'password' => 'password123',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(200);
        $permissions = $response->json('permissions');
        $roles = $response->json('roles');
        
        $this->assertIsArray($permissions);
        $this->assertIsArray($roles);
        $this->assertContains('Admin', $roles);
    }

    /** @test */
    public function it_handles_suspended_user_login()
    {
        $this->user->update(['status' => 'suspended']);

        $response = $this->postJson('/api/tenant/login', [
            'email' => 'user@test.com',
            'password' => 'password123',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_prevents_login_to_trial_expired_tenant()
    {
        $this->tenant->update([
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->subDays(1)
        ]);

        $response = $this->postJson('/api/tenant/login', [
            'email' => 'user@test.com',
            'password' => 'password123',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function it_allows_login_to_active_trial_tenant()
    {
        $this->tenant->update([
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->addDays(7)
        ]);

        $response = $this->postJson('/api/tenant/login', [
            'email' => 'user@test.com',
            'password' => 'password123',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function it_includes_tenant_context_in_response()
    {
        $response = $this->postJson('/api/tenant/login', [
            'email' => 'user@test.com',
            'password' => 'password123',
            'tenant_id' => $this->tenant->id
        ]);

        $response->assertStatus(200);
        
        $tenant = $response->json('tenant');
        $this->assertEquals($this->tenant->id, $tenant['id']);
        $this->assertEquals('test-company', $tenant['slug']);
        $this->assertEquals('active', $tenant['status']);
        $this->assertEquals('active', $tenant['subscription_status']);
    }

    protected function tearDown(): void
    {
        if ($this->tenant) {
            RateLimiter::clear("tenant-login:{$this->tenant->id}:127.0.0.1");
        }
        parent::tearDown();
    }
}