<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Queries\GetQuoteMessagesQuery;
use App\Application\Vendor\UseCases\GetQuoteMessagesUseCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Tests\TestCase;

class GetQuoteMessagesUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private GetQuoteMessagesUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->useCase = new GetQuoteMessagesUseCase();
    }

    /** @test */
    public function it_successfully_retrieves_messages(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
        ]);
        
        $adminUser = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'account_type' => 'tenant',
            'name' => 'Admin User',
        ]);
        
        $vendorUser = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid,
            'account_type' => 'vendor',
            'name' => 'Vendor User',
        ]);

        $quoteUuid = \Illuminate\Support\Str::uuid()->toString();
        $quoteId = DB::table('order_vendor_negotiations')->insertGetId([
            'uuid' => $quoteUuid,
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create messages
        DB::table('quote_messages')->insert([
            [
                'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id' => $tenant->id,
                'quote_id' => $quoteId,
                'sender_id' => $adminUser->id,
                'sender_type' => 'admin',
                'message' => 'Hello, please review this quote.',
                'attachments' => json_encode([]),
                'is_read' => false,
                'created_at' => now()->subMinutes(10),
                'updated_at' => now()->subMinutes(10),
            ],
            [
                'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id' => $tenant->id,
                'quote_id' => $quoteId,
                'sender_id' => $vendorUser->id,
                'sender_type' => 'vendor',
                'message' => 'Thank you, I will review it.',
                'attachments' => json_encode([]),
                'is_read' => true,
                'created_at' => now()->subMinutes(5),
                'updated_at' => now()->subMinutes(5),
            ],
        ]);

        $query = new GetQuoteMessagesQuery(
            quoteUuid: $quoteUuid,
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act
        $result = $this->useCase->execute($query);

        // Assert
        $this->assertIsArray($result);
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('pagination', $result);
        $this->assertCount(2, $result['data']);
        
        // Verify chronological order (oldest first)
        $this->assertEquals('Hello, please review this quote.', $result['data'][0]['message']);
        $this->assertEquals('Thank you, I will review it.', $result['data'][1]['message']);
        
        // Verify sender info
        $this->assertEquals('Admin User', $result['data'][0]['sender_name']);
        $this->assertEquals('Vendor User', $result['data'][1]['sender_name']);
        
        // Verify pagination
        $this->assertEquals(2, $result['pagination']['total']);
    }

    /** @test */
    public function it_marks_admin_messages_as_read(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
        ]);
        
        $adminUser = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'account_type' => 'tenant',
        ]);

        $quoteUuid = \Illuminate\Support\Str::uuid()->toString();
        $quoteId = DB::table('order_vendor_negotiations')->insertGetId([
            'uuid' => $quoteUuid,
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create unread admin message
        DB::table('quote_messages')->insert([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $tenant->id,
            'quote_id' => $quoteId,
            'sender_id' => $adminUser->id,
            'sender_type' => 'admin',
            'message' => 'Unread admin message',
            'attachments' => json_encode([]),
            'is_read' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $query = new GetQuoteMessagesQuery(
            quoteUuid: $quoteUuid,
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act
        $this->useCase->execute($query);

        // Assert - message should be marked as read
        $this->assertDatabaseHas('quote_messages', [
            'quote_id' => $quoteId,
            'sender_type' => 'admin',
            'is_read' => true,
        ]);
        
        $message = DB::table('quote_messages')
            ->where('quote_id', $quoteId)
            ->where('sender_type', 'admin')
            ->first();
        
        $this->assertNotNull($message->read_at);
    }

    /** @test */
    public function it_supports_pagination(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
        ]);
        
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'account_type' => 'tenant',
        ]);

        $quoteUuid = \Illuminate\Support\Str::uuid()->toString();
        $quoteId = DB::table('order_vendor_negotiations')->insertGetId([
            'uuid' => $quoteUuid,
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create 15 messages
        for ($i = 0; $i < 15; $i++) {
            DB::table('quote_messages')->insert([
                'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id' => $tenant->id,
                'quote_id' => $quoteId,
                'sender_id' => $user->id,
                'sender_type' => 'admin',
                'message' => "Message $i",
                'attachments' => json_encode([]),
                'is_read' => true,
                'created_at' => now()->subMinutes(15 - $i),
                'updated_at' => now()->subMinutes(15 - $i),
            ]);
        }

        // Test page 1
        $query1 = new GetQuoteMessagesQuery(
            quoteUuid: $quoteUuid,
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            page: 1,
            perPage: 10
        );

        $result1 = $this->useCase->execute($query1);

        $this->assertCount(10, $result1['data']);
        $this->assertEquals(15, $result1['pagination']['total']);
        $this->assertEquals(1, $result1['pagination']['current_page']);
        $this->assertEquals(2, $result1['pagination']['last_page']);

        // Test page 2
        $query2 = new GetQuoteMessagesQuery(
            quoteUuid: $quoteUuid,
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            page: 2,
            perPage: 10
        );

        $result2 = $this->useCase->execute($query2);

        $this->assertCount(5, $result2['data']);
        $this->assertEquals(2, $result2['pagination']['current_page']);
    }

    /** @test */
    public function it_throws_exception_when_quote_not_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $query = new GetQuoteMessagesQuery(
            quoteUuid: \Illuminate\Support\Str::uuid()->toString(),
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote not found or access denied');
        
        $this->useCase->execute($query);
    }

    /** @test */
    public function it_enforces_vendor_ownership(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor1 = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $vendor2 = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
        ]);

        $quoteUuid = \Illuminate\Support\Str::uuid()->toString();
        DB::table('order_vendor_negotiations')->insert([
            'uuid' => $quoteUuid,
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor1->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $query = new GetQuoteMessagesQuery(
            quoteUuid: $quoteUuid,
            vendorId: $vendor2->id, // Try to access with vendor2
            tenantId: $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote not found or access denied');
        
        $this->useCase->execute($query);
    }

    /** @test */
    public function it_enforces_tenant_isolation(): void
    {
        // Arrange
        $tenant1 = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $tenant2 = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant1->id,
        ]);
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant1->id,
        ]);
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant1->id,
            'customer_id' => $customer->id,
        ]);

        $quoteUuid = \Illuminate\Support\Str::uuid()->toString();
        DB::table('order_vendor_negotiations')->insert([
            'uuid' => $quoteUuid,
            'tenant_id' => $tenant1->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $query = new GetQuoteMessagesQuery(
            quoteUuid: $quoteUuid,
            vendorId: $vendor->id,
            tenantId: $tenant2->id // Try to access from different tenant
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote not found or access denied');
        
        $this->useCase->execute($query);
    }

    /** @test */
    public function it_returns_empty_result_when_no_messages(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $customer = \App\Infrastructure\Persistence\Eloquent\Models\Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $order = \App\Infrastructure\Persistence\Eloquent\Models\Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
        ]);

        $quoteUuid = \Illuminate\Support\Str::uuid()->toString();
        DB::table('order_vendor_negotiations')->insert([
            'uuid' => $quoteUuid,
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $query = new GetQuoteMessagesQuery(
            quoteUuid: $quoteUuid,
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act
        $result = $this->useCase->execute($query);

        // Assert
        $this->assertCount(0, $result['data']);
        $this->assertEquals(0, $result['pagination']['total']);
    }
}
