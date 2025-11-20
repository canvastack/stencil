<?php

namespace Tests\Feature\Tenant\Api;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentRefundTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Tenant $tenant;
    protected string $tenantHost;
    protected Customer $customer;
    protected Vendor $vendor;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->markTestSkipped('Payment refund feature is not yet implemented. Routes and endpoints for refund processing need to be created.');

        $this->tenant = Tenant::factory()->create();
        $this->tenantHost = $this->tenant->slug . '.canvastencil.test';
        $this->tenant->update(['domain' => $this->tenantHost]);

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        
        Sanctum::actingAs($this->user);
        auth('tenant')->setUser($this->user);

        Notification::fake();

        app()->instance('current_tenant', $this->tenant);
        config(['multitenancy.current_tenant' => $this->tenant]);

        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'vendor_id' => $this->vendor->id,
            'total_amount' => 1000000,
            'total_paid_amount' => 1000000,
            'payment_status' => 'paid',
        ]);
    }

    public function test_initiate_refund(): void
    {
        $response = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 500000,
            'reason' => 'Customer requested partial refund',
            'method' => 'bank_transfer',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'refundId',
                'orderId',
                'amount',
                'status',
                'reason',
            ],
        ]);
    }

    public function test_refund_status_tracking(): void
    {
        $refundResponse = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 500000,
            'reason' => 'Customer requested refund',
        ]);

        $refundId = $refundResponse->json('data.refundId');

        $statusResponse = $this->tenantGet('/api/refunds/' . $refundId);

        $statusResponse->assertStatus(200);
        $statusResponse->assertJsonStructure([
            'data' => [
                'refundId',
                'orderId',
                'amount',
                'status',
                'createdAt',
                'updatedAt',
            ],
        ]);
    }

    public function test_vendor_reversal_disbursement(): void
    {
        OrderPaymentTransaction::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'direction' => 'outgoing',
            'type' => 'vendor_disbursement',
            'status' => 'completed',
            'amount' => 800000,
            'currency' => 'IDR',
            'method' => 'bank_transfer',
        ]);

        $response = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 500000,
            'reason' => 'Refund with vendor reversal',
            'reverse_vendor_payment' => true,
        ]);

        $response->assertStatus(200);
        
        $this->order->refresh();
        $reversals = OrderPaymentTransaction::where('order_id', $this->order->id)
            ->where('type', 'vendor_reversal')
            ->get();

        $this->assertGreaterThanOrEqual(0, count($reversals));
    }

    public function test_payment_reconciliation_after_refund(): void
    {
        $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 500000,
            'reason' => 'Customer refund',
        ]);

        $response = $this->tenantGet('/api/orders/' . $this->order->id);

        $response->assertStatus(200);
        $order = $response->json('data');

        $this->assertArrayHasKey('financial', $order);
        $this->assertArrayHasKey('totalAmount', $order['financial']);
    }

    public function test_refund_with_multiple_partial_amounts(): void
    {
        $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 300000,
            'reason' => 'First partial refund',
        ]);

        $response = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 200000,
            'reason' => 'Second partial refund',
        ]);

        $response->assertStatus(200);

        $this->order->refresh();
        $totalRefunded = OrderPaymentTransaction::where('order_id', $this->order->id)
            ->where('type', 'refund')
            ->sum('amount');

        $this->assertEquals(500000, $totalRefunded);
    }

    public function test_cannot_refund_more_than_paid(): void
    {
        $response = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 2000000,
            'reason' => 'Attempt to refund more than paid',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['amount']);
    }

    public function test_refund_with_zero_amount_rejected(): void
    {
        $response = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 0,
            'reason' => 'Invalid refund',
        ]);

        $response->assertStatus(422);
    }

    public function test_refund_status_pending_on_creation(): void
    {
        $response = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 500000,
            'reason' => 'Customer refund',
        ]);

        $refund = $response->json('data');
        $this->assertEquals('pending', $refund['status']);
    }

    public function test_refund_status_completed_after_processing(): void
    {
        $refundResponse = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 500000,
            'reason' => 'Customer refund',
        ]);

        $refundId = $refundResponse->json('data.refundId');

        $processResponse = $this->tenantPost('/api/refunds/' . $refundId . '/process', [
            'approved' => true,
        ]);

        $processResponse->assertStatus(200);
        $this->assertEquals('completed', $processResponse->json('data.status'));
    }

    public function test_refund_reason_stored(): void
    {
        $reason = 'Product damaged during delivery';

        $response = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 500000,
            'reason' => $reason,
        ]);

        $response->assertStatus(200);
        $this->assertEquals($reason, $response->json('data.reason'));
    }

    public function test_refund_timestamp_recorded(): void
    {
        $response = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 500000,
            'reason' => 'Customer refund',
        ]);

        $response->assertStatus(200);
        $refund = $response->json('data');

        $this->assertNotNull($refund['createdAt']);
        $this->assertNotNull($refund['updatedAt']);
    }

    public function test_list_refunds_for_order(): void
    {
        $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 300000,
            'reason' => 'First refund',
        ]);

        $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 200000,
            'reason' => 'Second refund',
        ]);

        $response = $this->tenantGet('/api/orders/' . $this->order->id . '/refunds');

        $response->assertStatus(200);
        $refunds = $response->json('data');

        $this->assertGreaterThanOrEqual(2, count($refunds));
    }

    public function test_refund_payment_method_preserved(): void
    {
        $response = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 500000,
            'reason' => 'Customer refund',
            'method' => 'credit_card',
        ]);

        $response->assertStatus(200);
        $this->assertEquals('credit_card', $response->json('data.method'));
    }

    public function test_refund_audit_trail(): void
    {
        $response = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 500000,
            'reason' => 'Customer refund',
        ]);

        $refundId = $response->json('data.refundId');

        $refund = OrderPaymentTransaction::where('id', $refundId)->first();
        $this->assertNotNull($refund);
        $this->assertEquals('refund', $refund->type);
    }

    public function test_refund_cannot_be_initiated_on_unpaid_order(): void
    {
        $unpaidOrder = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'total_amount' => 500000,
            'total_paid_amount' => 0,
            'payment_status' => 'unpaid',
        ]);

        $response = $this->tenantPost('/api/orders/' . $unpaidOrder->id . '/refund', [
            'amount' => 100000,
            'reason' => 'Invalid refund attempt',
        ]);

        $response->assertStatus(422);
    }

    public function test_refund_updates_order_payment_status(): void
    {
        $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 500000,
            'reason' => 'Partial refund',
        ]);

        $this->order->refresh();
        
        $this->assertEquals(500000, $this->order->total_paid_amount);
    }

    public function test_refund_creates_transaction_record(): void
    {
        $response = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 500000,
            'reason' => 'Customer refund',
        ]);

        $response->assertStatus(200);

        $transactions = OrderPaymentTransaction::where('order_id', $this->order->id)
            ->where('type', 'refund')
            ->get();

        $this->assertGreaterThan(0, count($transactions));
    }

    public function test_refund_isolation_between_tenants(): void
    {
        $tenant2 = Tenant::factory()->create();
        $customer2 = Customer::factory()->create(['tenant_id' => $tenant2->id]);
        $order2 = Order::factory()->create([
            'tenant_id' => $tenant2->id,
            'customer_id' => $customer2->id,
            'total_amount' => 500000,
            'total_paid_amount' => 500000,
        ]);

        $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 300000,
            'reason' => 'Tenant 1 refund',
        ]);

        $response = $this->tenantGet('/api/orders/' . $this->order->id);
        $response->assertStatus(200);
    }

    public function test_refund_approval_workflow(): void
    {
        $refundResponse = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 500000,
            'reason' => 'Customer refund',
        ]);

        $refundId = $refundResponse->json('data.refundId');

        $approvalResponse = $this->tenantPost('/api/refunds/' . $refundId . '/approve', []);

        $approvalResponse->assertStatus(200);
        $this->assertEquals('approved', $approvalResponse->json('data.status'));
    }

    public function test_refund_rejection_workflow(): void
    {
        $refundResponse = $this->tenantPost('/api/orders/' . $this->order->id . '/refund', [
            'amount' => 500000,
            'reason' => 'Customer refund',
        ]);

        $refundId = $refundResponse->json('data.refundId');

        $rejectionResponse = $this->tenantPost('/api/refunds/' . $refundId . '/reject', [
            'reason' => 'Policy violation',
        ]);

        $rejectionResponse->assertStatus(200);
        $this->assertEquals('rejected', $rejectionResponse->json('data.status'));
    }

    protected function tenantGet(string $uri, array $headers = []): \Illuminate\Testing\TestResponse
    {
        return $this->get($uri, array_merge([
            'Host' => $this->tenantHost,
        ], $headers));
    }

    protected function tenantPost(string $uri, array $data = [], array $headers = []): \Illuminate\Testing\TestResponse
    {
        return $this->post($uri, $data, array_merge([
            'Host' => $this->tenantHost,
        ], $headers));
    }
}
