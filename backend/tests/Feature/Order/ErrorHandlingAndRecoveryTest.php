<?php

namespace Tests\Feature\Order;

use App\Application\Order\UseCases\{
    CreatePurchaseOrderUseCase,
    AssignVendorUseCase,
    NegotiateWithVendorUseCase,
    CancelOrderUseCase
};
use App\Application\Order\Commands\{
    CreatePurchaseOrderCommand,
    AssignVendorCommand,
    NegotiateWithVendorCommand,
    CancelOrderCommand
};
use App\Application\Order\Services\{PaymentApplicationService, VendorNegotiationService};
use App\Infrastructure\Persistence\Eloquent\Models\{Customer, Order, Product, Vendor};
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use InvalidArgumentException;
use Tests\TestCase;

class ErrorHandlingAndRecoveryTest extends TestCase
{
    use RefreshDatabase;

    private CreatePurchaseOrderUseCase $createPurchaseOrderUseCase;
    private AssignVendorUseCase $assignVendorUseCase;
    private NegotiateWithVendorUseCase $negotiateWithVendorUseCase;
    private CancelOrderUseCase $cancelOrderUseCase;
    private PaymentApplicationService $paymentService;
    private VendorNegotiationService $negotiationService;

    private TenantEloquentModel $tenant;
    private Customer $customer;
    private Vendor $vendor;
    private Product $product;
    private $orderRepository;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createPurchaseOrderUseCase = app(CreatePurchaseOrderUseCase::class);
        $this->assignVendorUseCase = app(AssignVendorUseCase::class);
        $this->negotiateWithVendorUseCase = app(NegotiateWithVendorUseCase::class);
        $this->cancelOrderUseCase = app(CancelOrderUseCase::class);
        $this->paymentService = app(PaymentApplicationService::class);
        $this->negotiationService = app(VendorNegotiationService::class);
        $this->orderRepository = app(\App\Domain\Order\Repositories\OrderRepositoryInterface::class);

        Event::fake();

        $this->tenant = TenantEloquentModel::factory()->create();
        
        // Create ExchangeRateSetting for tenant (required by CreatePurchaseOrderUseCase)
        \App\Models\ExchangeRateSetting::factory()->manual()->withRate(15000.0)->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        // Ensure Customer, Vendor, Product have uuid fields
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString()
        ]);
        
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString()
        ]);
        
        $this->product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString()
        ]);
    }

    /** @test */
    public function invalid_order_id_throws_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);

        $this->paymentService->verifyPayment(
            $this->tenant->uuid,
            'nonexistent-order-id',
            100000.00
        );
    }

    /** @test */
    public function payment_exceeding_order_total_throws_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Payment amount exceeds order total');

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
    public function negative_payment_amount_throws_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Payment amount must be non-negative');

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
            -5000.00
        );
    }

    /** @test */
    public function invalid_percentage_in_downpayment_throws_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Percentage must be between 0 and 100');

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

        $this->paymentService->calculateDownPayment(
            $this->tenant->uuid,
            $order->getId(),
            150.0
        );
    }

    /** @test */
    public function invalid_quote_price_throws_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote price must be non-negative');

        $this->negotiationService->requestQuote(
            'test-negotiation',
            $this->vendor->uuid,
            [
                'price' => -1000.00,
                'lead_time_days' => 5,
            ]
        );
    }

    /** @test */
    public function missing_lead_time_throws_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Lead time must be greater than zero');

        $this->negotiationService->requestQuote(
            'test-negotiation',
            $this->vendor->uuid,
            [
                'price' => 95000.00,
                'lead_time_days' => 0,
            ]
        );
    }

    /** @test */
    public function invalid_negotiation_deadline_throws_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Deadline must be in the future');

        $this->negotiationService->setNegotiationDeadline('test-negotiation', 0);
    }

    /** @test */
    public function invalid_concluded_price_throws_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Agreed price must be non-negative');

        $this->negotiationService->concludeNegotiation(
            'test-negotiation',
            (string) $this->vendor->id,
            -1000.00,
            5
        );
    }

    /** @test */
    public function invalid_concluded_lead_time_throws_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Agreed lead time must be greater than zero');

        $this->negotiationService->concludeNegotiation(
            'test-negotiation',
            (string) $this->vendor->id,
            92000.00,
            0
        );
    }

    /** @test */
    public function empty_quote_comparison_throws_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('At least one quote is required');

        $this->negotiationService->compareQuotes([]);
    }

    /** @test */
    public function cross_tenant_order_access_throws_exception(): void
    {
        $tenantB = TenantEloquentModel::factory()->create();
        
        // Create ExchangeRateSetting for tenantB
        \App\Models\ExchangeRateSetting::factory()->manual()->withRate(15000.0)->create([
            'tenant_id' => $tenantB->id,
        ]);

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

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('belongs to different tenant');

        $this->paymentService->verifyPayment(
            $tenantB->uuid,
            $order->getId(),
            100000.00
        );
    }

    /** @test */
    public function cross_vendor_assignment_throws_exception(): void
    {
        $this->expectException(InvalidArgumentException::class);

        $tenantB = TenantEloquentModel::factory()->create();
        
        // Create ExchangeRateSetting for tenantB
        \App\Models\ExchangeRateSetting::factory()->manual()->withRate(15000.0)->create([
            'tenant_id' => $tenantB->id,
        ]);
        
        $vendorB = Vendor::factory()->create(['tenant_id' => $tenantB->id]);

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

        $assignCommand = new AssignVendorCommand(
            orderUuid: $order->getId()->getValue(),
            vendorUuid: $vendorB->uuid,
            quotedPrice: 9500000, // 95000.00 in cents
            leadTimeDays: 5
        );

        $this->assignVendorUseCase->execute($assignCommand);
    }

    /** @test */
    public function order_recovery_after_partial_failure(): void
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
        $this->assertEquals('pending', $order->getStatus()->value);
        
        // Transition order to VENDOR_SOURCING status first
        $order->changeStatus(\App\Domain\Order\Enums\OrderStatus::VENDOR_SOURCING);
        $this->orderRepository->save($order);

        $assignCommand = new AssignVendorCommand(
            orderUuid: $order->getId()->getValue(),
            vendorUuid: $this->vendor->uuid,
            quotedPrice: 9500000, // 95000.00 in cents
            leadTimeDays: 5
        );

        $order = $this->assignVendorUseCase->execute($assignCommand);
        $this->assertEquals($this->vendor->uuid, $order->getVendorId()->getValue());

        try {
            $this->negotiationService->requestQuote(
                'negotiation-attempt-1',
                $this->vendor->uuid,
                [
                    'price' => -5000.00,
                    'lead_time_days' => 5,
                ]
            );
        } catch (InvalidArgumentException $e) {
            $this->assertStringContainsString('Quote price must be non-negative', $e->getMessage());
        }

        // Verify vendor is still assigned
        $this->assertEquals($this->vendor->uuid, $order->getVendorId()->getValue());

        $negotiateCommand = new NegotiateWithVendorCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            vendorId: $this->vendor->uuid,
            quotedPrice: 95000.00,
            leadTimeInDays: 5
        );

        $order = $this->negotiateWithVendorUseCase->execute($negotiateCommand);
        $this->assertEquals('vendor_negotiation', $order->getStatus()->value);
    }

    /** @test */
    public function order_cancellation_on_error_condition(): void
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

        $cancelCommand = new CancelOrderCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            cancellationReason: 'Error condition encountered'
        );

        $cancelledOrder = $this->cancelOrderUseCase->execute($cancelCommand);
        $this->assertEquals('cancelled', $cancelledOrder->getStatus()->value);

        $freshOrder = $this->orderRepository->findById(new \App\Domain\Shared\ValueObjects\UuidValueObject($order->getId()));
        $this->assertEquals('cancelled', $freshOrder->getStatus()->value);
    }

    /** @test */
    public function multiple_payment_attempts_with_error_recovery(): void
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

        try {
            $this->paymentService->verifyPayment(
                $this->tenant->uuid,
                $order->getId(),
                150000.00
            );
        } catch (InvalidArgumentException $e) {
            $this->assertStringContainsString('Payment amount exceeds order total', $e->getMessage());
        }

        $result = $this->paymentService->verifyPayment(
            $this->tenant->uuid,
            $order->getId(),
            100000.00
        );

        $this->assertEquals('full_payment', $result['payment_status']);
    }

    /** @test */
    public function negotiation_recovery_from_validation_errors(): void
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

        $order->changeStatus(\App\Domain\Order\Enums\OrderStatus::VENDOR_SOURCING);
        $this->orderRepository->save($order);

        $assignCommand = new AssignVendorCommand(
            orderUuid: $order->getId()->getValue(),
            vendorUuid: $this->vendor->uuid,
            quotedPrice: 9500000, // 95000.00 in cents
            leadTimeDays: 5
        );

        $order = $this->assignVendorUseCase->execute($assignCommand);

        try {
            $negotiationService = $this->negotiationService;
            $negotiationService->concludeNegotiation(
                'negotiation-1',
                $this->vendor->uuid,
                -5000.00,
                5
            );
        } catch (InvalidArgumentException $e) {
            $this->assertStringContainsString('Agreed price must be non-negative', $e->getMessage());
        }

        $validConclusion = $this->negotiationService->concludeNegotiation(
            'negotiation-1',
            $this->vendor->uuid,
            95000.00,
            5
        );

        $this->assertEquals('concluded', $validConclusion['status']);
        $this->assertEquals(95000.00, $validConclusion['agreed_price']);
    }
}
