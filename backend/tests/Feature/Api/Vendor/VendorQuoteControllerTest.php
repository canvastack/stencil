<?php

namespace Tests\Feature\Api\Vendor;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Event;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\AuditLog;
use Laravel\Sanctum\Sanctum;
use Tests\Middleware\TestTenantContextMiddleware;

/**
 * VendorQuoteControllerTest
 * 
 * Feature tests for vendor quote management endpoints.
 * 
 * Requirements: 4.1, 4.2, 4.3, 5.1, 6.2, 6.5, 6.8, 11.2, 11.3, 11.4
 */
class VendorQuoteControllerTest extends TestCase
{
    use RefreshDatabase;

    protected TenantEloquentModel $tenant;
    protected Vendor $vendor;
    protected UserEloquentModel $vendorUser;
    protected Order $order;
    protected string $testPassword = 'Test@VendorP4ss2026!';

    protected function setUp(): void
    {
        parent::setUp();
        
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

        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_number' => 'ORD-2026-001',
            'status' => 'pending',
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
     * Uses Sanctum and lets middleware work naturally
     */
    protected function actingAsVendor()
    {
        Sanctum::actingAs($this->vendorUser, ['vendor:access']);
        return $this;
    }

    /** @test */
    public function vendor_can_list_their_quotes(): void
    {
        // Verify vendor relationship is set
        $this->assertNotNull($this->vendorUser->vendor);
        $this->assertEquals($this->vendor->id, $this->vendorUser->vendor->id);
        
        // Create quotes for this vendor
        OrderVendorNegotiation::factory()->count(3)->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
        ]);

        $response = $this->actingAsVendor()
            ->getJson('/api/v1/vendor/quotes');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'quotes',
                    'pagination',
                    'statistics',
                ],
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Quotes retrieved successfully',
            ]);

        $this->assertCount(3, $response->json('data.quotes'));
    }

    /** @test */
    public function vendor_can_filter_quotes_by_status(): void
    {
        // Create quotes with different statuses
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'accepted',
        ]);

        $response = $this->actingAsVendor()
            ->getJson('/api/v1/vendor/quotes?status=sent');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data.quotes'));
        $this->assertEquals('sent', $response->json('data.quotes.0.status'));
    }

    /** @test */
    public function vendor_can_search_quotes(): void
    {
        // Create quotes
        OrderVendorNegotiation::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
        ]);

        $response = $this->actingAsVendor()
            ->getJson('/api/v1/vendor/quotes?search=test');

        $response->assertStatus(200);
    }

    /** @test */
    public function vendor_quotes_are_paginated(): void
    {
        // Create 25 quotes
        OrderVendorNegotiation::factory()->count(25)->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
        ]);

        $response = $this->actingAsVendor()
            ->getJson('/api/v1/vendor/quotes?page=1&per_page=15');

        $response->assertStatus(200)
            ->assertJsonPath('data.pagination.current_page', 1)
            ->assertJsonPath('data.pagination.per_page', 15)
            ->assertJsonPath('data.pagination.total', 25);

        $this->assertCount(15, $response->json('data.quotes'));
    }

    /** @test */
    public function vendor_can_get_quote_detail(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
        ]);

        $response = $this->actingAsVendor()
            ->getJson("/api/v1/vendor/quotes/{$quote->uuid}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Quote detail retrieved successfully',
                'data' => [
                    'uuid' => $quote->uuid,
                    'status' => 'sent',
                ],
            ]);
    }

    /** @test */
    public function get_quote_detail_returns_404_for_non_existent_quote(): void
    {
        $fakeUuid = '00000000-0000-0000-0000-000000000000';

        $response = $this->actingAsVendor()
            ->getJson("/api/v1/vendor/quotes/{$fakeUuid}");

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'Quote not found',
            ]);
    }

    /** @test */
    public function vendor_cannot_access_other_vendor_quote(): void
    {
        // Create another vendor
        $otherVendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'company_name' => 'Other Vendor',
        ]);

        // Create quote for other vendor
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $otherVendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
        ]);

        $response = $this->actingAsVendor()
            ->getJson("/api/v1/vendor/quotes/{$quote->uuid}");

        $response->assertStatus(404);
    }

    /** @test */
    public function vendor_can_accept_quote(): void
    {
        // Fake events to avoid queue issues in tests
        Event::fake([
            \App\Domain\Quote\Events\VendorRespondedToQuote::class,
            \App\Domain\Order\Events\OrderStatusChanged::class,
        ]);

        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
            'sent_at' => now(),
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$quote->uuid}/accept", [
                'estimated_delivery_days' => 14,
                'notes' => 'We can deliver within 2 weeks',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Quote accepted successfully',
            ]);

        // Verify quote was updated
        $quote->refresh();
        $this->assertEquals('accepted', $quote->status);
        $this->assertNotNull($quote->responded_at);
    }

    /** @test */
    public function accept_quote_validation_errors(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
        ]);

        // Missing estimated_delivery_days
        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$quote->uuid}/accept", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['estimated_delivery_days']);
    }

    /** @test */
    public function vendor_can_reject_quote(): void
    {
        // Fake events to avoid queue issues in tests
        Event::fake([
            \App\Domain\Quote\Events\VendorRespondedToQuote::class,
        ]);

        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
            'sent_at' => now(),
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$quote->uuid}/reject", [
                'rejection_reason' => 'Cannot meet the specifications',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Quote rejected successfully',
            ]);

        // Verify quote was updated
        $quote->refresh();
        $this->assertEquals('rejected', $quote->status);
        $this->assertNotNull($quote->responded_at);
    }

    /** @test */
    public function reject_quote_validation_errors(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
        ]);

        // Missing rejection_reason
        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$quote->uuid}/reject", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rejection_reason']);
    }

    /** @test */
    public function vendor_can_submit_counter_offer(): void
    {
        // Fake events to avoid queue issues in tests
        Event::fake([
            \App\Domain\Quote\Events\VendorRespondedToQuote::class,
        ]);

        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'round' => 1,
            'sent_at' => now(),
            'expires_at' => now()->addDays(7),
            'quote_details' => [
                'items' => [
                    [
                        'product_id' => 'product-uuid-1',
                        'product_name' => 'Test Product',
                        'quantity' => 10,
                        'unit_price' => 10000,
                        'total_price' => 100000,
                    ],
                ],
            ],
        ]);

        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$quote->uuid}/counter-offer", [
                'items' => [
                    [
                        'product_id' => 'product-uuid-1',
                        'counter_unit_price' => 12000,
                        'notes' => 'Higher cost due to material requirements',
                    ],
                ],
                'notes' => 'Overall counter offer notes',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Counter offer submitted successfully',
            ]);

        // Verify quote was updated
        $quote->refresh();
        $this->assertEquals('countered', $quote->status);
    }

    /** @test */
    public function counter_offer_validation_errors(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
        ]);

        // Missing items array
        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$quote->uuid}/counter-offer", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);
    }

    /** @test */
    public function vendor_cannot_respond_to_expired_quote(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'expired',
            'sent_at' => now()->subDays(10),
            'expires_at' => now()->subDays(3),
        ]);

        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$quote->uuid}/accept", [
                'estimated_delivery_days' => 14,
            ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function vendor_cannot_respond_to_already_responded_quote(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'accepted',
            'sent_at' => now()->subDays(2),
            'responded_at' => now()->subDay(),
            'response_type' => 'accept',
        ]);

        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$quote->uuid}/reject", [
                'rejection_reason' => 'Changed my mind',
            ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function tenant_isolation_works_for_quotes(): void
    {
        // Create another tenant
        $otherTenant = TenantEloquentModel::factory()->create([
            'name' => 'Other Tenant',
            'slug' => 'other-tenant',
            'status' => 'active',
        ]);

        // Create vendor in other tenant
        $otherVendor = Vendor::factory()->create([
            'tenant_id' => $otherTenant->id,
        ]);

        // Create order in other tenant
        $otherOrder = Order::factory()->create([
            'tenant_id' => $otherTenant->id,
        ]);

        // Create quote in other tenant
        $otherQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $otherTenant->id,
            'vendor_id' => $otherVendor->id,
            'order_id' => $otherOrder->id,
            'status' => 'sent',
        ]);

        // Try to access quote from other tenant
        $response = $this->actingAsVendor()
            ->getJson("/api/v1/vendor/quotes/{$otherQuote->uuid}");

        $response->assertStatus(404);
    }

    /** @test */
    public function authentication_required_for_quote_endpoints(): void
    {
        // Try to access without authentication
        $response = $this->getJson('/api/v1/vendor/quotes');
        $response->assertStatus(401);

        $response = $this->getJson('/api/v1/vendor/quotes/fake-uuid');
        $response->assertStatus(401);

        $response = $this->postJson('/api/v1/vendor/quotes/fake-uuid/accept', [
            'estimated_delivery_days' => 14,
        ]);
        $response->assertStatus(401);
    }

    /** @test */
    public function response_format_matches_openapi_spec(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
        ]);

        // Test list response format
        $response = $this->actingAsVendor()
            ->getJson('/api/v1/vendor/quotes');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'quotes',
                    'pagination',
                    'statistics',
                ],
            ]);

        // Test detail response format
        $response = $this->actingAsVendor()
            ->getJson("/api/v1/vendor/quotes/{$quote->uuid}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'uuid',
                    'status',
                ],
            ]);
    }

    /** @test */
    public function audit_logs_are_created_for_quote_actions(): void
    {
        // Fake events to avoid queue issues in tests
        Event::fake([
            \App\Domain\Quote\Events\VendorRespondedToQuote::class,
            \App\Domain\Order\Events\OrderStatusChanged::class,
        ]);

        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
            'sent_at' => now(),
            'expires_at' => now()->addDays(7),
        ]);

        // Accept quote
        $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$quote->uuid}/accept", [
                'estimated_delivery_days' => 14,
            ]);

        // Verify audit log was created
        $this->assertDatabaseHas('audit_logs', [
            'tenant_id' => $this->tenant->id,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'action_type' => 'quote_accepted',
            'resource_type' => 'quote',
        ]);
    }

    /** @test */
    public function notifications_are_sent_for_quote_responses(): void
    {
        // Fake events to avoid queue issues in tests
        Event::fake([
            \App\Domain\Quote\Events\VendorRespondedToQuote::class,
            \App\Domain\Order\Events\OrderStatusChanged::class,
        ]);

        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'order_id' => $this->order->id,
            'status' => 'sent',
            'sent_at' => now(),
            'expires_at' => now()->addDays(7),
        ]);

        // Accept quote
        $response = $this->actingAsVendor()
            ->postJson("/api/v1/vendor/quotes/{$quote->uuid}/accept", [
                'estimated_delivery_days' => 14,
            ]);

        $response->assertStatus(200);
        
        // Verify event was dispatched
        Event::assertDispatched(\App\Domain\Quote\Events\VendorRespondedToQuote::class);
    }
}
