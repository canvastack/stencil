<?php

namespace Tests\Feature\Order;

use App\Application\Order\UseCases\{
    CreatePurchaseOrderUseCase,
    VerifyCustomerPaymentUseCase,
    RequestFinalPaymentUseCase,
    RefundOrderUseCase
};
use App\Application\Order\Commands\{
    CreatePurchaseOrderCommand,
    VerifyCustomerPaymentCommand,
    RequestFinalPaymentCommand,
    RefundOrderCommand
};
use App\Application\Order\Services\PaymentApplicationService;
use App\Infrastructure\Persistence\Eloquent\Models\{Customer, Order, Product, Tenant, Vendor};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class PaymentProcessingTest extends TestCase
{
    use RefreshDatabase;

    private CreatePurchaseOrderUseCase $createPurchaseOrderUseCase;
    private VerifyCustomerPaymentUseCase $verifyCustomerPaymentUseCase;
    private RequestFinalPaymentUseCase $requestFinalPaymentUseCase;
    private RefundOrderUseCase $refundOrderUseCase;
    private PaymentApplicationService $paymentService;

    private Tenant $tenant;
    private Customer $customer;
    private Vendor $vendor;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createPurchaseOrderUseCase = app(CreatePurchaseOrderUseCase::class);
        $this->verifyCustomerPaymentUseCase = app(VerifyCustomerPaymentUseCase::class);
        $this->requestFinalPaymentUseCase = app(RequestFinalPaymentUseCase::class);
        $this->refundOrderUseCase = app(RefundOrderUseCase::class);
        $this->paymentService = app(PaymentApplicationService::class);

        Event::fake();

        $this->tenant = Tenant::factory()->create();
        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    /** @test */
    public function full_payment_processing_workflow(): void
    {
        $createCommand = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 1,
                    'unit_price' => 100000.00,
                ]
            ]
        );

        $order = $this->createPurchaseOrderUseCase->execute($createCommand);

        $downPayment = $this->paymentService->calculateDownPayment(
            $this->tenant->uuid,
            $order->getId()->getValue(),
            30.0
        );

        $this->assertEquals(30000.00, $downPayment['down_payment_amount']);
        $this->assertEquals(70000.00, $downPayment['remaining_amount']);

        $invoiceNumber = $this->paymentService->generateInvoiceNumber(
            $this->tenant->uuid,
            $order->getId()->getValue()
        );

        $this->assertStringStartsWith('INV-', $invoiceNumber);

        $paymentRecord = $this->paymentService->recordPaymentTransaction(
            $this->tenant->uuid,
            $order->getId()->getValue(),
            30000.00,
            'bank_transfer',
            'TXN-DOWN-001'
        );

        $this->assertEquals(30000.00, $paymentRecord['amount']);
        $this->assertEquals('recorded', $paymentRecord['status']);

        $verificationResult = $this->paymentService->verifyPayment(
            $this->tenant->uuid,
            $order->getId()->getValue(),
            30000.00
        );

        $this->assertEquals('partial_payment', $verificationResult['payment_status']);
        $this->assertEquals(70000.00, $verificationResult['pending_amount']);
    }

    /** @test */
    public function downpayment_and_final_payment(): void
    {
        $createCommand = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 1,
                    'unit_price' => 100000.00,
                ]
            ]
        );

        $order = $this->createPurchaseOrderUseCase->execute($createCommand);

        $downPaymentCommand = new VerifyCustomerPaymentCommand(
            orderId: $order->getId()->getValue(),
            tenantId: $this->tenant->uuid,
            paidAmount: 30000.00,
            paymentMethod: 'bank_transfer'
        );

        $order = $this->verifyCustomerPaymentUseCase->execute($downPaymentCommand);
        $this->assertNotNull($order->down_payment_at);

        $finalPaymentRequest = $this->requestFinalPaymentUseCase->execute(new RequestFinalPaymentCommand(
            orderId: $order->getId()->getValue(),
            tenantId: $this->tenant->uuid,
            dueDate: now()->addDays(7)->format('Y-m-d'),
            paymentMethod: 'bank_transfer'
        ));

        $this->assertNotNull($finalPaymentRequest);
    }

    /** @test */
    public function partial_payment_tracking(): void
    {
        $createCommand = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 1,
                    'unit_price' => 100000.00,
                ]
            ]
        );

        $order = $this->createPurchaseOrderUseCase->execute($createCommand);

        $payment1 = $this->paymentService->verifyPayment(
            $this->tenant->uuid,
            $order->getId()->getValue(),
            25000.00
        );

        $this->assertEquals('partial_payment', $payment1['payment_status']);
        $this->assertEquals(75000.00, $payment1['pending_amount']);

        $payment2 = $this->paymentService->verifyPayment(
            $this->tenant->uuid,
            $order->getId()->getValue(),
            50000.00
        );

        $this->assertEquals('partial_payment', $payment2['payment_status']);
        $this->assertEquals(50000.00, $payment2['pending_amount']);

        $payment3 = $this->paymentService->verifyPayment(
            $this->tenant->uuid,
            $order->getId()->getValue(),
            25000.00
        );

        $this->assertEquals('partial_payment', $payment3['payment_status']);
        $this->assertEquals(75000.00, $payment3['pending_amount']);
    }

    /** @test */
    public function payment_amount_validation(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $createCommand = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 1,
                    'unit_price' => 100000.00,
                ]
            ]
        );

        $order = $this->createPurchaseOrderUseCase->execute($createCommand);

        $this->paymentService->verifyPayment(
            $this->tenant->uuid,
            $order->getId()->getValue(),
            150000.00
        );
    }

    /** @test */
    public function negative_payment_amount_rejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $createCommand = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 1,
                    'unit_price' => 100000.00,
                ]
            ]
        );

        $order = $this->createPurchaseOrderUseCase->execute($createCommand);

        $this->paymentService->verifyPayment(
            $this->tenant->uuid,
            $order->getId()->getValue(),
            -5000.00
        );
    }

    /** @test */
    public function invoice_generation_for_payment_tracking(): void
    {
        $createCommand = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 1,
                    'unit_price' => 100000.00,
                ]
            ]
        );

        $order = $this->createPurchaseOrderUseCase->execute($createCommand);

        $invoiceNumber1 = $this->paymentService->generateInvoiceNumber(
            $this->tenant->uuid,
            $order->getId()->getValue()
        );

        $invoiceNumber2 = $this->paymentService->generateInvoiceNumber(
            $this->tenant->uuid,
            $order->getId()->getValue()
        );

        $this->assertStringStartsWith('INV-', $invoiceNumber1);
        $this->assertStringStartsWith('INV-', $invoiceNumber2);
    }

    /** @test */
    public function payment_method_recording(): void
    {
        $createCommand = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 1,
                    'unit_price' => 100000.00,
                ]
            ]
        );

        $order = $this->createPurchaseOrderUseCase->execute($createCommand);

        $bankTransferPayment = $this->paymentService->recordPaymentTransaction(
            $this->tenant->uuid,
            $order->getId()->getValue(),
            50000.00,
            'bank_transfer',
            'TXN-001'
        );

        $this->assertEquals('bank_transfer', $bankTransferPayment['payment_method']);

        $creditCardPayment = $this->paymentService->recordPaymentTransaction(
            $this->tenant->uuid,
            $order->getId()->getValue(),
            50000.00,
            'credit_card',
            'TXN-002'
        );

        $this->assertEquals('credit_card', $creditCardPayment['payment_method']);

        $eWalletPayment = $this->paymentService->recordPaymentTransaction(
            $this->tenant->uuid,
            $order->getId()->getValue(),
            100000.00,
            'e_wallet',
            'TXN-003'
        );

        $this->assertEquals('e_wallet', $eWalletPayment['payment_method']);
    }

    /** @test */
    public function multiple_payment_transactions_same_order(): void
    {
        $createCommand = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 1,
                    'unit_price' => 100000.00,
                ]
            ]
        );

        $order = $this->createPurchaseOrderUseCase->execute($createCommand);

        $transaction1 = $this->paymentService->recordPaymentTransaction(
            $this->tenant->uuid,
            $order->getId()->getValue(),
            30000.00,
            'bank_transfer',
            'DOWN-PAYMENT-001'
        );

        $transaction2 = $this->paymentService->recordPaymentTransaction(
            $this->tenant->uuid,
            $order->getId()->getValue(),
            40000.00,
            'bank_transfer',
            'PARTIAL-PAYMENT-001'
        );

        $transaction3 = $this->paymentService->recordPaymentTransaction(
            $this->tenant->uuid,
            $order->getId()->getValue(),
            30000.00,
            'bank_transfer',
            'FINAL-PAYMENT-001'
        );

        $this->assertEquals(30000.00, $transaction1['amount']);
        $this->assertEquals(40000.00, $transaction2['amount']);
        $this->assertEquals(30000.00, $transaction3['amount']);
        $this->assertEquals(100000.00, $transaction1['amount'] + $transaction2['amount'] + $transaction3['amount']);
    }

    /** @test */
    public function payment_processing_multi_tenant_isolation(): void
    {
        $tenantB = Tenant::factory()->create();
        $customerB = Customer::factory()->create(['tenant_id' => $tenantB->id]);
        $productB = Product::factory()->create(['tenant_id' => $tenantB->id]);

        $command1 = new CreatePurchaseOrderCommand(
            tenantId: $this->tenant->uuid,
            customerId: $this->customer->uuid,
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $this->product->uuid,
                    'quantity' => 1,
                    'unit_price' => 100000.00,
                ]
            ]
        );

        $order1 = $this->createPurchaseOrderUseCase->execute($command1);

        $command2 = new CreatePurchaseOrderCommand(
            tenantId: $tenantB->uuid,
            customerId: $customerB->uuid,
            totalAmount: 200000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => $productB->uuid,
                    'quantity' => 1,
                    'unit_price' => 200000.00,
                ]
            ]
        );

        $order2 = $this->createPurchaseOrderUseCase->execute($command2);

        $result1 = $this->paymentService->verifyPayment(
            $this->tenant->uuid,
            $order1->getId()->getValue(),
            100000.00
        );

        $result2 = $this->paymentService->verifyPayment(
            $tenantB->uuid,
            $order2->getId()->getValue(),
            200000.00
        );

        $this->assertEquals(100000.00, $result1['total_amount']);
        $this->assertEquals(200000.00, $result2['total_amount']);

        $this->expectException(\InvalidArgumentException::class);
        $this->paymentService->verifyPayment(
            $this->tenant->uuid,
            $order2->getId()->getValue(),
            100000.00
        );
    }
}
