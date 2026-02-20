<?php

namespace Tests\Feature\CustomerQuote;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Mail\CustomerEmailVerificationMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class CustomerEmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::factory()->create([
            'name' => 'Test Tenant',
            'domain' => 'test.example.com',
        ]);
    }

    /** @test */
    public function customer_registration_sends_verification_email()
    {
        Mail::fake();

        $response = $this->postJson('/api/v1/public/customers/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '+62812345678',
            'password' => 'Password123',
            'tenant_id' => $this->tenant->id,
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'message' => 'Registration successful. Please check your email for verification.',
        ]);

        // Assert email was queued (since it implements ShouldQueue)
        Mail::assertQueued(CustomerEmailVerificationMail::class, function ($mail) {
            return $mail->customer->email === 'john@example.com';
        });

        // Assert customer was created with registration token
        $customer = Customer::where('email', 'john@example.com')->first();
        $this->assertNotNull($customer);
        $this->assertEquals('registered', $customer->account_type);
        $this->assertNotNull($customer->registration_token);
        $this->assertNull($customer->email_verified_at);
    }

    /** @test */
    public function customer_can_verify_email_with_valid_token()
    {
        $customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'john@example.com',
            'account_type' => 'registered',
            'registration_token' => Str::uuid(),
            'email_verified_at' => null,
        ]);

        $response = $this->getJson("/api/v1/public/customers/verify-email/{$customer->registration_token}");

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Email verified successfully',
        ]);

        // Assert customer is now verified
        $customer->refresh();
        $this->assertEquals('verified', $customer->account_type);
        $this->assertNotNull($customer->email_verified_at);
        $this->assertNull($customer->registration_token);
    }

    /** @test */
    public function email_verification_fails_with_invalid_token()
    {
        // Use a valid UUID format but non-existent token
        $invalidToken = Str::uuid();
        
        $response = $this->getJson("/api/v1/public/customers/verify-email/{$invalidToken}");

        $response->assertStatus(404);
        $response->assertJson([
            'message' => 'Invalid verification token',
        ]);
    }

    /** @test */
    public function already_verified_email_returns_appropriate_message()
    {
        $customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'john@example.com',
            'account_type' => 'verified',
            'registration_token' => Str::uuid(),
            'email_verified_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/public/customers/verify-email/{$customer->registration_token}");

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Email already verified',
        ]);
    }

    /** @test */
    public function customer_can_resend_verification_email()
    {
        Mail::fake();

        $customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'john@example.com',
            'account_type' => 'registered',
            'registration_token' => Str::uuid(),
            'email_verified_at' => null,
        ]);

        $response = $this->postJson('/api/v1/public/customers/resend-verification', [
            'email' => 'john@example.com',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Verification email sent successfully',
        ]);

        // Assert email was queued
        Mail::assertQueued(CustomerEmailVerificationMail::class, function ($mail) use ($customer) {
            return $mail->customer->id === $customer->id;
        });
    }

    /** @test */
    public function resend_verification_fails_for_nonexistent_customer()
    {
        $response = $this->postJson('/api/v1/public/customers/resend-verification', [
            'email' => 'nonexistent@example.com',
        ]);

        $response->assertStatus(404);
        $response->assertJson([
            'message' => 'Customer not found',
        ]);
    }

    /** @test */
    public function resend_verification_returns_message_for_already_verified_customer()
    {
        $customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'john@example.com',
            'account_type' => 'verified',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/v1/public/customers/resend-verification', [
            'email' => 'john@example.com',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Email already verified',
        ]);
    }

    /** @test */
    public function resend_verification_generates_new_token_if_missing()
    {
        Mail::fake();

        $customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'john@example.com',
            'account_type' => 'registered',
            'registration_token' => null,
            'email_verified_at' => null,
        ]);

        $response = $this->postJson('/api/v1/public/customers/resend-verification', [
            'email' => 'john@example.com',
        ]);

        $response->assertStatus(200);

        // Assert new token was generated
        $customer->refresh();
        $this->assertNotNull($customer->registration_token);

        // Assert email was queued
        Mail::assertQueued(CustomerEmailVerificationMail::class);
    }

    /** @test */
    public function guest_account_upgrade_sends_verification_email()
    {
        Mail::fake();

        $customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'guest@example.com',
            'account_type' => 'guest',
            'password_hash' => null,
        ]);

        $response = $this->postJson('/api/v1/public/customers/upgrade-guest', [
            'email' => 'guest@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Account upgraded successfully. Please check your email for verification.',
        ]);

        // Assert email was queued
        Mail::assertQueued(CustomerEmailVerificationMail::class, function ($mail) use ($customer) {
            return $mail->customer->id === $customer->id;
        });

        // Assert customer was upgraded
        $customer->refresh();
        $this->assertEquals('registered', $customer->account_type);
        $this->assertNotNull($customer->password_hash);
        $this->assertNotNull($customer->registration_token);
    }

    /** @test */
    public function verification_email_contains_correct_url()
    {
        Mail::fake();

        $customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'john@example.com',
            'account_type' => 'registered',
            'registration_token' => Str::uuid(),
        ]);

        Mail::to($customer->email)->send(new CustomerEmailVerificationMail($customer));

        Mail::assertQueued(CustomerEmailVerificationMail::class, function ($mail) use ($customer) {
            $expectedUrl = config('app.frontend_url', config('app.url')) . "/customer/verify-email/{$customer->registration_token}";
            return $mail->verificationUrl === $expectedUrl;
        });
    }

    /** @test */
    public function resend_verification_respects_rate_limiting()
    {
        $this->markTestSkipped('Rate limiting test skipped - requires cache configuration');
        
        $customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'john@example.com',
            'account_type' => 'registered',
            'registration_token' => Str::uuid(),
            'email_verified_at' => null,
        ]);

        // Make 4 requests (rate limit is 3 per minute)
        for ($i = 0; $i < 4; $i++) {
            $response = $this->postJson('/api/v1/public/customers/resend-verification', [
                'email' => 'john@example.com',
            ]);

            if ($i < 3) {
                $response->assertStatus(200);
            } else {
                $response->assertStatus(429); // Too Many Requests
            }
        }
    }
}
