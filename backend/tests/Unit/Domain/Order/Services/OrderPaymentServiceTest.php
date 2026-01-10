<?php

namespace Tests\Unit\Domain\Order\Services;

use App\Domain\Order\Services\OrderPaymentService;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderPaymentTransaction;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderPaymentServiceTest extends TestCase
{
    use RefreshDatabase;

    protected OrderPaymentService $paymentService;
    protected TenantEloquentModel $tenant;
    protected Customer $customer;
    protected Vendor $vendor;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        $this->paymentService = app(OrderPaymentService::class);
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'vendor_id' => $this->vendor->id,
            'total_amount' => 1000000,
            'total_paid_amount' => 0,
            'total_disbursed_amount' => 0,
            'payment_status' => 'unpaid',
            'currency' => 'IDR',
        ]);
    }

    public function test_record_customer_payment_with_valid_amount(): void
    {
        $transaction = $this->paymentService->recordCustomerPayment(
            $this->order,
            [
                'amount' => 500000,
                'method' => 'bank_transfer',
                'reference' => 'TRX-001',
                'paid_at' => now(),
            ]
        );

        $this->assertInstanceOf(OrderPaymentTransaction::class, $transaction);
        $this->assertEquals(500000, $transaction->amount);
        $this->assertEquals('incoming', $transaction->direction);
        $this->assertEquals('down_payment', $transaction->type);
        $this->assertEquals('completed', $transaction->status);
        $this->assertEquals($this->order->id, $transaction->order_id);
        $this->assertEquals($this->customer->id, $transaction->customer_id);
        $this->assertNull($transaction->vendor_id);

        $this->order->refresh();
        $this->assertEquals(500000, $this->order->total_paid_amount);
        $this->assertEquals('partially_paid', $this->order->payment_status);
    }

    public function test_record_down_payment_detection(): void
    {
        $downPaymentAmount = 500000;

        $transaction = $this->paymentService->recordCustomerPayment(
            $this->order,
            [
                'amount' => $downPaymentAmount,
                'down_payment_amount' => $downPaymentAmount,
                'method' => 'bank_transfer',
                'reference' => 'DP-001',
                'type' => 'down_payment',
            ]
        );

        $this->assertEquals('down_payment', $transaction->type);
        $this->order->refresh();
        $this->assertEquals($downPaymentAmount, $this->order->down_payment_amount);
        $this->assertNotNull($this->order->down_payment_paid_at);
    }

    public function test_record_partial_payment_handling(): void
    {
        $transaction1 = $this->paymentService->recordCustomerPayment(
            $this->order,
            [
                'amount' => 400000,
                'method' => 'cash',
                'paid_at' => now(),
            ]
        );

        $this->order->refresh();
        $this->assertEquals(400000, $this->order->total_paid_amount);
        $this->assertEquals('partially_paid', $this->order->payment_status);

        $transaction2 = $this->paymentService->recordCustomerPayment(
            $this->order,
            [
                'amount' => 600000,
                'method' => 'bank_transfer',
                'paid_at' => now(),
            ]
        );

        $this->order->refresh();
        $this->assertEquals(1000000, $this->order->total_paid_amount);
        $this->assertEquals('paid', $this->order->payment_status);
        $this->assertNotNull($this->order->payment_date);
    }

    public function test_final_payment_detection_when_amount_equals_remaining(): void
    {
        $this->order->update([
            'total_paid_amount' => 400000,
            'payment_status' => 'partially_paid',
        ]);

        $transaction = $this->paymentService->recordCustomerPayment(
            $this->order,
            [
                'amount' => 600000,
                'method' => 'bank_transfer',
                'paid_at' => now(),
            ]
        );

        $this->assertEquals('final_payment', $transaction->type);
        $this->order->refresh();
        $this->assertEquals('paid', $this->order->payment_status);
    }

    public function test_payment_amount_capped_to_remaining(): void
    {
        $this->order->update(['total_paid_amount' => 600000]);

        $transaction = $this->paymentService->recordCustomerPayment(
            $this->order,
            [
                'amount' => 600000,
                'method' => 'bank_transfer',
                'paid_at' => now(),
            ]
        );

        $this->assertEquals(400000, $transaction->amount);
        $this->order->refresh();
        $this->assertEquals(1000000, $this->order->total_paid_amount);
    }

    public function test_throw_exception_when_order_already_paid(): void
    {
        $this->order->update([
            'total_paid_amount' => 1000000,
            'payment_status' => 'paid',
        ]);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Pesanan sudah lunas');

        $this->paymentService->recordCustomerPayment(
            $this->order,
            ['amount' => 100000]
        );
    }

    public function test_throw_exception_with_zero_or_negative_amount(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Jumlah pembayaran harus lebih besar dari 0');

        $this->paymentService->recordCustomerPayment(
            $this->order,
            ['amount' => 0]
        );
    }

    public function test_payment_method_validation(): void
    {
        $transaction = $this->paymentService->recordCustomerPayment(
            $this->order,
            [
                'amount' => 500000,
                'method' => 'bank_transfer',
                'paid_at' => now(),
            ]
        );

        $this->assertEquals('bank_transfer', $transaction->method);
        $this->order->refresh();
        $this->assertEquals('bank_transfer', $this->order->payment_method);
    }

    public function test_duplicate_payment_prevention_through_reference(): void
    {
        $reference = 'TRX-UNIQUE-001';

        $this->paymentService->recordCustomerPayment(
            $this->order,
            [
                'amount' => 300000,
                'method' => 'bank_transfer',
                'reference' => $reference,
                'paid_at' => now(),
            ]
        );

        $this->order->refresh();
        $this->assertEquals(300000, $this->order->total_paid_amount);

        $transactions = OrderPaymentTransaction::where('reference', $reference)->get();
        $this->assertCount(1, $transactions);
    }

    public function test_vendor_disbursement_recording(): void
    {
        $this->order->update(['total_paid_amount' => 1000000]);

        $transaction = $this->paymentService->recordVendorDisbursement(
            $this->order,
            [
                'amount' => 800000,
                'vendor_id' => $this->vendor->id,
                'method' => 'bank_transfer',
                'reference' => 'DISB-001',
                'paid_at' => now(),
            ]
        );

        $this->assertInstanceOf(OrderPaymentTransaction::class, $transaction);
        $this->assertEquals(800000, $transaction->amount);
        $this->assertEquals('outgoing', $transaction->direction);
        $this->assertEquals('vendor_disbursement', $transaction->type);
        $this->assertEquals($this->vendor->id, $transaction->vendor_id);
        $this->assertNull($transaction->customer_id);

        $this->order->refresh();
        $this->assertEquals(800000, $this->order->total_disbursed_amount);
    }

    public function test_multiple_vendor_disbursements(): void
    {
        $this->order->update(['total_paid_amount' => 1000000]);

        $disbursement1 = $this->paymentService->recordVendorDisbursement(
            $this->order,
            ['amount' => 400000, 'vendor_id' => $this->vendor->id]
        );

        $disbursement2 = $this->paymentService->recordVendorDisbursement(
            $this->order,
            ['amount' => 400000, 'vendor_id' => $this->vendor->id]
        );

        $this->order->refresh();
        $this->assertEquals(800000, $this->order->total_disbursed_amount);

        $disbursements = OrderPaymentTransaction::where('order_id', $this->order->id)
            ->where('direction', 'outgoing')
            ->get();
        $this->assertCount(2, $disbursements);
    }

    public function test_throw_exception_when_disbursing_without_vendor(): void
    {
        $this->order->update(['vendor_id' => null]);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Vendor harus dihubungkan sebelum melakukan disbursement');

        $this->paymentService->recordVendorDisbursement(
            $this->order,
            ['amount' => 500000]
        );
    }

    public function test_throw_exception_with_zero_disbursement_amount(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Jumlah disbursement harus lebih besar dari 0');

        $this->paymentService->recordVendorDisbursement(
            $this->order,
            ['amount' => 0, 'vendor_id' => $this->vendor->id]
        );
    }

    public function test_payment_metadata_tracking(): void
    {
        $this->paymentService->recordCustomerPayment(
            $this->order,
            [
                'amount' => 500000,
                'method' => 'bank_transfer',
                'reference' => 'TRX-001',
                'paid_at' => now(),
            ]
        );

        $this->order->refresh();
        $metadata = $this->order->metadata;

        $this->assertIsArray($metadata);
        $this->assertArrayHasKey('payments', $metadata);
        $this->assertArrayHasKey('last_customer_payment_at', $metadata['payments']);
        $this->assertArrayHasKey('last_payment_reference', $metadata['payments']);
        $this->assertArrayHasKey('last_payment_method', $metadata['payments']);
    }

    public function test_vendor_disbursement_metadata_tracking(): void
    {
        $this->order->update(['total_paid_amount' => 1000000]);

        $this->paymentService->recordVendorDisbursement(
            $this->order,
            [
                'amount' => 800000,
                'vendor_id' => $this->vendor->id,
                'method' => 'bank_transfer',
                'reference' => 'DISB-001',
                'paid_at' => now(),
            ]
        );

        $this->order->refresh();
        $metadata = $this->order->metadata;

        $this->assertArrayHasKey('payments', $metadata);
        $this->assertArrayHasKey('last_vendor_disbursement_at', $metadata['payments']);
        $this->assertArrayHasKey('last_disbursement_reference', $metadata['payments']);
    }

    public function test_payment_with_custom_currency(): void
    {
        $this->order->update(['currency' => 'USD']);

        $transaction = $this->paymentService->recordCustomerPayment(
            $this->order,
            [
                'amount' => 500000,
                'currency' => 'USD',
                'method' => 'bank_transfer',
                'paid_at' => now(),
            ]
        );

        $this->assertEquals('USD', $transaction->currency);
    }

    public function test_payment_with_due_date(): void
    {
        $dueDate = now()->addDays(7);

        $transaction = $this->paymentService->recordCustomerPayment(
            $this->order,
            [
                'amount' => 500000,
                'due_at' => $dueDate,
                'method' => 'bank_transfer',
                'paid_at' => now(),
            ]
        );

        $this->order->refresh();
        $this->assertEquals($dueDate->toDateString(), $this->order->down_payment_due_at->toDateString());
    }

    public function test_down_payment_amount_stored_in_order(): void
    {
        $downPaymentAmount = 600000;

        $this->paymentService->recordCustomerPayment(
            $this->order,
            [
                'amount' => 300000,
                'down_payment_amount' => $downPaymentAmount,
                'method' => 'bank_transfer',
                'paid_at' => now(),
            ]
        );

        $this->order->refresh();
        $this->assertEquals($downPaymentAmount, $this->order->down_payment_amount);
    }

    public function test_transaction_tenant_scoping(): void
    {
        $transaction = $this->paymentService->recordCustomerPayment(
            $this->order,
            [
                'amount' => 500000,
                'method' => 'bank_transfer',
                'paid_at' => now(),
            ]
        );

        $this->assertEquals($this->tenant->id, $transaction->tenant_id);
    }
}
