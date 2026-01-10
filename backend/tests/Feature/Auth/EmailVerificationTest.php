<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use App\Models\EmailVerification;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Application\Auth\Services\EmailVerificationService;
use Illuminate\Support\Facades\Mail;
use App\Mail\Auth\EmailVerificationMail;
use Carbon\Carbon;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected EmailVerificationService $emailVerificationService;
    protected TenantEloquentModel $tenant;
    protected UserEloquentModel $tenantUser;
    protected AccountEloquentModel $platformUser;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->emailVerificationService = app(EmailVerificationService::class);
        
        // Create test tenant
        $this->tenant = TenantEloquentModel::create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
            'domain' => 'test-tenant',
            'database_name' => 'test_tenant_db',
            'status' => 'active',
        ]);
        
        // Create test tenant user
        $this->tenantUser = UserEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test User',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'status' => 'active',
        ]);
        
        // Create test platform user
        $this->platformUser = AccountEloquentModel::create([
            'name' => 'Platform User',
            'email' => 'platform@test.com',
            'password' => bcrypt('password'),
            'account_type' => 'platform_owner',
            'status' => 'active',
        ]);
        
        Mail::fake();
    }

    public function test_can_send_verification_email_for_tenant_user(): void
    {
        $result = $this->emailVerificationService->sendVerification($this->tenantUser);
        
        $this->assertTrue($result);
        
        // Check that email verification record was created
        $this->assertDatabaseHas('email_verifications', [
            'email' => $this->tenantUser->email,
            'user_type' => 'tenant',
            'tenant_id' => $this->tenant->id,
            'verified' => false,
        ]);
        
        // Check that email was queued (EmailVerificationMail implements ShouldQueue)
        Mail::assertQueued(EmailVerificationMail::class, function ($mail) {
            return $mail->user->email === $this->tenantUser->email && 
                   $mail->tenantId === $this->tenant->id;
        });
    }

    public function test_can_send_verification_email_for_platform_user(): void
    {
        $result = $this->emailVerificationService->sendVerification($this->platformUser);
        
        $this->assertTrue($result);
        
        // Check that email verification record was created
        $this->assertDatabaseHas('email_verifications', [
            'email' => $this->platformUser->email,
            'user_type' => 'platform',
            'tenant_id' => null,
            'verified' => false,
        ]);
        
        // Check that email was queued (EmailVerificationMail implements ShouldQueue)
        Mail::assertQueued(EmailVerificationMail::class, function ($mail) {
            return $mail->user->email === $this->platformUser->email && 
                   $mail->tenantId === null;
        });
    }

    public function test_can_verify_email_with_valid_token(): void
    {
        // Send verification first
        $this->emailVerificationService->sendVerification($this->tenantUser);
        
        // Get the token from database
        $verification = EmailVerification::where('email', $this->tenantUser->email)->first();
        $token = $verification->token;
        
        $result = $this->emailVerificationService->verify($token);
        
        $this->assertTrue($result);
        
        // Check that user is now verified
        $this->tenantUser->refresh();
        $this->assertNotNull($this->tenantUser->email_verified_at);
        
        // Check that verification record is marked as verified
        $verification->refresh();
        $this->assertTrue($verification->verified);
        $this->assertNotNull($verification->verified_at);
    }

    public function test_cannot_verify_email_with_invalid_token(): void
    {
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        
        $this->emailVerificationService->verify('invalid-token');
    }

    public function test_cannot_verify_email_with_expired_token(): void
    {
        // Create expired verification
        EmailVerification::create([
            'tenant_id' => $this->tenant->id,
            'email' => $this->tenantUser->email,
            'token' => 'expired-token',
            'user_type' => 'tenant',
            'expires_at' => Carbon::now()->subHours(25), // Expired
            'ip_address' => '127.0.0.1',
        ]);
        
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        
        $this->emailVerificationService->verify('expired-token');
    }

    public function test_cannot_verify_already_verified_token(): void
    {
        // Create already verified token
        EmailVerification::create([
            'tenant_id' => $this->tenant->id,
            'email' => $this->tenantUser->email,
            'token' => 'already-verified-token',
            'user_type' => 'tenant',
            'expires_at' => Carbon::now()->addHours(24),
            'verified' => true,
            'verified_at' => Carbon::now(),
            'ip_address' => '127.0.0.1',
        ]);
        
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        
        $this->emailVerificationService->verify('already-verified-token');
    }

    public function test_can_resend_verification_email(): void
    {
        $result = $this->emailVerificationService->resendVerification(
            $this->tenantUser->email, 
            $this->tenant->id
        );
        
        $this->assertTrue($result);
        
        Mail::assertQueued(EmailVerificationMail::class);
    }

    public function test_cannot_resend_verification_if_already_verified(): void
    {
        // Mark user as verified
        $this->tenantUser->update(['email_verified_at' => now()]);
        
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        
        $this->emailVerificationService->resendVerification(
            $this->tenantUser->email, 
            $this->tenant->id
        );
    }

    public function test_rate_limiting_prevents_frequent_resend_requests(): void
    {
        // First request should work
        $result = $this->emailVerificationService->resendVerification(
            $this->tenantUser->email, 
            $this->tenant->id
        );
        $this->assertTrue($result);
        
        // Second request within 5 minutes should fail
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        
        $this->emailVerificationService->resendVerification(
            $this->tenantUser->email, 
            $this->tenant->id
        );
    }

    public function test_can_check_email_verification_status(): void
    {
        // Initially not verified
        $result = $this->emailVerificationService->isEmailVerified(
            $this->tenantUser->email, 
            $this->tenant->id
        );
        $this->assertFalse($result);
        
        // Verify the email
        $this->tenantUser->update(['email_verified_at' => now()]);
        
        // Now should be verified
        $result = $this->emailVerificationService->isEmailVerified(
            $this->tenantUser->email, 
            $this->tenant->id
        );
        $this->assertTrue($result);
    }

    public function test_cleanup_expired_tokens(): void
    {
        // Create expired tokens
        EmailVerification::create([
            'tenant_id' => $this->tenant->id,
            'email' => 'expired1@test.com',
            'token' => 'expired-token-1',
            'user_type' => 'tenant',
            'expires_at' => Carbon::now()->subHours(25),
            'ip_address' => '127.0.0.1',
        ]);
        
        EmailVerification::create([
            'tenant_id' => $this->tenant->id,
            'email' => 'expired2@test.com',
            'token' => 'expired-token-2',
            'user_type' => 'tenant',
            'expires_at' => Carbon::now()->subHours(30),
            'ip_address' => '127.0.0.1',
        ]);
        
        // Create valid token
        EmailVerification::create([
            'tenant_id' => $this->tenant->id,
            'email' => 'valid@test.com',
            'token' => 'valid-token',
            'user_type' => 'tenant',
            'expires_at' => Carbon::now()->addHours(24),
            'ip_address' => '127.0.0.1',
        ]);
        
        $deletedCount = $this->emailVerificationService->cleanupExpiredTokens();
        
        $this->assertEquals(2, $deletedCount);
        
        // Check that valid token still exists
        $this->assertDatabaseHas('email_verifications', [
            'token' => 'valid-token'
        ]);
        
        // Check that expired tokens are deleted
        $this->assertDatabaseMissing('email_verifications', [
            'token' => 'expired-token-1'
        ]);
        $this->assertDatabaseMissing('email_verifications', [
            'token' => 'expired-token-2'
        ]);
    }

    /** API Endpoint Tests */

    public function test_send_tenant_verification_api_endpoint(): void
    {
        $response = $this->postJson('/api/v1/auth/tenant/' . $this->tenant->id . '/send-verification', [
            'email' => $this->tenantUser->email,
            'tenant_id' => $this->tenant->id,
        ]);
        
        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'If the email exists in our system, a verification link has been sent.'
                ]);
        
        Mail::assertQueued(EmailVerificationMail::class);
    }

    public function test_send_platform_verification_api_endpoint(): void
    {
        $response = $this->postJson('/api/v1/auth/platform/send-verification', [
            'email' => $this->platformUser->email,
        ]);
        
        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'If the email exists in our system, a verification link has been sent.'
                ]);
        
        Mail::assertQueued(EmailVerificationMail::class);
    }

    public function test_verify_email_api_endpoint(): void
    {
        // Send verification first
        $this->emailVerificationService->sendVerification($this->tenantUser);
        
        // Get the token
        $verification = EmailVerification::where('email', $this->tenantUser->email)->first();
        
        $response = $this->postJson('/api/v1/auth/tenant/' . $this->tenant->id . '/verify-email', [
            'token' => $verification->token,
        ]);
        
        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Email verified successfully.'
                ]);
        
        // Check user is verified
        $this->tenantUser->refresh();
        $this->assertNotNull($this->tenantUser->email_verified_at);
    }

    public function test_check_verification_status_api_endpoint(): void
    {
        // Initially not verified
        $response = $this->getJson('/api/v1/auth/tenant/' . $this->tenant->id . '/verification-status?' . http_build_query([
            'email' => $this->tenantUser->email,
            'tenant_id' => $this->tenant->id,
        ]));
        
        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'verified' => false
                ]);
        
        // Verify the email
        $this->tenantUser->update(['email_verified_at' => now()]);
        
        // Now should show verified
        $response = $this->getJson('/api/v1/auth/tenant/' . $this->tenant->id . '/verification-status?' . http_build_query([
            'email' => $this->tenantUser->email,
            'tenant_id' => $this->tenant->id,
        ]));
        
        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'verified' => true
                ]);
    }

    public function test_api_validation_errors(): void
    {
        // Missing email
        $response = $this->postJson('/api/v1/auth/tenant/' . $this->tenant->id . '/send-verification', [
            'tenant_id' => $this->tenant->id,
        ]);
        
        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
        
        // Invalid email format
        $response = $this->postJson('/api/v1/auth/tenant/' . $this->tenant->id . '/send-verification', [
            'email' => 'invalid-email',
            'tenant_id' => $this->tenant->id,
        ]);
        
        $response->assertStatus(422)
                ->assertJsonValidationErrors(['email']);
        
        // Missing token for verification
        $response = $this->postJson('/api/v1/auth/tenant/' . $this->tenant->id . '/verify-email', []);
        
        $response->assertStatus(422)
                ->assertJsonValidationErrors(['token']);
    }
}