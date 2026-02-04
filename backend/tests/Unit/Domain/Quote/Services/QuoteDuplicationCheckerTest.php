<?php

namespace Tests\Unit\Domain\Quote\Services;

use App\Domain\Quote\Services\QuoteDuplicationChecker;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuoteDuplicationCheckerTest extends TestCase
{
    use RefreshDatabase;

    private QuoteDuplicationChecker $checker;
    private int $tenantId;
    private Order $order;
    private Vendor $vendor1;
    private Vendor $vendor2;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->checker = new QuoteDuplicationChecker();
        
        // Create tenant first (required for foreign key constraints)
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $this->tenantId = $tenant->id;
        
        // Create test data
        $this->order = Order::factory()->create(['tenant_id' => $this->tenantId]);
        $this->vendor1 = Vendor::factory()->create(['tenant_id' => $this->tenantId]);
        $this->vendor2 = Vendor::factory()->create(['tenant_id' => $this->tenantId]);
    }

    /** @test */
    public function it_detects_duplicate_quote_for_same_order_and_vendor()
    {
        // Create an active quote
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id
        );

        $this->assertTrue($hasDuplicate);
    }

    /** @test */
    public function it_allows_quote_for_different_vendor()
    {
        // Create quote for vendor 1
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        // Check for vendor 2 (different vendor)
        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor2->id
        );

        $this->assertFalse($hasDuplicate);
    }

    /** @test */
    public function it_ignores_rejected_quotes()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'rejected',
        ]);

        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id
        );

        $this->assertFalse($hasDuplicate);
    }

    /** @test */
    public function it_ignores_expired_quotes()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'expired',
        ]);

        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id
        );

        $this->assertFalse($hasDuplicate);
    }

    /** @test */
    public function it_ignores_cancelled_quotes()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'cancelled',
        ]);

        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id
        );

        $this->assertFalse($hasDuplicate);
    }

    /** @test */
    public function it_detects_open_status_as_active()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id,
            ['open', 'countered']
        );

        $this->assertTrue($hasDuplicate);
    }

    /** @test */
    public function it_detects_countered_status_as_active()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'countered',
        ]);

        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id
        );

        $this->assertTrue($hasDuplicate);
    }

    /** @test */
    public function it_enforces_tenant_isolation()
    {
        // Create another tenant
        $otherTenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $otherTenantId = $otherTenant->id;
        
        // Create quote for tenant 1
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        // Check for tenant 2 (different tenant)
        $hasDuplicate = $this->checker->check(
            $otherTenantId,
            $this->order->id,
            $this->vendor1->id
        );

        $this->assertFalse($hasDuplicate);
    }

    /** @test */
    public function it_can_exclude_specific_quote_id()
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        // Check with exclusion (should not find duplicate)
        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id,
            ['open', 'sent', 'countered'],
            $quote->id
        );

        $this->assertFalse($hasDuplicate);
    }

    /** @test */
    public function it_gets_existing_active_quote()
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        $existing = $this->checker->getExisting(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id
        );

        $this->assertNotNull($existing);
        $this->assertEquals($quote->id, $existing->id);
    }

    /** @test */
    public function it_returns_null_when_no_active_quote_exists()
    {
        $existing = $this->checker->getExisting(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id
        );

        $this->assertNull($existing);
    }

    /** @test */
    public function it_checks_if_order_has_any_active_quotes()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        $hasActiveQuotes = $this->checker->hasActiveQuotesForOrder(
            $this->tenantId,
            $this->order->id
        );

        $this->assertTrue($hasActiveQuotes);
    }

    /** @test */
    public function it_counts_active_quotes_for_order()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor2->id,
            'status' => 'countered',
        ]);

        $count = $this->checker->countActiveQuotesForOrder(
            $this->tenantId,
            $this->order->id
        );

        $this->assertEquals(2, $count);
    }

    /** @test */
    public function it_gets_all_active_quotes_for_order()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor2->id,
            'status' => 'countered',
        ]);

        // Create rejected quote (should be ignored)
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'rejected',
        ]);

        $quotes = $this->checker->getActiveQuotesForOrder(
            $this->tenantId,
            $this->order->id
        );

        $this->assertCount(2, $quotes);
    }

    /** @test */
    public function it_validates_no_duplicate_successfully()
    {
        // Should not throw exception when no duplicate exists
        $this->checker->validateNoDuplicate(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id
        );

        $this->assertTrue(true); // If we reach here, validation passed
    }

    /** @test */
    public function it_throws_exception_when_duplicate_exists()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('An active quote already exists');

        $this->checker->validateNoDuplicate(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id
        );
    }

    /** @test */
    public function it_supports_custom_status_filters()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'countered',
        ]);

        // Check with only 'open' status (should not find duplicate)
        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id,
            ['open']
        );

        $this->assertFalse($hasDuplicate);

        // Check with 'countered' status (should find duplicate)
        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id,
            ['countered']
        );

        $this->assertTrue($hasDuplicate);
    }

    /** @test */
    public function it_ignores_accepted_quotes()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'accepted',
        ]);

        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id
        );

        $this->assertFalse($hasDuplicate);
    }

    /** @test */
    public function it_handles_empty_status_array()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        // Empty status array should not find any duplicates
        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id,
            []
        );

        $this->assertFalse($hasDuplicate);
    }

    /** @test */
    public function it_handles_multiple_quotes_with_different_statuses()
    {
        // Create multiple quotes with different statuses
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'rejected',
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'expired',
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        // Should find the open quote
        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id
        );

        $this->assertTrue($hasDuplicate);
    }

    /** @test */
    public function it_excludes_multiple_quote_ids_correctly()
    {
        $quote1 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        $quote2 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'countered',
        ]);

        // Exclude quote1, should still find quote2
        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id,
            ['open', 'countered'],
            $quote1->id
        );

        $this->assertTrue($hasDuplicate);

        // Exclude quote2, should still find quote1
        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id,
            ['open', 'countered'],
            $quote2->id
        );

        $this->assertTrue($hasDuplicate);
    }

    /** @test */
    public function it_returns_most_recent_quote_when_multiple_exist()
    {
        // Create older quote
        $olderQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
            'created_at' => now()->subDays(2),
        ]);

        // Create newer quote
        $newerQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'countered',
            'created_at' => now()->subDay(),
        ]);

        $existing = $this->checker->getExisting(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id,
            ['open', 'countered']
        );

        $this->assertNotNull($existing);
        $this->assertEquals($newerQuote->id, $existing->id);
    }

    /** @test */
    public function it_eager_loads_relationships_in_get_existing()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        $existing = $this->checker->getExisting(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id
        );

        $this->assertNotNull($existing);
        $this->assertTrue($existing->relationLoaded('order'));
        $this->assertTrue($existing->relationLoaded('vendor'));
        $this->assertTrue($existing->order->relationLoaded('customer'));
    }

    /** @test */
    public function it_counts_only_active_quotes_ignoring_closed_ones()
    {
        // Create active quotes
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor2->id,
            'status' => 'countered',
        ]);

        // Create closed quotes (should be ignored)
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'rejected',
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor2->id,
            'status' => 'accepted',
        ]);

        $count = $this->checker->countActiveQuotesForOrder(
            $this->tenantId,
            $this->order->id
        );

        $this->assertEquals(2, $count);
    }

    /** @test */
    public function it_returns_zero_count_when_no_active_quotes()
    {
        // Create only closed quotes
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'rejected',
        ]);

        $count = $this->checker->countActiveQuotesForOrder(
            $this->tenantId,
            $this->order->id
        );

        $this->assertEquals(0, $count);
    }

    /** @test */
    public function it_returns_false_when_no_active_quotes_exist_for_order()
    {
        // Create only closed quotes
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'rejected',
        ]);

        $hasActiveQuotes = $this->checker->hasActiveQuotesForOrder(
            $this->tenantId,
            $this->order->id
        );

        $this->assertFalse($hasActiveQuotes);
    }

    /** @test */
    public function it_gets_active_quotes_ordered_by_created_at_desc()
    {
        // Create quotes with different timestamps
        $quote1 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
            'created_at' => now()->subDays(3),
        ]);

        $quote2 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor2->id,
            'status' => 'countered',
            'created_at' => now()->subDay(),
        ]);

        $quotes = $this->checker->getActiveQuotesForOrder(
            $this->tenantId,
            $this->order->id
        );

        $this->assertCount(2, $quotes);
        // Most recent should be first
        $this->assertEquals($quote2->id, $quotes->first()->id);
        $this->assertEquals($quote1->id, $quotes->last()->id);
    }

    /** @test */
    public function it_eager_loads_vendor_in_get_active_quotes()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        $quotes = $this->checker->getActiveQuotesForOrder(
            $this->tenantId,
            $this->order->id
        );

        $this->assertCount(1, $quotes);
        $this->assertTrue($quotes->first()->relationLoaded('vendor'));
    }

    /** @test */
    public function it_returns_empty_collection_when_no_active_quotes_for_order()
    {
        $quotes = $this->checker->getActiveQuotesForOrder(
            $this->tenantId,
            $this->order->id
        );

        $this->assertCount(0, $quotes);
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Collection::class, $quotes);
    }

    /** @test */
    public function it_validates_no_duplicate_with_different_order()
    {
        $order2 = Order::factory()->create(['tenant_id' => $this->tenantId]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        // Should not throw exception for different order
        $this->checker->validateNoDuplicate(
            $this->tenantId,
            $order2->id,
            $this->vendor1->id
        );

        $this->assertTrue(true);
    }

    /** @test */
    public function it_handles_multiple_active_statuses_correctly()
    {
        // Create quote with 'open' status
        $quote1 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        // Should find it with default statuses
        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id
        );

        $this->assertTrue($hasDuplicate);

        // Should also find it with explicit status list
        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id,
            ['open', 'countered']
        );

        $this->assertTrue($hasDuplicate);
    }

    /** @test */
    public function it_respects_status_filter_parameter()
    {
        // Create quote with 'countered' status
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'countered',
        ]);

        // Should find it when 'countered' is in the filter
        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id,
            ['countered']
        );

        $this->assertTrue($hasDuplicate);

        // Should NOT find it when only 'open' is in the filter
        $hasDuplicate = $this->checker->check(
            $this->tenantId,
            $this->order->id,
            $this->vendor1->id,
            ['open']
        );

        $this->assertFalse($hasDuplicate);
    }

    /** @test */
    public function it_handles_all_closed_statuses_correctly()
    {
        $closedStatuses = ['accepted', 'rejected', 'cancelled', 'expired'];

        foreach ($closedStatuses as $status) {
            // Create quote with closed status
            $quote = OrderVendorNegotiation::factory()->create([
                'tenant_id' => $this->tenantId,
                'order_id' => $this->order->id,
                'vendor_id' => $this->vendor1->id,
                'status' => $status,
            ]);

            // Should NOT find duplicate with default active statuses
            $hasDuplicate = $this->checker->check(
                $this->tenantId,
                $this->order->id,
                $this->vendor1->id
            );

            $this->assertFalse($hasDuplicate, "Status '{$status}' should not be considered active");

            // Clean up for next iteration
            $quote->forceDelete();
        }
    }

    /** @test */
    public function it_maintains_tenant_isolation_in_count_active_quotes()
    {
        $otherTenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $otherOrder = Order::factory()->create(['tenant_id' => $otherTenant->id]);

        // Create quotes for both tenants
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $otherTenant->id,
            'order_id' => $otherOrder->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        // Should only count quotes for current tenant
        $count = $this->checker->countActiveQuotesForOrder(
            $this->tenantId,
            $this->order->id
        );

        $this->assertEquals(1, $count);
    }

    /** @test */
    public function it_maintains_tenant_isolation_in_get_active_quotes()
    {
        $otherTenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $otherOrder = Order::factory()->create(['tenant_id' => $otherTenant->id]);

        // Create quotes for both tenants
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $otherTenant->id,
            'order_id' => $otherOrder->id,
            'vendor_id' => $this->vendor1->id,
            'status' => 'open',
        ]);

        // Should only get quotes for current tenant
        $quotes = $this->checker->getActiveQuotesForOrder(
            $this->tenantId,
            $this->order->id
        );

        $this->assertCount(1, $quotes);
        $this->assertEquals($this->tenantId, $quotes->first()->tenant_id);
    }
}
