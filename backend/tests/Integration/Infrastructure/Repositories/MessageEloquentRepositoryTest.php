<?php

namespace Tests\Integration\Infrastructure\Repositories;

use App\Domain\Quote\Repositories\MessageRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\QuoteMessage;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MessageEloquentRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private MessageRepositoryInterface $repository;
    private int $tenantId;
    private TenantEloquentModel $tenant;
    private Vendor $vendor;
    private Order $order;
    private OrderVendorNegotiation $quote;
    private UserEloquentModel $vendorUser;
    private UserEloquentModel $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = app(MessageRepositoryInterface::class);

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

        // Create test quote
        $this->quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
        ]);

        // Create vendor user
        $this->vendorUser = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->uuid,
            'account_type' => 'vendor',
        ]);

        // Create admin user
        $this->adminUser = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenantId,
            'account_type' => 'tenant',
        ]);
    }

    /** @test */
    public function it_finds_messages_by_quote(): void
    {
        // Arrange - Create messages for this quote
        QuoteMessage::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'sender_type' => 'vendor',
        ]);

        // Create messages for another quote (should not be included)
        $otherQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
        ]);

        QuoteMessage::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'quote_id' => $otherQuote->id,
            'sender_id' => $this->adminUser->id,
            'sender_type' => 'admin',
        ]);

        // Act
        $result = $this->repository->findByQuoteId($this->quote->id, $this->tenantId);

        // Assert
        $this->assertCount(3, $result);
        foreach ($result as $message) {
            $this->assertEquals($this->quote->id, $message->getQuoteId());
            $this->assertEquals($this->tenantId, $message->getTenantId());
        }
    }

    /** @test */
    public function it_filters_messages_by_sender_type(): void
    {
        // Arrange - Create messages from vendor
        QuoteMessage::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'sender_type' => 'vendor',
        ]);

        // Create messages from admin
        QuoteMessage::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->adminUser->id,
            'sender_type' => 'admin',
        ]);

        // Act - Find vendor messages
        $result = $this->repository->findBySender(
            $this->vendorUser->id,
            'vendor',
            $this->tenantId
        );

        // Assert
        $this->assertCount(3, $result['data']);
        $this->assertEquals(3, $result['total']);
        foreach ($result['data'] as $message) {
            $this->assertEquals($this->vendorUser->id, $message->getSenderId());
        }
    }

    /** @test */
    public function it_counts_unread_messages_by_sender_type_correctly(): void
    {
        // Arrange - Create unread messages from vendor
        QuoteMessage::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'sender_type' => 'vendor',
            'is_read' => false,
            'read_at' => null,
        ]);

        // Create read messages from vendor
        QuoteMessage::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'sender_type' => 'vendor',
            'is_read' => true,
            'read_at' => now(),
        ]);

        // Create unread messages from admin
        QuoteMessage::factory()->count(4)->create([
            'tenant_id' => $this->tenantId,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->adminUser->id,
            'sender_type' => 'admin',
            'is_read' => false,
            'read_at' => null,
        ]);

        // Act - Count unread vendor messages
        $vendorUnreadCount = $this->repository->countUnreadBySenderType(
            $this->quote->id,
            'vendor',
            $this->tenantId
        );

        // Act - Count unread admin messages
        $adminUnreadCount = $this->repository->countUnreadBySenderType(
            $this->quote->id,
            'admin',
            $this->tenantId
        );

        // Assert
        $this->assertEquals(3, $vendorUnreadCount);
        $this->assertEquals(4, $adminUnreadCount);
    }

    /** @test */
    public function it_marks_message_as_read_updates_status(): void
    {
        // Arrange - Create unread message
        $messageModel = QuoteMessage::factory()->create([
            'tenant_id' => $this->tenantId,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'sender_type' => 'vendor',
            'is_read' => false,
            'read_at' => null,
        ]);

        // Load as domain entity
        $message = $this->repository->findById($messageModel->id, $this->tenantId);
        $this->assertNotNull($message);
        $this->assertNull($message->getReadAt());

        // Mark as read
        $message->markAsRead();

        // Act
        $result = $this->repository->markAsRead($message);

        // Assert
        $this->assertTrue($result);
        
        // Verify in database
        $messageModel->refresh();
        $this->assertTrue($messageModel->is_read);
        $this->assertNotNull($messageModel->read_at);
    }

    /** @test */
    public function it_gets_recent_messages_for_vendor(): void
    {
        // Arrange - Create messages at different times
        QuoteMessage::factory()->create([
            'tenant_id' => $this->tenantId,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'sender_type' => 'vendor',
            'created_at' => now()->subDays(5),
        ]);

        QuoteMessage::factory()->create([
            'tenant_id' => $this->tenantId,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->adminUser->id,
            'sender_type' => 'admin',
            'created_at' => now()->subDays(3),
        ]);

        QuoteMessage::factory()->create([
            'tenant_id' => $this->tenantId,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'sender_type' => 'vendor',
            'created_at' => now()->subDays(1),
        ]);

        // Act
        $result = $this->repository->getRecentForVendor(
            $this->vendor->id,
            $this->tenantId,
            10
        );

        // Assert
        $this->assertCount(3, $result);
        
        // Verify messages are ordered by most recent first
        $this->assertGreaterThan(
            $result[1]->getCreatedAt(),
            $result[0]->getCreatedAt()
        );
        $this->assertGreaterThan(
            $result[2]->getCreatedAt(),
            $result[1]->getCreatedAt()
        );
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

        $otherQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $otherTenantId,
            'vendor_id' => $otherVendor->id,
            'order_id' => $otherOrder->id,
        ]);

        $otherUser = UserEloquentModel::factory()->create([
            'tenant_id' => $otherTenantId,
        ]);

        // Create messages for this tenant
        QuoteMessage::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'sender_type' => 'vendor',
        ]);

        // Create messages for other tenant
        QuoteMessage::factory()->count(2)->create([
            'tenant_id' => $otherTenantId,
            'quote_id' => $otherQuote->id,
            'sender_id' => $otherUser->id,
            'sender_type' => 'admin',
        ]);

        // Act
        $result = $this->repository->findByQuoteId($this->quote->id, $this->tenantId);

        // Assert - Should only find messages from this tenant
        $this->assertCount(3, $result);
        foreach ($result as $message) {
            $this->assertEquals($this->tenantId, $message->getTenantId());
        }
    }

    /** @test */
    public function it_paginates_messages_correctly(): void
    {
        // Arrange - Create 25 messages
        QuoteMessage::factory()->count(25)->create([
            'tenant_id' => $this->tenantId,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'sender_type' => 'vendor',
        ]);

        // Act - Get first page
        $page1 = $this->repository->findBySender(
            $this->vendorUser->id,
            'vendor',
            $this->tenantId,
            1,
            10
        );

        // Act - Get second page
        $page2 = $this->repository->findBySender(
            $this->vendorUser->id,
            'vendor',
            $this->tenantId,
            2,
            10
        );

        // Assert
        $this->assertCount(10, $page1['data']);
        $this->assertCount(10, $page2['data']);
        $this->assertEquals(25, $page1['total']);
        $this->assertEquals(25, $page2['total']);
        
        // Ensure different messages on each page
        $page1Ids = array_map(fn($m) => $m->getId(), $page1['data']);
        $page2Ids = array_map(fn($m) => $m->getId(), $page2['data']);
        $this->assertEmpty(array_intersect($page1Ids, $page2Ids));
    }
}
