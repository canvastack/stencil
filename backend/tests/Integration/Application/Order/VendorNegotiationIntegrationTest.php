<?php

namespace Tests\Integration\Application\Order;

use App\Application\Order\UseCases\CreatePurchaseOrderUseCase;
use App\Application\Order\UseCases\AssignVendorUseCase;
use App\Application\Order\UseCases\NegotiateWithVendorUseCase;
use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Application\Order\Commands\AssignVendorCommand;
use App\Application\Order\Commands\NegotiateWithVendorCommand;
use App\Application\Order\Services\VendorNegotiationService;
use App\Infrastructure\Persistence\Eloquent\Models\{Customer, Order, Product, Tenant, Vendor};
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class VendorNegotiationIntegrationTest extends TestCase
{
    use DatabaseTransactions;

    private CreatePurchaseOrderUseCase $createPurchaseOrderUseCase;
    private AssignVendorUseCase $assignVendorUseCase;
    private NegotiateWithVendorUseCase $negotiateWithVendorUseCase;
    private VendorNegotiationService $negotiationService;

    private TenantEloquentModel $tenant;
    private Customer $customer;
    private Vendor $vendor1;
    private Vendor $vendor2;
    private Vendor $vendor3;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->createPurchaseOrderUseCase = app(CreatePurchaseOrderUseCase::class);
        $this->assignVendorUseCase = app(AssignVendorUseCase::class);
        $this->negotiateWithVendorUseCase = app(NegotiateWithVendorUseCase::class);
        $this->negotiationService = app(VendorNegotiationService::class);

        Event::fake();

        $this->tenant = TenantEloquentModel::factory()->create();
        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor1 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor2 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor3 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    /** @test */
    public function vendor_negotiation_service_starts_negotiation(): void
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

        $result = $this->negotiationService->startNegotiation(
            $this->tenant->uuid,
            $order->getId(),
            $this->vendor1->uuid
        );

        $this->assertNotNull($result['negotiation_id']);
        $this->assertEquals($order->getId(), $result['order_id']);
        $this->assertEquals($this->vendor1->uuid, $result['vendor_id']);
        $this->assertEquals('active', $result['status']);
        $this->assertEquals(1, $result['round']);
    }

    /** @test */
    public function vendor_negotiation_service_requests_quote(): void
    {
        $negotiationId = 'test-negotiation-1';
        $quoteDetails = [
            'price' => 95000.00,
            'lead_time_days' => 5,
            'description' => 'Standard delivery',
        ];

        $result = $this->negotiationService->requestQuote(
            $negotiationId,
            $this->vendor1->uuid,
            $quoteDetails
        );

        $this->assertNotNull($result['quote_id']);
        $this->assertEquals($negotiationId, $result['negotiation_id']);
        $this->assertEquals(95000.00, $result['quoted_price']);
        $this->assertEquals(5, $result['lead_time_days']);
        $this->assertEquals('submitted', $result['status']);
    }

    /** @test */
    public function vendor_negotiation_service_validates_quote_price(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $negotiationId = 'test-negotiation-2';
        $quoteDetails = [
            'price' => -1000.00,
            'lead_time_days' => 5,
        ];

        $this->negotiationService->requestQuote(
            $negotiationId,
            $this->vendor1->uuid,
            $quoteDetails
        );
    }

    /** @test */
    public function vendor_negotiation_service_compares_quotes(): void
    {
        $quotes = [
            [
                'vendor_id' => $this->vendor1->uuid,
                'quoted_price' => 95000.00,
                'lead_time_days' => 5,
            ],
            [
                'vendor_id' => $this->vendor2->uuid,
                'quoted_price' => 90000.00,
                'lead_time_days' => 7,
            ],
            [
                'vendor_id' => $this->vendor3->uuid,
                'quoted_price' => 100000.00,
                'lead_time_days' => 3,
            ],
        ];

        $result = $this->negotiationService->compareQuotes($quotes);

        $this->assertEquals(3, $result['total_quotes']);
        $this->assertEquals(90000.00, $result['min_price']);
        $this->assertEquals(100000.00, $result['max_price']);
        $this->assertEquals((90000.00 + 95000.00 + 100000.00) / 3, $result['average_price']);
        $this->assertCount(3, $result['quotes']);

        $sortedByPrice = $result['quotes'];
        $this->assertEquals(90000.00, $sortedByPrice[0]['price']);
        $this->assertEquals(95000.00, $sortedByPrice[1]['price']);
        $this->assertEquals(100000.00, $sortedByPrice[2]['price']);
    }

    /** @test */
    public function vendor_negotiation_service_sets_deadline(): void
    {
        $negotiationId = 'test-negotiation-3';

        $result = $this->negotiationService->setNegotiationDeadline($negotiationId, 7);

        $this->assertEquals($negotiationId, $result['negotiation_id']);
        $this->assertEquals(7, $result['days_remaining']);
        $this->assertFalse($result['is_urgent']);
    }

    /** @test */
    public function vendor_negotiation_service_sets_urgent_deadline(): void
    {
        $negotiationId = 'test-negotiation-4';

        $result = $this->negotiationService->setNegotiationDeadline($negotiationId, 1);

        $this->assertEquals($negotiationId, $result['negotiation_id']);
        $this->assertEquals(1, $result['days_remaining']);
        $this->assertTrue($result['is_urgent']);
    }

    /** @test */
    public function vendor_negotiation_service_escalates_negotiation(): void
    {
        $negotiationId = 'test-negotiation-5';

        $result = $this->negotiationService->escalateNegotiation(
            $negotiationId,
            'No agreement reached after 3 rounds'
        );

        $this->assertEquals($negotiationId, $result['negotiation_id']);
        $this->assertNotNull($result['escalation_id']);
        $this->assertEquals('management', $result['escalation_level']);
        $this->assertEquals('escalated', $result['status']);
    }

    /** @test */
    public function vendor_negotiation_service_concludes_negotiation(): void
    {
        $negotiationId = 'test-negotiation-6';

        $result = $this->negotiationService->concludeNegotiation(
            $negotiationId,
            $this->vendor2->uuid,
            90000.00,
            7
        );

        $this->assertEquals($negotiationId, $result['negotiation_id']);
        $this->assertEquals($this->vendor2->uuid, $result['selected_vendor_id']);
        $this->assertEquals(90000.00, $result['agreed_price']);
        $this->assertEquals(7, $result['agreed_lead_time_days']);
        $this->assertEquals('concluded', $result['status']);
    }

    /** @test */
    public function multi_vendor_negotiation_workflow(): void
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

        $negotiationResult = $this->negotiationService->startNegotiation(
            $this->tenant->uuid,
            $order->getId(),
            $this->vendor1->uuid
        );

        $quotes = [
            [
                'vendor_id' => $this->vendor1->uuid,
                'quoted_price' => 95000.00,
                'lead_time_days' => 5,
            ],
            [
                'vendor_id' => $this->vendor2->uuid,
                'quoted_price' => 92000.00,
                'lead_time_days' => 6,
            ],
            [
                'vendor_id' => $this->vendor3->uuid,
                'quoted_price' => 98000.00,
                'lead_time_days' => 4,
            ],
        ];

        $comparisonResult = $this->negotiationService->compareQuotes($quotes);

        $this->assertEquals(92000.00, $comparisonResult['min_price']);
        $this->assertCount(3, $comparisonResult['quotes']);

        $conclusionResult = $this->negotiationService->concludeNegotiation(
            $negotiationResult['negotiation_id'],
            $this->vendor2->uuid,
            92000.00,
            6
        );

        $this->assertEquals('concluded', $conclusionResult['status']);
        $this->assertEquals($this->vendor2->uuid, $conclusionResult['selected_vendor_id']);
    }

    /** @test */
    public function vendor_negotiation_service_respects_tenant_isolation(): void
    {
        $tenantB = TenantEloquentModel::factory()->create();
        $vendorB = Vendor::factory()->create(['tenant_id' => $tenantB->id]);

        $this->expectException(\InvalidArgumentException::class);

        $this->negotiationService->startNegotiation(
            $this->tenant->uuid,
            'nonexistent-order-id',
            $vendorB->uuid
        );
    }
}
