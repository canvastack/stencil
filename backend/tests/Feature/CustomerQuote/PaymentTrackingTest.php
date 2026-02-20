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
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use App\Application\CustomerQuote\Services\ApprovalService;
use App\Application\CustomerQuote\Services\PaymentTrackingService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PaymentTrackingTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private User $admin;
    private Customer $customer;
    private Order $order;
    private VendorQuote $vendorQuote;
    private CustomerQuote $customerQuote;
    private PaymentTrackingService $paymentTrackingService;

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

        // Create some completed orders for the customer
        Order::factory()->count(2)->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'completed',
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
                    'is_custom' => false,
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
            'grand_total' => 10000000, // 100,000 IDR in cents
            'status' => 'sent',
            'created_by' => $this->admin->id,
            'history' => [],
            'metadata' => [],
        ]);

        // Create approval settings
        ApprovalSettings::create([
            'tenant_id' => $this->tenant->id,
            'auto_approval_enabled' => true,
            'auto_approval_threshold' => 20000000,
            'require_email_verification' => true,
            'min_successful_orders' => 0,
            'min_payment_success_rate' => 0,
            'require_approval_for_custom' => false,
            'max_negotiation_rounds' => 3,
            'allow_customer_counter_offer' => true,
            'notify_admin_on_auto_approve' => false,
            'notify_admin_on_pending_approval' => true,
        ]);

        $this->paymentTrackingService = app(PaymentTrackingService::class);
    }

    /**
     * Test that payment transactions are created when quote is accepted
     *
     * @test
     */
    public function test_payment_transactions_created_on_quote_acceptance(): void
    {
        // Accept quote
        $this->customerQuote->update([
            'customer_accepted_at' => now(),
            'accepted_by' => $this->customer->id,
        ]);

        $approvalService = app(ApprovalService::class);
        $result = $approvalService->processAcceptance($this->customerQuote);

        // Refresh quote
        $this->customerQuote->refresh();

        // Assert payment transactions were created
        $transactions = OrderPaymentTransaction::where('order_id', $this->order->id)
            ->where('direction', 'incoming')
            ->get();

        $this->assertCount(2, $transactions);

        // Assert DP transaction
        $dpTransaction = $transactions->firstWhere('type', 'customer_payment_dp');
        $this->assertNotNull($dpTransaction);
        $this->assertEquals(5000000, $dpTransaction->amount); // 50% of 100,000 IDR
        $this->assertEquals('pending', $dpTransaction->status);
        $this->assertEquals($this->customer->id, $dpTransaction->customer_id);
        $this->assertNotNull($dpTransaction->due_at);
        $this->assertArrayHasKey('customer_quote_id', $dpTransaction->metadata);
        $this->assertEquals($this->customerQuote->id, $dpTransaction->metadata['customer_quote_id']);

        // Assert balance transaction
        $balanceTransaction = $transactions->firstWhere('type', 'customer_payment_balance');
        $this->assertNotNull($balanceTransaction);
        $this->assertEquals(5000000, $balanceTransaction->amount); // 50% of 100,000 IDR
        $this->assertEquals('pending', $balanceTransaction->status);
        $this->assertEquals($this->customer->id, $balanceTransaction->customer_id);
        $this->assertArrayHasKey('customer_quote_id', $balanceTransaction->metadata);
    }

    /**
     * Test payment summary retrieval
     *
     * @test
     */
    public function test_payment_summary_retrieval(): void
    {
        // Accept quote to create payment transactions
        $this->customerQuote->update([
            'customer_accepted_at' => now(),
            'accepted_by' => $this->customer->id,
        ]);

        $approvalService = app(ApprovalService::class);
        $approvalService->processAcceptance($this->customerQuote);

        // Get payment summary
        $summary = $this->paymentTrackingService->getPaymentSummary($this->customerQuote->fresh());

        // Assert summary structure
        $this->assertArrayHasKey('quote_total', $summary);
        $this->assertArrayHasKey('total_paid', $summary);
        $this->assertArrayHasKey('remaining', $summary);
        $this->assertArrayHasKey('payment_status', $summary);
        $this->assertArrayHasKey('down_payment', $summary);
        $this->assertArrayHasKey('balance_payment', $summary);
        $this->assertArrayHasKey('transactions', $summary);

        // Assert values
        $this->assertEquals(10000000, $summary['quote_total']);
        $this->assertEquals(0, $summary['total_paid']); // No payments made yet
        $this->assertEquals(10000000, $summary['remaining']);
        $this->assertEquals('unpaid', $summary['payment_status']);

        // Assert down payment details
        $this->assertEquals(5000000, $summary['down_payment']['amount']);
        $this->assertEquals('pending', $summary['down_payment']['status']);
        $this->assertNotNull($summary['down_payment']['due_date']);

        // Assert balance payment details
        $this->assertEquals(5000000, $summary['balance_payment']['amount']);
        $this->assertEquals('pending', $summary['balance_payment']['status']);

        // Assert transactions
        $this->assertCount(2, $summary['transactions']);
    }

    /**
     * Test recording payment for a transaction
     *
     * @test
     */
    public function test_record_payment_for_transaction(): void
    {
        // Accept quote to create payment transactions
        $this->customerQuote->update([
            'customer_accepted_at' => now(),
            'accepted_by' => $this->customer->id,
        ]);

        $approvalService = app(ApprovalService::class);
        $approvalService->processAcceptance($this->customerQuote);

        // Get DP transaction
        $dpTransaction = OrderPaymentTransaction::where('order_id', $this->order->id)
            ->where('type', 'customer_payment_dp')
            ->first();

        $this->assertNotNull($dpTransaction);

        // Record payment
        $updatedTransaction = $this->paymentTrackingService->recordPayment(
            $dpTransaction,
            'bank_transfer',
            'TRX-12345',
            ['bank' => 'BCA', 'account' => '1234567890']
        );

        // Assert transaction updated
        $this->assertEquals('completed', $updatedTransaction->status);
        $this->assertEquals('bank_transfer', $updatedTransaction->method);
        $this->assertEquals('TRX-12345', $updatedTransaction->reference);
        $this->assertNotNull($updatedTransaction->paid_at);
        $this->assertArrayHasKey('bank', $updatedTransaction->metadata);

        // Assert order payment schedule updated
        $this->order->refresh();
        $paymentSchedule = $this->order->payment_schedule;
        $dpSchedule = collect($paymentSchedule)->firstWhere('type', 'dp_50');
        $this->assertEquals('paid', $dpSchedule['status']);
        $this->assertNotNull($dpSchedule['paid_at']);
        $this->assertEquals('bank_transfer', $dpSchedule['payment_method']);

        // Assert order payment status updated
        $this->assertEquals('partial', $this->order->payment_status);
        $this->assertEquals(5000000, $this->order->total_paid_amount);

        // Assert quote history updated
        $this->customerQuote->refresh();
        $history = $this->customerQuote->history;
        $paymentEntry = collect($history)->firstWhere('action', 'payment_received');
        $this->assertNotNull($paymentEntry);
        $this->assertEquals('customer', $paymentEntry['actor_type']);
        $this->assertEquals(5000000, $paymentEntry['details']['amount']);
    }

    /**
     * Test full payment completion
     *
     * @test
     */
    public function test_full_payment_completion(): void
    {
        // Accept quote
        $this->customerQuote->update([
            'customer_accepted_at' => now(),
            'accepted_by' => $this->customer->id,
        ]);

        $approvalService = app(ApprovalService::class);
        $approvalService->processAcceptance($this->customerQuote);

        // Get transactions
        $dpTransaction = OrderPaymentTransaction::where('order_id', $this->order->id)
            ->where('type', 'customer_payment_dp')
            ->first();

        $balanceTransaction = OrderPaymentTransaction::where('order_id', $this->order->id)
            ->where('type', 'customer_payment_balance')
            ->first();

        // Record DP payment
        $this->paymentTrackingService->recordPayment($dpTransaction, 'bank_transfer', 'TRX-DP-001');

        // Record balance payment
        $this->paymentTrackingService->recordPayment($balanceTransaction, 'bank_transfer', 'TRX-BAL-001');

        // Assert order fully paid
        $this->order->refresh();
        $this->assertEquals('paid', $this->order->payment_status);
        $this->assertEquals(10000000, $this->order->total_paid_amount);
        $this->assertNotNull($this->order->payment_date);

        // Assert both schedules marked as paid
        $paymentSchedule = $this->order->payment_schedule;
        $dpSchedule = collect($paymentSchedule)->firstWhere('type', 'dp_50');
        $balanceSchedule = collect($paymentSchedule)->firstWhere('type', 'balance_50');
        
        $this->assertEquals('paid', $dpSchedule['status']);
        $this->assertEquals('paid', $balanceSchedule['status']);

        // Assert quote payment status
        $this->customerQuote->refresh();
        $this->assertTrue($this->customerQuote->isFullyPaid());
        $this->assertEquals(10000000, $this->customerQuote->getTotalPaidAmount());
        $this->assertEquals(0, $this->customerQuote->getRemainingPaymentAmount());
    }

    /**
     * Test payment status helpers
     *
     * @test
     */
    public function test_payment_status_helpers(): void
    {
        // Before acceptance
        $this->assertEquals('not_applicable', $this->customerQuote->getPaymentStatus());
        $this->assertFalse($this->customerQuote->isDownPaymentPaid());
        $this->assertFalse($this->customerQuote->isFullyPaid());

        // Accept quote
        $this->customerQuote->update([
            'customer_accepted_at' => now(),
            'accepted_by' => $this->customer->id,
        ]);

        $approvalService = app(ApprovalService::class);
        $approvalService->processAcceptance($this->customerQuote);

        // After acceptance, before payment
        $this->customerQuote->refresh();
        $this->assertEquals('unpaid', $this->customerQuote->getPaymentStatus());
        $this->assertFalse($this->customerQuote->isDownPaymentPaid());
        $this->assertFalse($this->customerQuote->isFullyPaid());

        // Pay DP
        $dpTransaction = OrderPaymentTransaction::where('order_id', $this->order->id)
            ->where('type', 'customer_payment_dp')
            ->first();

        $this->paymentTrackingService->recordPayment($dpTransaction, 'bank_transfer');

        // After DP payment
        $this->customerQuote->refresh();
        $this->order->refresh();
        $this->assertEquals('partial', $this->customerQuote->getPaymentStatus());
        $this->assertTrue($this->customerQuote->isDownPaymentPaid());
        $this->assertFalse($this->customerQuote->isFullyPaid());

        // Pay balance
        $balanceTransaction = OrderPaymentTransaction::where('order_id', $this->order->id)
            ->where('type', 'customer_payment_balance')
            ->first();

        $this->paymentTrackingService->recordPayment($balanceTransaction, 'bank_transfer');

        // After full payment
        $this->customerQuote->refresh();
        $this->order->refresh();
        $this->assertEquals('paid', $this->customerQuote->getPaymentStatus());
        $this->assertTrue($this->customerQuote->isDownPaymentPaid());
        $this->assertTrue($this->customerQuote->isFullyPaid());
    }

    /**
     * Test overdue payment detection
     *
     * @test
     */
    public function test_overdue_payment_detection(): void
    {
        // Accept quote
        $this->customerQuote->update([
            'customer_accepted_at' => now(),
            'accepted_by' => $this->customer->id,
        ]);

        $approvalService = app(ApprovalService::class);
        $approvalService->processAcceptance($this->customerQuote);

        // Get DP transaction and set due date to past
        $dpTransaction = OrderPaymentTransaction::where('order_id', $this->order->id)
            ->where('type', 'customer_payment_dp')
            ->first();

        $dpTransaction->update(['due_at' => now()->subDays(1)]);

        // Check if overdue
        $this->assertTrue($this->paymentTrackingService->isPaymentOverdue($dpTransaction));

        // Get overdue payments
        $overduePayments = $this->paymentTrackingService->getOverduePayments($this->customerQuote);
        $this->assertCount(1, $overduePayments);

        // Pay the transaction
        $this->paymentTrackingService->recordPayment($dpTransaction, 'bank_transfer');

        // Should no longer be overdue
        $dpTransaction->refresh();
        $this->assertFalse($this->paymentTrackingService->isPaymentOverdue($dpTransaction));

        // No overdue payments
        $overduePayments = $this->paymentTrackingService->getOverduePayments($this->customerQuote->fresh());
        $this->assertCount(0, $overduePayments);
    }
}

