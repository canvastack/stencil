<?php

namespace Tests\Integration;

use Tests\TestCase;
use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Application\Order\Commands\AssignVendorCommand;
use App\Application\Order\Commands\ProcessPaymentCommand;
use App\Application\Order\UseCases\CreatePurchaseOrderUseCase;
use App\Application\Order\UseCases\AssignVendorUseCase;
use App\Application\Order\UseCases\ProcessPaymentUseCase;
use App\Domain\Order\Events\OrderCreated;
use App\Domain\Order\Events\VendorAssigned;
use App\Domain\Order\Events\PaymentReceived;
use App\Domain\Order\Events\OrderStatusChanged;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Production\Services\ProductionPlanningService;
use App\Domain\Vendor\Services\VendorMatchingService;
use App\Domain\Pricing\Services\PricingCalculatorService;
use App\Domain\Shared\Rules\BusinessRuleEngine;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

/**
 * Complete Order Workflow Integration Test
 * 
 * Tests the entire order processing workflow from creation to production,
 * ensuring all Phase 4 components work together seamlessly.
 * 
 * This test validates:
 * - Order creation and validation
 * - Business rules enforcement
 * - Vendor matching and assignment
 * - Pricing calculation
 * - Production planning
 * - Payment processing
 * - Event dispatching
 * - Status progression
 */
class CompleteOrderWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private CreatePurchaseOrderUseCase $createOrderUseCase;
    private AssignVendorUseCase $assignVendorUseCase;
    private ProcessPaymentUseCase $processPaymentUseCase;
    private VendorMatchingService $vendorMatchingService;
    private PricingCalculatorService $pricingCalculatorService;
    private ProductionPlanningService $productionPlanningService;
    private BusinessRuleEngine $businessRuleEngine;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->createOrderUseCase = app(CreatePurchaseOrderUseCase::class);
        $this->assignVendorUseCase = app(AssignVendorUseCase::class);
        $this->processPaymentUseCase = app(ProcessPaymentUseCase::class);
        $this->vendorMatchingService = app(VendorMatchingService::class);
        $this->pricingCalculatorService = app(PricingCalculatorService::class);
        $this->productionPlanningService = app(ProductionPlanningService::class);
        $this->businessRuleEngine = app(BusinessRuleEngine::class);
        
        Event::fake();
    }

    /**
     * Test complete order workflow from creation to production
     * 
     * @test
     */
    public function it_processes_complete_order_workflow_successfully(): void
    {
        // 1. Setup test data
        $tenant = $this->createTenant();
        $customer = $this->createCustomer($tenant);
        $vendors = $this->createVendors($tenant, 3);

        // 2. Customer places order
        $orderCommand = new CreatePurchaseOrderCommand(
            tenantId: $tenant->uuid,
            customerId: $customer->uuid,
            items: [
                [
                    'product_id' => 'steel-etching-001',
                    'name' => 'Custom Steel Etching',
                    'quantity' => 100,
                    'specifications' => [
                        'material' => 'stainless_steel',
                        'thickness' => '2mm',
                        'dimensions' => '10x10cm',
                        'finish' => 'brushed'
                    ]
                ]
            ],
            specifications: [
                'material' => 'stainless_steel',
                'thickness' => '2mm',
                'complexity' => 'medium',
                'quality_requirements' => 'high'
            ],
            deliveryAddress: '123 Business Street, Jakarta 12345',
            requiredDeliveryDate: now()->addDays(30)->toDateString()
        );

        $order = $this->createOrderUseCase->execute($orderCommand);

        // Verify order creation
        $this->assertNotNull($order);
        $this->assertEquals(OrderStatus::PENDING, $order->getStatus());
        $this->assertEquals($customer->uuid, $order->getCustomerId()->getValue());

        // 3. System validates business rules
        $validationResult = $this->businessRuleEngine->validateContext('order_creation', [
            'order' => $order,
            'customer' => $customer,
            'tenant_id' => $tenant->uuid
        ]);

        $this->assertTrue($validationResult->isValid(), 'Business rules validation should pass');

        // 4. System finds and assigns vendor
        $orderRequirements = $order->getRequirements();
        $vendorMatches = $this->vendorMatchingService->findBestVendorsForOrder($orderRequirements);

        $this->assertGreaterThan(0, count($vendorMatches->getVendors()), 'Should find at least one matching vendor');

        $topVendor = $vendorMatches->getTopVendor();
        $this->assertNotNull($topVendor, 'Should have a top vendor recommendation');

        // Assign the best vendor
        $assignVendorCommand = new AssignVendorCommand(
            orderId: $order->getId()->getValue(),
            vendorId: $topVendor->getVendor()->getId()->getValue(),
            quote: $topVendor->getQuote()->toArray()
        );

        $updatedOrder = $this->assignVendorUseCase->execute($assignVendorCommand);

        // Verify vendor assignment
        $this->assertNotNull($updatedOrder->getVendorId());
        $this->assertEquals($topVendor->getVendor()->getId()->getValue(), $updatedOrder->getVendorId()->getValue());

        // 5. System calculates pricing
        $pricing = $this->pricingCalculatorService->calculateCustomerPricing(
            $topVendor->getQuote(),
            $customer,
            $order->getComplexity()
        );

        // Verify pricing calculations
        $this->assertInstanceOf(Money::class, $pricing->getFinalPrice());
        $this->assertGreaterThanOrEqual(0.30, $pricing->getProfitMargin(), 'Profit margin should be at least 30%');
        $this->assertGreaterThan(0, $pricing->getFinalPrice()->getAmount(), 'Final price should be positive');

        // 6. System creates production plan
        $productionPlan = $this->productionPlanningService->createProductionPlan($updatedOrder);

        // Verify production plan
        $this->assertNotNull($productionPlan);
        $this->assertEquals($updatedOrder->getId()->getValue(), $productionPlan->getOrderId());
        $this->assertNotNull($productionPlan->getTimeline());
        $this->assertNotNull($productionPlan->getResources());
        $this->assertGreaterThan(0, count($productionPlan->getMilestones()));

        // 7. Customer processes payment
        $paymentCommand = new ProcessPaymentCommand(
            orderId: $updatedOrder->getId()->getValue(),
            amount: $pricing->getFinalPrice()->getAmount(),
            paymentMethod: 'bank_transfer',
            paymentReference: 'TXN-' . now()->format('YmdHis')
        );

        $paidOrder = $this->processPaymentUseCase->execute($paymentCommand);

        // Verify payment processing
        $this->assertEquals(OrderStatus::PAID, $paidOrder->getStatus());
        $this->assertEquals($pricing->getFinalPrice()->getAmount(), $paidOrder->getTotalAmount()->getAmount());

        // 8. Verify order status progression
        $finalOrder = Order::where('uuid', $order->getId()->getValue())->first();
        $this->assertNotNull($finalOrder);
        $this->assertEquals('paid', $finalOrder->status);
        $this->assertNotNull($finalOrder->vendor_id);
        $this->assertNotNull($finalOrder->total_amount);

        // 9. Verify production metadata is stored
        $metadata = json_decode($finalOrder->metadata, true);
        $this->assertArrayHasKey('production_plan', $metadata);
        $this->assertArrayHasKey('pricing_breakdown', $metadata);
        $this->assertArrayHasKey('vendor_quote', $metadata);

        // 10. Verify all events were dispatched
        Event::assertDispatched(OrderCreated::class);
        Event::assertDispatched(VendorAssigned::class);
        Event::assertDispatched(PaymentReceived::class);
        Event::assertDispatched(OrderStatusChanged::class);

        // 11. Verify business metrics are trackable
        $this->assertDatabaseHas('orders', [
            'uuid' => $order->getId()->getValue(),
            'status' => 'paid',
            'tenant_id' => $tenant->id
        ]);

        // 12. Verify production plan integration
        $this->assertArrayHasKey('timeline', $metadata['production_plan']);
        $this->assertArrayHasKey('milestones', $metadata['production_plan']);
        $this->assertArrayHasKey('resources', $metadata['production_plan']);
        $this->assertArrayHasKey('risk_factors', $metadata['production_plan']);
    }

    /**
     * Test order workflow with quality assurance integration
     * 
     * @test
     */
    public function it_integrates_quality_assurance_in_workflow(): void
    {
        // Setup
        $tenant = $this->createTenant();
        $customer = $this->createCustomer($tenant);
        $vendor = $this->createVendors($tenant, 1)[0];

        // Create high-complexity order requiring quality checks
        $orderCommand = new CreatePurchaseOrderCommand(
            tenantId: $tenant->uuid,
            customerId: $customer->uuid,
            items: [
                [
                    'product_id' => 'precision-etching-001',
                    'name' => 'Precision Medical Device Etching',
                    'quantity' => 50,
                    'specifications' => [
                        'material' => 'titanium',
                        'thickness' => '0.5mm',
                        'tolerance' => '±0.01mm',
                        'finish' => 'medical_grade'
                    ]
                ]
            ],
            specifications: [
                'material' => 'titanium',
                'complexity' => 'high',
                'quality_requirements' => 'medical_grade',
                'certifications_required' => ['ISO13485', 'FDA']
            ],
            deliveryAddress: '456 Medical Center, Jakarta 12346',
            requiredDeliveryDate: now()->addDays(45)->toDateString()
        );

        $order = $this->createOrderUseCase->execute($orderCommand);

        // Verify quality checkpoints are created for high-complexity orders
        $productionPlan = $this->productionPlanningService->createProductionPlan($order);
        
        $qualityCheckpoints = $productionPlan->getQualityCheckpoints();
        $this->assertGreaterThan(0, count($qualityCheckpoints), 'High-complexity orders should have quality checkpoints');

        // Verify quality requirements are in metadata
        $finalOrder = Order::where('uuid', $order->getId()->getValue())->first();
        $metadata = json_decode($finalOrder->metadata, true);
        
        $this->assertArrayHasKey('quality_requirements', $metadata);
        $this->assertEquals('medical_grade', $metadata['quality_requirements']);
        $this->assertArrayHasKey('certifications_required', $metadata);
    }

    /**
     * Test workflow with vendor performance tracking
     * 
     * @test
     */
    public function it_tracks_vendor_performance_throughout_workflow(): void
    {
        // Setup
        $tenant = $this->createTenant();
        $customer = $this->createCustomer($tenant);
        $vendor = $this->createVendors($tenant, 1)[0];

        // Create order
        $orderCommand = new CreatePurchaseOrderCommand(
            tenantId: $tenant->uuid,
            customerId: $customer->uuid,
            items: [
                [
                    'product_id' => 'standard-etching-001',
                    'name' => 'Standard Aluminum Etching',
                    'quantity' => 200,
                    'specifications' => [
                        'material' => 'aluminum',
                        'thickness' => '3mm'
                    ]
                ]
            ],
            specifications: [
                'material' => 'aluminum',
                'complexity' => 'low'
            ],
            deliveryAddress: '789 Industrial Park, Jakarta 12347',
            requiredDeliveryDate: now()->addDays(14)->toDateString()
        );

        $order = $this->createOrderUseCase->execute($orderCommand);

        // Assign vendor
        $assignVendorCommand = new AssignVendorCommand(
            orderId: $order->getId()->getValue(),
            vendorId: $vendor->uuid,
            quote: [
                'base_price' => 5000000, // 50,000 IDR in cents
                'lead_time_days' => 10,
                'quality_score' => 4.5
            ]
        );

        $this->assignVendorUseCase->execute($assignVendorCommand);

        // Verify vendor performance tracking data is stored
        $finalOrder = Order::where('uuid', $order->getId()->getValue())->first();
        $metadata = json_decode($finalOrder->metadata, true);

        $this->assertArrayHasKey('vendor_performance', $metadata);
        $this->assertArrayHasKey('expected_delivery', $metadata['vendor_performance']);
        $this->assertArrayHasKey('quality_expectations', $metadata['vendor_performance']);

        // Verify vendor's order count is updated
        $updatedVendor = Vendor::where('uuid', $vendor->uuid)->first();
        $this->assertGreaterThanOrEqual(1, $updatedVendor->total_orders);
    }

    // Helper methods for test setup

    private function createTenant(): object
    {
        return (object) [
            'id' => 1,
            'uuid' => 'tenant-' . uniqid(),
            'name' => 'Test Tenant',
            'domain' => 'test.canvastencil.com'
        ];
    }

    private function createCustomer(object $tenant): Customer
    {
        return Customer::create([
            'uuid' => 'customer-' . uniqid(),
            'tenant_id' => $tenant->id,
            'name' => 'Test Customer Corp',
            'email' => 'customer@testcorp.com',
            'phone' => '+6281234567890',
            'address' => '123 Customer Street, Jakarta',
            'credit_limit' => 100000000, // 1,000,000 IDR in cents
            'status' => 'active'
        ]);
    }

    private function createVendors(object $tenant, int $count): array
    {
        $vendors = [];
        
        for ($i = 0; $i < $count; $i++) {
            $vendors[] = Vendor::create([
                'uuid' => 'vendor-' . uniqid(),
                'tenant_id' => $tenant->id,
                'name' => "Test Vendor {$i}",
                'email' => "vendor{$i}@testvendor.com",
                'phone' => '+628123456789' . $i,
                'address' => "456 Vendor Street {$i}, Jakarta",
                'capabilities' => json_encode([
                    'materials' => ['steel', 'aluminum', 'titanium'],
                    'processes' => ['etching', 'engraving', 'cutting'],
                    'max_thickness' => '10mm',
                    'certifications' => ['ISO9001', 'ISO13485']
                ]),
                'lead_time' => rand(7, 21),
                'rating' => 4.0 + (rand(0, 10) / 10),
                'total_orders' => rand(10, 100),
                'status' => 'active'
            ]);
        }
        
        return $vendors;
    }
}