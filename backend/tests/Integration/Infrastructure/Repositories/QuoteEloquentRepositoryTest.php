<?php

namespace Tests\Integration\Infrastructure\Repositories;

use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use DateTimeImmutable;

class QuoteEloquentRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private QuoteRepositoryInterface $repository;
    private int $tenantId;
    private TenantEloquentModel $tenant;
    private Vendor $vendor;
    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = app(QuoteRepositoryInterface::class);

        // Create tenant using factory
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->tenantId = $this->tenant->id;

        // Create test vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenantId,
            'status' => 'active',
        ]);

        // Create test order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);
    }

    /** @test */
    public function it_finds_quotes_by_vendor_id_returns_vendor_quotes_only(): void
    {
        // Arrange
        $otherVendor = Vendor::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        // Create quotes for this vendor
        OrderVendorNegotiation::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
        ]);

        // Create quotes for other vendor
        OrderVendorNegotiation::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $otherVendor->id,
            'order_id' => $this->order->id,
        ]);

        // Act
        $result = $this->repository->findByVendorId($this->vendor->id, $this->tenantId);

        // Assert
        $this->assertCount(3, $result);
        foreach ($result as $quote) {
            $this->assertEquals($this->vendor->id, $quote->getVendorId());
        }
    }

    /** @test */
    public function it_finds_quotes_requiring_vendor_action_filters_correctly(): void
    {
        // Arrange - Create quotes with different statuses
        OrderVendorNegotiation::factory()->sent()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'responded_at' => null,
        ]);

        OrderVendorNegotiation::factory()->pendingResponse()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'responded_at' => null,
        ]);

        // These should NOT be included
        OrderVendorNegotiation::factory()->accepted()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'responded_at' => now(),
        ]);

        OrderVendorNegotiation::factory()->rejected()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'responded_at' => now(),
        ]);

        // Act
        $result = $this->repository->findRequiringVendorAction($this->vendor->id, $this->tenantId);

        // Assert - Should only find 3 quotes (2 sent + 1 pending_response)
        $this->assertCount(3, $result);
        foreach ($result as $quote) {
            $this->assertNull($quote->getRespondedAt());
            $this->assertContains($quote->getStatus()->value, ['sent', 'pending_response']);
        }
    }

    /** @test */
    public function it_gets_vendor_statistics_calculates_correctly(): void
    {
        // Arrange - Create quotes with different statuses
        OrderVendorNegotiation::factory()->sent()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
        ]);

        OrderVendorNegotiation::factory()->accepted()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
        ]);

        OrderVendorNegotiation::factory()->rejected()->count(1)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
        ]);

        OrderVendorNegotiation::factory()->countered()->count(1)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
        ]);

        OrderVendorNegotiation::factory()->expired()->count(1)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
        ]);

        // Act
        $stats = $this->repository->getVendorStatistics($this->vendor->id, $this->tenantId);

        // Assert
        $this->assertIsArray($stats);
        $this->assertEquals(8, $stats['total']);
        $this->assertEquals(2, $stats['pending']);
        $this->assertEquals(3, $stats['accepted']);
        $this->assertEquals(1, $stats['rejected']);
        $this->assertEquals(1, $stats['countered']);
        $this->assertEquals(1, $stats['expired']);
    }

    /** @test */
    public function it_calculates_vendor_metrics_response_time(): void
    {
        // Arrange - Create quotes with response times
        OrderVendorNegotiation::factory()->accepted()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'sent_at' => now()->subHours(48),
            'responded_at' => now()->subHours(24), // 24 hours response time
        ]);

        OrderVendorNegotiation::factory()->rejected()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'sent_at' => now()->subHours(72),
            'responded_at' => now()->subHours(24), // 48 hours response time
        ]);

        // Act
        $metrics = $this->repository->calculateVendorMetrics($this->vendor->id, $this->tenantId);

        // Assert
        $this->assertIsArray($metrics);
        $this->assertArrayHasKey('avg_response_time_hours', $metrics);
        $this->assertArrayHasKey('total_responses', $metrics);
        $this->assertEquals(2, $metrics['total_responses']);
        // Average should be (24 + 48) / 2 = 36 hours
        $this->assertEquals(36.0, $metrics['avg_response_time_hours']);
    }

    /** @test */
    public function it_calculates_vendor_metrics_acceptance_rate(): void
    {
        // Arrange - Create quotes with different responses
        OrderVendorNegotiation::factory()->accepted()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'sent_at' => now()->subDays(2),
            'responded_at' => now()->subDays(1),
        ]);

        OrderVendorNegotiation::factory()->rejected()->count(1)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'sent_at' => now()->subDays(2),
            'responded_at' => now()->subDays(1),
        ]);

        OrderVendorNegotiation::factory()->countered()->count(1)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'sent_at' => now()->subDays(2),
            'responded_at' => now()->subDays(1),
        ]);

        // Act
        $metrics = $this->repository->calculateVendorMetrics($this->vendor->id, $this->tenantId);

        // Assert
        $this->assertIsArray($metrics);
        $this->assertArrayHasKey('acceptance_rate', $metrics);
        $this->assertArrayHasKey('total_responses', $metrics);
        $this->assertEquals(5, $metrics['total_responses']);
        // Acceptance rate should be 3/5 * 100 = 60%
        $this->assertEquals(60.0, $metrics['acceptance_rate']);
    }

    /** @test */
    public function it_finds_quotes_expiring_soon_within_threshold(): void
    {
        // Arrange
        $now = new DateTimeImmutable();

        // Create quotes expiring in 2 days (within 3-day threshold)
        OrderVendorNegotiation::factory()->sent()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'expires_at' => $now->modify('+2 days'),
        ]);

        // Create quote expiring in 5 days (outside 3-day threshold)
        OrderVendorNegotiation::factory()->sent()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'expires_at' => $now->modify('+5 days'),
        ]);

        // Create already expired quote (should not be included)
        OrderVendorNegotiation::factory()->expired()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'expires_at' => $now->modify('-1 day'),
        ]);

        // Act
        $result = $this->repository->findExpiringSoon($this->tenantId, 3, $now);

        // Assert - Should only find 2 quotes expiring within 3 days
        $this->assertCount(2, $result);
        foreach ($result as $quote) {
            $expiresAt = $quote->getExpiresAt();
            $this->assertNotNull($expiresAt);
            $this->assertGreaterThan($now, $expiresAt);
            $this->assertLessThanOrEqual($now->modify('+3 days'), $expiresAt);
        }
    }

    /** @test */
    public function it_finds_vendor_quotes_expiring_soon_filters_by_vendor(): void
    {
        // Arrange
        $now = new DateTimeImmutable();
        $otherVendor = Vendor::factory()->create([
            'tenant_id' => $this->tenantId,
        ]);

        // Create quotes for this vendor expiring soon
        OrderVendorNegotiation::factory()->sent()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'expires_at' => $now->modify('+2 days'),
        ]);

        // Create quotes for other vendor expiring soon
        OrderVendorNegotiation::factory()->sent()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $otherVendor->id,
            'order_id' => $this->order->id,
            'expires_at' => $now->modify('+2 days'),
        ]);

        // Act
        $result = $this->repository->findVendorQuotesExpiringSoon(
            $this->vendor->id,
            $this->tenantId,
            3,
            $now
        );

        // Assert - Should only find 2 quotes for this vendor
        $this->assertCount(2, $result);
        foreach ($result as $quote) {
            $this->assertEquals($this->vendor->id, $quote->getVendorId());
        }
    }

    /** @test */
    public function it_saves_new_quote(): void
    {
        // Arrange
        $quoteEntity = \App\Domain\Quote\Entities\Quote::create(
            tenantId: $this->tenantId,
            orderId: $this->order->id,
            vendorId: $this->vendor->id,
            productId: 1,
            quantity: 10,
            specifications: ['material' => 'steel'],
            notes: 'Test quote',
            initialOffer: 100000,
            currency: 'IDR'
        );

        // Act
        $savedQuote = $this->repository->save($quoteEntity);

        // Assert
        $this->assertNotNull($savedQuote);
        $this->assertNotNull($savedQuote->getId());
        $this->assertEquals($this->tenantId, $savedQuote->getTenantId());
        $this->assertEquals($this->order->id, $savedQuote->getOrderId());
        $this->assertEquals($this->vendor->id, $savedQuote->getVendorId());
        
        // Verify in database
        $this->assertDatabaseHas('order_vendor_negotiations', [
            'tenant_id' => $this->tenantId,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 100000,
        ]);
    }

    /** @test */
    public function it_updates_existing_quote(): void
    {
        // Arrange - Create a quote first
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
            'notes' => 'Original notes',
        ]);

        // Load as domain entity
        $quoteEntity = $this->repository->findById($quote->id, $this->tenantId);
        $this->assertNotNull($quoteEntity);

        // Modify the entity
        $quoteEntity->accept(10, 'Updated notes');

        // Act
        $updatedQuote = $this->repository->save($quoteEntity);

        // Assert
        $this->assertEquals($quote->id, $updatedQuote->getId());
        $this->assertEquals('accepted', $updatedQuote->getStatus()->value);
        
        // Verify in database
        $this->assertDatabaseHas('order_vendor_negotiations', [
            'id' => $quote->id,
            'status' => 'accepted',
        ]);
    }

    /** @test */
    public function it_enforces_tenant_isolation(): void
    {
        // Arrange
        $otherTenant = TenantEloquentModel::factory()->create();
        $otherTenantId = $otherTenant->id;

        $otherVendor = Vendor::factory()->create([
            'tenant_id' => $otherTenantId,
        ]);

        $otherOrder = Order::factory()->create([
            'tenant_id' => $otherTenantId,
        ]);

        // Create quotes for this tenant
        OrderVendorNegotiation::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
        ]);

        // Create quotes for other tenant
        OrderVendorNegotiation::factory()->count(2)->create([
            'tenant_id' => $otherTenantId,
            'vendor_id' => $otherVendor->id,
            'order_id' => $otherOrder->id,
        ]);

        // Act
        $result = $this->repository->list($this->tenantId);

        // Assert - Should only find quotes from this tenant
        $this->assertEquals(3, $result['total']);
        foreach ($result['data'] as $quote) {
            $this->assertEquals($this->tenantId, $quote->getTenantId());
        }
    }

    /** @test */
    public function it_applies_complex_filters_correctly(): void
    {
        // Arrange
        OrderVendorNegotiation::factory()->sent()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'created_at' => now()->subDays(5),
        ]);

        OrderVendorNegotiation::factory()->accepted()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'created_at' => now()->subDays(3),
        ]);

        OrderVendorNegotiation::factory()->rejected()->count(1)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'created_at' => now()->subDays(1),
        ]);

        // Act - Filter by status and date range
        $result = $this->repository->list(
            $this->tenantId,
            [
                'status' => 'accepted',
                'date_from' => now()->subDays(4)->format('Y-m-d'),
                'date_to' => now()->format('Y-m-d'),
            ]
        );

        // Assert - Should only find 3 accepted quotes within date range
        $this->assertEquals(3, $result['total']);
        foreach ($result['data'] as $quote) {
            $this->assertEquals('accepted', $quote->getStatus()->value);
        }
    }

    /** @test */
    public function it_paginates_quotes_correctly(): void
    {
        // Arrange - Create 25 quotes
        OrderVendorNegotiation::factory()->count(25)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
        ]);

        // Act - Get first page
        $page1 = $this->repository->list($this->tenantId, [], 'created_at', 'desc', 1, 10);

        // Act - Get second page
        $page2 = $this->repository->list($this->tenantId, [], 'created_at', 'desc', 2, 10);

        // Assert
        $this->assertCount(10, $page1['data']);
        $this->assertCount(10, $page2['data']);
        $this->assertEquals(25, $page1['total']);
        $this->assertEquals(25, $page2['total']);
        
        // Ensure different quotes on each page
        $page1Ids = array_map(fn($q) => $q->getId(), $page1['data']);
        $page2Ids = array_map(fn($q) => $q->getId(), $page2['data']);
        $this->assertEmpty(array_intersect($page1Ids, $page2Ids));
    }

    /** @test */
    public function it_sorts_quotes_correctly(): void
    {
        // Arrange - Create quotes with different timestamps
        $oldest = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'created_at' => now()->subDays(10),
        ]);

        $middle = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'created_at' => now()->subDays(5),
        ]);

        $newest = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'created_at' => now()->subDays(1),
        ]);

        // Act - Sort by created_at descending (newest first)
        $resultDesc = $this->repository->list($this->tenantId, [], 'created_at', 'desc');

        // Act - Sort by created_at ascending (oldest first)
        $resultAsc = $this->repository->list($this->tenantId, [], 'created_at', 'asc');

        // Assert - Descending order
        $this->assertEquals($newest->id, $resultDesc['data'][0]->getId());
        $this->assertEquals($oldest->id, $resultDesc['data'][2]->getId());

        // Assert - Ascending order
        $this->assertEquals($oldest->id, $resultAsc['data'][0]->getId());
        $this->assertEquals($newest->id, $resultAsc['data'][2]->getId());
    }

    /** @test */
    public function it_calculates_statistics_aggregation_correctly(): void
    {
        // Arrange - Create quotes with different statuses
        // Note: Using 'draft' status directly since factory doesn't have draft() method
        OrderVendorNegotiation::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'draft',
        ]);

        OrderVendorNegotiation::factory()->sent()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
        ]);

        OrderVendorNegotiation::factory()->accepted()->count(5)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
        ]);

        OrderVendorNegotiation::factory()->rejected()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
        ]);

        // Act
        $stats = $this->repository->getStatistics($this->tenantId);

        // Assert
        $this->assertIsArray($stats);
        $this->assertEquals(12, $stats['total']);
        $this->assertEquals(2, $stats['by_status']['draft']);
        $this->assertEquals(3, $stats['by_status']['sent']);
        $this->assertEquals(5, $stats['by_status']['accepted']);
        $this->assertEquals(2, $stats['by_status']['rejected']);
        
        // Acceptance rate should be 5/12 * 100 = 41.67%
        $this->assertEquals(41.67, $stats['acceptance_rate']);
        
        // Rejection rate should be 2/12 * 100 = 16.67%
        $this->assertEquals(16.67, $stats['rejection_rate']);
    }

    /** @test */
    public function it_performs_well_with_large_datasets(): void
    {
        // Arrange - Create 100 quotes
        OrderVendorNegotiation::factory()->count(100)->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
        ]);

        // Act - Measure query performance
        $startTime = microtime(true);
        $result = $this->repository->list($this->tenantId, [], 'created_at', 'desc', 1, 20);
        $endTime = microtime(true);

        $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds

        // Assert
        $this->assertEquals(100, $result['total']);
        $this->assertCount(20, $result['data']);
        
        // Performance assertion - should complete in less than 500ms
        $this->assertLessThan(500, $executionTime, 
            "Query took {$executionTime}ms, expected less than 500ms");
    }
}
