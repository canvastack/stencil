<?php

namespace Tests\Integration\Application\Order;

use App\Application\Order\UseCases\CreatePurchaseOrderUseCase;
use App\Application\Order\UseCases\VerifyCustomerPaymentUseCase;
use App\Application\Order\UseCases\RequestFinalPaymentUseCase;
use App\Application\Order\UseCases\RefundOrderUseCase;
use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Application\Order\Commands\VerifyCustomerPaymentCommand;
use App\Application\Order\Commands\RequestFinalPaymentCommand;
use App\Application\Order\Commands\RefundOrderCommand;
use App\Application\Order\Services\PaymentApplicationService;
use App\Infrastructure\Persistence\Eloquent\Models\{Customer, Order, Product, Tenant, Vendor};
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class PaymentWorkflowIntegrationTest extends TestCase
{
    use DatabaseTransactions;

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
    public function payment_service_verifies_payment_successfully(): void
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

        $result = $this->paymentService->verifyPayment(
            $this->tenant->uuid,
            $order->getId(),
            100000.00
        );

        $this->assertEquals(100000.00, $result['total_amount']);
        $this->assertEquals(100000.00, $result['paid_amount']);
        $this->assertEquals(0, $result['pending_amount']);
        $this->assertEquals('full_payment', $result['payment_status']);
    }

    /** @test */
    public function payment_service_validates_payment_amount(): void
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
            $order->getId(),
            150000.00
        );
    }

    /** @test */
    public function payment_service_calculates_down_payment(): void
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

        $result = $this->paymentService->calculateDownPayment(
            $this->tenant->uuid,
            $order->getId(),
            30.0
        );

        $this->assertEquals(100000.00, $result['total_amount']);
        $this->assertEquals(30.0, $result['down_payment_percentage']);
        $this->assertEquals(30000.00, $result['down_payment_amount']);
        $this->assertEquals(70000.00, $result['remaining_amount']);
    }

    /** @test */
    public function payment_service_generates_invoice_number(): void
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

        $invoiceNumber = $this->paymentService->generateInvoiceNumber(
            $this->tenant->uuid,
            $order->getId()
        );

        $this->assertStringStartsWith('INV-', $invoiceNumber);
        $this->assertStringContainsString($order->order_number, $invoiceNumber);
    }

    /** @test */
    public function payment_service_records_payment_transaction(): void
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

        $result = $this->paymentService->recordPaymentTransaction(
            $this->tenant->uuid,
            $order->getId(),
            100000.00,
            'bank_transfer',
            'TXN-20250101-001'
        );

        $this->assertEquals($this->tenant->uuid, $result['tenant_id']);
        $this->assertEquals($order->getId(), $result['order_id']);
        $this->assertEquals(100000.00, $result['amount']);
        $this->assertEquals('bank_transfer', $result['payment_method']);
        $this->assertEquals('TXN-20250101-001', $result['transaction_reference']);
        $this->assertEquals('recorded', $result['status']);
    }

    /** @test */
    public function partial_payment_workflow(): void
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

        $partialPaymentResult = $this->paymentService->verifyPayment(
            $this->tenant->uuid,
            $order->getId(),
            50000.00
        );

        $this->assertEquals(100000.00, $partialPaymentResult['total_amount']);
        $this->assertEquals(50000.00, $partialPaymentResult['paid_amount']);
        $this->assertEquals(50000.00, $partialPaymentResult['pending_amount']);
        $this->assertEquals('partial_payment', $partialPaymentResult['payment_status']);

        $remainingPaymentResult = $this->paymentService->verifyPayment(
            $this->tenant->uuid,
            $order->getId(),
            50000.00
        );

        $this->assertEquals(100000.00, $remainingPaymentResult['total_amount']);
        $this->assertEquals(50000.00, $remainingPaymentResult['paid_amount']);
        $this->assertEquals(50000.00, $remainingPaymentResult['pending_amount']);
        $this->assertEquals('partial_payment', $remainingPaymentResult['payment_status']);
    }

    /** @test */
    public function payment_service_respects_tenant_isolation(): void
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
            $order1->getId(),
            100000.00
        );

        $result2 = $this->paymentService->verifyPayment(
            $tenantB->uuid,
            $order2->getId(),
            200000.00
        );

        $this->assertEquals(100000.00, $result1['total_amount']);
        $this->assertEquals(200000.00, $result2['total_amount']);

        $this->expectException(\InvalidArgumentException::class);
        $this->paymentService->verifyPayment(
            $this->tenant->uuid,
            $order2->getId(),
            100000.00
        );
    }
}
