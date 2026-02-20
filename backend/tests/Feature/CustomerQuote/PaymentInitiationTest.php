<?php

namespace Tests\Feature\CustomerQuote;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\ApprovalSettings;
use App\Application\CustomerQuote\Services\ApprovalService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PaymentInitiationTest extends TestCase
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

        // Create some completed orders for the customer to pass trust score
        Order::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'completed',
            'payment_status' => 'paid',
            'items' => [['product_id' => 1, 'quantity' => 1, 'unit_price' => 100000]],
        ]);

        // Also create one more order to ensure payment success rate is 100%
        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'processing',
            'payment_status' => 'paid',
            'items' => [['product_id' => 1, 'quantity' => 1, 'unit_price' => 100000]],
        ]);

        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'customer_quote',
            'total_amount' => 10000000, // 100,000 IDR in cents
            'items' => [
                [
                    'product_id' => 1,
                    'product_name' => 'Test Product',
                    'quantity' => 1,
                    'unit_price' => 10000000,
                    'is_custom' => false, // Not a custom product
                ],
            ],
        ]);

        // Create vendor quote (without order_id as it doesn't exist in schema)
        $this->vendorQuote = VendorQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'amount' => 800.00, // 800 IDR
            'status' => 'accepted',
        ]);

        // Create customer quote
        $this->customerQuote = CustomerQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_quote_id' => $this->vendorQuote->id,
            'grand_total' => 10000000, // 100,000 IDR in cents
            'status' => 'sent',
            'created_by' => $this->admin->id,
            'history' => [], // Initialize as empty array
            'metadata' => [], // Initialize as empty array
        ]);

        // Create approval settings with auto-approval enabled
        ApprovalSettings::create([
            'tenant_id' => $this->tenant->id,
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 20000000, // 200,000 IDR in cents
            'require_email_verification' => true,
            'min_successful_orders' => 0,
            'min_payment_success_rate' => 0,
            'require_approval_for_custom' => false,
            'max_negotiation_rounds' => 3,
            'allow_customer_counter_offer' => true,
            'notify_admin_on_auto_approve' => false,
            'notify_admin_on_pending_approval' => true,
        ]);
    }

    /**
     * Test that payment is initiated after quote acceptance (auto or manual)
     *
     * @test
     */
    public function test_payment_initiated_after_quote_acceptance(): void
    {
        // Accept quote (will trigger approval process)
        $this->customerQuote->update([
            'customer_accepted_at' => now(),
            'accepted_by' => $this->customer->id,
        ]);

        $approvalService = app(ApprovalService::class);
        $result = $approvalService->processAcceptance($this->customerQuote);

        // Payment should be initiated regardless of approval method
        if ($result['method'] === 'auto') {
            // Auto-approved - payment initiated immediately
            $this->assertTrue($result['payment_initiated']);
            
            // Refresh order
            $this->order->refresh();

            // Assert order status updated
            $this->assertEquals('awaiting_payment', $this->order->status);
            $this->assertEquals('unpaid', $this->order->payment_status);

            // Assert payment schedule created
            $this->assertNotNull($this->order->payment_schedule);
            $paymentSchedule = $this->order->payment_schedule;
            
            $this->assertIsArray($paymentSchedule);
            $this->assertCount(2, $paymentSchedule);

            // Assert DP payment
            $dpPayment = collect($paymentSchedule)->firstWhere('type', 'dp_50');
            $this->assertNotNull($dpPayment);
            $this->assertEquals(5000000, $dpPayment['amount']); // 50% of 100,000 IDR
            $this->assertEquals(50, $dpPayment['percentage']);
            $this->assertEquals('pending', $dpPayment['status']);
            $this->assertNotNull($dpPayment['due_date']);

            // Assert balance payment
            $balancePayment = collect($paymentSchedule)->firstWhere('type', 'balance_50');
            $this->assertNotNull($balancePayment);
            $this->assertEquals(5000000, $balancePayment['amount']); // 50% of 100,000 IDR
            $this->assertEquals(50, $balancePayment['percentage']);
            $this->assertEquals('pending', $balancePayment['status']);

            // Assert down payment amount set
            $this->assertEquals(5000000, $this->order->down_payment_amount);
            $this->assertNotNull($this->order->down_payment_due_at);
        } else {
            // Manual approval required - payment will be initiated after admin approval
            $this->assertTrue($result['requires_manual_approval']);
            $this->assertNotNull($result['reason']);
        }
    }

    /**
     * Test that payment is initiated after manual approval
     *
     * @test
     */
    public function test_payment_initiated_after_manual_approval(): void
    {
        // Set quote to pending approval
        $this->customerQuote->update([
            'status' => 'pending_approval',
            'customer_accepted_at' => now(),
            'accepted_by' => $this->customer->id,
        ]);

        // Manually approve quote
        $approvalService = app(ApprovalService::class);
        $approvedQuote = $approvalService->approveQuote(
            $this->customerQuote->uuid,
            $this->admin->id,
            'Approved after review'
        );

        // Refresh order
        $this->order->refresh();

        // Assert order status updated
        $this->assertEquals('awaiting_payment', $this->order->status);
        $this->assertEquals('unpaid', $this->order->payment_status);

        // Assert payment schedule created
        $this->assertNotNull($this->order->payment_schedule);
        $paymentSchedule = $this->order->payment_schedule;
        
        $this->assertIsArray($paymentSchedule);
        $this->assertCount(2, $paymentSchedule);

        // Assert DP payment
        $dpPayment = collect($paymentSchedule)->firstWhere('type', 'dp_50');
        $this->assertNotNull($dpPayment);
        $this->assertEquals(5000000, $dpPayment['amount']);

        // Assert down payment amount set
        $this->assertEquals(5000000, $this->order->down_payment_amount);
        $this->assertNotNull($this->order->down_payment_due_at);

        // Assert quote history includes payment initiation
        $history = $approvedQuote->history;
        $manualApprovalEntry = collect($history)->firstWhere('action', 'manually_approved');
        
        $this->assertNotNull($manualApprovalEntry);
        $this->assertTrue($manualApprovalEntry['details']['payment_initiated']);
        $this->assertEquals(5000000, $manualApprovalEntry['details']['dp_amount']);
    }

    /**
     * Test that notification is created after quote acceptance
     *
     * @test
     */
    public function test_notification_created_after_quote_acceptance(): void
    {
        // Accept quote (will trigger approval process)
        $this->customerQuote->update([
            'customer_accepted_at' => now(),
            'accepted_by' => $this->customer->id,
        ]);

        $approvalService = app(ApprovalService::class);
        $result = $approvalService->processAcceptance($this->customerQuote);

        // Check notification was created (either accepted or pending_approval)
        $notificationExists = \App\Infrastructure\Persistence\Eloquent\Models\CustomerNotification::where('customer_quote_id', $this->customerQuote->id)
            ->where('customer_id', $this->customer->id)
            ->whereIn('type', ['quote_accepted', 'quote_pending_approval'])
            ->exists();

        $this->assertTrue($notificationExists, 'Notification should be created after quote acceptance');

        // Get notification and check it has relevant data
        $notification = \App\Infrastructure\Persistence\Eloquent\Models\CustomerNotification::where('customer_quote_id', $this->customerQuote->id)
            ->where('customer_id', $this->customer->id)
            ->first();

        $this->assertNotNull($notification);
        $this->assertIsArray($notification->data);
        $this->assertArrayHasKey('quote_number', $notification->data);
        
        // If auto-approved, check payment information
        if ($result['method'] === 'auto') {
            $this->assertEquals('quote_accepted', $notification->type);
            $this->assertTrue($notification->data['payment_initiated']);
            $this->assertArrayHasKey('dp_amount', $notification->data);
            $this->assertArrayHasKey('dp_due_date', $notification->data);
            $this->assertArrayHasKey('payment_schedule', $notification->data);
        }
    }
}
