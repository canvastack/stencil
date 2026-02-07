<?php

declare(strict_types=1);

namespace Tests\Feature\Quote;

use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Property-Based Test for Quote Soft Delete
 * 
 * **Feature: quote-workflow-fixes, Property 14: Soft Delete Maintains Audit Trail**
 * **Validates: Requirements 4.6**
 * 
 * This property test verifies that for any quote deletion, the record remains in
 * the database with deleted_at timestamp set, and all data remains accessible for
 * audit purposes.
 * 
 * The test runs multiple iterations with different quote states to ensure soft
 * delete maintains audit trail across all scenarios.
 */
class SoftDeletePropertyTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private Customer $customer;
    private Vendor $vendor;
    private User $adminUser;
    private Order $order;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = Tenant::factory()->create([
            'domain' => 'test-soft-delete.localhost',
        ]);

        // Create admin role for the tenant
        \App\Infrastructure\Persistence\Eloquent\RoleEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Admin',
            'slug' => 'admin',
            'guard_name' => 'api',
            'description' => 'Full tenant access',
            'abilities' => []
        ]);

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Vendor',
            'email' => 'vendor@test.com',
        ]);

        // Create admin user
        $this->adminUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'admin@test.com',
        ]);

        // Assign admin role
        $this->adminUser->assignRole('admin');

        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create product
        $this->product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Product',
        ]);
    }

    /**
     * Property 14: Soft Delete Maintains Audit Trail
     * 
     * For any quote deletion, the record should remain in the database with
     * deleted_at timestamp set, and all data should remain accessible for
     * audit purposes.
     * 
     * @test
     * @group Property 14: Soft Delete Maintains Audit Trail
     */
    public function property_soft_delete_maintains_audit_trail(): void
    {
        // Test with multiple quote states
        $scenarios = [
            [
                'status' => 'draft',
                'quantity' => 100,
                'specifications' => ['material' => 'stainless_steel'],
                'notes' => 'Draft quote for testing',
            ],
            [
                'status' => 'sent',
                'quantity' => 50,
                'specifications' => ['material' => 'aluminum'],
                'notes' => 'Sent quote for testing',
            ],
            [
                'status' => 'accepted',
                'quantity' => 200,
                'specifications' => ['material' => 'brass'],
                'notes' => 'Accepted quote for testing',
            ],
        ];

        foreach ($scenarios as $index => $scenario) {
            $status = $scenario['status'];
            $quantity = $scenario['quantity'];
            $specifications = $scenario['specifications'];
            $notes = $scenario['notes'];

            // Create quote directly in database
            $quote = OrderVendorNegotiation::create([
                'tenant_id' => $this->tenant->id,
                'order_id' => $this->order->id,
                'vendor_id' => $this->vendor->id,
                'initial_offer' => 500000,
                'latest_offer' => 500000,
                'currency' => 'IDR',
                'status' => $status,
                'quote_details' => [
                    'items' => [
                        [
                            'product_id' => $this->product->id,
                            'quantity' => $quantity,
                            'specifications' => $specifications,
                            'notes' => $notes,
                        ]
                    ]
                ],
                'status_history' => [
                    [
                        'from' => null,
                        'to' => $status,
                        'changed_by' => $this->adminUser->id,
                        'changed_at' => now()->toIso8601String(),
                        'reason' => 'Initial status'
                    ]
                ],
            ]);

            // Store original data for comparison
            $originalId = $quote->id;
            $originalUuid = $quote->uuid;
            $originalTenantId = $quote->tenant_id;
            $originalOrderId = $quote->order_id;
            $originalVendorId = $quote->vendor_id;
            $originalStatus = $quote->status;
            $originalQuoteDetails = $quote->quote_details;
            $originalStatusHistory = $quote->status_history;
            $originalCreatedAt = $quote->created_at;

            // Property 1: Quote should exist before deletion
            $this->assertDatabaseHas('order_vendor_negotiations', [
                'id' => $originalId,
                'uuid' => $originalUuid,
                'deleted_at' => null,
            ]);

            // Delete the quote (soft delete)
            $quote->delete();

            // Property 2: Quote should still exist in database after soft delete
            $this->assertDatabaseHas('order_vendor_negotiations', [
                'id' => $originalId,
                'uuid' => $originalUuid,
            ]);

            // Property 3: deleted_at timestamp should be set
            $deletedQuote = OrderVendorNegotiation::withTrashed()
                ->where('id', $originalId)
                ->first();

            $this->assertNotNull(
                $deletedQuote,
                "Quote should still exist in database after soft delete"
            );

            $this->assertNotNull(
                $deletedQuote->deleted_at,
                "deleted_at timestamp should be set after soft delete"
            );

            // Property 4: deleted_at should be recent (within last minute)
            $this->assertTrue(
                $deletedQuote->deleted_at >= now()->subMinute(),
                sprintf(
                    "deleted_at should be recent, got %s",
                    $deletedQuote->deleted_at->toDateTimeString()
                )
            );

            // Property 5: All original data should be preserved
            $this->assertEquals(
                $originalId,
                $deletedQuote->id,
                "ID should be preserved after soft delete"
            );
            $this->assertEquals(
                $originalUuid,
                $deletedQuote->uuid,
                "UUID should be preserved after soft delete"
            );
            $this->assertEquals(
                $originalTenantId,
                $deletedQuote->tenant_id,
                "Tenant ID should be preserved after soft delete"
            );
            $this->assertEquals(
                $originalOrderId,
                $deletedQuote->order_id,
                "Order ID should be preserved after soft delete"
            );
            $this->assertEquals(
                $originalVendorId,
                $deletedQuote->vendor_id,
                "Vendor ID should be preserved after soft delete"
            );
            $this->assertEquals(
                $originalStatus,
                $deletedQuote->status,
                "Status should be preserved after soft delete"
            );

            // Property 6: Quote details should be preserved
            $this->assertEquals(
                $originalQuoteDetails,
                $deletedQuote->quote_details,
                "Quote details should be preserved after soft delete"
            );

            // Property 7: Status history should be preserved
            $this->assertEquals(
                $originalStatusHistory,
                $deletedQuote->status_history,
                "Status history should be preserved after soft delete"
            );

            // Property 8: Created timestamp should be preserved
            $this->assertEquals(
                $originalCreatedAt->format('Y-m-d H:i:s'),
                $deletedQuote->created_at->format('Y-m-d H:i:s'),
                "Created timestamp should be preserved after soft delete"
            );

            // Property 9: Quote should not appear in normal queries
            $normalQuery = OrderVendorNegotiation::where('id', $originalId)->first();
            $this->assertNull(
                $normalQuery,
                "Soft deleted quote should not appear in normal queries"
            );

            // Property 10: Quote should appear in withTrashed queries
            $trashedQuery = OrderVendorNegotiation::withTrashed()
                ->where('id', $originalId)
                ->first();
            $this->assertNotNull(
                $trashedQuery,
                "Soft deleted quote should appear in withTrashed queries"
            );

            // Property 11: Quote should appear in onlyTrashed queries
            $onlyTrashedQuery = OrderVendorNegotiation::onlyTrashed()
                ->where('id', $originalId)
                ->first();
            $this->assertNotNull(
                $onlyTrashedQuery,
                "Soft deleted quote should appear in onlyTrashed queries"
            );

            // Property 12: Quote can be restored
            $deletedQuote->restore();
            $restoredQuote = OrderVendorNegotiation::where('id', $originalId)->first();
            $this->assertNotNull(
                $restoredQuote,
                "Quote should be restorable after soft delete"
            );
            $this->assertNull(
                $restoredQuote->deleted_at,
                "deleted_at should be null after restore"
            );

            // Property 13: All data should remain intact after restore
            $this->assertEquals(
                $originalQuoteDetails,
                $restoredQuote->quote_details,
                "Quote details should remain intact after restore"
            );
            $this->assertEquals(
                $originalStatusHistory,
                $restoredQuote->status_history,
                "Status history should remain intact after restore"
            );

            // Cleanup for next iteration
            $restoredQuote->forceDelete();
        }
    }

    /**
     * Property: Soft deleted quotes are excluded from list queries
     * 
     * For any quote list query, soft deleted quotes should not be included
     * in the results.
     * 
     * @test
     * @group Property 14: Soft Delete Maintains Audit Trail
     */
    public function property_soft_deleted_quotes_excluded_from_list_queries(): void
    {
        // Create multiple quotes
        $quote1 = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 500000,
            'latest_offer' => 500000,
            'currency' => 'IDR',
            'status' => 'draft',
            'quote_details' => ['items' => []],
        ]);

        $quote2 = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 600000,
            'latest_offer' => 600000,
            'currency' => 'IDR',
            'status' => 'sent',
            'quote_details' => ['items' => []],
        ]);

        $quote3 = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 700000,
            'latest_offer' => 700000,
            'currency' => 'IDR',
            'status' => 'accepted',
            'quote_details' => ['items' => []],
        ]);

        // Property 1: All quotes should appear in list before deletion
        $allQuotes = OrderVendorNegotiation::where('tenant_id', $this->tenant->id)->get();
        $this->assertCount(
            3,
            $allQuotes,
            "Should have 3 quotes before deletion"
        );

        // Soft delete quote2
        $quote2->delete();

        // Property 2: Only non-deleted quotes should appear in list
        $activeQuotes = OrderVendorNegotiation::where('tenant_id', $this->tenant->id)->get();
        $this->assertCount(
            2,
            $activeQuotes,
            "Should have 2 active quotes after soft delete"
        );

        // Property 3: Deleted quote should not be in active list
        $activeIds = $activeQuotes->pluck('id')->toArray();
        $this->assertNotContains(
            $quote2->id,
            $activeIds,
            "Soft deleted quote should not be in active list"
        );

        // Property 4: Non-deleted quotes should be in active list
        $this->assertContains(
            $quote1->id,
            $activeIds,
            "Non-deleted quote 1 should be in active list"
        );
        $this->assertContains(
            $quote3->id,
            $activeIds,
            "Non-deleted quote 3 should be in active list"
        );

        // Property 5: All quotes including deleted should appear with withTrashed
        $allQuotesWithTrashed = OrderVendorNegotiation::withTrashed()
            ->where('tenant_id', $this->tenant->id)
            ->get();
        $this->assertCount(
            3,
            $allQuotesWithTrashed,
            "Should have 3 quotes with withTrashed"
        );

        // Property 6: Only deleted quotes should appear with onlyTrashed
        $onlyTrashedQuotes = OrderVendorNegotiation::onlyTrashed()
            ->where('tenant_id', $this->tenant->id)
            ->get();
        $this->assertCount(
            1,
            $onlyTrashedQuotes,
            "Should have 1 trashed quote with onlyTrashed"
        );
        $this->assertEquals(
            $quote2->id,
            $onlyTrashedQuotes->first()->id,
            "onlyTrashed should return the deleted quote"
        );

        // Cleanup
        $quote1->forceDelete();
        $quote2->forceDelete();
        $quote3->forceDelete();
    }

    /**
     * Property: Soft deleted quotes maintain tenant isolation
     * 
     * For any soft deleted quote, tenant isolation should be maintained
     * even in trashed queries.
     * 
     * @test
     * @group Property 14: Soft Delete Maintains Audit Trail
     */
    public function property_soft_deleted_quotes_maintain_tenant_isolation(): void
    {
        // Create another tenant
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
        ]);

        // Create quotes for both tenants
        $tenant1Quote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 500000,
            'latest_offer' => 500000,
            'currency' => 'IDR',
            'status' => 'draft',
            'quote_details' => ['items' => []],
        ]);

        $tenant2Quote = OrderVendorNegotiation::create([
            'tenant_id' => $otherTenant->id,
            'order_id' => $otherOrder->id,
            'vendor_id' => $otherVendor->id,
            'initial_offer' => 600000,
            'latest_offer' => 600000,
            'currency' => 'IDR',
            'status' => 'draft',
            'quote_details' => ['items' => []],
        ]);

        // Soft delete both quotes
        $tenant1Quote->delete();
        $tenant2Quote->delete();

        // Property 1: Tenant 1 should only see their trashed quote
        $tenant1Trashed = OrderVendorNegotiation::onlyTrashed()
            ->where('tenant_id', $this->tenant->id)
            ->get();
        $this->assertCount(
            1,
            $tenant1Trashed,
            "Tenant 1 should only see their own trashed quote"
        );
        $this->assertEquals(
            $tenant1Quote->id,
            $tenant1Trashed->first()->id,
            "Tenant 1 should see their own quote"
        );

        // Property 2: Tenant 2 should only see their trashed quote
        $tenant2Trashed = OrderVendorNegotiation::onlyTrashed()
            ->where('tenant_id', $otherTenant->id)
            ->get();
        $this->assertCount(
            1,
            $tenant2Trashed,
            "Tenant 2 should only see their own trashed quote"
        );
        $this->assertEquals(
            $tenant2Quote->id,
            $tenant2Trashed->first()->id,
            "Tenant 2 should see their own quote"
        );

        // Property 3: Cross-tenant access should not be possible
        $crossTenantQuery = OrderVendorNegotiation::onlyTrashed()
            ->where('tenant_id', $this->tenant->id)
            ->where('id', $tenant2Quote->id)
            ->first();
        $this->assertNull(
            $crossTenantQuery,
            "Should not be able to access other tenant's trashed quote"
        );

        // Cleanup
        $tenant1Quote->forceDelete();
        $tenant2Quote->forceDelete();
        $otherOrder->forceDelete();
        $otherVendor->forceDelete();
        $otherCustomer->forceDelete();
        $otherTenant->forceDelete();
    }
}
