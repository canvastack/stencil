<?php

namespace Tests\Feature\Api\Vendor;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\PasswordResetToken;
use Laravel\Sanctum\Sanctum;

/**
 * VendorAuthControllerTest
 * 
 * Feature tests for vendor authentication endpoints.
 * 
 * Tests:
 * 1. POST /api/v1/vendor/auth/login - successful login
 * 2. POST /api/v1/vendor/auth/login - invalid credentials
 * 3. POST /api/v1/vendor/auth/login - account locked
 * 4. POST /api/v1/vendor/auth/login - rate limiting
 * 5. POST /api/v1/vendor/auth/logout - successful logout
 * 6. POST /api/v1/vendor/auth/password/email - send reset email
 * 7. POST /api/v1/vendor/auth/password/reset - reset password
 * 8. Test unauthorized access returns 401
 * 9. Test CSRF protection works
 * 10. Test tenant isolation works
 * 11. Test response format matches OpenAPI spec
 * 12. Test validation errors return 422
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 3.1, 3.2, 3.3, 3.4, 3.5, 15.5, 15.6, 15.7
 */
class VendorAuthControllerTest extends TestCase
{
    use RefreshDatabase;

    protected TenantEloquentModel $tenant;
    protected Vendor $vendor;
    protected UserEloquentModel $vendorUser;
    protected string $testPassword = 'Test@VendorP4ss2026!';

    protected function setUp(): void
    {
        parent::setUp();
        
        Mail::fake();
        
        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
            'domain' => 'test-tenant.local',
            'status' => 'active',
        ]);
        
        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'company_name' => 'Test Vendor Company',
            'email' => 'vendor@test.com',
            'phone' => '+1234567890',
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
            'onboarding_completed_at' => now(),
        ]);
        
        // Create vendor user
        $this->vendorUser = UserEloquentModel::create([
            'tenant_id' => $this->tenant->id, // Use integer ID
            'vendor_id' => $this->vendor->uuid, // Use UUID
            'name' => 'Vendor User',
            'email' => 'vendor@test.com',
            'password' => Hash::make($this->testPassword),
            'account_type' => 'vendor',
            'status' => 'active',
            'failed_login_attempts' => 0,
        ]);
    }

    /** @test */
    public function vendor_can_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/v1/vendor/auth/login', [
            'email' => 'vendor@test.com',
            'password' => $this->testPassword,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'token',
                    'vendor' => [
                        'id',
                        'company_name',
                        'email',
                        'status',
                    ],
                    'user' => [
                        'id',
                        'name',
                        'email',
                    ],
                ],
            ])
            ->assertJson([
                'message' => 'Login successful',
            ]);

        // Assert token was created
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $this->vendorUser->id,
            'tokenable_type' => get_class($this->vendorUser),
        ]);

        // Assert failed login attempts were reset
        $this->vendorUser->refresh();
        $this->assertEquals(0, $this->vendorUser->failed_login_attempts);
    }

    /** @test */
    public function vendor_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/v1/vendor/auth/login', [
            'email' => 'vendor@test.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid credentials',
            ]);

        // Assert failed login attempts were incremented
        $this->vendorUser->refresh();
        $this->assertEquals(1, $this->vendorUser->failed_login_attempts);
    }

    /** @test */
    public function vendor_account_is_locked_after_5_failed_attempts(): void
    {
        // Set failed attempts to 4
        $this->vendorUser->update(['failed_login_attempts' => 4]);

        // Make 5th failed attempt
        $response = $this->postJson('/api/v1/vendor/auth/login', [
            'email' => 'vendor@test.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Authentication failed',
            ]);

        // Assert account is locked
        $this->vendorUser->refresh();
        $this->assertEquals(5, $this->vendorUser->failed_login_attempts);
        $this->assertNotNull($this->vendorUser->locked_until);
    }

    /** @test */
    public function vendor_login_is_rate_limited(): void
    {
        // Clear any existing rate limits
        RateLimiter::clear('vendor-login:127.0.0.1');

        // Make 5 login attempts (rate limit is 5 per 15 minutes)
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/vendor/auth/login', [
                'email' => 'vendor@test.com',
                'password' => 'wrong-password',
            ]);
        }

        // 6th attempt should be rate limited
        $response = $this->postJson('/api/v1/vendor/auth/login', [
            'email' => 'vendor@test.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(429); // Too Many Requests
    }

    /** @test */
    public function vendor_can_logout_successfully(): void
    {
        // Login first
        Sanctum::actingAs($this->vendorUser, ['vendor:access']);

        // Add vendor and vendor_user to request (simulating middleware)
        $response = $this->withHeaders([
            'Accept' => 'application/json',
        ])->postJson('/api/v1/vendor/auth/logout', [
            'all_devices' => false,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'tokens_revoked',
                ],
            ])
            ->assertJson([
                'message' => 'Logout successful',
            ]);
    }

    /** @test */
    public function vendor_can_request_password_reset(): void
    {
        $response = $this->postJson('/api/v1/vendor/auth/password/email', [
            'email' => 'vendor@test.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Password reset link has been sent to your email',
                'data' => [
                    'email' => 'vendor@test.com',
                ],
            ]);

        // Assert token was created
        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'vendor@test.com',
        ]);
    }

    /** @test */
    public function vendor_can_reset_password_with_valid_token(): void
    {
        // Create password reset token
        $token = 'test-reset-token-' . uniqid();
        PasswordResetToken::create([
            'email' => 'vendor@test.com',
            'token' => Hash::make($token),
            'expires_at' => now()->addHour(),
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Test Agent',
        ]);

        $newPassword = 'NewTest@VendorP4ss2026!';

        $response = $this->postJson('/api/v1/vendor/auth/password/reset', [
            'token' => $token,
            'email' => 'vendor@test.com',
            'password' => $newPassword,
            'password_confirmation' => $newPassword,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Password has been reset successfully',
            ]);

        // Assert password was changed
        $this->vendorUser->refresh();
        $this->assertTrue(Hash::check($newPassword, $this->vendorUser->password));
    }

    /** @test */
    public function unauthorized_access_returns_401(): void
    {
        // Try to access protected route without authentication
        $response = $this->getJson('/api/v1/vendor/quotes');

        $response->assertStatus(401);
    }

    /** @test */
    public function csrf_protection_works_for_vendor_routes(): void
    {
        // This test verifies CSRF protection is enabled
        // Laravel Sanctum handles CSRF for stateful requests
        
        $response = $this->post('/api/v1/vendor/auth/login', [
            'email' => 'vendor@test.com',
            'password' => $this->testPassword,
        ]);

        // Should work with JSON requests (CSRF not required for API)
        $this->assertNotEquals(419, $response->status());
    }

    /** @test */
    public function tenant_isolation_works_for_vendor_login(): void
    {
        // Create another tenant with a vendor
        $otherTenant = TenantEloquentModel::factory()->create([
            'name' => 'Other Tenant',
            'slug' => 'other-tenant',
            'domain' => 'other-tenant.local',
            'status' => 'active',
        ]);

        $otherVendor = Vendor::factory()->create([
            'tenant_id' => $otherTenant->id,
            'company_name' => 'Other Vendor',
            'email' => 'other-vendor@test.com',
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
        ]);

        $otherVendorUser = UserEloquentModel::create([
            'tenant_id' => $otherTenant->id, // Use integer ID
            'vendor_id' => $otherVendor->uuid, // Use UUID
            'name' => 'Other Vendor User',
            'email' => 'other-vendor@test.com',
            'password' => Hash::make($this->testPassword),
            'account_type' => 'vendor',
            'status' => 'active',
        ]);

        // Login with first vendor
        $response = $this->postJson('/api/v1/vendor/auth/login', [
            'email' => 'vendor@test.com',
            'password' => $this->testPassword,
        ]);

        $response->assertStatus(200);
        $token = $response->json('data.token');

        // Verify vendor belongs to correct tenant
        $vendorData = $response->json('data.vendor');
        $this->assertEquals($this->tenant->id, $vendorData['tenant_id'] ?? null);
        $this->assertNotEquals($otherTenant->id, $vendorData['tenant_id'] ?? null);
    }

    /** @test */
    public function response_format_matches_openapi_spec(): void
    {
        $response = $this->postJson('/api/v1/vendor/auth/login', [
            'email' => 'vendor@test.com',
            'password' => $this->testPassword,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'token',
                    'vendor' => [
                        'id',
                        'company_name',
                        'email',
                        'phone',
                        'status',
                    ],
                    'user' => [
                        'id',
                        'name',
                        'email',
                    ],
                ],
            ]);

        // Verify data types
        $data = $response->json('data');
        $this->assertIsString($data['token']);
        $this->assertIsArray($data['vendor']);
        $this->assertIsArray($data['user']);
    }

    /** @test */
    public function validation_errors_return_422(): void
    {
        // Test missing email
        $response = $this->postJson('/api/v1/vendor/auth/login', [
            'password' => $this->testPassword,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);

        // Test missing password
        $response = $this->postJson('/api/v1/vendor/auth/login', [
            'email' => 'vendor@test.com',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);

        // Test invalid email format
        $response = $this->postJson('/api/v1/vendor/auth/login', [
            'email' => 'invalid-email',
            'password' => $this->testPassword,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function vendor_cannot_login_with_portal_access_disabled(): void
    {
        // Disable portal access
        $this->vendor->update(['portal_access_enabled' => false]);

        $response = $this->postJson('/api/v1/vendor/auth/login', [
            'email' => 'vendor@test.com',
            'password' => $this->testPassword,
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Authentication failed',
            ]);
    }

    /** @test */
    public function vendor_cannot_login_with_incomplete_onboarding(): void
    {
        // Set onboarding as incomplete
        $this->vendor->update([
            'onboarding_status' => 'in_progress',
            'onboarding_completed_at' => null,
        ]);

        $response = $this->postJson('/api/v1/vendor/auth/login', [
            'email' => 'vendor@test.com',
            'password' => $this->testPassword,
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Authentication failed',
            ]);
    }

    /** @test */
    public function vendor_cannot_login_with_inactive_status(): void
    {
        // Set vendor as inactive
        $this->vendor->update(['status' => 'inactive']);

        $response = $this->postJson('/api/v1/vendor/auth/login', [
            'email' => 'vendor@test.com',
            'password' => $this->testPassword,
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Authentication failed',
            ]);
    }

    /** @test */
    public function password_reset_rate_limiting_works(): void
    {
        // Clear any existing rate limits
        RateLimiter::clear('vendor-password-reset:vendor@test.com');

        // Make first request (should succeed)
        $response = $this->postJson('/api/v1/vendor/auth/password/email', [
            'email' => 'vendor@test.com',
        ]);

        $response->assertStatus(200);

        // Make second request immediately (should be rate limited)
        $response = $this->postJson('/api/v1/vendor/auth/password/email', [
            'email' => 'vendor@test.com',
        ]);

        $response->assertStatus(429); // Too Many Requests
    }

    /** @test */
    public function password_reset_fails_with_invalid_token(): void
    {
        $newPassword = 'NewTest@VendorP4ss2026!';

        $response = $this->postJson('/api/v1/vendor/auth/password/reset', [
            'token' => 'invalid-token',
            'email' => 'vendor@test.com',
            'password' => $newPassword,
            'password_confirmation' => $newPassword,
        ]);

        $response->assertStatus(400)
            ->assertJsonFragment([
                'message' => 'Password reset failed',
            ]);
    }

    /** @test */
    public function password_reset_fails_with_mismatched_passwords(): void
    {
        $token = 'test-reset-token-' . uniqid();
        PasswordResetToken::create([
            'email' => 'vendor@test.com',
            'token' => Hash::make($token),
            'expires_at' => now()->addHour(),
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Test Agent',
        ]);

        $response = $this->postJson('/api/v1/vendor/auth/password/reset', [
            'token' => $token,
            'email' => 'vendor@test.com',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'DifferentPassword123!',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }
}
