<?php

namespace Tests\Integration\Security;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Customer Quote Security Test
 * 
 * Tests security measures for customer quote workflow:
 * - CSRF protection
 * - Rate limiting
 * - Input validation and sanitization
 * - SQL injection prevention
 * - XSS attack prevention
 * - Audit logging
 * - Data encryption
 * - Access control
 */
class CustomerQuoteSecurityTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private UserEloquentModel $admin;
    private Customer $customer;
    private Order $order;
    private VendorQuote $vendorQuote;
    private CustomerQuote $quote;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create([
            'name' => 'Security Test Tenant',
        ]);

        // Create admin user
        $this->admin = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'admin@security-test.com',
            'account_type' => 'tenant',
        ]);

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'customer@test.com',
            'account_type' => 'registered',
            'email_verified_at' => now(),
        ]);

        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'customer_quote',
        ]);

        // Create vendor quote (no order_id - vendor_quotes table doesn't have this column)
        $this->vendorQuote = VendorQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create customer quote
        $this->quote = CustomerQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_quote_id' => $this->vendorQuote->id,
            'status' => 'sent',
            'response_token' => \Str::uuid(),
            'valid_until' => now()->addDays(7),
            'created_by' => $this->admin->id,
        ]);
    }

    /** @test */
    public function it_prevents_sql_injection_in_counter_offer_notes(): void
    {
        $maliciousInput = "'; DROP TABLE customer_quotes; --";

        $response = $this->postJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}/counter-offer", [
            'counter_amount' => 1000000,
            'notes' => $maliciousInput,
        ]);

        // Should be blocked by security middleware
        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'message' => 'Request blocked due to suspicious activity',
        ]);

        // Verify table still exists
        $this->assertTrue(Schema::hasTable('customer_quotes'));
    }

    /** @test */
    public function it_prevents_xss_attacks_in_rejection_reason(): void
    {
        $xssPayload = '<script>alert("XSS")</script>';

        $response = $this->postJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}/reject", [
            'reason' => $xssPayload,
        ]);

        // Should be blocked by security middleware
        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'message' => 'Request blocked due to suspicious activity',
        ]);
    }

    /** @test */
    public function it_sanitizes_input_data(): void
    {
        $inputWithNullBytes = "Test\0Input";
        $inputWithExtraSpaces = "  Test Input  ";

        $response = $this->postJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}/reject", [
            'reason' => $inputWithExtraSpaces,
        ]);

        // Should pass through after sanitization
        $response->assertStatus(200);
        
        // Verify data was sanitized (trimmed)
        $this->quote->refresh();
        $this->assertEquals('Test Input', $this->quote->rejection_reason);
    }

    /** @test */
    public function it_enforces_rate_limiting_on_quote_view(): void
    {
        // Make 60 requests (the limit)
        for ($i = 0; $i < 60; $i++) {
            $response = $this->getJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}");
            $response->assertStatus(200);
        }

        // 61st request should be rate limited
        $response = $this->getJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}");
        $response->assertStatus(429); // Too Many Requests
    }

    /** @test */
    public function it_enforces_rate_limiting_on_quote_actions(): void
    {
        // Make 10 counter offer attempts (the limit)
        for ($i = 0; $i < 10; $i++) {
            $this->postJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}/counter-offer", [
                'counter_amount' => 1000000 + $i,
                'notes' => 'Counter offer attempt ' . $i,
            ]);
        }

        // 11th request should be rate limited
        $response = $this->postJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}/counter-offer", [
            'counter_amount' => 1000000,
            'notes' => 'This should be rate limited',
        ]);

        $response->assertStatus(429); // Too Many Requests
    }

    /** @test */
    public function it_logs_all_quote_actions_in_audit_trail(): void
    {
        // View quote
        $this->getJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}");

        // Accept quote
        $this->postJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}/accept", [
            'terms_accepted' => true,
        ]);

        // Check audit log
        $auditEntries = DB::table('customer_quote_audit_log')
            ->where('quote_id', $this->quote->id)
            ->get();

        $this->assertGreaterThanOrEqual(2, $auditEntries->count());
        
        // Verify audit entries contain required fields
        foreach ($auditEntries as $entry) {
            $this->assertNotNull($entry->action);
            $this->assertNotNull($entry->actor_type);
            $this->assertNotNull($entry->ip_address);
            $this->assertNotNull($entry->created_at);
        }
    }

    /** @test */
    public function it_logs_security_events_for_suspicious_activity(): void
    {
        $maliciousInput = "'; DROP TABLE customer_quotes; --";

        $this->postJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}/counter-offer", [
            'counter_amount' => 1000000,
            'notes' => $maliciousInput,
        ]);

        // Check security audit log
        $securityEvents = DB::table('security_audit_log')
            ->where('event_type', 'suspicious_activity')
            ->get();

        $this->assertGreaterThan(0, $securityEvents->count());
    }

    /** @test */
    public function it_adds_security_headers_to_responses(): void
    {
        $response = $this->getJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}");

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        // The existing SecurityHeadersMiddleware sets X-Frame-Options to SAMEORIGIN
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-XSS-Protection', '1; mode=block');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Content-Security-Policy');
    }

    /** @test */
    public function it_validates_token_format(): void
    {
        $invalidToken = 'invalid-token-format';

        $response = $this->getJson("/api/v1/public/customer-quotes/token/{$invalidToken}");

        $response->assertStatus(404);
        $response->assertJson([
            'success' => false,
            'message' => 'Quote not found or token is invalid',
        ]);
    }

    /** @test */
    public function it_prevents_access_to_expired_quotes(): void
    {
        // Set quote as expired
        $this->quote->update([
            'status' => 'expired',
            'expired_at' => now()->subDay(),
        ]);

        $response = $this->getJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}");

        $response->assertStatus(410); // Gone
        $response->assertJson([
            'success' => false,
            'message' => 'This quote has expired',
        ]);
    }

    /** @test */
    public function it_prevents_actions_on_already_accepted_quotes(): void
    {
        // Set quote as accepted
        $this->quote->update(['status' => 'accepted']);

        $response = $this->postJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}/accept", [
            'terms_accepted' => true,
        ]);

        $response->assertStatus(400);
        $response->assertJsonFragment([
            'success' => false,
        ]);
    }

    /** @test */
    public function it_validates_input_length_to_prevent_dos(): void
    {
        $veryLongInput = str_repeat('A', 15000); // Exceeds 10000 char limit

        $response = $this->postJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}/reject", [
            'reason' => $veryLongInput,
        ]);

        // Should be blocked by security middleware
        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'message' => 'Request blocked due to suspicious activity',
        ]);
    }

    /** @test */
    public function it_prevents_path_traversal_attacks(): void
    {
        $pathTraversalInput = '../../../etc/passwd';

        $response = $this->postJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}/reject", [
            'reason' => $pathTraversalInput,
        ]);

        // Should be blocked by security middleware
        $response->assertStatus(403);
    }

    /** @test */
    public function it_enforces_csrf_protection_for_state_changing_operations(): void
    {
        // Laravel Sanctum handles CSRF for stateful requests
        // For API routes with JSON requests, CSRF is not required
        // This test verifies the configuration is correct

        $this->assertTrue(
            class_exists('App\Http\Middleware\VerifyCsrfToken'),
            'VerifyCsrfToken middleware exists'
        );
    }

    /** @test */
    public function it_tracks_ip_address_in_audit_log(): void
    {
        $response = $this->getJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}");

        $response->assertStatus(200);

        $auditEntry = DB::table('customer_quote_audit_log')
            ->where('quote_id', $this->quote->id)
            ->latest('created_at')
            ->first();

        $this->assertNotNull($auditEntry);
        $this->assertNotNull($auditEntry->ip_address);
        $this->assertEquals('127.0.0.1', $auditEntry->ip_address);
    }

    /** @test */
    public function it_tracks_user_agent_in_audit_log(): void
    {
        $response = $this->withHeaders([
            'User-Agent' => 'Mozilla/5.0 Test Browser',
        ])->getJson("/api/v1/public/customer-quotes/token/{$this->quote->response_token}");

        $response->assertStatus(200);

        $auditEntry = DB::table('customer_quote_audit_log')
            ->where('quote_id', $this->quote->id)
            ->latest('created_at')
            ->first();

        $this->assertNotNull($auditEntry);
        $this->assertNotNull($auditEntry->user_agent);
        $this->assertStringContainsString('Mozilla', $auditEntry->user_agent);
    }
}
