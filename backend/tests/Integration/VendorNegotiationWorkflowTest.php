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

/**
 * End-to-End Integration Test for Vendor Negotiation Workflow
 * 
 * This test validates the complete workflow from order creation through
 * vendor negotiation to customer quote stage advancement.
 * 
 * Workflow Steps:
 * 1. Create order in vendor_negotiation stage
 * 2. Navigate to quotes from order (verify order context)
 * 3. Create vendor quote
 * 4. Accept quote
 * 5. Verify order data sync
 * 6. Advance to customer_quote stage
 * 
 * Validates: All requirements for vendor negotiation integration
 */
class VendorNegotiationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private Customer $customer;
    private Vendor $vendor;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = Tenant::factory()->create([
            'domain' => 'test-tenant.localhost',
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
     * Test complete vendor negotiation workflow end-to-end
     * 
     * @test
     */
    public function it_completes_vendor_negotiation_workflow_successfully(): void
    {
        // ============================================================
        // STEP 1: Create order in vendor_negotiation stage
        // ============================================================
        
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
            'vendor_quoted_price' => null,
            'vendor_id' => null,
            'vendor_terms' => null,
            'quotation_amount' => null,
        ]);

        // Verify order is created correctly
        $this->assertDatabaseHas('orders', [
            'uuid' => $order->uuid,
            'status' => 'vendor_negotiation',
            'tenant_id' => $this->tenant->id,
        ]);

        // ============================================================
        // STEP 2: Verify order context (simulating navigation)
        // ============================================================
        
        // Fetch order details via API (simulating frontend navigation)
        $orderResponse = $this->getJson("/api/v1/tenant/orders/{$order->uuid}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $orderResponse->assertStatus(200);
        $orderResponse->assertJsonStructure([
            'data' => [
                'id',
                'status',
                'active_quotes',
                'accepted_quote',
            ],
        ]);

        // Verify order has no active quotes initially
        $orderData = $orderResponse->json('data');
        $this->assertEquals(0, $orderData['active_quotes']);
        $this->assertNull($orderData['accepted_quote']);

        // ============================================================
        // STEP 3: Create vendor quote
        // ============================================================
        
        $vendorPrice = 10000000; // IDR 100,000 in cents
        $vendorTerms = [
            'payment_terms' => 'Net 30',
            'delivery_time' => '14 days',
            'warranty' => '1 year',
        ];

        $quoteData = [
            'order_id' => $order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'initial_offer' => $vendorPrice / 100, // Convert to decimal for API
            'currency' => 'IDR',
            'terms' => $vendorTerms,
            'lead_time_days' => 14,
        ];

        $createQuoteResponse = $this->postJson('/api/v1/tenant/quotes', $quoteData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $createQuoteResponse->assertStatus(201);
        $createQuoteResponse->assertJsonStructure([
            'data' => [
                'id',
                'status',
                'quoted_price',
            ],
        ]);

        $quoteId = $createQuoteResponse->json('data.id');

        // Verify quote is created
        $this->assertDatabaseHas('order_vendor_negotiations', [
            'uuid' => $quoteId,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
        ]);

        // Verify order now has active quotes
        $orderResponse = $this->getJson("/api/v1/tenant/orders/{$order->uuid}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $orderData = $orderResponse->json('data');
        $this->assertEquals(1, $orderData['active_quotes']);

        // ============================================================
        // STEP 4: Accept quote
        // ============================================================
        
        $acceptQuoteResponse = $this->postJson("/api/v1/tenant/quotes/{$quoteId}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $acceptQuoteResponse->assertStatus(200);
        $acceptQuoteResponse->assertJson([
            'message' => 'Quote accepted and order data synchronized',
        ]);

        // ============================================================
        // STEP 5: Verify order data sync
        // ============================================================
        
        // Refresh order to get updated data
        $order->refresh();

        // Verify vendor_quoted_price is synced
        $this->assertEquals(
            $vendorPrice,
            $order->vendor_quoted_price,
            'Order vendor_quoted_price should be synced from quote'
        );

        // Verify vendor_id is synced
        $this->assertEquals(
            $this->vendor->id,
            $order->vendor_id,
            'Order vendor_id should be synced from quote'
        );

        // Verify vendor_terms is synced
        $this->assertEquals(
            $vendorTerms,
            $order->vendor_terms,
            'Order vendor_terms should be synced from quote'
        );

        // Verify quotation_amount is calculated (vendor_price × 1.35)
        $expectedQuotation = (int) ($vendorPrice * 1.35);
        $this->assertEquals(
            $expectedQuotation,
            $order->quotation_amount,
            'Order quotation_amount should be calculated as vendor_quoted_price × 1.35'
        );

        // Verify quote status is updated
        $quote = OrderVendorNegotiation::where('uuid', $quoteId)->first();
        $this->assertEquals('accepted', $quote->status);
        $this->assertNotNull($quote->closed_at);

        // Verify order API response includes accepted quote
        $orderResponse = $this->getJson("/api/v1/tenant/orders/{$order->uuid}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $orderData = $orderResponse->json('data');
        $this->assertEquals($quoteId, $orderData['accepted_quote']);
        $this->assertEquals(0, $orderData['active_quotes']); // No more active quotes

        // ============================================================
        // STEP 6: Advance to customer_quote stage
        // ============================================================
        
        $advanceStageResponse = $this->postJson(
            "/api/v1/tenant/orders/{$order->uuid}/advance-stage",
            [
                'action' => 'advance',
                'target_stage' => 'customer_quote',
            ],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $advanceStageResponse->assertStatus(200);
        $advanceStageResponse->assertJsonStructure([
            'data' => [
                'id',
                'status',
            ],
        ]);

        // Verify order status is advanced
        $order->refresh();
        $this->assertEquals(
            'customer_quote',
            $order->status,
            'Order status should be advanced to customer_quote'
        );

        // ============================================================
        // FINAL VERIFICATION: Complete workflow integrity
        // ============================================================
        
        // Verify all data is persisted correctly
        $this->assertDatabaseHas('orders', [
            'uuid' => $order->uuid,
            'status' => 'customer_quote',
            'vendor_id' => $this->vendor->id,
            'vendor_quoted_price' => $vendorPrice,
            'quotation_amount' => $expectedQuotation,
        ]);

        $this->assertDatabaseHas('order_vendor_negotiations', [
            'uuid' => $quoteId,
            'status' => 'accepted',
            'order_id' => $order->id,
        ]);

        // Verify tenant isolation
        $this->assertEquals($this->tenant->id, $order->tenant_id);
        $this->assertEquals($this->tenant->id, $quote->tenant_id);
    }

    /**
     * Test workflow with multiple vendors and quote comparison
     * 
     * @test
     */
    public function it_handles_multiple_vendor_quotes_in_workflow(): void
    {
        // Create order
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create additional vendors
        $vendor2 = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $vendor3 = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create quotes from multiple vendors
        $quote1Data = [
            'order_id' => $order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'initial_offer' => 1000.00, // IDR 10,000
            'currency' => 'IDR',
            'terms' => ['payment_terms' => 'Net 30'],
            'lead_time_days' => 14,
        ];

        $quote2Data = [
            'order_id' => $order->uuid,
            'vendor_id' => $vendor2->uuid,
            'initial_offer' => 950.00, // IDR 9,500 (better price)
            'currency' => 'IDR',
            'terms' => ['payment_terms' => 'Net 45'],
            'lead_time_days' => 10,
        ];

        $quote3Data = [
            'order_id' => $order->uuid,
            'vendor_id' => $vendor3->uuid,
            'initial_offer' => 1100.00, // IDR 11,000
            'currency' => 'IDR',
            'terms' => ['payment_terms' => 'Net 15'],
            'lead_time_days' => 7,
        ];

        // Create all quotes
        $response1 = $this->postJson('/api/v1/tenant/quotes', $quote1Data, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);
        $response2 = $this->postJson('/api/v1/tenant/quotes', $quote2Data, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);
        $response3 = $this->postJson('/api/v1/tenant/quotes', $quote3Data, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response1->assertStatus(201);
        $response2->assertStatus(201);
        $response3->assertStatus(201);

        $quote2Id = $response2->json('data.id');

        // Verify order has 3 active quotes
        $orderResponse = $this->getJson("/api/v1/tenant/orders/{$order->uuid}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $this->assertEquals(3, $orderResponse->json('data.active_quotes'));

        // Accept the best quote (quote2 with lowest price)
        $acceptResponse = $this->postJson("/api/v1/tenant/quotes/{$quote2Id}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $acceptResponse->assertStatus(200);

        // Verify order is synced with the accepted quote
        $order->refresh();
        $this->assertEquals(950 * 100, $order->vendor_quoted_price); // 95000 cents
        $this->assertEquals($vendor2->id, $order->vendor_id);

        // Verify other quotes are rejected
        $quote1 = OrderVendorNegotiation::where('uuid', $response1->json('data.id'))->first();
        $quote3 = OrderVendorNegotiation::where('uuid', $response3->json('data.id'))->first();

        $this->assertEquals('rejected', $quote1->status);
        $this->assertEquals('rejected', $quote3->status);

        // Verify stage advancement works
        $advanceResponse = $this->postJson(
            "/api/v1/tenant/orders/{$order->uuid}/advance-stage",
            [
                'action' => 'advance',
                'target_stage' => 'customer_quote',
            ],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $advanceResponse->assertStatus(200);
    }

    /**
     * Test workflow failure when trying to advance without accepted quote
     * 
     * @test
     */
    public function it_prevents_stage_advancement_without_accepted_quote(): void
    {
        // Create order in vendor_negotiation stage
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create quote but don't accept it
        $quoteData = [
            'order_id' => $order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'initial_offer' => 1000.00,
            'currency' => 'IDR',
            'terms' => ['payment_terms' => 'Net 30'],
            'lead_time_days' => 14,
        ];

        $createResponse = $this->postJson('/api/v1/tenant/quotes', $quoteData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $createResponse->assertStatus(201);

        // Try to advance stage without accepting quote
        $advanceResponse = $this->postJson(
            "/api/v1/tenant/orders/{$order->uuid}/advance-stage",
            [
                'action' => 'advance',
                'target_stage' => 'customer_quote',
            ],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        // Should fail with validation error
        $advanceResponse->assertStatus(422);
        $advanceResponse->assertJsonStructure([
            'message',
            'errors',
        ]);

        // Verify error message
        $errors = $advanceResponse->json('errors');
        $this->assertArrayHasKey('vendor_negotiation', $errors);
        $this->assertStringContainsString(
            'No accepted vendor quote found',
            $errors['vendor_negotiation'][0]
        );

        // Verify order status unchanged
        $order->refresh();
        $this->assertEquals('vendor_negotiation', $order->status);
    }

    /**
     * Test workflow with order context preservation
     * 
     * @test
     */
    public function it_preserves_order_context_throughout_workflow(): void
    {
        // Create order
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
            'order_number' => 'ORD-2024-001',
        ]);

        // Fetch quotes with order_id filter (simulating order context)
        $quotesResponse = $this->getJson(
            "/api/v1/tenant/quotes?order_id={$order->uuid}",
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $quotesResponse->assertStatus(200);
        $quotesResponse->assertJsonStructure([
            'data' => [],
        ]);

        // Initially no quotes
        $this->assertCount(0, $quotesResponse->json('data'));

        // Create quote in order context
        $quoteData = [
            'order_id' => $order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'initial_offer' => 1000.00,
            'currency' => 'IDR',
            'terms' => ['payment_terms' => 'Net 30'],
            'lead_time_days' => 14,
        ];

        $createResponse = $this->postJson('/api/v1/tenant/quotes', $quoteData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $createResponse->assertStatus(201);
        $quoteId = $createResponse->json('data.id');

        // Fetch quotes again with order context
        $quotesResponse = $this->getJson(
            "/api/v1/tenant/quotes?order_id={$order->uuid}",
            ['X-Tenant-ID' => $this->tenant->id]
        );

        // Should now have 1 quote
        $this->assertCount(1, $quotesResponse->json('data'));
        $this->assertEquals($quoteId, $quotesResponse->json('data.0.id'));

        // Accept quote
        $acceptResponse = $this->postJson("/api/v1/tenant/quotes/{$quoteId}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $acceptResponse->assertStatus(200);

        // Verify order context is maintained in response
        $orderResponse = $this->getJson("/api/v1/tenant/orders/{$order->uuid}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $orderData = $orderResponse->json('data');
        $this->assertEquals($order->order_number, $orderData['order_number']);
        $this->assertEquals($quoteId, $orderData['accepted_quote']);
    }
}
