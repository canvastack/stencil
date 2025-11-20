<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Hash;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\PasswordResetToken;
use App\Infrastructure\Notifications\Auth\PasswordResetMail;
use App\Application\Auth\Services\PasswordResetService;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    protected TenantEloquentModel $tenant;
    protected UserEloquentModel $user;
    protected AccountEloquentModel $platformAccount;
    protected PasswordResetService $passwordResetService;

    protected function setUp(): void
    {
        parent::setUp();
        
        Mail::fake();
        
        // Create tenant and user
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->user = UserEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test User',
            'email' => 'test@tenant.com',
            'password' => Hash::make('password123'),
            'status' => 'active'
        ]);
        
        // Create platform account
        $this->platformAccount = AccountEloquentModel::create([
            'name' => 'Platform Admin',
            'email' => 'admin@platform.com',
            'password' => Hash::make('platform123'),
            'account_type' => 'platform_owner',
            'status' => 'active'
        ]);
        
        $this->passwordResetService = app(PasswordResetService::class);
    }

    /** @test */
    public function tenant_user_can_request_password_reset(): void
    {
        $response = $this->postJson("/api/v1/tenant/{$this->tenant->id}/forgot-password", [
            'email' => $this->user->email
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'If an account with that email exists, a password reset link has been sent.',
                'data' => [
                    'email' => $this->user->email,
                    'tenant_id' => $this->tenant->id,
                    'type' => 'tenant'
                ]
            ]);

        // Assert email was sent
        Mail::assertSent(PasswordResetMail::class, function ($mail) {
            return $mail->user->email === $this->user->email;
        });

        // Assert token was created
        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => $this->user->email,
            'tenant_id' => $this->tenant->id,
            'user_type' => 'tenant',
            'used' => false
        ]);
    }

    /** @test */
    public function platform_user_can_request_password_reset(): void
    {
        $response = $this->postJson('/api/v1/platform/forgot-password', [
            'email' => $this->platformAccount->email
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'If an account with that email exists, a password reset link has been sent.',
                'data' => [
                    'email' => $this->platformAccount->email,
                    'type' => 'platform'
                ]
            ]);

        // Assert email was sent
        Mail::assertSent(PasswordResetMail::class);

        // Assert token was created
        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => $this->platformAccount->email,
            'tenant_id' => null,
            'user_type' => 'platform',
            'used' => false
        ]);
    }

    /** @test */
    public function tenant_user_can_reset_password_with_valid_token(): void
    {
        // Request password reset
        $this->passwordResetService->requestReset($this->user->email, $this->tenant->id);

        // Get the generated token from database
        $resetToken = PasswordResetToken::where('email', $this->user->email)
            ->where('tenant_id', $this->tenant->id)
            ->first();

        // Mock the token for testing (since it's hashed in real implementation)
        $plainToken = 'test-token-123';
        $resetToken->update(['token' => Hash::make($plainToken)]);

        $newPassword = 'newpassword123@';

        $response = $this->postJson("/api/v1/tenant/{$this->tenant->id}/reset-password", [
            'token' => $plainToken,
            'email' => $this->user->email,
            'password' => $newPassword,
            'password_confirmation' => $newPassword
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Password has been reset successfully.'
            ]);

        // Assert password was changed
        $this->user->refresh();
        $this->assertTrue(Hash::check($newPassword, $this->user->password));

        // Assert token was marked as used
        $resetToken->refresh();
        $this->assertTrue($resetToken->used);
    }

    /** @test */
    public function platform_user_can_reset_password_with_valid_token(): void
    {
        // Request password reset
        $this->passwordResetService->requestReset($this->platformAccount->email);

        // Get and mock token
        $resetToken = PasswordResetToken::where('email', $this->platformAccount->email)
            ->whereNull('tenant_id')
            ->first();

        $plainToken = 'test-platform-token';
        $resetToken->update(['token' => Hash::make($plainToken)]);

        $newPassword = 'newplatformpassword123@';

        $response = $this->postJson('/api/v1/platform/reset-password', [
            'token' => $plainToken,
            'email' => $this->platformAccount->email,
            'password' => $newPassword,
            'password_confirmation' => $newPassword
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Password has been reset successfully.'
            ]);

        // Assert password was changed
        $this->platformAccount->refresh();
        $this->assertTrue(Hash::check($newPassword, $this->platformAccount->password));
    }

    /** @test */
    public function reset_fails_with_invalid_token(): void
    {
        $response = $this->postJson("/api/v1/tenant/{$this->tenant->id}/reset-password", [
            'token' => 'invalid-token',
            'email' => $this->user->email,
            'password' => 'newpassword123@',
            'password_confirmation' => 'newpassword123@'
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_TOKEN',
                    'message' => 'Invalid or expired reset token.'
                ]
            ]);
    }

    /** @test */
    public function reset_fails_with_mismatched_passwords(): void
    {
        $response = $this->postJson("/api/v1/tenant/{$this->tenant->id}/reset-password", [
            'token' => 'some-token',
            'email' => $this->user->email,
            'password' => 'password123@',
            'password_confirmation' => 'differentpassword123@'
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    /** @test */
    public function rate_limiting_prevents_spam_requests(): void
    {
        // Make multiple requests quickly
        for ($i = 0; $i < 4; $i++) {
            $response = $this->postJson("/api/v1/tenant/{$this->tenant->id}/forgot-password", [
                'email' => $this->user->email
            ]);
        }

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /** @test */
    public function token_validation_works_correctly(): void
    {
        // Request password reset
        $this->passwordResetService->requestReset($this->user->email, $this->tenant->id);

        $resetToken = PasswordResetToken::where('email', $this->user->email)->first();
        $plainToken = 'validation-token';
        $resetToken->update(['token' => Hash::make($plainToken)]);

        $response = $this->postJson("/api/v1/tenant/{$this->tenant->id}/validate-token", [
            'token' => $plainToken,
            'email' => $this->user->email,
            'password' => 'dummy',
            'password_confirmation' => 'dummy'
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'valid' => true,
                    'email' => $this->user->email
                ]
            ]);
    }

    /** @test */
    public function expired_tokens_are_rejected(): void
    {
        // Create expired token
        $expiredToken = PasswordResetToken::create([
            'email' => $this->user->email,
            'tenant_id' => $this->tenant->id,
            'token' => Hash::make('expired-token'),
            'user_type' => 'tenant',
            'expires_at' => now()->subHour(), // Expired 1 hour ago
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Test'
        ]);

        $response = $this->postJson("/api/v1/tenant/{$this->tenant->id}/reset-password", [
            'token' => 'expired-token',
            'email' => $this->user->email,
            'password' => 'newpassword123@',
            'password_confirmation' => 'newpassword123@'
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_TOKEN'
                ]
            ]);
    }

    /** @test */
    public function nonexistent_email_returns_same_response_for_security(): void
    {
        $response = $this->postJson("/api/v1/tenant/{$this->tenant->id}/forgot-password", [
            'email' => 'nonexistent@example.com'
        ]);

        // Should return same response to prevent email enumeration
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'If an account with that email exists, a password reset link has been sent.'
            ]);

        // But no email should be sent
        Mail::assertNotSent(PasswordResetMail::class);

        // And no token should be created
        $this->assertDatabaseMissing('password_reset_tokens', [
            'email' => 'nonexistent@example.com'
        ]);
    }
}