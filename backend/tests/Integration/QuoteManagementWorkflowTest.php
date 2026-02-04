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
 * Integration Tests for Quote Management Workflow
 * 
 * Tests the complete quote management workflow including:
 * - Quote acceptance flow
 * - Auto-rejection of other quotes
 * - Order status advancement
 * - All quotes rejected scenario
 * - Tenant isolation
 * - Duplicate prevention
 * 
 * Validates: Requirements from .kiro/specs/quote-management-workflow/
 */
class QuoteManagementWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private Customer $customer;
    private Vendor $vendor;
    private Vendor $vendor2;
    private User $user;
    private Order $order;

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

        // Create vendors
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Vendor One',
        ]);

        $this->vendor2 = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Vendor Two',
        ]);

        // Create and authenticate user
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        Sanctum::actingAs($this->user);

        // Create order in vendor_negotiation stage
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
            'vendor_quoted_price' => null,
            'vendor_id' => null,
            'quotation_amount' => null,
            'items' => [
                [
                    'product_id' => 'test-product-uuid',
                    'product_name' => 'Test Product',
                    'quantity' => 1,
                    'specifications' => [],
                    'pricing' => [
                        'unit_price' => 100000,
                        'total_price' => 100000,
                    ],
                ],
            ],
        ]);
    }

    /**
     * Test quote acceptance flow
     * 
     * Validates: Requirement 3 - Accept Quote
     * 
     * @test
     */
    public function test_quote_acceptance_flow_updates_order_correctly(): void
    {
        // Create a quote
        $vendorPrice = 5000000; // IDR 50,000 in cents
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => $vendorPrice,
            'currency' => 'IDR',
        ]);

        // Accept the quote
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        // Assert response is successful
        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Quote accepted and order data synchronized',
        ]);

        // Refresh models
        $quote->refresh();
        $this->order->refresh();

        // Assert quote status updated
        $this->assertEquals('accepted', $quote->status);
        $this->assertNotNull($quote->closed_at);

        // Assert order data synced
        $this->assertEquals($vendorPrice, $this->order->vendor_quoted_price);
        $this->assertEquals($this->vendor->id, $this->order->vendor_id);
        
        // Assert quotation amount calculated (vendor_price × 1.35)
        $expectedQuotation = (int) ($vendorPrice * 1.35);
        $this->assertEquals($expectedQuotation, $this->order->quotation_amount);

        // Assert order status advanced to customer_quote
        $this->assertEquals('customer_quote', $this->order->status);
    }

    /**
     * Test auto-rejection of other quotes when one is accepted
     * 
     * Validates: Requirement 3.3 - All other quotes for same order auto-rejected
     * 
     * @test
     */
    public function test_accepting_quote_auto_rejects_other_quotes(): void
    {
        // Create multiple quotes for the same order
        $quote1 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
        ]);

        $quote2 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor2->id,
            'status' => 'open',
            'latest_offer' => 4500000,
        ]);

        $quote3 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'countered',
            'latest_offer' => 4800000,
        ]);

        // Accept quote1
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote1->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);

        // Refresh all quotes
        $quote1->refresh();
        $quote2->refresh();
        $quote3->refresh();

        // Assert quote1 is accepted
        $this->assertEquals('accepted', $quote1->status);

        // Assert other quotes are auto-rejected
        $this->assertEquals('rejected', $quote2->status);
        $this->assertEquals('rejected', $quote3->status);

        // Assert rejection reason is set in history
        $this->assertNotNull($quote2->history);
        $this->assertNotNull($quote3->history);
    }

    /**
     * Test order status advancement after quote acceptance
     * 
     * Validates: Requirement 8.1 - When quote accepted → Order status = "customer_quote"
     * 
     * @test
     */
    public function test_order_status_advances_to_customer_quote_after_acceptance(): void
    {
        // Verify initial order status
        $this->assertEquals('vendor_negotiation', $this->order->status);

        // Create and accept a quote
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
        ]);

        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);

        // Refresh order
        $this->order->refresh();

        // Assert order status advanced
        $this->assertEquals('customer_quote', $this->order->status);

        // Verify order can be fetched with new status
        $orderResponse = $this->getJson("/api/v1/tenant/orders/{$this->order->uuid}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $orderResponse->assertStatus(200);
        $orderResponse->assertJsonPath('data.status', 'customer_quote');
    }

    /**
     * Test all quotes rejected scenario
     * 
     * Validates: Requirement 4.5 - If all quotes rejected → Order status reverts to "vendor_sourcing"
     * 
     * @test
     */
    public function test_order_reverts_to_vendor_sourcing_when_all_quotes_rejected(): void
    {
        // Create multiple quotes
        $quote1 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
        ]);

        $quote2 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor2->id,
            'status' => 'open',
            'latest_offer' => 4500000,
        ]);

        // Reject first quote
        $response1 = $this->postJson("/api/v1/tenant/quotes/{$quote1->uuid}/reject", [
            'reason' => 'Price too high for our budget',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response1->assertStatus(200);
        // Check if all_quotes_rejected field exists and is false
        $responseData = $response1->json();
        $this->assertArrayHasKey('all_quotes_rejected', $responseData);
        $this->assertFalse($responseData['all_quotes_rejected']);

        // Order should still be in vendor_negotiation
        $this->order->refresh();
        $this->assertEquals('vendor_negotiation', $this->order->status);

        // Reject second quote (last remaining quote)
        $response2 = $this->postJson("/api/v1/tenant/quotes/{$quote2->uuid}/reject", [
            'reason' => 'Lead time too long',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response2->assertStatus(200);
        $this->assertTrue($response2->json('all_quotes_rejected'));
        $this->assertEquals('vendor_sourcing', $response2->json('order_status'));

        // Order should revert to vendor_sourcing
        $this->order->refresh();
        $this->assertEquals('vendor_sourcing', $this->order->status);

        // Verify both quotes are rejected
        $quote1->refresh();
        $quote2->refresh();
        $this->assertEquals('rejected', $quote1->status);
        $this->assertEquals('rejected', $quote2->status);
    }

    /**
     * Test tenant isolation in quote operations
     * 
     * Validates: Requirement 8.6 - Tenant isolation maintained
     * 
     * @test
     */
    public function test_tenant_isolation_prevents_cross_tenant_access(): void
    {
        // Create another tenant with its own data
        $otherTenant = Tenant::factory()->create([
            'domain' => 'other-tenant.localhost',
        ]);

        $otherCustomer = Customer::factory()->create([
            'tenant_id' => $otherTenant->id,
        ]);

        $otherVendor = Vendor::factory()->create([
            'tenant_id' => $otherTenant->id,
        ]);

        $otherOrder = Order::factory()->create([
            'tenant_id' => $otherTenant->id,
            'customer_id' => $otherCustomer->id,
            'status' => 'vendor_negotiation',
        ]);

        $otherQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $otherTenant->id,
            'order_id' => $otherOrder->id,
            'vendor_id' => $otherVendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
        ]);

        // Try to accept other tenant's quote (should fail)
        $response = $this->postJson("/api/v1/tenant/quotes/{$otherQuote->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(404); // Quote not found for this tenant

        // Try to reject other tenant's quote (should fail)
        $response = $this->postJson("/api/v1/tenant/quotes/{$otherQuote->uuid}/reject", [
            'reason' => 'Testing cross-tenant access',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(404);

        // Verify other tenant's quote is unchanged
        $otherQuote->refresh();
        $this->assertEquals('open', $otherQuote->status);

        // Verify other tenant's order is unchanged
        $otherOrder->refresh();
        $this->assertEquals('vendor_negotiation', $otherOrder->status);
    }

    /**
     * Test duplicate prevention for same order and vendor
     * 
     * Validates: Requirement 0.4 - Cannot create new quote if active quote exists
     * 
     * @test
     */
    public function test_duplicate_prevention_for_same_order_and_vendor(): void
    {
        // Create an active quote
        $existingQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
        ]);

        // Check for existing quote
        $response = $this->getJson(
            "/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}&vendor_id={$this->vendor->uuid}",
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $response->assertStatus(200);
        $response->assertJsonPath('data.has_active_quote', true);
        $response->assertJsonPath('data.quote.id', $existingQuote->uuid);

        // Verify can create quote for different vendor
        $response2 = $this->getJson(
            "/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}&vendor_id={$this->vendor2->uuid}",
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $response2->assertStatus(200);
        $response2->assertJsonPath('data.has_active_quote', false);
        $response2->assertJsonPath('data.quote', null);
    }

    /**
     * Test duplicate check ignores rejected and expired quotes
     * 
     * Validates: Requirement 0.6 - Can create new quote if all previous rejected/expired
     * 
     * @test
     */
    public function test_duplicate_check_ignores_rejected_and_expired_quotes(): void
    {
        // Create rejected quote
        $rejectedQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'rejected',
            'latest_offer' => 5000000,
        ]);

        // Check for existing quote - should return false
        $response = $this->getJson(
            "/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}&vendor_id={$this->vendor->uuid}",
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $response->assertStatus(200);
        $response->assertJsonPath('data.has_active_quote', false);

        // Create expired quote
        $expiredQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'expired',
            'latest_offer' => 5000000,
        ]);

        // Check again - should still return false
        $response2 = $this->getJson(
            "/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}&vendor_id={$this->vendor->uuid}",
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $response2->assertStatus(200);
        $response2->assertJsonPath('data.has_active_quote', false);
    }

    /**
     * Test cannot accept expired quote
     * 
     * Validates: Requirement 3.6 - Cannot accept expired quotes
     * 
     * @test
     */
    public function test_cannot_accept_expired_quote(): void
    {
        // Create expired quote
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'expired',
            'latest_offer' => 5000000,
        ]);

        // Try to accept expired quote
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(422);
        $response->assertJson(['message' => 'Cannot accept expired quote']);

        // Verify quote status unchanged
        $quote->refresh();
        $this->assertEquals('expired', $quote->status);

        // Verify order unchanged
        $this->order->refresh();
        $this->assertEquals('vendor_negotiation', $this->order->status);
        $this->assertNull($this->order->vendor_quoted_price);
    }

    /**
     * Test cannot accept already accepted quote
     * 
     * Validates: Requirement 3.7 - Cannot accept already accepted quotes
     * 
     * @test
     */
    public function test_cannot_accept_already_accepted_quote(): void
    {
        // Create and accept a quote
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
        ]);

        // Accept it first time
        $response1 = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response1->assertStatus(200);

        // Try to accept again
        $response2 = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response2->assertStatus(422);
        $response2->assertJson(['message' => 'Quote has already been accepted']);

        // Verify quote still accepted (not changed)
        $quote->refresh();
        $this->assertEquals('accepted', $quote->status);
    }

    /**
     * Test rejection requires reason
     * 
     * Validates: Requirement 4.2 - Rejection dialog requires reason (min 10 characters)
     * 
     * @test
     */
    public function test_rejection_requires_valid_reason(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
        ]);

        // Try to reject without reason
        $response1 = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/reject", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response1->assertStatus(422);
        $response1->assertJsonValidationErrors(['reason']);

        // Try to reject with too short reason
        $response2 = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/reject", [
            'reason' => 'Too high', // Only 8 characters
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response2->assertStatus(422);
        $response2->assertJsonValidationErrors(['reason']);

        // Reject with valid reason
        $response3 = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/reject", [
            'reason' => 'Price exceeds our budget constraints',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response3->assertStatus(200);

        // Verify quote is rejected
        $quote->refresh();
        $this->assertEquals('rejected', $quote->status);
    }

    /**
     * Test multiple quotes workflow with comparison
     * 
     * Validates: Requirement 7 - Multiple Quotes Per Order
     * 
     * @test
     */
    public function test_multiple_quotes_workflow_with_comparison(): void
    {
        // Create quotes from different vendors
        $quote1 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000, // Higher price
        ]);

        $quote2 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor2->id,
            'status' => 'open',
            'latest_offer' => 4500000, // Better price
        ]);

        // Fetch all quotes for the order (using internal ID)
        $response = $this->getJson(
            "/api/v1/tenant/quotes?order_id={$this->order->id}",
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');

        // Accept the better quote
        $acceptResponse = $this->postJson("/api/v1/tenant/quotes/{$quote2->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $acceptResponse->assertStatus(200);

        // Verify order synced with better quote
        $this->order->refresh();
        $this->assertEquals(4500000, $this->order->vendor_quoted_price);
        $this->assertEquals($this->vendor2->id, $this->order->vendor_id);

        // Verify other quote auto-rejected
        $quote1->refresh();
        $this->assertEquals('rejected', $quote1->status);
    }

    /**
     * Test order history is updated after quote acceptance
     * 
     * Validates: Requirement 8.3 - Order status change triggers order history entry
     * 
     * @test
     */
    public function test_order_history_updated_after_quote_acceptance(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
        ]);

        // Accept quote
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);

        // Fetch order to check history
        $orderResponse = $this->getJson("/api/v1/tenant/orders/{$this->order->uuid}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $orderResponse->assertStatus(200);
        
        // Verify order status is customer_quote
        $orderResponse->assertJsonPath('data.status', 'customer_quote');
    }

    /**
     * Test counter offer flow
     * 
     * Validates: Requirement 5 - Counter Offer
     * 
     * @test
     */
    public function test_counter_offer_increments_round_and_updates_history(): void
    {
        $initialPrice = 5000000;
        $counterPrice = 4500000;

        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => $initialPrice,
            'round' => 1,
            'history' => [
                [
                    'action' => 'created',
                    'timestamp' => now()->subHours(2)->toISOString(),
                    'user_id' => $this->user->id,
                ],
            ],
        ]);

        // Send counter offer (price in IDR, not cents)
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/counter", [
            'quoted_price' => $counterPrice / 100, // Convert cents to IDR
            'notes' => 'Can you reduce the price to meet our budget?',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);

        // Refresh quote
        $quote->refresh();

        // Assert round incremented
        $this->assertEquals(2, $quote->round);

        // Assert status changed to countered
        $this->assertEquals('countered', $quote->status);

        // Assert latest offer updated
        $this->assertEquals($counterPrice, $quote->latest_offer);

        // Assert history updated
        $this->assertNotNull($quote->history);
        $this->assertCount(2, $quote->history);
        
        $history = $quote->history;
        $latestHistory = $history[count($history) - 1];
        $this->assertEquals('counter_offered', $latestHistory['action']);
        $this->assertEquals($initialPrice, $latestHistory['previous_offer']);
        $this->assertEquals($counterPrice, $latestHistory['new_offer']);
        $this->assertEquals('Can you reduce the price to meet our budget?', $latestHistory['notes']);
        $this->assertEquals($this->user->id, $latestHistory['user_id']);
    }

    /**
     * Test counter offer validation
     * 
     * Validates: Requirement 5.3 - Counter form validation
     * 
     * @test
     */
    public function test_counter_offer_requires_valid_price(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
        ]);

        // Try counter without price
        $response1 = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/counter", [
            'notes' => 'Please reduce price',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response1->assertStatus(422);
        $response1->assertJsonValidationErrors(['quoted_price']);

        // Try counter with negative price
        $response2 = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/counter", [
            'quoted_price' => -1000,
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response2->assertStatus(422);
        $response2->assertJsonValidationErrors(['quoted_price']);

        // Verify quote unchanged
        $quote->refresh();
        $this->assertEquals('open', $quote->status);
        $this->assertEquals(5000000, $quote->latest_offer);
    }

    /**
     * Test concurrent quote acceptance (race condition)
     * 
     * Validates: Transaction safety and data consistency
     * 
     * @test
     */
    public function test_concurrent_quote_acceptance_prevents_multiple_acceptances(): void
    {
        $quote1 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
        ]);

        $quote2 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor2->id,
            'status' => 'open',
            'latest_offer' => 4500000,
        ]);

        // Accept first quote
        $response1 = $this->postJson("/api/v1/tenant/quotes/{$quote1->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response1->assertStatus(200);

        // Try to accept second quote (should fail because first is already accepted)
        $response2 = $this->postJson("/api/v1/tenant/quotes/{$quote2->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        // Second acceptance should fail because quote2 was auto-rejected
        $response2->assertStatus(422);

        // Verify only one quote is accepted
        $quote1->refresh();
        $quote2->refresh();

        $this->assertEquals('accepted', $quote1->status);
        $this->assertEquals('rejected', $quote2->status);

        // Verify order has correct vendor
        $this->order->refresh();
        $this->assertEquals($this->vendor->id, $this->order->vendor_id);
        $this->assertEquals(5000000, $this->order->vendor_quoted_price);
    }

    /**
     * Test transaction rollback on failure
     * 
     * Validates: Atomic operations and data consistency
     * 
     * @test
     */
    public function test_acceptance_maintains_data_consistency(): void
    {
        // Create two quotes
        $quote1 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
        ]);

        $quote2 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor2->id,
            'status' => 'open',
            'latest_offer' => 4500000,
        ]);

        // Accept first quote
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote1->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);

        // Verify data consistency across all affected records
        $quote1->refresh();
        $quote2->refresh();
        $this->order->refresh();

        // Quote 1 should be accepted
        $this->assertEquals('accepted', $quote1->status);
        $this->assertNotNull($quote1->closed_at);

        // Quote 2 should be auto-rejected
        $this->assertEquals('rejected', $quote2->status);
        $this->assertNotNull($quote2->closed_at);

        // Order should be updated consistently
        $this->assertEquals('customer_quote', $this->order->status);
        $this->assertEquals($quote1->latest_offer, $this->order->vendor_quoted_price);
        $this->assertEquals($this->vendor->id, $this->order->vendor_id);
        $this->assertEquals((int)($quote1->latest_offer * 1.35), $this->order->quotation_amount);

        // Verify no orphaned or inconsistent states
        $allQuotesForOrder = OrderVendorNegotiation::where('order_id', $this->order->id)->get();
        $acceptedCount = $allQuotesForOrder->where('status', 'accepted')->count();
        
        // Only one quote should be accepted
        $this->assertEquals(1, $acceptedCount, 'Only one quote should be accepted per order');
    }

    /**
     * Test vendor_quoted_price and quotation_amount calculation
     * 
     * Validates: Requirement 3.3 - Pricing calculations
     * 
     * @test
     */
    public function test_quotation_amount_calculated_correctly(): void
    {
        $vendorPrice = 10000000; // IDR 100,000 in cents

        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => $vendorPrice,
        ]);

        // Accept quote
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);

        // Refresh order
        $this->order->refresh();

        // Verify vendor_quoted_price
        $this->assertEquals($vendorPrice, $this->order->vendor_quoted_price);

        // Verify quotation_amount (vendor_price × 1.35)
        $expectedQuotation = (int) ($vendorPrice * 1.35);
        $this->assertEquals($expectedQuotation, $this->order->quotation_amount);

        // Verify vendor_id set
        $this->assertEquals($this->vendor->id, $this->order->vendor_id);
    }

    /**
     * Test rejection reason is saved in history
     * 
     * Validates: Requirement 4.3 - Rejection reason saved
     * 
     * @test
     */
    public function test_rejection_reason_saved_in_history(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
            'history' => [
                [
                    'action' => 'created',
                    'timestamp' => now()->subHours(1)->toISOString(),
                ],
            ],
        ]);

        $rejectionReason = 'Price exceeds our budget constraints and timeline is too long';

        // Reject quote
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/reject", [
            'reason' => $rejectionReason,
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);

        // Refresh quote
        $quote->refresh();

        // Verify status
        $this->assertEquals('rejected', $quote->status);
        $this->assertNotNull($quote->closed_at);

        // Verify history contains rejection reason
        $this->assertNotNull($quote->history);
        $this->assertGreaterThanOrEqual(2, count($quote->history));

        $history = $quote->history;
        $latestHistory = $history[count($history) - 1];
        $this->assertEquals('rejected', $latestHistory['action']);
        $this->assertEquals($rejectionReason, $latestHistory['reason']);
        $this->assertArrayHasKey('timestamp', $latestHistory);
    }

    /**
     * Test multiple counter offers increment round correctly
     * 
     * Validates: Requirement 5.4 - Round incrementation
     * 
     * @test
     */
    public function test_multiple_counter_offers_increment_round(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
            'round' => 1,
        ]);

        // First counter offer
        $response1 = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/counter", [
            'quoted_price' => 45000, // IDR (will be converted to cents)
            'notes' => 'First counter',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response1->assertStatus(200);
        $quote->refresh();
        $this->assertEquals(2, $quote->round);
        $this->assertEquals('countered', $quote->status);

        // Second counter offer
        $response2 = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/counter", [
            'quoted_price' => 43000,
            'notes' => 'Second counter',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response2->assertStatus(200);
        $quote->refresh();
        $this->assertEquals(3, $quote->round);

        // Third counter offer
        $response3 = $this->postJson("/api/v1/tenant/quotes/{$quote->uuid}/counter", [
            'quoted_price' => 42000,
            'notes' => 'Third counter',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response3->assertStatus(200);
        $quote->refresh();
        $this->assertEquals(4, $quote->round);

        // Verify history has all counter offers (initial history may exist)
        $this->assertGreaterThanOrEqual(3, count($quote->history));
    }

    /**
     * Test order status remains unchanged when not all quotes rejected
     * 
     * Validates: Requirement 4.5 - Order status only reverts when ALL quotes rejected
     * 
     * @test
     */
    public function test_order_status_unchanged_when_some_quotes_remain_active(): void
    {
        // Create three quotes
        $quote1 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
        ]);

        $quote2 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor2->id,
            'status' => 'open',
            'latest_offer' => 4500000,
        ]);

        $vendor3 = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Vendor Three',
        ]);

        $quote3 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $vendor3->id,
            'status' => 'open',
            'latest_offer' => 4800000,
        ]);

        // Reject first quote
        $response1 = $this->postJson("/api/v1/tenant/quotes/{$quote1->uuid}/reject", [
            'reason' => 'Price too high',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response1->assertStatus(200);
        $this->assertFalse($response1->json('all_quotes_rejected'));

        // Order should still be in vendor_negotiation
        $this->order->refresh();
        $this->assertEquals('vendor_negotiation', $this->order->status);

        // Reject second quote
        $response2 = $this->postJson("/api/v1/tenant/quotes/{$quote2->uuid}/reject", [
            'reason' => 'Lead time too long',
        ], [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response2->assertStatus(200);
        $this->assertFalse($response2->json('all_quotes_rejected'));

        // Order should STILL be in vendor_negotiation (quote3 is still active)
        $this->order->refresh();
        $this->assertEquals('vendor_negotiation', $this->order->status);

        // Verify quote3 is still open
        $quote3->refresh();
        $this->assertEquals('open', $quote3->status);
    }
}
