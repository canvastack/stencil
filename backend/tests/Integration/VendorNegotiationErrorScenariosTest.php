<?php

namespace Tests\Integration;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Carbon\Carbon;

/**
 * Integration Test for Vendor Negotiation Error Scenarios
 * 
 * This test validates error handling and validation in the vendor
 * negotiation workflow, ensuring the system fails gracefully.
 * 
 * Test Scenarios:
 * 1. Stage advancement without accepted quote
 * 2. Quote acceptance with expired quote
 * 3. Cross-tenant sync attempt
 * 
 * Validates: Requirements 3.2, 8.5
 */
class VendorNegotiationErrorScenariosTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private Tenant $otherTenant;
    private Customer $customer;
    private Vendor $vendor;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create primary tenant
        $this->tenant = Tenant::factory()->create([
            'domain' => 'test-tenant.localhost',
        ]);

        // Create secondary tenant for cross-tenant tests
        $this->otherTenant = Tenant::factory()->create([
            'domain' => 'other-tenant.localhost',
        ]);

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create and authenticate user
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        Sanctum::actingAs($this->user);
    }

    /**
     * Test stage advancement without accepted quote
     * 
     * @test
     * Validates: Requirement 3.2
     */
    public function it_prevents_stage_advancement_without_accepted_quote(): void
    {
        // ============================================================
        // SCENARIO 1: No quotes at all
        // ============================================================
        
        $orderNoQuotes = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Attempt to advance stage
        $response = $this->postJson(
            "/api/v1/tenant/orders/{$orderNoQuotes->uuid}/advance-stage",
            [
                'action' => 'advance',
                'target_stage' => 'customer_quote',
            ],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        // Should fail with validation error
        $response->assertStatus(422);
        $response->assertJsonStructure([
            'message',
            'errors' => [
                'vendor_negotiation',
            ],
        ]);

        // Verify specific error message
        $errors = $response->json('errors.vendor_negotiation');
        $this->assertIsArray($errors);
        $this->assertStringContainsString(
            'No accepted vendor quote found',
            $errors[0]
        );
        $this->assertStringContainsString(
            'Please accept a quote',
            $errors[0]
        );

        // Verify order status unchanged
        $orderNoQuotes->refresh();
        $this->assertEquals('vendor_negotiation', $orderNoQuotes->status);

        // ============================================================
        // SCENARIO 2: Quotes exist but none accepted
        // ============================================================
        
        $orderWithOpenQuotes = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create open quote
        OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $orderWithOpenQuotes->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'open',
        ]);

        // Attempt to advance stage
        $response = $this->postJson(
            "/api/v1/tenant/orders/{$orderWithOpenQuotes->uuid}/advance-stage",
            [
                'action' => 'advance',
                'target_stage' => 'customer_quote',
            ],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        // Should fail with validation error
        $response->assertStatus(422);
        $errors = $response->json('errors.vendor_negotiation');
        $this->assertStringContainsString('No accepted vendor quote found', $errors[0]);

        // Verify order status unchanged
        $orderWithOpenQuotes->refresh();
        $this->assertEquals('vendor_negotiation', $orderWithOpenQuotes->status);

        // ============================================================
        // SCENARIO 3: Quotes exist but all rejected/expired
        // ============================================================
        
        $orderWithRejectedQuotes = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create rejected quote
        OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $orderWithRejectedQuotes->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'rejected',
        ]);

        // Create expired quote
        OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $orderWithRejectedQuotes->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 950000,
            'latest_offer' => 950000,
            'currency' => 'IDR',
            'status' => 'expired',
        ]);

        // Attempt to advance stage
        $response = $this->postJson(
            "/api/v1/tenant/orders/{$orderWithRejectedQuotes->uuid}/advance-stage",
            [
                'action' => 'advance',
                'target_stage' => 'customer_quote',
            ],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        // Should fail with validation error
        $response->assertStatus(422);
        $errors = $response->json('errors.vendor_negotiation');
        $this->assertStringContainsString('No accepted vendor quote found', $errors[0]);
    }

    /**
     * Test stage advancement validation checks order data completeness
     * 
     * @test
     * Validates: Requirement 3.2
     */
    public function it_validates_order_data_completeness_before_stage_advancement(): void
    {
        // Create order with accepted quote but missing data
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
            'vendor_quoted_price' => null, // Missing
            'quotation_amount' => null,    // Missing
        ]);

        // Create accepted quote
        OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'accepted',
            'closed_at' => now(),
        ]);

        // Attempt to advance stage
        $response = $this->postJson(
            "/api/v1/tenant/orders/{$order->uuid}/advance-stage",
            [
                'action' => 'advance',
                'target_stage' => 'customer_quote',
            ],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        // Should fail with validation error about missing data
        $response->assertStatus(422);
        $errors = $response->json('errors.vendor_negotiation');
        $this->assertIsArray($errors);
        $this->assertStringContainsString(
            'missing',
            strtolower($errors[0])
        );
    }

    /**
     * Test quote acceptance with expired quote
     * 
     * @test
     * Validates: Requirement 3.2
     */
    public function it_prevents_acceptance_of_expired_quotes(): void
    {
        // ============================================================
        // SCENARIO 1: Quote with expired status
        // ============================================================
        
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        $expiredStatusQuote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order1->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'expired',
        ]);

        // Attempt to accept expired quote
        $response = $this->postJson(
            "/api/v1/tenant/quotes/{$expiredStatusQuote->uuid}/accept",
            [],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        // Should fail with error
        $response->assertStatus(422);
        $response->assertJson([
            'message' => 'Cannot accept expired quote',
        ]);

        // Verify quote status unchanged
        $expiredStatusQuote->refresh();
        $this->assertEquals('expired', $expiredStatusQuote->status);

        // ============================================================
        // SCENARIO 2: Quote with past expiration date
        // ============================================================
        
        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        $pastExpirationQuote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order2->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'open',
            'expires_at' => Carbon::now()->subDays(7), // Expired 7 days ago
        ]);

        // Attempt to accept quote with past expiration
        $response = $this->postJson(
            "/api/v1/tenant/quotes/{$pastExpirationQuote->uuid}/accept",
            [],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        // Should fail with error
        $response->assertStatus(422);
        $response->assertJson([
            'message' => 'Quote has expired',
        ]);

        // Verify quote status unchanged
        $pastExpirationQuote->refresh();
        $this->assertEquals('open', $pastExpirationQuote->status);

        // ============================================================
        // SCENARIO 3: Quote already accepted
        // ============================================================
        
        $order3 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        $alreadyAcceptedQuote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order3->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'accepted',
            'closed_at' => Carbon::now()->subHour(),
        ]);

        // Attempt to accept already accepted quote
        $response = $this->postJson(
            "/api/v1/tenant/quotes/{$alreadyAcceptedQuote->uuid}/accept",
            [],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        // Should fail with error
        $response->assertStatus(422);
        $response->assertJson([
            'message' => 'Quote has already been accepted',
        ]);

        // Verify quote status unchanged
        $alreadyAcceptedQuote->refresh();
        $this->assertEquals('accepted', $alreadyAcceptedQuote->status);
    }

    /**
     * Test cross-tenant sync attempt prevention
     * 
     * @test
     * Validates: Requirement 8.5
     */
    public function it_prevents_cross_tenant_sync_attempts(): void
    {
        // ============================================================
        // SCENARIO 1: Quote from one tenant, order from another
        // ============================================================
        
        // Create order in primary tenant
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create vendor in other tenant
        $otherVendor = Vendor::factory()->create([
            'tenant_id' => $this->otherTenant->id,
        ]);

        // Attempt to create quote with mismatched tenant
        // Note: This should be prevented at the API level by tenant scoping
        $quoteData = [
            'order_id' => $order->uuid,
            'vendor_id' => $otherVendor->uuid,
            'initial_offer' => 1000.00,
            'currency' => 'IDR',
            'terms' => ['payment_terms' => 'Net 30'],
            'lead_time_days' => 14,
        ];

        $response = $this->postJson('/api/v1/tenant/quotes', $quoteData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        // Should fail because vendor doesn't exist in this tenant's scope
        $response->assertStatus(422);

        // ============================================================
        // SCENARIO 2: Direct database manipulation (edge case)
        // ============================================================
        
        // Create customer in other tenant
        $otherCustomer = Customer::factory()->create([
            'tenant_id' => $this->otherTenant->id,
        ]);

        // Create order in other tenant
        $otherOrder = Order::factory()->create([
            'tenant_id' => $this->otherTenant->id,
            'customer_id' => $otherCustomer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create quote in primary tenant pointing to other tenant's order
        // This simulates a data integrity issue
        $crossTenantQuote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,      // Primary tenant
            'order_id' => $otherOrder->id,          // Other tenant's order
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'open',
        ]);

        // Attempt to accept this cross-tenant quote
        $response = $this->postJson(
            "/api/v1/tenant/quotes/{$crossTenantQuote->uuid}/accept",
            [],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        // The sync should fail due to tenant mismatch
        // The exact behavior depends on implementation, but it should not succeed
        if ($response->status() === 200) {
            // If it somehow succeeds, verify no data was synced
            $otherOrder->refresh();
            $this->assertNull($otherOrder->vendor_quoted_price);
            $this->assertNull($otherOrder->quotation_amount);
        } else {
            // Should fail with error
            $response->assertStatus(422);
        }
    }

    /**
     * Test tenant isolation in quote queries
     * 
     * @test
     * Validates: Requirement 8.5
     */
    public function it_enforces_tenant_isolation_in_quote_queries(): void
    {
        // Create order in primary tenant
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create quote in primary tenant
        $quote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'open',
        ]);

        // Try to access quote from other tenant context
        $response = $this->getJson(
            "/api/v1/tenant/quotes/{$quote->uuid}",
            ['X-Tenant-ID' => $this->otherTenant->id]
        );

        // Should not find the quote (404) or return empty
        $this->assertNotEquals(200, $response->status());
    }

    /**
     * Test error handling for invalid stage transitions
     * 
     * @test
     */
    public function it_prevents_invalid_stage_transitions(): void
    {
        // Create order in vendor_negotiation stage with accepted quote
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
            'vendor_quoted_price' => 1000000,
            'quotation_amount' => 1350000,
            'vendor_id' => $this->vendor->id,
        ]);

        // Create accepted quote
        OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'accepted',
            'closed_at' => now(),
        ]);

        // Try to advance to invalid stage
        $response = $this->postJson(
            "/api/v1/tenant/orders/{$order->uuid}/advance-stage",
            [
                'action' => 'advance',
                'target_stage' => 'completed', // Invalid transition
            ],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        // Should fail with validation error
        $response->assertStatus(422);
    }

    /**
     * Test error handling for missing required fields
     * 
     * @test
     */
    public function it_validates_required_fields_in_quote_creation(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Try to create quote without required fields
        $incompleteQuoteData = [
            'order_id' => $order->uuid,
            // Missing vendor_id
            'initial_offer' => 1000.00,
            // Missing currency
        ];

        $response = $this->postJson('/api/v1/tenant/quotes', $incompleteQuoteData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        // Should fail with validation error
        $response->assertStatus(422);
        $response->assertJsonStructure([
            'message',
            'errors',
        ]);
    }

    /**
     * Test concurrent quote acceptance prevention
     * 
     * @test
     */
    public function it_prevents_concurrent_quote_acceptance(): void
    {
        // Create order
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create two quotes
        $quote1 = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'open',
        ]);

        $vendor2 = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $quote2 = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor2->id,
            'initial_offer' => 950000,
            'latest_offer' => 950000,
            'currency' => 'IDR',
            'status' => 'open',
        ]);

        // Accept first quote
        $response1 = $this->postJson(
            "/api/v1/tenant/quotes/{$quote1->uuid}/accept",
            [],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $response1->assertStatus(200);

        // Try to accept second quote (should be rejected already)
        $response2 = $this->postJson(
            "/api/v1/tenant/quotes/{$quote2->uuid}/accept",
            [],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        // Should fail because quote is now rejected
        $response2->assertStatus(422);

        // Verify second quote is rejected
        $quote2->refresh();
        $this->assertEquals('rejected', $quote2->status);
    }
}
