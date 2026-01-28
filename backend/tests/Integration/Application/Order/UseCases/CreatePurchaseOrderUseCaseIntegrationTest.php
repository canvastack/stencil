<?php

namespace Tests\Integration\Application\Order\UseCases;

use Tests\TestCase;
use App\Application\Order\Commands\CreatePurchaseOrderCommand;
use App\Application\Order\UseCases\CreatePurchaseOrderUseCase;
use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\PaymentStatus;
use App\Domain\Customer\Entities\Customer;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Infrastructure\Persistence\Eloquent\Models\Customer as CustomerModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

/**
 * Integration Test for CreatePurchaseOrderUseCase
 * 
 * Tests the complete flow from command to database persistence
 * using real repository implementations and database.
 */
class CreatePurchaseOrderUseCaseIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private CreatePurchaseOrderUseCase $useCase;
    private UuidValueObject $tenantId;
    private UuidValueObject $customerId;

    protected function setUp(): void
    {
        parent::setUp();
        
        Event::fake();
        
        // Resolve use case from container (tests DI configuration)
        $this->useCase = $this->app->make(CreatePurchaseOrderUseCase::class);
        
        $this->tenantId = UuidValueObject::generate();
        $this->customerId = UuidValueObject::generate();
        
        // Create customer in database
        CustomerModel::create([
            'uuid' => $this->customerId->getValue(),
            'tenant_id' => $this->tenantId->getValue(),
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '+62812345678',
            'company' => 'Test Company',
            'address' => json_encode([
                'street' => 'Jl. Sudirman No. 123',
                'city' => 'Jakarta Pusat',
                'state' => 'DKI Jakarta',
                'postal_code' => '10220',
                'country' => 'ID'
            ]),
            'contact_info' => json_encode([
                'email' => 'john@example.com',
                'phone' => '+62812345678',
                'website' => null,
                'social_media' => []
            ]),
            'preferences' => json_encode([]),
            'metadata' => json_encode([]),
            'status' => 'active',
        ]);
    }

    /** @test */
    public function it_creates_purchase_order_with_real_database_integration()
    {
        // Arrange
        $command = new CreatePurchaseOrderCommand(
            tenantId: $this->tenantId->getValue(),
            customerId: $this->customerId->getValue(),
            items: [
                [
                    'product_id' => 'prod-123',
                    'name' => 'Custom Metal Etching',
                    'quantity' => 2,
                    'price' => 50000,
                    'specifications' => [
                        'material' => 'stainless_steel',
                        'size' => '10x15cm',
                        'thickness' => '2mm'
                    ]
                ]
            ],
            specifications: [
                'finish' => 'brushed',
                'engraving_depth' => '0.5mm',
                'special_instructions' => 'Handle with care'
            ],
            deliveryAddress: json_encode([
                'street' => 'Jl. Delivery No. 456',
                'city' => 'Jakarta Selatan',
                'state' => 'DKI Jakarta',
                'postal_code' => '12190',
                'country' => 'ID'
            ]),
            billingAddress: json_encode([
                'street' => 'Jl. Billing No. 789',
                'city' => 'Jakarta Barat',
                'state' => 'DKI Jakarta',
                'postal_code' => '11470',
                'country' => 'ID'
            ]),
            requiredDeliveryDate: (new \DateTime('+30 days'))->format('Y-m-d H:i:s'),
            customerNotes: 'Please handle with extra care'
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertInstanceOf(PurchaseOrder::class, $result);
        $this->assertEquals($this->tenantId, $result->getTenantId());
        $this->assertEquals($this->customerId, $result->getCustomerId());
        $this->assertEquals(OrderStatus::PENDING, $result->getStatus());
        $this->assertEquals(PaymentStatus::UNPAID, $result->getPaymentStatus());
        $this->assertNotNull($result->getOrderNumber());
        $this->assertTrue(str_starts_with($result->getOrderNumber(), 'ORD-'));
        
        // Verify database persistence
        $this->assertDatabaseHas('orders', [
            'uuid' => $result->getId()->getValue(),
            'tenant_id' => $this->tenantId->getValue(),
            'customer_id' => $this->customerId->getValue(),
            'status' => 'pending',
            'payment_status' => 'unpaid',
        ]);
        
        // Verify items are stored correctly
        $orderData = \DB::table('orders')
            ->where('uuid', $result->getId()->getValue())
            ->first();
        
        $items = json_decode($orderData->items, true);
        $this->assertCount(1, $items);
        $this->assertEquals('prod-123', $items[0]['product_id']);
        $this->assertEquals('Custom Metal Etching', $items[0]['name']);
        $this->assertEquals(2, $items[0]['quantity']);
        $this->assertEquals(50000, $items[0]['price']);
        
        // Verify specifications are stored
        $specifications = json_decode($orderData->specifications, true);
        $this->assertEquals('brushed', $specifications['finish']);
        $this->assertEquals('0.5mm', $specifications['engraving_depth']);
        
        // Verify addresses are stored
        $deliveryAddress = json_decode($orderData->delivery_address, true);
        $this->assertEquals('Jl. Delivery No. 456', $deliveryAddress['street']);
        $this->assertEquals('Jakarta Selatan', $deliveryAddress['city']);
        
        $billingAddress = json_decode($orderData->billing_address, true);
        $this->assertEquals('Jl. Billing No. 789', $billingAddress['street']);
        $this->assertEquals('Jakarta Barat', $billingAddress['city']);
    }

    /** @test */
    public function it_throws_exception_when_customer_not_found_in_database()
    {
        // Arrange
        $nonExistentCustomerId = UuidValueObject::generate();
        
        $command = new CreatePurchaseOrderCommand(
            tenantId: $this->tenantId->getValue(),
            customerId: $nonExistentCustomerId->getValue(),
            items: [
                [
                    'product_id' => 'prod-123',
                    'name' => 'Test Product',
                    'quantity' => 1,
                    'price' => 25000
                ]
            ],
            specifications: [],
            deliveryAddress: json_encode([
                'street' => 'Test Street',
                'city' => 'Test City',
                'state' => 'Test State',
                'postal_code' => '12345',
                'country' => 'ID'
            ]),
            requiredDeliveryDate: (new \DateTime('+30 days'))->format('Y-m-d H:i:s')
        );

        // Act & Assert
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Customer not found');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_generates_unique_order_numbers()
    {
        // Arrange
        $command1 = new CreatePurchaseOrderCommand(
            tenantId: $this->tenantId->getValue(),
            customerId: $this->customerId->getValue(),
            items: [['product_id' => 'prod-1', 'name' => 'Product 1', 'quantity' => 1, 'price' => 25000]],
            specifications: [],
            deliveryAddress: json_encode(['street' => 'Test', 'city' => 'Test', 'state' => 'Test', 'postal_code' => '12345', 'country' => 'ID']),
            requiredDeliveryDate: (new \DateTime('+30 days'))->format('Y-m-d H:i:s')
        );
        
        $command2 = new CreatePurchaseOrderCommand(
            tenantId: $this->tenantId->getValue(),
            customerId: $this->customerId->getValue(),
            items: [['product_id' => 'prod-2', 'name' => 'Product 2', 'quantity' => 1, 'price' => 35000]],
            specifications: [],
            deliveryAddress: json_encode(['street' => 'Test', 'city' => 'Test', 'state' => 'Test', 'postal_code' => '12345', 'country' => 'ID']),
            requiredDeliveryDate: (new \DateTime('+30 days'))->format('Y-m-d H:i:s')
        );

        // Act
        $order1 = $this->useCase->execute($command1);
        $order2 = $this->useCase->execute($command2);

        // Assert
        $this->assertNotEquals($order1->getOrderNumber(), $order2->getOrderNumber());
        $this->assertNotEquals($order1->getId()->getValue(), $order2->getId()->getValue());
        
        // Verify both orders are in database
        $this->assertDatabaseHas('orders', ['uuid' => $order1->getId()->getValue()]);
        $this->assertDatabaseHas('orders', ['uuid' => $order2->getId()->getValue()]);
    }
}