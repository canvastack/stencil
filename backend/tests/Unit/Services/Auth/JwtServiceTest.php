<?php

namespace Tests\Unit\Services\Auth;

use Tests\TestCase;
use App\Application\Auth\UseCases\AuthenticationService;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\RoleEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class JwtServiceTest extends TestCase
{
    use RefreshDatabase;

    private AuthenticationService $authService;
    private AccountEloquentModel $platformAccount;
    private TenantEloquentModel $tenant;
    private UserEloquentModel $tenantUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->authService = app(AuthenticationService::class);
        
        // Create platform account
        $this->platformAccount = AccountEloquentModel::create([
            'name' => 'Platform Admin',
            'email' => 'admin@platform.test',
            'password' => Hash::make('password123'),
            'account_type' => 'platform_owner',
            'status' => 'active'
        ]);

        // Create tenant
        $this->tenant = TenantEloquentModel::create([
            'name' => 'Test Company',
            'slug' => 'test-company',
            'status' => 'active',
            'subscription_status' => 'active',
            'trial_ends_at' => now()->addDays(30),
            'subscription_ends_at' => now()->addYear()
        ]);

        // Create tenant user
        $this->tenantUser = UserEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Tenant User',
            'email' => 'user@tenant.test',
            'password' => Hash::make('password123'),
            'status' => 'active'
        ]);

        // Create role for tenant user
        $role = RoleEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Admin',
            'slug' => 'admin',
            'description' => 'Tenant Administrator',
            'abilities' => ['read', 'write', 'delete']
        ]);

        $this->tenantUser->roles()->attach($role->id);
    }

    /** @test */
    public function it_can_generate_jwt_token_for_platform_account()
    {
        $result = $this->authService->authenticatePlatformAccount(
            'admin@platform.test',
            'password123',
            '127.0.0.1'
        );

        $this->assertArrayHasKey('access_token', $result);
        $this->assertArrayHasKey('account', $result);
        $this->assertEquals('platform', $result['account_type']);
        $this->assertIsString($result['access_token']);
    }

    /** @test */
    public function it_can_generate_jwt_token_for_tenant_user()
    {
        $result = $this->authService->authenticateTenantUser(
            'user@tenant.test',
            'password123',
            $this->tenant->id,
            '127.0.0.1'
        );

        $this->assertArrayHasKey('access_token', $result);
        $this->assertArrayHasKey('user', $result);
        $this->assertArrayHasKey('tenant', $result);
        $this->assertEquals($this->tenant->id, $result['tenant']['id']);
        $this->assertIsString($result['access_token']);
    }

    /** @test */
    public function it_fails_authentication_with_invalid_platform_credentials()
    {
        $this->expectException(ValidationException::class);
        
        $this->authService->authenticatePlatformAccount(
            'admin@platform.test',
            'wrong-password',
            '127.0.0.1'
        );
    }

    /** @test */
    public function it_fails_authentication_with_invalid_tenant_credentials()
    {
        $this->expectException(ValidationException::class);
        
        $this->authService->authenticateTenantUser(
            'user@tenant.test',
            'wrong-password',
            $this->tenant->id,
            '127.0.0.1'
        );
    }

    /** @test */
    public function it_fails_authentication_for_inactive_platform_account()
    {
        $this->platformAccount->update(['status' => 'inactive']);

        $this->expectException(ValidationException::class);
        
        $this->authService->authenticatePlatformAccount(
            'admin@platform.test',
            'password123',
            '127.0.0.1'
        );
    }

    /** @test */
    public function it_fails_authentication_for_inactive_tenant()
    {
        $this->tenant->update(['status' => 'inactive']);

        $this->expectException(ValidationException::class);
        
        $this->authService->authenticateTenantUser(
            'user@tenant.test',
            'password123',
            $this->tenant->id,
            '127.0.0.1'
        );
    }

    /** @test */
    public function it_fails_authentication_for_expired_tenant_subscription()
    {
        $this->tenant->update([
            'subscription_status' => 'expired',
            'subscription_ends_at' => now()->subDays(1)
        ]);

        $this->expectException(ValidationException::class);
        
        $this->authService->authenticateTenantUser(
            'user@tenant.test',
            'password123',
            $this->tenant->id,
            '127.0.0.1'
        );
    }

    /** @test */
    public function it_prevents_cross_tenant_authentication()
    {
        $otherTenant = TenantEloquentModel::create([
            'name' => 'Other Company',
            'slug' => 'other-company',
            'status' => 'active',
            'subscription_status' => 'active'
        ]);

        $this->expectException(ValidationException::class);
        
        $this->authService->authenticateTenantUser(
            'user@tenant.test',
            'password123',
            $otherTenant->id,
            '127.0.0.1'
        );
    }

    /** @test */
    public function it_includes_proper_user_permissions_in_token()
    {
        $result = $this->authService->authenticateTenantUser(
            'user@tenant.test',
            'password123',
            $this->tenant->id,
            '127.0.0.1'
        );

        $this->assertNotNull($result);
        $this->assertArrayHasKey('permissions', $result);
        $this->assertIsArray($result['permissions']);
    }

    /** @test */
    public function platform_and_tenant_tokens_have_different_structures()
    {
        $platformResult = $this->authService->authenticatePlatformAccount(
            'admin@platform.test',
            'password123',
            '127.0.0.1'
        );

        $tenantResult = $this->authService->authenticateTenantUser(
            'user@tenant.test',
            'password123',
            $this->tenant->id,
            '127.0.0.1'
        );

        // Platform should have account key
        $this->assertArrayHasKey('account', $platformResult);
        $this->assertArrayNotHasKey('user', $platformResult);
        $this->assertArrayNotHasKey('tenant', $platformResult);

        // Tenant should have user and tenant keys
        $this->assertArrayHasKey('user', $tenantResult);
        $this->assertArrayHasKey('tenant', $tenantResult);
        $this->assertArrayNotHasKey('account', $tenantResult);
    }

    /** @test */
    public function it_handles_case_insensitive_email_lookup()
    {
        $result = $this->authService->authenticatePlatformAccount(
            'ADMIN@PLATFORM.TEST',
            'password123',
            '127.0.0.1'
        );

        $this->assertNotNull($result);
        $this->assertEquals('admin@platform.test', $result['account']['email']);
    }

    /** @test */
    public function it_validates_nonexistent_email()
    {
        $this->expectException(ValidationException::class);
        
        $this->authService->authenticatePlatformAccount(
            'nonexistent@platform.test',
            'password123',
            '127.0.0.1'
        );
    }

    /** @test */
    public function it_validates_nonexistent_tenant()
    {
        $this->expectException(ValidationException::class);
        
        $this->authService->authenticateTenantUser(
            'user@tenant.test',
            'password123',
            99999, // Non-existent tenant ID
            '127.0.0.1'
        );
    }

    /** @test */
    public function it_includes_proper_token_expiration_times()
    {
        $platformResult = $this->authService->authenticatePlatformAccount(
            'admin@platform.test',
            'password123',
            '127.0.0.1'
        );

        $tenantResult = $this->authService->authenticateTenantUser(
            'user@tenant.test',
            'password123',
            $this->tenant->id,
            '127.0.0.1'
        );

        // Platform should have 24 hour expiration
        $this->assertEquals(24 * 60 * 60, $platformResult['expires_in']);
        
        // Tenant should have 8 hour expiration
        $this->assertEquals(8 * 60 * 60, $tenantResult['expires_in']);
    }

    /** @test */
    public function it_includes_account_type_in_response()
    {
        $platformResult = $this->authService->authenticatePlatformAccount(
            'admin@platform.test',
            'password123',
            '127.0.0.1'
        );

        $tenantResult = $this->authService->authenticateTenantUser(
            'user@tenant.test',
            'password123',
            $this->tenant->id,
            '127.0.0.1'
        );

        $this->assertEquals('platform', $platformResult['account_type']);
        $this->assertEquals('tenant', $tenantResult['account_type']);
    }

    /** @test */
    public function it_includes_bearer_token_type()
    {
        $result = $this->authService->authenticatePlatformAccount(
            'admin@platform.test',
            'password123',
            '127.0.0.1'
        );

        $this->assertEquals('Bearer', $result['token_type']);
    }
}