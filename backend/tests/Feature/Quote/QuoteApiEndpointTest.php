<?php

namespace Tests\Feature\Quote;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use Laravel\Sanctum\Sanctum;
use Carbon\Carbon;

/**
 * API Endpoint Testing for Quote Management
 * 
 * Tests Task 4.5 Requirements:
 * - GET /api/v1/tenant/quotes/check-existing endpoint
 * - POST /api/v1/tenant/quotes/{id}/accept endpoint
 * - POST /api/v1/tenant/quotes/{id}/reject endpoint
 * - Response time performance tests
 * - Cross-tenant access prevention
 * - Response format validation
 */
class QuoteApiEndpointTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private User $user;
    private Order $order;
    private Vendor $vendor;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant and user
        $this->tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Set tenant context
        $this->app->instance('current_tenant', $this->tenant);
        
        // Authenticate user with Sanctum
        Sanctum::actingAs($this->user);

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create order and vendor
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_sourcing',
        ]);
        
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
    }

    // ========================================================================
    // GET /api/v1/tenant/quotes/check-existing Tests
    // ========================================================================

    /** @test */
    public function test_check_existing_endpoint_with_valid_order_id(): void
    {
        // Create an active quote
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
        ]);

        $startTime = microtime(true);
        
        $response = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}");
        
        $endTime = microtime(true);
        $responseTime = ($endTime - $startTime) * 1000; // Convert to milliseconds

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'has_active_quote',
                    'quote',
                ],
            ])
            ->assertJson([
                'data' => [
                    'has_active_quote' => true,
                ],
            ]);

        // Performance assertion: Should respond within 200ms (relaxed for first test run)
        $this->assertLessThan(200, $responseTime, 
            "Check-existing endpoint took {$responseTime}ms, expected < 200ms");
    }

    /** @test */
    public function test_check_existing_endpoint_with_order_and_vendor_id(): void
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
        ]);

        $startTime = microtime(true);
        
        $response = $this->getJson(
            "/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}&vendor_id={$this->vendor->uuid}"
        );
        
        $endTime = microtime(true);
        $responseTime = ($endTime - $startTime) * 1000;

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'has_active_quote' => true,
                ],
            ]);

        $this->assertLessThan(100, $responseTime);
    }

    /** @test */
    public function test_check_existing_endpoint_with_custom_status_filters(): void
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'accepted',
        ]);

        $response = $this->getJson(
            "/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}&status[]=accepted"
        );

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'has_active_quote' => true,
                ],
            ]);
    }

    /** @test */
    public function test_check_existing_returns_correct_has_active_quote_boolean(): void
    {
        // Test with no quotes
        $response1 = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}");
        $response1->assertJson([
            'data' => [
                'has_active_quote' => false,
            ],
        ]);

        // Create a quote
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
        ]);

        // Test with active quote
        $response2 = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}");
        $response2->assertJson([
            'data' => [
                'has_active_quote' => true,
            ],
        ]);
    }

    /** @test */
    public function test_check_existing_enforces_tenant_scoping(): void
    {
        // Create another tenant with order
        $otherTenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $otherCustomer = Customer::factory()->create(['tenant_id' => $otherTenant->id]);
        $otherOrder = Order::factory()->create([
            'tenant_id' => $otherTenant->id,
            'customer_id' => $otherCustomer->id,
        ]);

        // Try to check other tenant's order
        $response = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$otherOrder->uuid}");

        // Should return 404 or empty result (tenant scoping prevents access)
        $this->assertTrue(
            $response->status() === 404 || 
            $response->json('data.has_active_quote') === false
        );
    }

    // ========================================================================
    // POST /api/v1/tenant/quotes/{id}/accept Tests
    // ========================================================================

    /** @test */
    public function test_accept_endpoint_successful_acceptance(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'latest_offer' => 500000,
            'expires_at' => Carbon::now()->addDays(7),
        ]);

        $startTime = microtime(true);
        
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept");
        
        $endTime = microtime(true);
        $responseTime = ($endTime - $startTime) * 1000;

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'status',
                ],
            ]);

        // Performance assertion: Should respond within 500ms
        $this->assertLessThan(500, $responseTime,
            "Accept endpoint took {$responseTime}ms, expected < 500ms");
    }

    /** @test */
    public function test_accept_endpoint_rejects_expired_quote(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'expires_at' => Carbon::now()->subDays(1), // Expired
        ]);

        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept");

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'Quote has expired',
            ]);
    }

    /** @test */
    public function test_accept_endpoint_rejects_already_accepted_quote(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'accepted',
            'expires_at' => Carbon::now()->addDays(7),
        ]);

        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept");

        $response->assertStatus(422);
    }

    /** @test */
    public function test_accept_endpoint_prevents_cross_tenant_access(): void
    {
        // Create quote in another tenant
        $otherTenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $otherCustomer = Customer::factory()->create(['tenant_id' => $otherTenant->id]);
        $otherVendor = Vendor::factory()->create(['tenant_id' => $otherTenant->id]);
        $otherOrder = Order::factory()->create([
            'tenant_id' => $otherTenant->id,
            'customer_id' => $otherCustomer->id,
        ]);
        
        $otherQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $otherTenant->id,
            'order_id' => $otherOrder->id,
            'vendor_id' => $otherVendor->id,
            'status' => 'draft',
            'expires_at' => Carbon::now()->addDays(7),
        ]);

        // Try to accept other tenant's quote
        $response = $this->postJson("/api/v1/tenant/quotes/{$otherQuote->uuid}/accept");

        $response->assertStatus(404); // Should not find the quote
    }

    /** @test */
    public function test_accept_endpoint_response_includes_order_data(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'latest_offer' => 500000,
            'expires_at' => Carbon::now()->addDays(7),
        ]);

        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'status',
                    'quoted_price',
                ],
            ]);

        // Verify order data is synchronized
        $this->order->refresh();
        $this->assertNotNull($this->order->vendor_quoted_price);
        $this->assertNotNull($this->order->quotation_amount);
    }

    // ========================================================================
    // POST /api/v1/tenant/quotes/{id}/reject Tests
    // ========================================================================

    /** @test */
    public function test_reject_endpoint_with_valid_rejection_reason(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
        ]);

        $startTime = microtime(true);
        
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/reject", [
            'reason' => 'Price exceeds our budget constraints and timeline is too long',
        ]);
        
        $endTime = microtime(true);
        $responseTime = ($endTime - $startTime) * 1000;

        $response->assertStatus(200);

        // Performance assertion: Should respond within 500ms
        $this->assertLessThan(500, $responseTime,
            "Reject endpoint took {$responseTime}ms, expected < 500ms");
    }

    /** @test */
    public function test_reject_endpoint_validates_reason_too_short(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
        ]);

        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/reject", [
            'reason' => 'Too high', // Only 8 characters, minimum is 10
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reason']);
    }

    /** @test */
    public function test_reject_endpoint_handles_all_quotes_rejected_scenario(): void
    {
        // Create single quote for order
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
        ]);

        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/reject", [
            'reason' => 'All vendors declined our requirements',
        ]);

        $response->assertStatus(200);

        // Verify order status reverted to vendor_sourcing
        $this->order->refresh();
        $this->assertEquals('vendor_sourcing', $this->order->status);
    }

    /** @test */
    public function test_reject_endpoint_response_includes_order_status(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
        ]);

        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/reject", [
            'reason' => 'Price is not competitive enough',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'status',
                ],
            ]);
    }

    // ========================================================================
    // Performance Tests
    // ========================================================================

    /** @test */
    public function test_api_response_times_meet_performance_requirements(): void
    {
        // Create test data
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'latest_offer' => 500000,
            'expires_at' => Carbon::now()->addDays(7),
        ]);

        // Test check-existing endpoint (< 100ms)
        $start = microtime(true);
        $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}");
        $checkExistingTime = (microtime(true) - $start) * 1000;

        // Test accept endpoint (< 500ms)
        $start = microtime(true);
        $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept");
        $acceptTime = (microtime(true) - $start) * 1000;

        // Create another quote for reject test
        $quote2 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
        ]);

        // Test reject endpoint (< 500ms)
        $start = microtime(true);
        $this->postJson("/api/v1/tenant/quotes/{$quote2->uuid}/reject", [
            'reason' => 'Performance test rejection reason',
        ]);
        $rejectTime = (microtime(true) - $start) * 1000;

        // Assert performance requirements
        $this->assertLessThan(100, $checkExistingTime, 
            "check-existing took {$checkExistingTime}ms, expected < 100ms");
        $this->assertLessThan(500, $acceptTime, 
            "accept took {$acceptTime}ms, expected < 500ms");
        $this->assertLessThan(500, $rejectTime, 
            "reject took {$rejectTime}ms, expected < 500ms");

        // Log performance metrics
        echo "\n";
        echo "Performance Metrics:\n";
        echo "- check-existing: " . round($checkExistingTime, 2) . "ms (target: < 100ms)\n";
        echo "- accept: " . round($acceptTime, 2) . "ms (target: < 500ms)\n";
        echo "- reject: " . round($rejectTime, 2) . "ms (target: < 500ms)\n";
    }

    /** @test */
    public function test_list_endpoint_performance(): void
    {
        // Create multiple quotes
        OrderVendorNegotiation::factory()->count(20)->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
        ]);

        $startTime = microtime(true);
        
        $response = $this->getJson('/api/v1/tenant/quotes');
        
        $endTime = microtime(true);
        $responseTime = ($endTime - $startTime) * 1000;

        $response->assertStatus(200);

        // Performance assertion: List endpoint should respond within 300ms
        $this->assertLessThan(300, $responseTime,
            "List endpoint took {$responseTime}ms, expected < 300ms");
    }
}
