<?php

namespace Tests\Unit\Http\Controllers\Platform;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    private AccountEloquentModel $account;

    protected function setUp(): void
    {
        parent::setUp();

        $this->account = AccountEloquentModel::create([
            'name' => 'Test Admin',
            'email' => 'admin@test.com',
            'password' => Hash::make('password123'),
            'account_type' => 'platform_owner',
            'status' => 'active'
        ]);
    }

    /** @test */
    public function it_can_authenticate_platform_account_with_valid_credentials()
    {
        $response = $this->postJson('/api/v1/platform/login', [
            'email' => 'admin@test.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'access_token',
                    'token_type',
                    'expires_in',
                    'account' => [
                        'id',
                        'name',
                        'email',
                        'account_type',
                        'status'
                    ],
                    'permissions',
                    'account_type'
                ]);

        $this->assertEquals('Bearer', $response->json('token_type'));
        $this->assertEquals('platform_owner', $response->json('account_type'));
    }

    /** @test */
    public function it_rejects_invalid_credentials()
    {
        $response = $this->postJson('/api/v1/platform/login', [
            'email' => 'admin@test.com',
            'password' => 'wrong-password'
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_rejects_non_existent_account()
    {
        $response = $this->postJson('/api/v1/platform/login', [
            'email' => 'nonexistent@test.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_rejects_inactive_account()
    {
        $this->account->update(['status' => 'inactive']);

        $response = $this->postJson('/api/v1/platform/login', [
            'email' => 'admin@test.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_validates_required_fields()
    {
        $response = $this->postJson('/api/v1/platform/login', []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email', 'password']);
    }

    /** @test */
    public function it_validates_email_format()
    {
        $response = $this->postJson('/api/v1/platform/login', [
            'email' => 'invalid-email',
            'password' => 'password123'
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_enforces_rate_limiting()
    {
        // Make 5 failed login attempts
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/platform/login', [
                'email' => 'admin@test.com',
                'password' => 'wrong-password'
            ]);
        }

        // 6th attempt should be rate limited
        $response = $this->postJson('/api/v1/platform/login', [
            'email' => 'admin@test.com',
            'password' => 'wrong-password'
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
        $loginResponse = $this->postJson('/api/v1/platform/login', [
            'email' => 'admin@test.com',
            'password' => 'password123'
        ]);

        $token = $loginResponse->json('access_token');

        // Then logout
        $response = $this->postJson('/api/v1/platform/logout', [], [
            'Authorization' => 'Bearer ' . $token
        ]);

        $response->assertStatus(200)
                ->assertJson(['message' => 'Successfully logged out']);
    }

    /** @test */
    public function it_can_get_authenticated_user_info()
    {
        // First authenticate
        $loginResponse = $this->postJson('/api/v1/platform/login', [
            'email' => 'admin@test.com',
            'password' => 'password123'
        ]);

        $token = $loginResponse->json('access_token');

        // Get user info
        $response = $this->getJson('/api/v1/platform/me', [
            'Authorization' => 'Bearer ' . $token
        ]);

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'account' => [
                        'id',
                        'name',
                        'email',
                        'account_type',
                        'status'
                    ],
                    'permissions'
                ]);
    }

    /** @test */
    public function it_requires_authentication_for_protected_endpoints()
    {
        $response = $this->getJson('/api/v1/platform/me');

        $response->assertStatus(401);
    }

    /** @test */
    public function it_rejects_invalid_tokens()
    {
        $response = $this->getJson('/api/v1/platform/me', [
            'Authorization' => 'Bearer invalid-token'
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function it_handles_suspended_account_login()
    {
        $this->account->update(['status' => 'suspended']);

        $response = $this->postJson('/api/v1/platform/login', [
            'email' => 'admin@test.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function it_updates_last_login_timestamp_on_successful_authentication()
    {
        $originalTime = $this->account->last_login_at;

        $response = $this->postJson('/api/v1/platform/login', [
            'email' => 'admin@test.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200);

        $this->account->refresh();
        $this->assertNotEquals($originalTime, $this->account->last_login_at);
        $this->assertNotNull($this->account->last_login_at);
    }

    /** @test */
    public function it_includes_proper_expiration_time()
    {
        $response = $this->postJson('/api/v1/platform/login', [
            'email' => 'admin@test.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200);
        
        // Platform tokens should have 24 hour expiration
        $this->assertEquals(24 * 60 * 60, $response->json('expires_in'));
    }

    /** @test */
    public function it_includes_bearer_token_type()
    {
        $response = $this->postJson('/api/v1/platform/login', [
            'email' => 'admin@test.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200);
        $this->assertEquals('Bearer', $response->json('token_type'));
    }

    protected function tearDown(): void
    {
        RateLimiter::clear('platform-login:127.0.0.1');
        parent::tearDown();
    }
}