<?php

namespace Tests\Integration\Application\Order\Services;

use Tests\TestCase;
use App\Application\Order\Services\VendorNegotiationService;
use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Customer\Entities\Customer;
use App\Domain\Vendor\Entities\Vendor;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Shared\ValueObjects\Address;
use App\Domain\Shared\ValueObjects\Timeline;
use App\Infrastructure\Persistence\Eloquent\Repositories\PurchaseOrderRepository;
use App\Infrastructure\Persistence\Eloquent\Repositories\VendorRepository;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use InvalidArgumentException;
use DateTimeImmutable;

/**
 * Integration Test for Vendor Negotiation Service
 * 
 * ZERO MOCK POLICY: Uses real database and domain entities
 * Tests actual vendor negotiation workflows with real data persistence
 */
class VendorNegotiationServiceIntegrationTest extends TestCase
{
    use DatabaseTransactions;

    private VendorNegotiationService $service;
    private PurchaseOrderRepository $orderRepository;
    private VendorRepository $vendorRepository;
    private UuidValueObject $tenantId;
    private Customer $customer;
    private Vendor $vendor;
    private PurchaseOrder $order;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenantId = new UuidValueObject('550e8400-e29b-41d4-a716-446655440000');
        
        // Create real repositories
        $this->orderRepository = app(PurchaseOrderRepository::class);
        $this->vendorRepository = app(VendorRepository::class);
        $this->service = new VendorNegotiationService(
            $this->orderRepository,
            $this->vendorRepository
        );
        
        // Create real customer entity
        $this->customer = Customer::create(
            $this->tenantId,
            'Test Customer',
            'customer@test.com',
            '+62123456789',
            'Test Company'
        );
        
        // Create real vendor entity
        $this->vendor = Vendor::create(
            $this->tenantId,
            'Test Vendor',
            'vendor@test.com',
            '+62987654321',
            'Test Vendor Company',
            new Address('Vendor Street', 'Vendor City', 'Vendor State', '54321', 'ID'),
            ['etching', 'engraving']
        );
        
        // Create real order entity
        $this->order = PurchaseOrder::create(
            tenantId: $this->tenantId,
            customerId: $this->customer->getId(),
            orderNumber: 'ORD-' . time(),
            items: [
                ['product_id' => 'prod-001', 'quantity' => 1, 'price' => 10000000]
            ],
            totalAmount: Money::fromCents(10000000),
            deliveryAddress: new Address('Test Street', 'Test City', 'Test State', '12345', 'ID'),
            billingAddress: new Address('Test Street', 'Test City', 'Test State', '12345', 'ID'),
            requiredDeliveryDate: new DateTimeImmutable('+30 days'),
            customerNotes: 'Test notes',
            specifications: ['material' => 'steel'],
            timeline: Timeline::forOrderProduction(new DateTimeImmutable(), 30),
            metadata: ['source' => 'integration_test']
        );
        
        // Save to database
        $this->vendorRepository->save($this->vendor);
        $this->orderRepository->save($this->order);
    }

    /** @test */
    public function it_starts_negotiation_with_real_entities(): void
    {
        $result = $this->service->startNegotiation(
            $this->tenantId->getValue(),
            $this->order->getId()->getValue(),
            $this->vendor->getId()->getValue()
        );

        $this->assertIsArray($result);
        $this->assertEquals('active', $result['status']);
        $this->assertEquals(1, $result['round']);
        $this->assertArrayHasKey('negotiation_id', $result);
        $this->assertArrayHasKey('started_at', $result);
    }

    /** @test */
    public function it_requests_quote_with_valid_data(): void
    {
        $result = $this->service->requestQuote(
            'negotiation-123',
            $this->vendor->getId()->getValue(),
            [
                'price' => 50000.00,
                'lead_time_days' => 5,
                'description' => 'Sample quote for steel etching',
                'terms' => 'Standard terms and conditions'
            ]
        );

        $this->assertIsArray($result);
        $this->assertEquals(50000.00, $result['quoted_price']);
        $this->assertEquals(5, $result['lead_time_days']);
        $this->assertEquals('submitted', $result['status']);
        $this->assertArrayHasKey('quote_id', $result);
        $this->assertArrayHasKey('submitted_at', $result);
    }

    /** @test */
    public function it_validates_quote_price_requirement(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote price is required');

        $this->service->requestQuote(
            'negotiation-123',
            $this->vendor->getId()->getValue(),
            [
                'lead_time_days' => 5,
                'description' => 'Quote without price'
            ]
        );
    }

    /** @test */
    public function it_compares_multiple_quotes(): void
    {
        $quotes = [
            [
                'vendor_id' => 'vendor-1',
                'quoted_price' => 50000.00,
                'lead_time_days' => 5,
                'vendor_name' => 'Vendor One'
            ],
            [
                'vendor_id' => 'vendor-2',
                'quoted_price' => 60000.00,
                'lead_time_days' => 7,
                'vendor_name' => 'Vendor Two'
            ],
            [
                'vendor_id' => 'vendor-3',
                'quoted_price' => 45000.00,
                'lead_time_days' => 10,
                'vendor_name' => 'Vendor Three'
            ],
        ];

        $result = $this->service->compareQuotes($quotes);

        $this->assertIsArray($result);
        $this->assertEquals(3, $result['total_quotes']);
        $this->assertEquals(45000.00, $result['min_price']);
        $this->assertEquals(60000.00, $result['max_price']);
        $this->assertEquals(51666.67, round($result['average_price'], 2));
        $this->assertEquals('vendor-3', $result['best_price_vendor']);
        $this->assertEquals('vendor-1', $result['fastest_delivery_vendor']);
    }

    /** @test */
    public function it_sets_negotiation_deadline(): void
    {
        $result = $this->service->setNegotiationDeadline('negotiation-123', 7);

        $this->assertIsArray($result);
        $this->assertEquals(7, $result['days_remaining']);
        $this->assertFalse($result['is_urgent']);
        $this->assertArrayHasKey('deadline_date', $result);
    }

    /** @test */
    public function it_identifies_urgent_deadline(): void
    {
        $result = $this->service->setNegotiationDeadline('negotiation-123', 2);

        $this->assertIsArray($result);
        $this->assertEquals(2, $result['days_remaining']);
        $this->assertTrue($result['is_urgent']);
    }

    /** @test */
    public function it_concludes_negotiation_successfully(): void
    {
        $result = $this->service->concludeNegotiation(
            'negotiation-123',
            $this->vendor->getId()->getValue(),
            55000.00,
            5
        );

        $this->assertIsArray($result);
        $this->assertEquals($this->vendor->getId()->getValue(), $result['selected_vendor_id']);
        $this->assertEquals(55000.00, $result['agreed_price']);
        $this->assertEquals(5, $result['agreed_lead_time_days']);
        $this->assertEquals('concluded', $result['status']);
        $this->assertArrayHasKey('concluded_at', $result);
    }

    /** @test */
    public function it_validates_quote_lead_time(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Lead time must be positive');

        $this->service->requestQuote(
            'negotiation-123',
            $this->vendor->getId()->getValue(),
            [
                'price' => 50000.00,
                'lead_time_days' => -1, // Invalid lead time
                'description' => 'Quote with invalid lead time'
            ]
        );
    }

    /** @test */
    public function it_validates_quote_price_positive(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Quote price must be positive');

        $this->service->requestQuote(
            'negotiation-123',
            $this->vendor->getId()->getValue(),
            [
                'price' => -1000.00, // Invalid price
                'lead_time_days' => 5,
                'description' => 'Quote with negative price'
            ]
        );
    }

    /** @test */
    public function it_handles_empty_quotes_comparison(): void
    {
        $result = $this->service->compareQuotes([]);

        $this->assertIsArray($result);
        $this->assertEquals(0, $result['total_quotes']);
        $this->assertNull($result['min_price']);
        $this->assertNull($result['max_price']);
        $this->assertNull($result['average_price']);
    }

    /** @test */
    public function it_calculates_negotiation_metrics(): void
    {
        $quotes = [
            [
                'vendor_id' => 'vendor-1',
                'quoted_price' => 50000.00,
                'lead_time_days' => 5,
                'vendor_rating' => 4.5
            ],
            [
                'vendor_id' => 'vendor-2',
                'quoted_price' => 60000.00,
                'lead_time_days' => 7,
                'vendor_rating' => 4.8
            ]
        ];

        $result = $this->service->compareQuotes($quotes);

        $this->assertArrayHasKey('price_variance', $result);
        $this->assertArrayHasKey('delivery_variance', $result);
        $this->assertEquals(10000.00, $result['price_variance']);
        $this->assertEquals(2, $result['delivery_variance']);
    }
}