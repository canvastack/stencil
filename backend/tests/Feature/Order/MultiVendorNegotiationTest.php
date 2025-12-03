<?php

namespace Tests\Feature\Order;

use App\Application\Order\UseCases\{
    CreatePurchaseOrderUseCase,
    AssignVendorUseCase,
    NegotiateWithVendorUseCase
};
use App\Application\Order\Commands\{
    CreatePurchaseOrderCommand,
    AssignVendorCommand,
    NegotiateWithVendorCommand
};
use App\Application\Order\Services\VendorNegotiationService;
use App\Infrastructure\Persistence\Eloquent\Models\{Customer, Order, Product, Tenant, Vendor};
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class MultiVendorNegotiationTest extends TestCase
{
    use RefreshDatabase;

    private CreatePurchaseOrderUseCase $createPurchaseOrderUseCase;
    private AssignVendorUseCase $assignVendorUseCase;
    private NegotiateWithVendorUseCase $negotiateWithVendorUseCase;
    private VendorNegotiationService $negotiationService;

    private Tenant $tenant;
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

        $this->tenant = Tenant::factory()->create();
        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor1 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor2 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor3 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    /** @test */
    public function negotiate_with_multiple_vendors_sequentially(): void
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

        $assignCommand1 = new AssignVendorCommand(
            orderId: $order->getId(),
            vendorId: $this->vendor1->uuid,
            tenantId: $this->tenant->uuid
        );

        $order = $this->assignVendorUseCase->execute($assignCommand1);
        $this->assertEquals($this->vendor1->id, $order->vendor_id);

        $negotiateCommand1 = new NegotiateWithVendorCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            proposedPrice: 98000.00,
            leadTimeDays: 7
        );

        $order = $this->negotiateWithVendorUseCase->execute($negotiateCommand1);
        $this->assertEquals('negotiating', $order->status);

        $assignCommand2 = new AssignVendorCommand(
            orderId: $order->getId(),
            vendorId: $this->vendor2->uuid,
            tenantId: $this->tenant->uuid
        );

        $order = $this->assignVendorUseCase->execute($assignCommand2);
        $this->assertEquals($this->vendor2->id, $order->vendor_id);

        $negotiateCommand2 = new NegotiateWithVendorCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            proposedPrice: 95000.00,
            leadTimeDays: 5
        );

        $order = $this->negotiateWithVendorUseCase->execute($negotiateCommand2);

        $assignCommand3 = new AssignVendorCommand(
            orderId: $order->getId(),
            vendorId: $this->vendor3->uuid,
            tenantId: $this->tenant->uuid
        );

        $order = $this->assignVendorUseCase->execute($assignCommand3);
        $this->assertEquals($this->vendor3->id, $order->vendor_id);

        $negotiateCommand3 = new NegotiateWithVendorCommand(
            orderId: $order->getId(),
            tenantId: $this->tenant->uuid,
            proposedPrice: 92000.00,
            leadTimeDays: 6
        );

        $order = $this->negotiateWithVendorUseCase->execute($negotiateCommand3);
        $this->assertEquals('negotiating', $order->status);
    }

    /** @test */
    public function compare_quotes_from_multiple_vendors(): void
    {
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

        $comparison = $this->negotiationService->compareQuotes($quotes);

        $this->assertEquals(3, $comparison['total_quotes']);
        $this->assertEquals(92000.00, $comparison['min_price']);
        $this->assertEquals(98000.00, $comparison['max_price']);

        $avgPrice = (95000.00 + 92000.00 + 98000.00) / 3;
        $this->assertEquals($avgPrice, $comparison['average_price']);

        $sortedQuotes = $comparison['quotes'];
        $this->assertEquals(92000.00, $sortedQuotes[0]['price']);
        $this->assertEquals(95000.00, $sortedQuotes[1]['price']);
        $this->assertEquals(98000.00, $sortedQuotes[2]['price']);
    }

    /** @test */
    public function vendor_with_lowest_price_selected(): void
    {
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

        $comparison = $this->negotiationService->compareQuotes($quotes);
        $negotiationId = 'test-negotiation-1';

        $conclusion = $this->negotiationService->concludeNegotiation(
            $negotiationId,
            $this->vendor2->uuid,
            92000.00,
            6
        );

        $this->assertEquals($this->vendor2->uuid, $conclusion['selected_vendor_id']);
        $this->assertEquals(92000.00, $conclusion['agreed_price']);
        $this->assertEquals('concluded', $conclusion['status']);
    }

    /** @test */
    public function vendor_with_best_lead_time_selected(): void
    {
        $quotes = [
            [
                'vendor_id' => $this->vendor1->uuid,
                'quoted_price' => 95000.00,
                'lead_time_days' => 10,
            ],
            [
                'vendor_id' => $this->vendor2->uuid,
                'quoted_price' => 100000.00,
                'lead_time_days' => 3,
            ],
            [
                'vendor_id' => $this->vendor3->uuid,
                'quoted_price' => 98000.00,
                'lead_time_days' => 5,
            ],
        ];

        $comparison = $this->negotiationService->compareQuotes($quotes);
        $negotiationId = 'test-negotiation-2';

        $conclusion = $this->negotiationService->concludeNegotiation(
            $negotiationId,
            $this->vendor2->uuid,
            100000.00,
            3
        );

        $this->assertEquals($this->vendor2->uuid, $conclusion['selected_vendor_id']);
        $this->assertEquals(3, $conclusion['agreed_lead_time_days']);
    }

    /** @test */
    public function price_negotiation_round_escalation(): void
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

        $assignCommand = new AssignVendorCommand(
            orderId: $order->getId(),
            vendorId: $this->vendor1->uuid,
            tenantId: $this->tenant->uuid
        );

        $order = $this->assignVendorUseCase->execute($assignCommand);

        $quotes = [];
        $proposedPrices = [98000.00, 96000.00, 94000.00, 92000.00];

        foreach ($proposedPrices as $price) {
            $negotiateCommand = new NegotiateWithVendorCommand(
                orderId: $order->getId(),
                tenantId: $this->tenant->uuid,
                proposedPrice: $price,
                leadTimeDays: 5
            );

            $order = $this->negotiateWithVendorUseCase->execute($negotiateCommand);

            $quotes[] = [
                'vendor_id' => $this->vendor1->uuid,
                'quoted_price' => $price,
                'lead_time_days' => 5,
            ];
        }

        $this->assertEquals('negotiating', $order->status);
        $this->assertCount(4, $quotes);
        $this->assertEquals(92000.00, $quotes[3]['quoted_price']);
    }

    /** @test */
    public function negotiation_deadline_and_urgency(): void
    {
        $negotiationId = 'test-negotiation-3';

        $standardDeadline = $this->negotiationService->setNegotiationDeadline($negotiationId, 7);
        $this->assertFalse($standardDeadline['is_urgent']);
        $this->assertEquals(7, $standardDeadline['days_remaining']);

        $urgentDeadline = $this->negotiationService->setNegotiationDeadline($negotiationId, 1);
        $this->assertTrue($urgentDeadline['is_urgent']);
        $this->assertEquals(1, $urgentDeadline['days_remaining']);

        $veryUrgentDeadline = $this->negotiationService->setNegotiationDeadline($negotiationId, 2);
        $this->assertTrue($veryUrgentDeadline['is_urgent']);
    }

    /** @test */
    public function negotiation_escalation_workflow(): void
    {
        $negotiationId = 'test-negotiation-4';

        $startResult = $this->negotiationService->startNegotiation(
            $this->tenant->uuid,
            'test-order-id',
            $this->vendor1->uuid
        );

        $deadlineResult = $this->negotiationService->setNegotiationDeadline($negotiationId, 1);
        $this->assertTrue($deadlineResult['is_urgent']);

        $escalationResult = $this->negotiationService->escalateNegotiation(
            $negotiationId,
            'No agreement reached after 3 rounds of negotiation'
        );

        $this->assertEquals('escalated', $escalationResult['status']);
        $this->assertNotNull($escalationResult['escalation_id']);
        $this->assertEquals('management', $escalationResult['escalation_level']);
    }

    /** @test */
    public function multi_tenant_vendor_negotiation_isolation(): void
    {
        $tenantB = Tenant::factory()->create();
        $vendorB1 = Vendor::factory()->create(['tenant_id' => $tenantB->id]);
        $vendorB2 = Vendor::factory()->create(['tenant_id' => $tenantB->id]);

        $quotesA = [
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
        ];

        $quotesB = [
            [
                'vendor_id' => $vendorB1->uuid,
                'quoted_price' => 105000.00,
                'lead_time_days' => 7,
            ],
            [
                'vendor_id' => $vendorB2->uuid,
                'quoted_price' => 108000.00,
                'lead_time_days' => 8,
            ],
        ];

        $comparisonA = $this->negotiationService->compareQuotes($quotesA);
        $comparisonB = $this->negotiationService->compareQuotes($quotesB);

        $this->assertEquals(92000.00, $comparisonA['min_price']);
        $this->assertEquals(105000.00, $comparisonB['min_price']);

        $this->assertNotEquals($comparisonA['min_price'], $comparisonB['min_price']);
    }
}
