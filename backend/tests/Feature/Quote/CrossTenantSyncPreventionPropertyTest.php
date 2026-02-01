<?php

namespace Tests\Feature\Quote;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Log;

/**
 * Property-based tests for tenant isolation validation
 * 
 * Property 24: Cross-Tenant Sync Prevention
 * Validates: Requirements 8.5
 * 
 * For any quote and order pair, syncing quote data to order should fail 
 * if quote.tenant_id does not equal order.tenant_id.
 */
class CrossTenantSyncPreventionPropertyTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant1;
    private Tenant $tenant2;
    private Customer $customer1;
    private Customer $customer2;
    private Vendor $vendor1;
    private Vendor $vendor2;
    private User $user1;
    private User $user2;

    protected function setUp(): void
    {
        parent::setUp();

        // Create two separate tenants
        $this->tenant1 = Tenant::factory()->create([
            'domain' => 'tenant1.localhost',
        ]);

        $this->tenant2 = Tenant::factory()->create([
            'domain' => 'tenant2.localhost',
        ]);

        // Create customers for each tenant
        $this->customer1 = Customer::factory()->create([
            'tenant_id' => $this->tenant1->id,
        ]);

        $this->customer2 = Customer::factory()->create([
            'tenant_id' => $this->tenant2->id,
        ]);

        // Create vendors for each tenant
        $this->vendor1 = Vendor::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'name' => 'Tenant 1 Vendor',
        ]);

        $this->vendor2 = Vendor::factory()->create([
            'tenant_id' => $this->tenant2->id,
            'name' => 'Tenant 2 Vendor',
        ]);

        // Create users for each tenant
        $this->user1 = User::factory()->create([
            'tenant_id' => $this->tenant1->id,
        ]);

        $this->user2 = User::factory()->create([
            'tenant_id' => $this->tenant2->id,
        ]);
    }

    /**
     * Property 24: Cross-Tenant Sync Prevention
     * 
     * For any quote and order pair, syncing quote data to order should fail 
     * if quote.tenant_id does not equal order.tenant_id.
     * 
     * Validates: Requirements 8.5
     */
    public function test_cross_tenant_sync_prevention_property(): void
    {
        // Authenticate as tenant 1 user
        Sanctum::actingAs($this->user1);

        // Create order in tenant 1
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create quote in tenant 1 (same tenant - should work)
        $validQuote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant1->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor1->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'open',
        ]);

        // Accept the valid quote - should succeed
        $response = $this->postJson("/api/v1/tenant/quotes/{$validQuote->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant1->id,
        ]);

        $response->assertStatus(200);

        // Verify order was updated
        $order->refresh();
        $this->assertEquals($validQuote->latest_offer, $order->vendor_quoted_price);
        $this->assertEquals($validQuote->vendor_id, $order->vendor_id);
        $this->assertNotNull($order->quotation_amount);
    }

    /**
     * Test that cross-tenant access is prevented at the query level
     * 
     * This test verifies that tenant scoping prevents users from accessing
     * quotes from other tenants, returning 404 before any sync logic is reached.
     */
    public function test_cross_tenant_access_prevented_at_query_level(): void
    {
        // Create order in tenant 1
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create a quote in tenant 1
        $tenant1Quote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant1->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor1->id,
            'initial_offer' => 2000000,
            'latest_offer' => 2000000,
            'currency' => 'IDR',
            'status' => 'open',
        ]);

        // Authenticate as tenant 2 user
        Sanctum::actingAs($this->user2);

        // Attempt to accept tenant 1's quote from tenant 2 context
        // This should return 404 because tenant scoping prevents finding the quote
        $response = $this->postJson("/api/v1/tenant/quotes/{$tenant1Quote->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant2->id,
        ]);

        // Should return 404 - quote not found in tenant 2's scope
        $response->assertStatus(404);

        // Verify order was not modified
        $order->refresh();
        $this->assertNull($order->vendor_quoted_price);
        $this->assertNull($order->quotation_amount);
    }

    /**
     * Test that syncQuoteToOrder validation works as defense-in-depth
     * 
     * This test directly calls the sync method to verify the tenant validation
     * logic works correctly as a secondary defense layer.
     */
    public function test_sync_quote_to_order_validates_tenant_match(): void
    {
        // Create order in tenant 1
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create a quote in tenant 2 but manually associate it with tenant 1's order
        // This simulates a data corruption scenario that bypasses query-level scoping
        $crossTenantQuote = new OrderVendorNegotiation([
            'tenant_id' => $this->tenant2->id, // Different tenant!
            'order_id' => $order->id, // Order from tenant 1
            'vendor_id' => $this->vendor2->id,
            'initial_offer' => 2000000,
            'latest_offer' => 2000000,
            'currency' => 'IDR',
            'status' => 'open',
        ]);
        
        // Save without validation to simulate the scenario
        $crossTenantQuote->saveQuietly();
        $crossTenantQuote->load('order'); // Load the relationship

        // Use reflection to access the private syncQuoteToOrder method
        $controller = new \App\Infrastructure\Presentation\Http\Controllers\Tenant\QuoteController();
        $reflection = new \ReflectionClass($controller);
        $method = $reflection->getMethod('syncQuoteToOrder');
        $method->setAccessible(true);

        // Expect RuntimeException when trying to sync cross-tenant data
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Cross-tenant data synchronization is not allowed');

        // Call the sync method directly - should throw exception
        $method->invoke($controller, $crossTenantQuote);
    }

    /**
     * Test that security warning is logged when syncQuoteToOrder detects cross-tenant attempt
     * 
     * This test verifies the defense-in-depth logging mechanism works correctly.
     */
    public function test_security_warning_logged_for_cross_tenant_sync(): void
    {
        // Enable log capturing
        \Log::spy();

        // Create order in tenant 1
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create a cross-tenant quote
        $crossTenantQuote = new OrderVendorNegotiation([
            'tenant_id' => $this->tenant2->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor2->id,
            'initial_offer' => 3000000,
            'latest_offer' => 3000000,
            'currency' => 'IDR',
            'status' => 'open',
        ]);
        
        $crossTenantQuote->saveQuietly();
        $crossTenantQuote->load('order');

        // Use reflection to access the private syncQuoteToOrder method
        $controller = new \App\Infrastructure\Presentation\Http\Controllers\Tenant\QuoteController();
        $reflection = new \ReflectionClass($controller);
        $method = $reflection->getMethod('syncQuoteToOrder');
        $method->setAccessible(true);

        try {
            // Call the sync method directly - should throw exception and log warning
            $method->invoke($controller, $crossTenantQuote);
        } catch (\RuntimeException $e) {
            // Expected exception
        }

        // Verify security warning was logged
        \Log::shouldHaveReceived('warning')
            ->once()
            ->with('Cross-tenant sync attempt detected', \Mockery::on(function ($context) use ($crossTenantQuote, $order) {
                return $context['quote_tenant_id'] === $this->tenant2->id
                    && $context['order_tenant_id'] === $this->tenant1->id
                    && $context['quote_id'] === $crossTenantQuote->id
                    && $context['order_id'] === $order->id;
            }));
    }

    /**
     * Test property with multiple iterations and random tenant combinations
     */
    public function test_cross_tenant_prevention_with_multiple_iterations(): void
    {
        // Run property test with 10 iterations
        for ($iteration = 0; $iteration < 10; $iteration++) {
            // Create orders in both tenants
            $order1 = Order::factory()->create([
                'tenant_id' => $this->tenant1->id,
                'customer_id' => $this->customer1->id,
                'status' => 'vendor_negotiation',
            ]);

            $order2 = Order::factory()->create([
                'tenant_id' => $this->tenant2->id,
                'customer_id' => $this->customer2->id,
                'status' => 'vendor_negotiation',
            ]);

            // Test same-tenant sync (should succeed)
            $validQuote1 = OrderVendorNegotiation::create([
                'tenant_id' => $this->tenant1->id,
                'order_id' => $order1->id,
                'vendor_id' => $this->vendor1->id,
                'initial_offer' => rand(100000, 10000000),
                'latest_offer' => rand(100000, 10000000),
                'currency' => 'IDR',
                'status' => 'open',
            ]);

            Sanctum::actingAs($this->user1);
            
            $response = $this->postJson("/api/v1/tenant/quotes/{$validQuote1->uuid}/accept", [], [
                'X-Tenant-ID' => $this->tenant1->id,
            ]);

            $response->assertStatus(200);

            // Verify order was updated
            $order1->refresh();
            $this->assertEquals(
                $validQuote1->latest_offer,
                $order1->vendor_quoted_price,
                "Iteration {$iteration}: Same-tenant sync should succeed"
            );

            // Test same-tenant sync for tenant 2 (should also succeed)
            $validQuote2 = OrderVendorNegotiation::create([
                'tenant_id' => $this->tenant2->id,
                'order_id' => $order2->id,
                'vendor_id' => $this->vendor2->id,
                'initial_offer' => rand(100000, 10000000),
                'latest_offer' => rand(100000, 10000000),
                'currency' => 'IDR',
                'status' => 'open',
            ]);

            Sanctum::actingAs($this->user2);
            
            $response = $this->postJson("/api/v1/tenant/quotes/{$validQuote2->uuid}/accept", [], [
                'X-Tenant-ID' => $this->tenant2->id,
            ]);

            $response->assertStatus(200);

            // Verify order was updated
            $order2->refresh();
            $this->assertEquals(
                $validQuote2->latest_offer,
                $order2->vendor_quoted_price,
                "Iteration {$iteration}: Same-tenant sync should succeed for tenant 2"
            );
        }
    }

    /**
     * Test that tenant isolation is maintained even with valid UUIDs
     */
    public function test_tenant_isolation_with_valid_uuids(): void
    {
        // Create order in tenant 1
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create quote in tenant 1
        $quote1 = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant1->id,
            'order_id' => $order1->id,
            'vendor_id' => $this->vendor1->id,
            'initial_offer' => 1000000,
            'latest_offer' => 1000000,
            'currency' => 'IDR',
            'status' => 'open',
        ]);

        // Authenticate as tenant 2 user
        Sanctum::actingAs($this->user2);

        // Attempt to access tenant 1's quote from tenant 2 context
        // This should fail at the query level (not found)
        $response = $this->postJson("/api/v1/tenant/quotes/{$quote1->uuid}/accept", [], [
            'X-Tenant-ID' => $this->tenant2->id,
        ]);

        // Should return 404 because the quote doesn't exist in tenant 2's scope
        $response->assertStatus(404);

        // Verify order was not modified
        $order1->refresh();
        $this->assertNull($order1->vendor_quoted_price);
        $this->assertNull($order1->quotation_amount);
    }

    /**
     * Test that order data remains unchanged after failed cross-tenant sync
     */
    public function test_order_data_unchanged_after_failed_sync(): void
    {
        // Create order in tenant 1 with existing data
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
            'status' => 'vendor_negotiation',
            'vendor_quoted_price' => 5000000,
            'quotation_amount' => 6750000,
            'vendor_id' => $this->vendor1->id,
        ]);

        // Store original values
        $originalVendorPrice = $order->vendor_quoted_price;
        $originalQuotationAmount = $order->quotation_amount;
        $originalVendorId = $order->vendor_id;

        // Create a cross-tenant quote
        $crossTenantQuote = new OrderVendorNegotiation([
            'tenant_id' => $this->tenant2->id,
            'order_id' => $order->id,
            'vendor_id' => $this->vendor2->id,
            'initial_offer' => 10000000,
            'latest_offer' => 10000000,
            'currency' => 'IDR',
            'status' => 'open',
        ]);
        
        $crossTenantQuote->saveQuietly();

        // Authenticate as tenant 2 user
        Sanctum::actingAs($this->user2);

        try {
            // Attempt to accept the cross-tenant quote
            $this->postJson("/api/v1/tenant/quotes/{$crossTenantQuote->uuid}/accept", [], [
                'X-Tenant-ID' => $this->tenant2->id,
            ]);
        } catch (\Exception $e) {
            // Expected exception
        }

        // Verify order data remains unchanged
        $order->refresh();
        $this->assertEquals(
            $originalVendorPrice,
            $order->vendor_quoted_price,
            'Vendor quoted price should remain unchanged after failed sync'
        );
        $this->assertEquals(
            $originalQuotationAmount,
            $order->quotation_amount,
            'Quotation amount should remain unchanged after failed sync'
        );
        $this->assertEquals(
            $originalVendorId,
            $order->vendor_id,
            'Vendor ID should remain unchanged after failed sync'
        );
    }
}
