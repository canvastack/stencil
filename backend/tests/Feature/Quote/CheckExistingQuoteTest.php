<?php

namespace Tests\Feature\Quote;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Laravel\Sanctum\Sanctum;

class CheckExistingQuoteTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private User $user;
    private Order $order;
    private Vendor $vendor;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant and user
        $this->tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Set tenant context
        $this->app->instance('current_tenant', $this->tenant);
        
        // Authenticate user with Sanctum
        Sanctum::actingAs($this->user);

        // Create order and vendor
        $this->order = Order::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    public function test_detects_existing_active_quote(): void
    {
        // Create an active quote
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
        ]);

        $response = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'has_active_quote' => true,
                ]
            ])
            ->assertJsonPath('data.quote.id', $quote->uuid);
    }

    public function test_returns_false_when_no_active_quote(): void
    {
        $response = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'has_active_quote' => false,
                    'quote' => null,
                ]
            ]);
    }

    public function test_ignores_rejected_quotes(): void
    {
        // Create a rejected quote
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'rejected',
        ]);

        $response = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'has_active_quote' => false,
                    'quote' => null,
                ]
            ]);
    }

    public function test_ignores_expired_quotes(): void
    {
        // Create an expired quote
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'expired',
        ]);

        $response = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'has_active_quote' => false,
                    'quote' => null,
                ]
            ]);
    }

    public function test_filters_by_vendor_id(): void
    {
        $vendor2 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);

        // Create quote for vendor 1
        $quote1 = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
        ]);

        // Create quote for vendor 2
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $vendor2->id,
            'status' => 'open',
        ]);

        // Check for vendor 1 specifically
        $response = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}&vendor_id={$this->vendor->uuid}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'has_active_quote' => true,
                ]
            ])
            ->assertJsonPath('data.quote.id', $quote1->uuid);
    }

    public function test_filters_by_custom_statuses(): void
    {
        // Create quotes with different statuses
        $acceptedQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'accepted',
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
        ]);

        // Check for accepted status only
        $response = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}&status[]=accepted");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'has_active_quote' => true,
                ]
            ])
            ->assertJsonPath('data.quote.id', $acceptedQuote->uuid);
    }

    public function test_enforces_tenant_isolation(): void
    {
        $otherTenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $otherOrder = Order::factory()->create(['tenant_id' => $otherTenant->id]);

        // Create quote for other tenant
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $otherTenant->id,
            'order_id' => $otherOrder->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
        ]);

        // Try to check for other tenant's order
        $response = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$otherOrder->uuid}");

        // Should return 404 because order doesn't belong to current tenant
        $response->assertStatus(404);
    }

    public function test_requires_order_id(): void
    {
        $response = $this->getJson("/api/v1/tenant/quotes/check-existing");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['order_id']);
    }

    public function test_validates_order_id_format(): void
    {
        $response = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id=invalid-uuid");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['order_id']);
    }

    public function test_returns_most_recent_quote_when_multiple_exist(): void
    {
        // Create older quote
        $olderQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'created_at' => now()->subDays(2),
        ]);

        // Create newer quote
        $newerQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'created_at' => now()->subDay(),
        ]);

        $response = $this->getJson("/api/v1/tenant/quotes/check-existing?order_id={$this->order->uuid}");

        $response->assertStatus(200)
            ->assertJsonPath('data.quote.id', $newerQuote->uuid);
    }
}
