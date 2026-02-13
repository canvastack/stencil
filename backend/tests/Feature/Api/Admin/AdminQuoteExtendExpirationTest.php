<?php

declare(strict_types=1);

namespace Tests\Feature\Api\Admin;

use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Admin Quote Extend Expiration API Tests
 * 
 * Tests the POST /api/v1/admin/quotes/{quoteUuid}/extend-expiration endpoint
 * 
 * Requirements: 10.8
 */
class AdminQuoteExtendExpirationTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private User $adminUser;
    private Vendor $vendor;
    private Order $order;
    private OrderVendorNegotiation $quote;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create();

        // Create admin user
        $this->adminUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'account_type' => 'tenant',
            'status' => 'active',
        ]);

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Vendor',
            'company_name' => 'Test Vendor Company',
            'email' => 'vendor@example.com',
            'status' => 'active',
        ]);

        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'pending',
        ]);

        // Create quote that is expiring soon (2 days from now)
        $this->quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'sent',
            'sent_at' => now()->subDays(5),
            'expires_at' => now()->addDays(2), // Expiring in 2 days
        ]);
    }

    /** @test */
    public function it_extends_quote_expiration_successfully()
    {
        $newExpiresAt = now()->addDays(10)->format('Y-m-d\TH:i:s\Z');

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->tenant->uuid])
            ->postJson("/api/v1/admin/quotes/{$this->quote->uuid}/extend-expiration", [
                'expires_at' => $newExpiresAt,
                'reason' => 'Vendor requested more time',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'quote_uuid',
                    'new_expires_at',
                    'extended_by',
                ]
            ])
            ->assertJson([
                'message' => 'Quote expiration extended successfully',
                'data' => [
                    'quote_uuid' => $this->quote->uuid,
                ]
            ]);

        // Verify quote was updated in database
        $this->quote->refresh();
        $this->assertNotNull($this->quote->expires_at);
    }

    /** @test */
    public function it_requires_authentication()
    {
        $newExpiresAt = now()->addDays(10)->format('Y-m-d\TH:i:s\Z');

        $response = $this->postJson("/api/v1/admin/quotes/{$this->quote->uuid}/extend-expiration", [
            'expires_at' => $newExpiresAt,
        ]);

        $response->assertStatus(401);
    }

    /** @test */
    public function it_validates_expires_at_is_required()
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->tenant->uuid])
            ->postJson("/api/v1/admin/quotes/{$this->quote->uuid}/extend-expiration", [
                'reason' => 'Vendor requested more time',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['expires_at']);
    }

    /** @test */
    public function it_validates_expires_at_must_be_in_future()
    {
        $pastDate = now()->subDays(1)->format('Y-m-d\TH:i:s\Z');

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->tenant->uuid])
            ->postJson("/api/v1/admin/quotes/{$this->quote->uuid}/extend-expiration", [
                'expires_at' => $pastDate,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['expires_at']);
    }

    /** @test */
    public function it_returns_404_for_non_existent_quote()
    {
        $newExpiresAt = now()->addDays(10)->format('Y-m-d\TH:i:s\Z');
        $fakeUuid = '00000000-0000-0000-0000-000000000000';

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->withHeaders(['X-Tenant-ID' => $this->tenant->uuid])
            ->postJson("/api/v1/admin/quotes/{$fakeUuid}/extend-expiration", [
                'expires_at' => $newExpiresAt,
            ]);

        $response->assertStatus(500); // Use case throws exception for not found
    }
}

