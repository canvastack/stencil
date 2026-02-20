<?php

namespace Tests\Feature\CustomerQuote;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class CustomerQuoteApiTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $admin;
    private Customer $customer;
    private Order $order;
    private VendorQuote $vendorQuote;
    private CustomerQuote $customerQuote;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = Tenant::factory()->create();

        // Create admin user
        $this->admin = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'account_type' => 'tenant',
        ]);

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email_verified_at' => now(),
        ]);

        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'customer_quote',
            'total_amount' => 10000000,
            'down_payment_amount' => 5000000,
            'payment_status' => 'unpaid',
            'items' => [
                [
                    'product_id' => 1,
                    'product_name' => 'Test Product',
                    'quantity' => 1,
                    'unit_price' => 10000000,
                ],
            ],
        ]);

        // Create vendor quote
        $this->vendorQuote = VendorQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'amount' => 800.00,
            'status' => 'accepted',
        ]);

        // Create customer quote
        $this->customerQuote = CustomerQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_quote_id' => $this->vendorQuote->id,
            'grand_total' => 10000000,
            'status' => 'accepted',
            'created_by' => $this->admin->id,
            'approved_at' => now(),
            'approved_by' => $this->admin->id,
            'approval_method' => 'auto',
        ]);
    }

    /** @test */
    public function it_includes_payment_status_in_quote_detail_for_accepted_quotes(): void
    {
        // Authenticate as admin
        Sanctum::actingAs($this->admin, ['*']);

        // Create payment transactions
        OrderPaymentTransaction::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'customer_id' => $this->customer->id,
            'direction' => 'incoming',
            'type' => 'customer_payment_dp',
            'status' => 'pending',
            'amount' => 5000000,
            'currency' => 'IDR',
            'reference' => "DP-{$this->customerQuote->quote_number}",
            'metadata' => [
                'customer_quote_id' => $this->customerQuote->id,
                'payment_type' => 'down_payment',
            ],
        ]);

        // Make API request
        $response = $this->getJson("/api/v1/tenant/customer-quotes/{$this->customerQuote->uuid}");

        // Assert response structure
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'uuid',
                    'quote_number',
                    'status',
                    'payment' => [
                        'status',
                        'total_paid',
                        'remaining',
                        'is_down_payment_paid',
                        'is_fully_paid',
                        'summary' => [
                            'quote_total',
                            'total_paid',
                            'remaining',
                            'payment_status',
                            'down_payment',
                            'balance_payment',
                        ],
                    ],
                ],
            ]);

        // Assert payment data
        $paymentData = $response->json('data.payment');
        $this->assertEquals('unpaid', $paymentData['status']);
        $this->assertEquals(0, $paymentData['total_paid']);
        $this->assertEquals(10000000, $paymentData['remaining']);
        $this->assertFalse($paymentData['is_down_payment_paid']);
        $this->assertFalse($paymentData['is_fully_paid']);
    }

    /** @test */
    public function it_does_not_include_payment_status_for_non_accepted_quotes(): void
    {
        // Authenticate as admin
        Sanctum::actingAs($this->admin, ['*']);

        // Update quote to sent status
        $this->customerQuote->update(['status' => 'sent']);

        // Make API request
        $response = $this->getJson("/api/v1/tenant/customer-quotes/{$this->customerQuote->uuid}");

        // Assert response structure
        $response->assertStatus(200)
            ->assertJsonMissing(['payment']);
    }

    /** @test */
    public function it_shows_payment_progress_when_partially_paid(): void
    {
        // Authenticate as admin
        Sanctum::actingAs($this->admin, ['*']);

        // Create and complete DP payment transaction
        OrderPaymentTransaction::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'customer_id' => $this->customer->id,
            'direction' => 'incoming',
            'type' => 'customer_payment_dp',
            'status' => 'completed',
            'amount' => 5000000,
            'currency' => 'IDR',
            'reference' => "DP-{$this->customerQuote->quote_number}",
            'paid_at' => now(),
            'method' => 'bank_transfer',
            'metadata' => [
                'customer_quote_id' => $this->customerQuote->id,
                'payment_type' => 'down_payment',
            ],
        ]);

        // Update order payment status and payment schedule
        $this->order->update([
            'payment_status' => 'partial',
            'total_paid_amount' => 5000000,
            'payment_schedule' => [
                [
                    'type' => 'dp_50',
                    'amount' => 5000000,
                    'due_date' => now()->addDays(7)->toDateString(),
                    'status' => 'paid',
                    'paid_at' => now()->toDateString(),
                    'payment_method' => 'bank_transfer',
                ],
                [
                    'type' => 'balance_50',
                    'amount' => 5000000,
                    'due_date' => null,
                    'status' => 'pending',
                ],
            ],
        ]);

        // Make API request
        $response = $this->getJson("/api/v1/tenant/customer-quotes/{$this->customerQuote->uuid}");

        // Assert payment data
        $response->assertStatus(200);
        $paymentData = $response->json('data.payment');
        
        $this->assertEquals('partial', $paymentData['status']);
        $this->assertEquals(5000000, $paymentData['total_paid']);
        $this->assertEquals(5000000, $paymentData['remaining']);
        $this->assertTrue($paymentData['is_down_payment_paid']);
        $this->assertFalse($paymentData['is_fully_paid']);
    }
}
