<?php

namespace Tests\Feature\Api\Vendor;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\QuoteMessage;
use Laravel\Sanctum\Sanctum;
use Tests\Middleware\TestTenantContextMiddleware;

/**
 * VendorMessageControllerTest
 * 
 * Feature tests for vendor quote message endpoints.
 * 
 * Tests:
 * 1. GET /api/v1/vendor/quotes/:uuid/messages - list messages
 * 2. POST /api/v1/vendor/quotes/:uuid/messages - send message
 * 3. POST /api/v1/vendor/quotes/:uuid/messages - with attachment
 * 4. POST /api/v1/vendor/quotes/:uuid/messages - validation errors
 * 5. POST /api/v1/vendor/quotes/:uuid/messages - file size limit
 * 6. POST /api/v1/vendor/quotes/:uuid/messages - file type validation
 * 7. PUT /api/v1/vendor/quotes/:uuid/messages/mark-read - mark as read
 * 8. Test authentication required
 * 9. Test tenant isolation works
 * 10. Test response format matches OpenAPI spec
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.7, 13.8, 13.10, 15.9
 */
class VendorMessageControllerTest extends TestCase
{
    use RefreshDatabase;

    protected TenantEloquentModel $tenant;
    protected Vendor $vendor;
    protected UserEloquentModel $vendorUser;
    protected OrderVendorNegotiation $quote;
    protected string $testPassword = 'Test@VendorP4ss2026!';

    protected function setUp(): void
    {
        parent::setUp();
        
        // Fake storage for file upload tests
        Storage::fake('local');
        
        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
            'domain' => 'test-tenant.local',
            'status' => 'active',
        ]);
        
        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'company_name' => 'Test Vendor Company',
            'email' => 'vendor@test.com',
            'phone' => '+1234567890',
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
            'onboarding_completed_at' => now(),
        ]);
        
        // Create vendor user
        $this->vendorUser = UserEloquentModel::create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->uuid,
            'name' => 'Vendor User',
            'email' => 'vendor@test.com',
            'password' => Hash::make($this->testPassword),
            'account_type' => 'vendor',
            'status' => 'active',
            'failed_login_attempts' => 0,
        ]);
        
        // Create a quote for testing
        $this->quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'sent',
        ]);
        
        // Register tenant context for test middleware
        $this->app->instance('test.tenant.context', [
            'tenant_id' => $this->tenant->id,
            'tenant' => $this->tenant,
        ]);
        
        // Replace TenantContextMiddleware with test version
        $this->app[\Illuminate\Contracts\Http\Kernel::class]
            ->prependMiddleware(TestTenantContextMiddleware::class);
    }
    
    /**
     * Helper to make authenticated vendor requests
     */
    protected function actingAsVendor()
    {
        Sanctum::actingAs($this->vendorUser, ['vendor:access']);
        return $this;
    }

    /** @test */
    public function vendor_can_list_quote_messages(): void
    {
        // Create some messages for the quote
        QuoteMessage::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'sender_type' => 'vendor',
            'message' => 'Test message from vendor',
        ]);

        QuoteMessage::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'sender_type' => 'admin',
            'message' => 'Test message from admin',
            'is_read' => false,
        ]);

        $response = $this->actingAsVendor()
            ->getJson("/api/v1/vendor/quotes/{$this->quote->uuid}/messages");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'uuid',
                        'message',
                        'sender_type',
                        'is_read',
                        'created_at',
                    ],
                ],
                'pagination' => [
                    'current_page',
                    'per_page',
                    'total',
                ],
            ])
            ->assertJson([
                'message' => 'Messages retrieved successfully',
            ]);

        // Verify we got all 5 messages
        $this->assertCount(5, $response->json('data'));
    }

    /** @test */
    public function vendor_can_send_message_without_attachment(): void
    {
        $messageData = [
            'message' => 'This is a test message from vendor',
        ];

        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$this->quote->uuid}/messages", $messageData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'uuid',
                    'message',
                    'sender_type',
                    'attachments',
                ],
            ])
            ->assertJson([
                'message' => 'Message sent successfully',
            ]);

        // Verify message was stored in database
        $this->assertDatabaseHas('quote_messages', [
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'sender_type' => 'vendor',
            'message' => 'This is a test message from vendor',
        ]);
    }

    /** @test */
    public function vendor_can_send_message_with_attachment(): void
    {
        $file = UploadedFile::fake()->create('document.pdf', 1024); // 1MB

        $response = $this->actingAsVendor()
            ->post("/api/v1/vendor/quotes/{$this->quote->uuid}/messages", [
                'message' => 'Message with attachment',
                'attachments' => [$file],
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Message sent successfully',
            ]);

        // Verify file was stored
        $message = QuoteMessage::where('quote_id', $this->quote->id)
            ->where('message', 'Message with attachment')
            ->first();

        $this->assertNotNull($message);
        $this->assertNotEmpty($message->attachments);
        $this->assertCount(1, $message->attachments);
        $this->assertEquals('document.pdf', $message->attachments[0]['filename']);
    }

    /** @test */
    public function vendor_message_validation_errors(): void
    {
        // Test empty message
        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$this->quote->uuid}/messages", [
                'message' => '',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);

        // Test message too long (over 5000 characters)
        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$this->quote->uuid}/messages", [
                'message' => str_repeat('a', 5001),
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);

        // Test missing message field
        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$this->quote->uuid}/messages", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    /** @test */
    public function vendor_message_file_size_limit_validation(): void
    {
        // Create a file larger than 10MB (10241KB)
        $largeFile = UploadedFile::fake()->create('large-document.pdf', 10241);

        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$this->quote->uuid}/messages", [
                'message' => 'Message with large file',
                'attachments' => [$largeFile],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['attachments.0']);
    }

    /** @test */
    public function vendor_message_file_type_validation(): void
    {
        // Test invalid file type (.exe)
        $invalidFile = UploadedFile::fake()->create('malware.exe', 100);

        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$this->quote->uuid}/messages", [
                'message' => 'Message with invalid file',
                'attachments' => [$invalidFile],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['attachments.0']);

        // Test valid file types
        $validFiles = [
            UploadedFile::fake()->create('document.pdf', 100),
            UploadedFile::fake()->image('photo.jpg'),
            UploadedFile::fake()->image('photo.png'),
            UploadedFile::fake()->create('document.doc', 100),
            UploadedFile::fake()->create('document.docx', 100),
            UploadedFile::fake()->create('spreadsheet.xls', 100),
            UploadedFile::fake()->create('spreadsheet.xlsx', 100),
        ];

        foreach ($validFiles as $file) {
            $response = $this->actingAsVendor()
                ->post("/api/v1/vendor/quotes/{$this->quote->uuid}/messages", [
                    'message' => 'Message with valid file',
                    'attachments' => [$file],
                ]);

            $response->assertStatus(201);
        }
    }

    /** @test */
    public function vendor_message_max_attachments_validation(): void
    {
        // Create 6 files (exceeds max of 5)
        $files = [];
        for ($i = 0; $i < 6; $i++) {
            $files[] = UploadedFile::fake()->create("document{$i}.pdf", 100);
        }

        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$this->quote->uuid}/messages", [
                'message' => 'Message with too many attachments',
                'attachments' => $files,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['attachments']);

        // Test exactly 5 attachments (should pass)
        $files = [];
        for ($i = 0; $i < 5; $i++) {
            $files[] = UploadedFile::fake()->create("document{$i}.pdf", 100);
        }

        $response = $this->actingAsVendor()
            ->post("/api/v1/vendor/quotes/{$this->quote->uuid}/messages", [
                'message' => 'Message with exactly 5 attachments',
                'attachments' => $files,
            ]);

        $response->assertStatus(201);
    }

    /** @test */
    public function authentication_required_for_message_endpoints(): void
    {
        // Try to list messages without authentication
        $response = $this->getJson("/api/v1/vendor/quotes/{$this->quote->uuid}/messages");
        $response->assertStatus(401);

        // Try to send message without authentication
        $response = $this->postJson("/api/v1/vendor/quotes/{$this->quote->uuid}/messages", [
            'message' => 'Test message',
        ]);
        $response->assertStatus(401);
    }

    /** @test */
    public function tenant_isolation_works_for_messages(): void
    {
        // Create another tenant with a vendor and quote
        $otherTenant = TenantEloquentModel::factory()->create([
            'name' => 'Other Tenant',
            'slug' => 'other-tenant',
            'domain' => 'other-tenant.local',
            'status' => 'active',
        ]);

        $otherVendor = Vendor::factory()->create([
            'tenant_id' => $otherTenant->id,
            'company_name' => 'Other Vendor',
            'email' => 'other-vendor@test.com',
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
        ]);

        $otherQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $otherTenant->id,
            'vendor_id' => $otherVendor->id,
            'status' => 'sent',
        ]);

        // Create messages for the other tenant's quote
        QuoteMessage::factory()->count(3)->create([
            'tenant_id' => $otherTenant->id,
            'quote_id' => $otherQuote->id,
            'sender_id' => $this->vendorUser->id,
            'sender_type' => 'vendor',
        ]);

        // Try to access other tenant's quote messages
        $response = $this->actingAsVendor()
            ->getJson("/api/v1/vendor/quotes/{$otherQuote->uuid}/messages");

        // Should return 404 or empty result (tenant isolation)
        $response->assertStatus(404);

        // Verify our vendor can only see their own quote messages
        $response = $this->actingAsVendor()
            ->getJson("/api/v1/vendor/quotes/{$this->quote->uuid}/messages");

        $response->assertStatus(200);
        $messages = $response->json('data');
        
        // Should not include messages from other tenant
        foreach ($messages as $message) {
            $this->assertEquals($this->tenant->id, $message['tenant_id'] ?? null);
        }
    }

    /** @test */
    public function response_format_matches_openapi_spec(): void
    {
        // Create a message with attachment
        QuoteMessage::factory()->withAttachments(1)->create([
            'tenant_id' => $this->tenant->id,
            'quote_id' => $this->quote->id,
            'sender_id' => $this->vendorUser->id,
            'sender_type' => 'vendor',
        ]);

        // Test GET /api/v1/vendor/quotes/:uuid/messages response format
        $response = $this->actingAsVendor()
            ->getJson("/api/v1/vendor/quotes/{$this->quote->uuid}/messages");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    '*' => [
                        'id',
                        'uuid',
                        'message',
                        'sender_type',
                        'attachments',
                        'is_read',
                        'created_at',
                    ],
                ],
                'pagination' => [
                    'current_page',
                    'per_page',
                    'total',
                    'last_page',
                ],
            ]);

        // Verify data types
        $data = $response->json('data.0');
        $this->assertIsInt($data['id']);
        $this->assertIsString($data['uuid']);
        $this->assertIsString($data['message']);
        $this->assertIsString($data['sender_type']);
        $this->assertIsArray($data['attachments']);
        $this->assertIsBool($data['is_read']);

        // Test POST /api/v1/vendor/quotes/:uuid/messages response format
        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$this->quote->uuid}/messages", [
                'message' => 'Test message for format validation',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'uuid',
                    'message',
                    'sender_type',
                    'attachments',
                ],
            ]);

        // Verify data types
        $data = $response->json('data');
        $this->assertIsInt($data['id']);
        $this->assertIsString($data['uuid']);
        $this->assertIsString($data['message']);
        $this->assertIsString($data['sender_type']);
        $this->assertIsArray($data['attachments']);
    }
}
