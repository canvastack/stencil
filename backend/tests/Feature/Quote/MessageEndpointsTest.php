<?php

declare(strict_types=1);

namespace Tests\Feature\Quote;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\QuoteMessage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Spatie\Multitenancy\Models\Tenant;

/**
 * Message Endpoints Integration Test
 * 
 * Tests the message API endpoints for quote communication.
 * Validates message creation, retrieval, and read tracking.
 */
class MessageEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private User $adminUser;
    private User $vendorUser;
    private OrderVendorNegotiation $quote;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create();

        // Create roles for this tenant
        $adminRole = \App\Infrastructure\Persistence\Eloquent\RoleEloquentModel::create([
            'name' => 'Admin',
            'guard_name' => 'api',
            'tenant_id' => $this->tenant->id,
        ]);

        $vendorRole = \App\Infrastructure\Persistence\Eloquent\RoleEloquentModel::create([
            'name' => 'Vendor',
            'guard_name' => 'api',
            'tenant_id' => $this->tenant->id,
        ]);

        // Create admin user
        $this->adminUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        $this->adminUser->assignRole($adminRole);

        // Create vendor user
        $this->vendorUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        $this->vendorUser->assignRole($vendorRole);

        // Create vendor
        $vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create order
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create quote
        $this->quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'status' => 'draft',
        ]);
    }

    /** @test */
    public function it_can_send_a_message_to_quote_thread(): void
    {
        $this->actingAs($this->adminUser, 'sanctum');

        $response = $this->postJson("/api/v1/tenant/quotes/{$this->quote->uuid}/messages", [
            'message' => 'Hello, can you provide a quote for this order?',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Message sent successfully',
            ])
            ->assertJsonStructure([
                'data' => [
                    'uuid',
                    'quote_id',
                    'sender_id',
                    'sender',
                    'message',
                    'attachments',
                    'read_at',
                    'created_at',
                    'updated_at',
                ],
            ]);

        // Verify message was saved to database
        $this->assertDatabaseHas('quote_messages', [
            'tenant_id' => $this->tenant->id,
            'sender_id' => $this->adminUser->id,
            'message' => 'Hello, can you provide a quote for this order?',
        ]);
    }

    /** @test */
    public function it_can_retrieve_messages_for_a_quote(): void
    {
        // Create some messages directly without factory issues
        for ($i = 0; $i < 3; $i++) {
            QuoteMessage::create([
                'uuid' => \Illuminate\Support\Str::uuid()->toString(),
                'tenant_id' => $this->tenant->id,
                'quote_id' => $this->quote->id,
                'sender_id' => $this->adminUser->id,
                'message' => "Test message {$i}",
                'attachments' => [],
                'read_at' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->actingAs($this->adminUser, 'sanctum');

        $response = $this->getJson("/api/v1/tenant/quotes/{$this->quote->uuid}/messages");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'uuid',
                        'quote_id',
                        'sender_id',
                        'message',
                        'attachments',
                        'read_at',
                        'created_at',
                        'updated_at',
                    ],
                ],
                'meta' => [
                    'total',
                    'unread_count',
                ],
            ]);

        $this->assertEquals(3, count($response->json('data')));
    }

    /** @test */
    public function it_can_mark_a_message_as_read(): void
    {
        // Create a message directly
        $message = QuoteMessage::create([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $this->tenant->id,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'message' => 'Test message',
            'attachments' => [],
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($this->adminUser, 'sanctum');

        $response = $this->postJson("/api/v1/tenant/quotes/{$this->quote->uuid}/messages/{$message->uuid}/read");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Message marked as read',
            ]);

        // Verify message was marked as read
        $this->assertDatabaseHas('quote_messages', [
            'uuid' => $message->uuid,
        ]);

        $message->refresh();
        $this->assertNotNull($message->read_at);
    }

    /** @test */
    public function it_validates_message_content_is_required(): void
    {
        $this->actingAs($this->adminUser, 'sanctum');

        $response = $this->postJson("/api/v1/tenant/quotes/{$this->quote->uuid}/messages", [
            'message' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    /** @test */
    public function it_validates_file_size_limit(): void
    {
        Storage::fake('local');

        $this->actingAs($this->adminUser, 'sanctum');

        // Create a file larger than 10MB
        $largeFile = UploadedFile::fake()->create('large-file.pdf', 11000); // 11MB

        $response = $this->postJson("/api/v1/tenant/quotes/{$this->quote->uuid}/messages", [
            'message' => 'Here is a large file',
            'attachments' => [$largeFile],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['attachments.0']);
    }

    /** @test */
    public function it_can_send_message_with_attachments(): void
    {
        Storage::fake('local');

        $this->actingAs($this->adminUser, 'sanctum');

        $file = UploadedFile::fake()->create('document.pdf', 1000); // 1MB

        $response = $this->post("/api/v1/tenant/quotes/{$this->quote->uuid}/messages", [
            'message' => 'Please review this document',
            'attachments' => [$file],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        // Verify file was stored
        $message = QuoteMessage::where('tenant_id', $this->tenant->id)
            ->where('message', 'Please review this document')
            ->first();

        $this->assertNotNull($message);
        $this->assertCount(1, $message->attachments);
        $this->assertEquals('document.pdf', $message->attachments[0]['name']);
    }

    /** @test */
    public function it_enforces_tenant_isolation_for_messages(): void
    {
        // Create another tenant and quote
        $otherTenant = TenantEloquentModel::factory()->create();
        
        // Create admin role for other tenant
        $otherAdminRole = \App\Infrastructure\Persistence\Eloquent\RoleEloquentModel::create([
            'name' => 'Admin',
            'guard_name' => 'api',
            'tenant_id' => $otherTenant->id,
        ]);
        
        $otherUser = User::factory()->create(['tenant_id' => $otherTenant->id]);
        $otherUser->assignRole($otherAdminRole);

        $otherOrder = Order::factory()->create(['tenant_id' => $otherTenant->id]);
        $otherVendor = Vendor::factory()->create(['tenant_id' => $otherTenant->id]);
        $otherQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $otherTenant->id,
            'order_id' => $otherOrder->id,
            'vendor_id' => $otherVendor->id,
            'status' => 'draft',
        ]);

        // Try to access other tenant's quote messages
        $this->actingAs($this->adminUser, 'sanctum');

        $response = $this->getJson("/api/v1/tenant/quotes/{$otherQuote->uuid}/messages");

        $response->assertStatus(404);
    }

    /** @test */
    public function it_returns_messages_in_chronological_order(): void
    {
        // Create messages with different timestamps directly
        $message1 = QuoteMessage::create([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $this->tenant->id,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->adminUser->id,
            'message' => 'First message',
            'attachments' => [],
            'read_at' => null,
            'created_at' => now()->subHours(2),
            'updated_at' => now()->subHours(2),
        ]);

        $message2 = QuoteMessage::create([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $this->tenant->id,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'message' => 'Second message',
            'attachments' => [],
            'read_at' => null,
            'created_at' => now()->subHour(),
            'updated_at' => now()->subHour(),
        ]);

        $message3 = QuoteMessage::create([
            'uuid' => \Illuminate\Support\Str::uuid()->toString(),
            'tenant_id' => $this->tenant->id,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->adminUser->id,
            'message' => 'Third message',
            'attachments' => [],
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($this->adminUser, 'sanctum');

        $response = $this->getJson("/api/v1/tenant/quotes/{$this->quote->uuid}/messages");

        $response->assertStatus(200);

        $messages = $response->json('data');
        $this->assertEquals('First message', $messages[0]['message']);
        $this->assertEquals('Second message', $messages[1]['message']);
        $this->assertEquals('Third message', $messages[2]['message']);
    }
}

