<?php

namespace Tests\Feature\Authentication;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use App\Infrastructure\Persistence\Eloquent\RoleEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class PlatformAuthenticationFlowTest extends TestCase
{
    use RefreshDatabase;

    private AccountEloquentModel $superAdmin;
    private AccountEloquentModel $platformManager;

    protected function setUp(): void
    {
        parent::setUp();

        // Create platform roles
        $superAdminRole = RoleEloquentModel::create([
            'tenant_id' => null, // Platform role
            'name' => 'Super Administrator',
            'slug' => 'super-admin',
            'description' => 'Full platform access',
            'is_system' => true,
            'abilities' => [
                'platform.*',
                'tenant.create',
                'tenant.read',
                'tenant.update',
                'tenant.delete',
                'user.impersonate'
            ]
        ]);

        $managerRole = RoleEloquentModel::create([
            'tenant_id' => null, // Platform role
            'name' => 'Platform Manager',
            'slug' => 'platform-manager',
            'description' => 'Limited platform access',
            'is_system' => true,
            'abilities' => [
                'tenant.read',
                'tenant.update',
                'analytics.read'
            ]
        ]);

        // Create platform accounts
        $this->superAdmin = AccountEloquentModel::create([
            'name' => 'Super Admin',
            'email' => 'admin@canvastencil.com',
            'password' => Hash::make('SuperAdmin2024!'),
            'account_type' => 'platform_owner',
            'status' => 'active'
        ]);

        $this->platformManager = AccountEloquentModel::create([
            'name' => 'Platform Manager',
            'email' => 'manager@canvastencil.com',
            'password' => Hash::make('Manager2024!'),
            'account_type' => 'platform_owner',
            'status' => 'active'
        ]);

        // Assign roles
        $this->superAdmin->roles()->attach($superAdminRole->id);
        $this->platformManager->roles()->attach($managerRole->id);
    }

    /** @test */
    public function complete_platform_authentication_flow_works()
    {
        // 1. Login
        $loginResponse = $this->postJson('/api/platform/login', [
            'email' => 'admin@canvastencil.com',
            'password' => 'SuperAdmin2024!'
        ]);

        $loginResponse->assertStatus(200)
                    ->assertJsonStructure([
                        'token',
                        'user' => [
                            'id',
                            'name',
                            'email',
                            'account_type',
                            'status',
                            'permissions'
                        ]
                    ]);

        $token = $loginResponse->json('token');
        $this->assertNotEmpty($token);

        // 2. Access protected resource
        $meResponse = $this->getJson('/api/platform/me', [
            'Authorization' => 'Bearer ' . $token
        ]);

        $meResponse->assertStatus(200)
                  ->assertJsonStructure([
                      'user',
                      'permissions'
                  ]);

        // 3. Verify permissions
        $permissions = $meResponse->json('permissions');
        $this->assertContains('platform.*', $permissions);
        $this->assertContains('tenant.create', $permissions);

        // 4. Access another protected endpoint
        $healthResponse = $this->getJson('/api/auth/health', [
            'Authorization' => 'Bearer ' . $token
        ]);

        $healthResponse->assertStatus(200);

        // 5. Logout
        $logoutResponse = $this->postJson('/api/platform/logout', [], [
            'Authorization' => 'Bearer ' . $token
        ]);

        $logoutResponse->assertStatus(200)
                      ->assertJson(['message' => 'Successfully logged out']);

        // 6. Try to access protected resource after logout (should fail)
        $afterLogoutResponse = $this->getJson('/api/platform/me', [
            'Authorization' => 'Bearer ' . $token
        ]);

        $afterLogoutResponse->assertStatus(401);
    }

    /** @test */
    public function platform_manager_has_limited_permissions()
    {
        $loginResponse = $this->postJson('/api/platform/login', [
            'email' => 'manager@canvastencil.com',
            'password' => 'Manager2024!'
        ]);

        $loginResponse->assertStatus(200);
        $token = $loginResponse->json('token');

        $meResponse = $this->getJson('/api/platform/me', [
            'Authorization' => 'Bearer ' . $token
        ]);

        $permissions = $meResponse->json('permissions');
        
        // Should have limited permissions
        $this->assertContains('tenant.read', $permissions);
        $this->assertContains('analytics.read', $permissions);
        
        // Should not have full platform access
        $this->assertNotContains('platform.*', $permissions);
        $this->assertNotContains('tenant.create', $permissions);
        $this->assertNotContains('user.impersonate', $permissions);
    }

    /** @test */
    public function rate_limiting_prevents_brute_force_attacks()
    {
        // Make 5 failed login attempts
        for ($i = 0; $i < 5; $i++) {
            $response = $this->postJson('/api/platform/login', [
                'email' => 'admin@canvastencil.com',
                'password' => 'wrong-password'
            ]);

            if ($i < 4) {
                $response->assertStatus(422);
            }
        }

        // 6th attempt should be rate limited
        $response = $this->postJson('/api/platform/login', [
            'email' => 'admin@canvastencil.com',
            'password' => 'wrong-password'
        ]);

        $response->assertStatus(422);
        $this->assertStringContains('Too many login attempts', 
            $response->json('errors.email.0')
        );

        // Even correct password should be blocked
        $blockedResponse = $this->postJson('/api/platform/login', [
            'email' => 'admin@canvastencil.com',
            'password' => 'SuperAdmin2024!'
        ]);

        $blockedResponse->assertStatus(422);
    }

    /** @test */
    public function inactive_account_cannot_login()
    {
        $this->superAdmin->update(['status' => 'inactive']);

        $response = $this->postJson('/api/platform/login', [
            'email' => 'admin@canvastencil.com',
            'password' => 'SuperAdmin2024!'
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);

        $error = $response->json('errors.email.0');
        $this->assertStringContains('not active', $error);
    }

    /** @test */
    public function suspended_account_cannot_login()
    {
        $this->superAdmin->update(['status' => 'suspended']);

        $response = $this->postJson('/api/platform/login', [
            'email' => 'admin@canvastencil.com',
            'password' => 'SuperAdmin2024!'
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function last_login_timestamp_is_updated()
    {
        $originalTime = $this->superAdmin->last_login_at;

        $response = $this->postJson('/api/platform/login', [
            'email' => 'admin@canvastencil.com',
            'password' => 'SuperAdmin2024!'
        ]);

        $response->assertStatus(200);

        $this->superAdmin->refresh();
        $this->assertNotEquals($originalTime, $this->superAdmin->last_login_at);
        $this->assertNotNull($this->superAdmin->last_login_at);
    }

    /** @test */
    public function token_refresh_works()
    {
        // Login first
        $loginResponse = $this->postJson('/api/platform/login', [
            'email' => 'admin@canvastencil.com',
            'password' => 'SuperAdmin2024!'
        ]);

        $originalToken = $loginResponse->json('token');

        // Refresh token
        $refreshResponse = $this->postJson('/api/platform/refresh', [], [
            'Authorization' => 'Bearer ' . $originalToken
        ]);

        $refreshResponse->assertStatus(200)
                       ->assertJsonStructure([
                           'access_token',
                           'token_type',
                           'expires_in',
                           'refreshed_at'
                       ]);

        $newToken = $refreshResponse->json('access_token');
        $this->assertNotEmpty($newToken);
        $this->assertNotEquals($originalToken, $newToken);

        // New token should work
        $meResponse = $this->getJson('/api/platform/me', [
            'Authorization' => 'Bearer ' . $newToken
        ]);

        $meResponse->assertStatus(200);
    }

    /** @test */
    public function invalid_email_format_is_rejected()
    {
        $response = $this->postJson('/api/platform/login', [
            'email' => 'invalid-email-format',
            'password' => 'SuperAdmin2024!'
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function empty_credentials_are_rejected()
    {
        $response = $this->postJson('/api/platform/login', [
            'email' => '',
            'password' => ''
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email', 'password']);
    }

    /** @test */
    public function case_insensitive_email_login_works()
    {
        $response = $this->postJson('/api/platform/login', [
            'email' => 'ADMIN@CANVASTENCIL.COM',
            'password' => 'SuperAdmin2024!'
        ]);

        $response->assertStatus(200);
        $this->assertEquals('admin@canvastencil.com', 
            $response->json('user.email')
        );
    }

    /** @test */
    public function concurrent_logins_are_allowed()
    {
        // First login
        $login1 = $this->postJson('/api/platform/login', [
            'email' => 'admin@canvastencil.com',
            'password' => 'SuperAdmin2024!'
        ]);

        // Second login
        $login2 = $this->postJson('/api/platform/login', [
            'email' => 'admin@canvastencil.com',
            'password' => 'SuperAdmin2024!'
        ]);

        $login1->assertStatus(200);
        $login2->assertStatus(200);

        $token1 = $login1->json('token');
        $token2 = $login2->json('token');

        // Both tokens should work
        $response1 = $this->getJson('/api/platform/me', [
            'Authorization' => 'Bearer ' . $token1
        ]);

        $response2 = $this->getJson('/api/platform/me', [
            'Authorization' => 'Bearer ' . $token2
        ]);

        $response1->assertStatus(200);
        $response2->assertStatus(200);
    }

    protected function tearDown(): void
    {
        RateLimiter::clear('platform-login:127.0.0.1');
        parent::tearDown();
    }
}