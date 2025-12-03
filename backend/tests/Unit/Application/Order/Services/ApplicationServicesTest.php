<?php

namespace Tests\Unit\Application\Order\Services;

use Tests\TestCase;
use App\Application\Order\Services\OrderApplicationService;
use App\Application\Order\Services\PaymentApplicationService;
use App\Application\Order\Services\VendorNegotiationService;
use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Application\Order\Commands\AssignVendorCommand;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Order\Entities\Order;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use Mockery;
use Illuminate\Database\ConnectionInterface;
use InvalidArgumentException;

class ApplicationServicesTest extends TestCase
{
    private OrderRepositoryInterface $orderRepository;
    private VendorRepositoryInterface $vendorRepository;
    private ConnectionInterface $database;

    protected function setUp(): void
    {
        parent::setUp();
        $this->orderRepository = Mockery::mock(OrderRepositoryInterface::class);
        $this->vendorRepository = Mockery::mock(VendorRepositoryInterface::class);
        $this->database = Mockery::mock(ConnectionInterface::class);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function order_application_service_creates_order_with_transaction(): void
    {
        $service = new OrderApplicationService(
            Mockery::mock(\App\Application\Order\UseCases\CreatePurchaseOrderUseCase::class),
            Mockery::mock(\App\Application\Order\UseCases\AssignVendorUseCase::class),
            Mockery::mock(\App\Application\Order\UseCases\NegotiateWithVendorUseCase::class),
            Mockery::mock(\App\Application\Order\UseCases\CreateCustomerQuoteUseCase::class),
            Mockery::mock(\App\Application\Order\UseCases\HandleCustomerApprovalUseCase::class),
            Mockery::mock(\App\Application\Order\UseCases\VerifyCustomerPaymentUseCase::class),
            Mockery::mock(\App\Application\Order\UseCases\UpdateProductionProgressUseCase::class),
            Mockery::mock(\App\Application\Order\UseCases\RequestFinalPaymentUseCase::class),
            Mockery::mock(\App\Application\Order\UseCases\ShipOrderUseCase::class),
            Mockery::mock(\App\Application\Order\UseCases\CompleteOrderUseCase::class),
            Mockery::mock(\App\Application\Order\UseCases\CancelOrderUseCase::class),
            Mockery::mock(\App\Application\Order\UseCases\RefundOrderUseCase::class),
            $this->orderRepository,
            $this->database
        );

        $mockOrder = Mockery::mock(Order::class);
        
        $command = new CreatePurchaseOrderCommand(
            tenantId: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '660e8400-e29b-41d4-a716-446655440001',
            totalAmount: 100000.00,
            currency: 'IDR',
            items: [
                [
                    'product_id' => '770e8400-e29b-41d4-a716-446655440002',
                    'quantity' => 2,
                    'unit_price' => 50000.00,
                ]
            ]
        );

        $this->assertIsObject($service);
    }

    /** @test */
    public function payment_service_verifies_payment_successfully(): void
    {
        $service = new PaymentApplicationService($this->orderRepository, $this->database);

        $mockOrder = Mockery::mock(Order::class);
        $mockOrder->shouldReceive('getTenantId->equals')->andReturn(true);
        $mockOrder->shouldReceive('getTotal->getAmount')->andReturn(100000.00);
        $mockOrder->shouldReceive('getTotal->getCurrency')->andReturn('IDR');

        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockOrder);

        $this->database
            ->shouldReceive('transaction')
            ->once()
            ->andReturnUsing(function ($callback) {
                return $callback();
            });

        $result = $service->verifyPayment(
            '550e8400-e29b-41d4-a716-446655440000',
            '660e8400-e29b-41d4-a716-446655440001',
            100000.00
        );

        $this->assertIsArray($result);
        $this->assertEquals(100000.00, $result['total_amount']);
        $this->assertEquals(100000.00, $result['paid_amount']);
        $this->assertEquals(0, $result['pending_amount']);
        $this->assertEquals('full_payment', $result['payment_status']);
    }

    /** @test */
    public function payment_service_validates_payment_amount(): void
    {
        $service = new PaymentApplicationService($this->orderRepository, $this->database);

        $mockOrder = Mockery::mock(Order::class);
        $mockOrder->shouldReceive('getTenantId->equals')->andReturn(true);
        $mockOrder->shouldReceive('getTotal->getAmount')->andReturn(100000.00);

        $this->orderRepository
            ->shouldReceive('findById')
            ->andReturn($mockOrder);

        $this->database
            ->shouldReceive('transaction')
            ->once()
            ->andReturnUsing(function ($callback) {
                return $callback();
            });

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Payment amount exceeds order total');

        $service->verifyPayment(
            '550e8400-e29b-41d4-a716-446655440000',
            '660e8400-e29b-41d4-a716-446655440001',
            150000.00
        );
    }

    /** @test */
    public function payment_service_calculates_down_payment(): void
    {
        $service = new PaymentApplicationService($this->orderRepository, $this->database);

        $mockOrder = Mockery::mock(Order::class);
        $mockOrder->shouldReceive('getTenantId->equals')->andReturn(true);
        $mockOrder->shouldReceive('getTotal->getAmount')->andReturn(100000.00);
        $mockOrder->shouldReceive('getTotal->getCurrency')->andReturn('IDR');

        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockOrder);

        $result = $service->calculateDownPayment(
            '550e8400-e29b-41d4-a716-446655440000',
            '660e8400-e29b-41d4-a716-446655440001',
            30.0
        );

        $this->assertIsArray($result);
        $this->assertEquals(100000.00, $result['total_amount']);
        $this->assertEquals(30.0, $result['down_payment_percentage']);
        $this->assertEquals(30000.00, $result['down_payment_amount']);
        $this->assertEquals(70000.00, $result['remaining_amount']);
    }

    /** @test */
    public function payment_service_generates_invoice_number(): void
    {
        $service = new PaymentApplicationService($this->orderRepository, $this->database);

        $mockOrder = Mockery::mock(Order::class);
        $mockOrder->shouldReceive('getTenantId->equals')->andReturn(true);
        $mockOrder->shouldReceive('getOrderNumber->getValue')->andReturn('ORD-20241203-ABC123');

        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockOrder);

        $result = $service->generateInvoiceNumber(
            '550e8400-e29b-41d4-a716-446655440000',
            '660e8400-e29b-41d4-a716-446655440001'
        );

        $this->assertStringStartsWith('INV-ORD-20241203-ABC123-', $result);
    }

    /** @test */
    public function vendor_negotiation_service_starts_negotiation(): void
    {
        $service = new VendorNegotiationService($this->orderRepository, $this->vendorRepository);

        $mockOrder = Mockery::mock(Order::class);
        $mockOrder->shouldReceive('getTenantId->equals')->andReturn(true);

        $mockVendor = Mockery::mock(\App\Domain\Vendor\Entities\Vendor::class);
        $mockVendor->shouldReceive('getTenantId')->andReturn(new UuidValueObject('550e8400-e29b-41d4-a716-446655440000'));

        $this->orderRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockOrder);

        $this->vendorRepository
            ->shouldReceive('findById')
            ->once()
            ->andReturn($mockVendor);

        $result = $service->startNegotiation(
            '550e8400-e29b-41d4-a716-446655440000',
            '660e8400-e29b-41d4-a716-446655440001',
            '770e8400-e29b-41d4-a716-446655440002'
        );

        $this->assertIsArray($result);
        $this->assertEquals('active', $result['status']);
        $this->assertEquals(1, $result['round']);
    }

    /** @test */
    public function vendor_negotiation_service_requests_quote(): void
    {
        $service = new VendorNegotiationService($this->orderRepository, $this->vendorRepository);

        $result = $service->requestQuote(
            'negotiation-123',
            'vendor-456',
            [
                'price' => 50000.00,
                'lead_time_days' => 5,
                'description' => 'Sample quote',
            ]
        );

        $this->assertIsArray($result);
        $this->assertEquals(50000.00, $result['quoted_price']);
        $this->assertEquals(5, $result['lead_time_days']);
        $this->assertEquals('submitted', $result['status']);
    }

    /** @test */
    public function vendor_negotiation_service_validates_quote_price(): void
    {
        $service = new VendorNegotiationService($this->orderRepository, $this->vendorRepository);

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote price is required');

        $service->requestQuote(
            'negotiation-123',
            'vendor-456',
            [
                'lead_time_days' => 5,
            ]
        );
    }

    /** @test */
    public function vendor_negotiation_service_compares_quotes(): void
    {
        $service = new VendorNegotiationService($this->orderRepository, $this->vendorRepository);

        $quotes = [
            [
                'vendor_id' => 'vendor-1',
                'quoted_price' => 50000.00,
                'lead_time_days' => 5,
            ],
            [
                'vendor_id' => 'vendor-2',
                'quoted_price' => 60000.00,
                'lead_time_days' => 7,
            ],
            [
                'vendor_id' => 'vendor-3',
                'quoted_price' => 45000.00,
                'lead_time_days' => 10,
            ],
        ];

        $result = $service->compareQuotes($quotes);

        $this->assertIsArray($result);
        $this->assertEquals(3, $result['total_quotes']);
        $this->assertEquals(45000.00, $result['min_price']);
        $this->assertEquals(60000.00, $result['max_price']);
        $this->assertEquals(51666.67, round($result['average_price'], 2));
    }

    /** @test */
    public function vendor_negotiation_service_sets_deadline(): void
    {
        $service = new VendorNegotiationService($this->orderRepository, $this->vendorRepository);

        $result = $service->setNegotiationDeadline('negotiation-123', 7);

        $this->assertIsArray($result);
        $this->assertEquals(7, $result['days_remaining']);
        $this->assertFalse($result['is_urgent']);
    }

    /** @test */
    public function vendor_negotiation_service_sets_urgent_deadline(): void
    {
        $service = new VendorNegotiationService($this->orderRepository, $this->vendorRepository);

        $result = $service->setNegotiationDeadline('negotiation-123', 2);

        $this->assertIsArray($result);
        $this->assertEquals(2, $result['days_remaining']);
        $this->assertTrue($result['is_urgent']);
    }

    /** @test */
    public function vendor_negotiation_service_concludes_negotiation(): void
    {
        $service = new VendorNegotiationService($this->orderRepository, $this->vendorRepository);

        $result = $service->concludeNegotiation(
            'negotiation-123',
            'vendor-1',
            55000.00,
            5
        );

        $this->assertIsArray($result);
        $this->assertEquals('vendor-1', $result['selected_vendor_id']);
        $this->assertEquals(55000.00, $result['agreed_price']);
        $this->assertEquals(5, $result['agreed_lead_time_days']);
        $this->assertEquals('concluded', $result['status']);
    }
}