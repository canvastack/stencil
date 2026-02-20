<?php

namespace Tests\Feature\CustomerQuote;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Laravel\Sanctum\Sanctum;

class AuthenticatedQuoteAccessTest extends TestCase
{
    use RefreshDatabase;

    private Customer $customer;
    private TenantEloquentModel $tenant;
    private Order $order;
    private CustomerQuote $quote;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create();

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'account_type' => 'registered',
            'email_verified_at' => now(),
        ]);

        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);

        // Create vendor sourcing
        $vendorSourcing = \App\Infrastructure\Persistence\Eloquent\Models\VendorSourcing::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
        ]);

        // Create user for created_by
        $user = \App\Infrastructure\Persistence\Eloquent\Models\User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create vendor quote
        $vendorQuote = VendorQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'sourcing_request_id' => $vendorSourcing->id,
            'status' => 'accepted',
        ]);

        // Create customer quote
        $this->quote = CustomerQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_quote_id' => $vendorQuote->id,
            'status' => 'sent',
            'created_by' => $user->id,
        ]);
    }

    public function test_authenticated_customer_can_list_their_quotes()
    {
        // Authenticate customer
        Sanctum::actingAs($this->customer, ['*']);

        $response = $this->getJson('/api/v1/public/customers/quotes');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data' => [
                        '*' => [
                            'uuid',
                            'quote_number',
                            'status',
                        ],
                    ],
                ],
            ]);
    }

    public function test_authenticated_customer_can_view_their_quote_detail()
    {
        // Authenticate customer
        Sanctum::actingAs($this->customer, ['*']);

        $response = $this->getJson("/api/v1/public/customers/quotes/{$this->quote->uuid}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'quote' => [
                        'uuid',
                        'quote_number',
                        'status',
                    ],
                    'is_expired',
                    'can_accept',
                    'can_counter',
                ],
            ]);
    }

    public function test_authenticated_customer_cannot_view_other_customer_quote()
    {
        // Create another customer
        $otherCustomer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Authenticate as other customer
        Sanctum::actingAs($otherCustomer, ['*']);

        $response = $this->getJson("/api/v1/public/customers/quotes/{$this->quote->uuid}");

        $response->assertStatus(404);
    }

    public function test_unauthenticated_customer_cannot_access_quotes()
    {
        $response = $this->getJson('/api/v1/public/customers/quotes');

        $response->assertStatus(401);
    }

    public function test_authenticated_customer_can_accept_quote()
    {
        // Authenticate customer
        Sanctum::actingAs($this->customer, ['*']);

        $response = $this->postJson("/api/v1/public/customers/quotes/{$this->quote->uuid}/accept", [
            'terms_accepted' => true,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Verify quote status changed
        $this->quote->refresh();
        $this->assertContains($this->quote->status, ['accepted', 'pending_approval']);
    }

    public function test_authenticated_customer_can_submit_counter_offer()
    {
        // Authenticate customer
        Sanctum::actingAs($this->customer, ['*']);

        $response = $this->postJson("/api/v1/public/customers/quotes/{$this->quote->uuid}/counter-offer", [
            'counter_amount' => 9000000, // 90,000 IDR
            'reason' => 'This is a test counter offer reason that is long enough to pass validation',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Verify quote status changed
        $this->quote->refresh();
        $this->assertEquals('countered', $this->quote->status);
        $this->assertEquals(9000000, $this->quote->counter_offer_amount);
    }

    public function test_authenticated_customer_can_reject_quote()
    {
        // Authenticate customer
        Sanctum::actingAs($this->customer, ['*']);

        $response = $this->postJson("/api/v1/public/customers/quotes/{$this->quote->uuid}/reject", [
            'reason' => 'This is a test rejection reason that is long enough to pass validation',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // Verify quote status changed
        $this->quote->refresh();
        $this->assertEquals('rejected', $this->quote->status);
    }
}
