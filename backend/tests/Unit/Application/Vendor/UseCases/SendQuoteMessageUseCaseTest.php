<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\SendQuoteMessageCommand;
use App\Application\Vendor\UseCases\SendQuoteMessageUseCase;
use Tests\Unit\Application\Quote\UseCases\StubAuditLogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Tests\TestCase;

class SendQuoteMessageUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private StubAuditLogRepository $auditLogRepository;
    private SendQuoteMessageUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->auditLogRepository = new StubAuditLogRepository();
        $this->useCase = new SendQuoteMessageUseCase($this->auditLogRepository);
    }

    /** @test */
    public function it_successfully_sends_message(): void
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
            'vendor_id' => $vendor->uuid,
            'account_type' => 'vendor',
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

        $command = new SendQuoteMessageCommand(
            quoteUuid: $quoteUuid,
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            message: 'Hello, I have a question about this quote.',
            attachments: []
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertIsArray($result);
        $this->assertArrayHasKey('uuid', $result);
        $this->assertEquals('vendor', $result['sender_type']);
        $this->assertEquals('Hello, I have a question about this quote.', $result['message']);
        $this->assertFalse($result['is_read']);
        
        // Verify database
        $this->assertDatabaseHas('quote_messages', [
            'sender_id' => $user->id,
            'sender_type' => 'vendor',
            'message' => 'Hello, I have a question about this quote.',
        ]);
        
        // Verify audit log
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals('quote_message_sent', $this->auditLogRepository->auditLogs[0]['action_type']);
    }

    /** @test */
    public function it_throws_exception_when_message_is_empty(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $command = new SendQuoteMessageCommand(
            quoteUuid: \Illuminate\Support\Str::uuid()->toString(),
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            message: '   ', // Empty/whitespace
            attachments: []
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Message cannot be empty');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_message_exceeds_max_length(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $command = new SendQuoteMessageCommand(
            quoteUuid: \Illuminate\Support\Str::uuid()->toString(),
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            message: str_repeat('a', 5001), // Exceeds 5000 chars
            attachments: []
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Message cannot exceed 5000 characters');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_too_many_attachments(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $command = new SendQuoteMessageCommand(
            quoteUuid: \Illuminate\Support\Str::uuid()->toString(),
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            message: 'Test message',
            attachments: [
                ['name' => 'file1.pdf'],
                ['name' => 'file2.pdf'],
                ['name' => 'file3.pdf'],
                ['name' => 'file4.pdf'],
                ['name' => 'file5.pdf'],
                ['name' => 'file6.pdf'], // 6 attachments, max is 5
            ]
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Maximum 5 attachments allowed per message');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_quote_not_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $command = new SendQuoteMessageCommand(
            quoteUuid: \Illuminate\Support\Str::uuid()->toString(),
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            message: 'Test message',
            attachments: []
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote not found or access denied');
        
        $this->useCase->execute($command);
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
            'vendor_id' => $vendor1->id, // Owned by vendor1
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'round' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $command = new SendQuoteMessageCommand(
            quoteUuid: $quoteUuid,
            vendorId: $vendor2->id, // Try to access with vendor2
            tenantId: $tenant->id,
            message: 'Test message',
            attachments: []
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote not found or access denied');
        
        $this->useCase->execute($command);
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

        $command = new SendQuoteMessageCommand(
            quoteUuid: $quoteUuid,
            vendorId: $vendor->id,
            tenantId: $tenant2->id, // Try to access from different tenant
            message: 'Test message',
            attachments: []
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote not found or access denied');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_stores_attachments_correctly(): void
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
            'vendor_id' => $vendor->uuid,
            'account_type' => 'vendor',
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

        $attachments = [
            [
                'name' => 'quote_details.pdf',
                'path' => '/uploads/quote_details.pdf',
                'size' => 1024000,
                'mime_type' => 'application/pdf',
            ],
            [
                'name' => 'sample_image.jpg',
                'path' => '/uploads/sample_image.jpg',
                'size' => 512000,
                'mime_type' => 'image/jpeg',
            ],
        ];

        $command = new SendQuoteMessageCommand(
            quoteUuid: $quoteUuid,
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            message: 'Please see attached files.',
            attachments: $attachments
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertCount(2, $result['attachments']);
        $this->assertEquals('quote_details.pdf', $result['attachments'][0]['name']);
        $this->assertEquals('sample_image.jpg', $result['attachments'][1]['name']);
        
        // Verify audit log includes attachment count
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals(2, $this->auditLogRepository->auditLogs[0]['metadata']['attachments_count']);
    }
}
