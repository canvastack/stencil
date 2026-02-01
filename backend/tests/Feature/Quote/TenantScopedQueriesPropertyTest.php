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

/**
 * Property-based tests for tenant-scoped queries
 * 
 * Property 21: Tenant-Scoped Quote Queries
 * Property 22: Tenant-Scoped Order Queries
 * Validates: Requirements 8.1, 8.2
 * 
 * For any tenant, querying quotes/orders should return only data 
 * where tenant_id equals the current tenant_id.
 */
class TenantScopedQueriesPropertyTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant1;
    private Tenant $tenant2;
    private Tenant $tenant3;
    private Customer $customer1;
    private Customer $customer2;
    private Customer $customer3;
    private Vendor $vendor1;
    private Vendor $vendor2;
    private Vendor $vendor3;
    private User $user1;
    private User $user2;
    private User $user3;

    protected function setUp(): void
    {
        parent::setUp();

        // Create three separate tenants for comprehensive testing
        $this->tenant1 = Tenant::factory()->create([
            'domain' => 'tenant1.localhost',
        ]);

        $this->tenant2 = Tenant::factory()->create([
            'domain' => 'tenant2.localhost',
        ]);

        $this->tenant3 = Tenant::factory()->create([
            'domain' => 'tenant3.localhost',
        ]);

        // Create customers for each tenant
        $this->customer1 = Customer::factory()->create([
            'tenant_id' => $this->tenant1->id,
        ]);

        $this->customer2 = Customer::factory()->create([
            'tenant_id' => $this->tenant2->id,
        ]);

        $this->customer3 = Customer::factory()->create([
            'tenant_id' => $this->tenant3->id,
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

        $this->vendor3 = Vendor::factory()->create([
            'tenant_id' => $this->tenant3->id,
            'name' => 'Tenant 3 Vendor',
        ]);

        // Create users for each tenant
        $this->user1 = User::factory()->create([
            'tenant_id' => $this->tenant1->id,
        ]);

        $this->user2 = User::factory()->create([
            'tenant_id' => $this->tenant2->id,
        ]);

        $this->user3 = User::factory()->create([
            'tenant_id' => $this->tenant3->id,
        ]);
    }

    /**
     * Property 21: Tenant-Scoped Quote Queries
     * 
     * For any tenant, querying quotes should return only quotes 
     * where quote.tenant_id equals the current tenant_id.
     * 
     * Validates: Requirements 8.1
     */
    public function test_tenant_scoped_quote_queries_property(): void
    {
        // Create orders for each tenant
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant2->id,
            'customer_id' => $this->customer2->id,
        ]);

        $order3 = Order::factory()->create([
            'tenant_id' => $this->tenant3->id,
            'customer_id' => $this->customer3->id,
        ]);

        // Create multiple quotes for each tenant
        $tenant1Quotes = [];
        for ($i = 0; $i < 5; $i++) {
            $tenant1Quotes[] = OrderVendorNegotiation::create([
                'tenant_id' => $this->tenant1->id,
                'order_id' => $order1->id,
                'vendor_id' => $this->vendor1->id,
                'initial_offer' => rand(100000, 10000000),
                'latest_offer' => rand(100000, 10000000),
                'currency' => 'IDR',
                'status' => ['open', 'countered', 'accepted', 'rejected'][rand(0, 3)],
            ]);
        }

        $tenant2Quotes = [];
        for ($i = 0; $i < 7; $i++) {
            $tenant2Quotes[] = OrderVendorNegotiation::create([
                'tenant_id' => $this->tenant2->id,
                'order_id' => $order2->id,
                'vendor_id' => $this->vendor2->id,
                'initial_offer' => rand(100000, 10000000),
                'latest_offer' => rand(100000, 10000000),
                'currency' => 'IDR',
                'status' => ['open', 'countered', 'accepted', 'rejected'][rand(0, 3)],
            ]);
        }

        $tenant3Quotes = [];
        for ($i = 0; $i < 3; $i++) {
            $tenant3Quotes[] = OrderVendorNegotiation::create([
                'tenant_id' => $this->tenant3->id,
                'order_id' => $order3->id,
                'vendor_id' => $this->vendor3->id,
                'initial_offer' => rand(100000, 10000000),
                'latest_offer' => rand(100000, 10000000),
                'currency' => 'IDR',
                'status' => ['open', 'countered', 'accepted', 'rejected'][rand(0, 3)],
            ]);
        }

        // Test tenant 1 can only see their quotes
        Sanctum::actingAs($this->user1);
        
        $response = $this->getJson('/api/v1/tenant/quotes', [
            'X-Tenant-ID' => $this->tenant1->id,
        ]);

        $response->assertStatus(200);
        $responseData = $response->json('data');
        
        // Verify only tenant 1 quotes are returned
        $this->assertCount(5, $responseData, 'Tenant 1 should see exactly 5 quotes');
        
        foreach ($responseData as $quote) {
            $this->assertArrayHasKey('id', $quote, 'Quote should have UUID id');
            
            // Verify the quote belongs to tenant 1 by checking it's in our created list
            $foundInTenant1 = false;
            foreach ($tenant1Quotes as $t1Quote) {
                if ($quote['id'] === $t1Quote->uuid) {
                    $foundInTenant1 = true;
                    break;
                }
            }
            
            $this->assertTrue(
                $foundInTenant1,
                "Quote {$quote['id']} should belong to tenant 1"
            );
        }

        // Test tenant 2 can only see their quotes
        Sanctum::actingAs($this->user2);
        
        $response = $this->getJson('/api/v1/tenant/quotes', [
            'X-Tenant-ID' => $this->tenant2->id,
        ]);

        $response->assertStatus(200);
        $responseData = $response->json('data');
        
        // Verify only tenant 2 quotes are returned
        $this->assertCount(7, $responseData, 'Tenant 2 should see exactly 7 quotes');
        
        foreach ($responseData as $quote) {
            $foundInTenant2 = false;
            foreach ($tenant2Quotes as $t2Quote) {
                if ($quote['id'] === $t2Quote->uuid) {
                    $foundInTenant2 = true;
                    break;
                }
            }
            
            $this->assertTrue(
                $foundInTenant2,
                "Quote {$quote['id']} should belong to tenant 2"
            );
        }

        // Test tenant 3 can only see their quotes
        Sanctum::actingAs($this->user3);
        
        $response = $this->getJson('/api/v1/tenant/quotes', [
            'X-Tenant-ID' => $this->tenant3->id,
        ]);

        $response->assertStatus(200);
        $responseData = $response->json('data');
        
        // Verify only tenant 3 quotes are returned
        $this->assertCount(3, $responseData, 'Tenant 3 should see exactly 3 quotes');
        
        foreach ($responseData as $quote) {
            $foundInTenant3 = false;
            foreach ($tenant3Quotes as $t3Quote) {
                if ($quote['id'] === $t3Quote->uuid) {
                    $foundInTenant3 = true;
                    break;
                }
            }
            
            $this->assertTrue(
                $foundInTenant3,
                "Quote {$quote['id']} should belong to tenant 3"
            );
        }
    }

    /**
     * Property 22: Tenant-Scoped Order Queries
     * 
     * For any tenant, querying orders should return only orders 
     * where order.tenant_id equals the current tenant_id.
     * 
     * Validates: Requirements 8.2
     */
    public function test_tenant_scoped_order_queries_property(): void
    {
        // Create multiple orders for each tenant
        $tenant1Orders = [];
        for ($i = 0; $i < 4; $i++) {
            $tenant1Orders[] = Order::factory()->create([
                'tenant_id' => $this->tenant1->id,
                'customer_id' => $this->customer1->id,
            ]);
        }

        $tenant2Orders = [];
        for ($i = 0; $i < 6; $i++) {
            $tenant2Orders[] = Order::factory()->create([
                'tenant_id' => $this->tenant2->id,
                'customer_id' => $this->customer2->id,
            ]);
        }

        $tenant3Orders = [];
        for ($i = 0; $i < 2; $i++) {
            $tenant3Orders[] = Order::factory()->create([
                'tenant_id' => $this->tenant3->id,
                'customer_id' => $this->customer3->id,
            ]);
        }

        // Test tenant 1 can only see their orders
        Sanctum::actingAs($this->user1);
        
        $response = $this->getJson('/api/v1/tenant/orders', [
            'X-Tenant-ID' => $this->tenant1->id,
        ]);

        $response->assertStatus(200);
        $responseData = $response->json('data');
        
        // Verify only tenant 1 orders are returned
        $this->assertCount(4, $responseData, 'Tenant 1 should see exactly 4 orders');
        
        foreach ($responseData as $order) {
            $this->assertArrayHasKey('id', $order, 'Order should have UUID id');
            
            // Verify the order belongs to tenant 1
            $foundInTenant1 = false;
            foreach ($tenant1Orders as $t1Order) {
                if ($order['id'] === $t1Order->uuid) {
                    $foundInTenant1 = true;
                    break;
                }
            }
            
            $this->assertTrue(
                $foundInTenant1,
                "Order {$order['id']} should belong to tenant 1"
            );
        }

        // Test tenant 2 can only see their orders
        Sanctum::actingAs($this->user2);
        
        $response = $this->getJson('/api/v1/tenant/orders', [
            'X-Tenant-ID' => $this->tenant2->id,
        ]);

        $response->assertStatus(200);
        $responseData = $response->json('data');
        
        // Verify only tenant 2 orders are returned
        $this->assertCount(6, $responseData, 'Tenant 2 should see exactly 6 orders');
        
        foreach ($responseData as $order) {
            $foundInTenant2 = false;
            foreach ($tenant2Orders as $t2Order) {
                if ($order['id'] === $t2Order->uuid) {
                    $foundInTenant2 = true;
                    break;
                }
            }
            
            $this->assertTrue(
                $foundInTenant2,
                "Order {$order['id']} should belong to tenant 2"
            );
        }

        // Test tenant 3 can only see their orders
        Sanctum::actingAs($this->user3);
        
        $response = $this->getJson('/api/v1/tenant/orders', [
            'X-Tenant-ID' => $this->tenant3->id,
        ]);

        $response->assertStatus(200);
        $responseData = $response->json('data');
        
        // Verify only tenant 3 orders are returned
        $this->assertCount(2, $responseData, 'Tenant 3 should see exactly 2 orders');
        
        foreach ($responseData as $order) {
            $foundInTenant3 = false;
            foreach ($tenant3Orders as $t3Order) {
                if ($order['id'] === $t3Order->uuid) {
                    $foundInTenant3 = true;
                    break;
                }
            }
            
            $this->assertTrue(
                $foundInTenant3,
                "Order {$order['id']} should belong to tenant 3"
            );
        }
    }

    /**
     * Test that tenant cannot access another tenant's quote by UUID
     */
    public function test_tenant_cannot_access_other_tenant_quote_by_uuid(): void
    {
        // Create order and quote for tenant 1
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
        ]);

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

        // Attempt to access tenant 1's quote
        $response = $this->getJson("/api/v1/tenant/quotes/{$quote1->uuid}", [
            'X-Tenant-ID' => $this->tenant2->id,
        ]);

        // Should return 404 because the quote doesn't exist in tenant 2's scope
        $response->assertStatus(404);
    }

    /**
     * Test that tenant cannot access another tenant's order by UUID
     */
    public function test_tenant_cannot_access_other_tenant_order_by_uuid(): void
    {
        // Create order for tenant 1
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant1->id,
            'customer_id' => $this->customer1->id,
        ]);

        // Authenticate as tenant 2 user
        Sanctum::actingAs($this->user2);

        // Attempt to access tenant 1's order
        $response = $this->getJson("/api/v1/tenant/orders/{$order1->uuid}", [
            'X-Tenant-ID' => $this->tenant2->id,
        ]);

        // Should return 404 because the order doesn't exist in tenant 2's scope
        $response->assertStatus(404);
    }
}
