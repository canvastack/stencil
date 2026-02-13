<?php

namespace Tests\Integration\Application\Order\Services;

use Tests\TestCase;
use App\Application\Order\Services\PaymentApplicationService;
use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Customer\Entities\Customer;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Shared\ValueObjects\Address;
use App\Domain\Shared\ValueObjects\Timeline;
use App\Infrastructure\Persistence\Eloquent\Repositories\PurchaseOrderRepository;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use InvalidArgumentException;
use DateTimeImmutable;

/**
 * Integration Test for Payment Application Service
 * 
 * ZERO MOCK POLICY: Uses real database and domain entities
 * Tests actual business workflows with real data persistence
 */
class PaymentApplicationServiceIntegrationTest extends TestCase
{
    use DatabaseTransactions;

    private PaymentApplicationService $service;
    private PurchaseOrderRepository $orderRepository;
    private UuidValueObject $tenantId;
    private Customer $customer;
    private PurchaseOrder $order;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenantId = new UuidValueObject('550e8400-e29b-41d4-a716-446655440000');
        
        // Create tenant in database first
        $tenant = $this->createTenant();
        
        // Create real database connection and repository
        $this->orderRepository = app(PurchaseOrderRepository::class);
        $this->service = new PaymentApplicationService(
            $this->orderRepository,
            app('db.connection')
        );
        
        // Generate customer UUID first
        $customerUuid = UuidValueObject::generate();
        
        // Create real customer in database
        $customerModel = \App\Infrastructure\Persistence\Eloquent\Models\Customer::create([
            'uuid' => $customerUuid->getValue(), // Use the same UUID
            'tenant_id' => $tenant->id, // Use BIGINT id
            'name' => 'Test Customer',
            'email' => 'customer@test.com',
            'phone' => '+62123456789',
            'company' => 'Test Company',
            'status' => 'active',
            'address' => json_encode([
                'street' => 'Test Street',
                'city' => 'Test City',
                'state' => 'Test State',
                'postal_code' => '12345',
                'country' => 'ID'
            ]),
        ]);
        
        // Create customer entity with the SAME UUID as database record
        $this->customer = Customer::create(
            $this->tenantId,
            $customerModel->name,
            $customerModel->email,
            $customerModel->phone,
            $customerModel->company
        );
        
        // CRITICAL: Set the customer ID to match the database UUID
        // Use reflection to set the private id property
        $reflection = new \ReflectionClass($this->customer);
        $idProperty = $reflection->getProperty('id');
        $idProperty->setAccessible(true);
        $idProperty->setValue($this->customer, $customerUuid);
        
        // Create real order entity
        $this->order = PurchaseOrder::create(
            tenantId: $this->tenantId,
            customerId: $customerUuid, // Use the same UUID
            orderNumber: 'ORD-' . time(),
            items: [
                ['product_id' => 'prod-001', 'quantity' => 1, 'price' => 10000000] // 100000 IDR in cents
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
        $this->orderRepository->save($this->order);
    }

    /**
     * Create tenant for testing
     */
    private function createTenant()
    {
        return \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::create([
            'uuid' => $this->tenantId->getValue(),
            'name' => 'Test Tenant',
            'slug' => 'test-tenant-' . substr(md5(microtime()), 0, 8),
            'domain' => 'test-tenant.local',
            'status' => 'active',
            'subscription_status' => 'active',
            'settings' => json_encode([]),
            'features' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /** @test */
    public function it_verifies_payment_successfully_with_real_data(): void
    {
        $result = $this->service->verifyPayment(
            $this->tenantId->getValue(),
            $this->order->getId()->getValue(),
            100000.00
        );

        $this->assertIsArray($result);
        $this->assertEquals(100000.00, $result['total_amount']);
        $this->assertEquals(100000.00, $result['paid_amount']);
        $this->assertEquals(0, $result['pending_amount']);
        $this->assertEquals('full_payment', $result['payment_status']);
        $this->assertEquals('IDR', $result['currency']);
    }

    /** @test */
    public function it_validates_payment_amount_against_real_order(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Payment amount exceeds order total');

        $this->service->verifyPayment(
            $this->tenantId->getValue(),
            $this->order->getId()->getValue(),
            150000.00 // Exceeds order total
        );
    }

    /** @test */
    public function it_calculates_down_payment_with_real_order(): void
    {
        $result = $this->service->calculateDownPayment(
            $this->tenantId->getValue(),
            $this->order->getId()->getValue(),
            30.0
        );

        $this->assertIsArray($result);
        $this->assertEquals(100000.00, $result['total_amount']);
        $this->assertEquals(30.0, $result['down_payment_percentage']);
        $this->assertEquals(30000.00, $result['down_payment_amount']);
        $this->assertEquals(70000.00, $result['remaining_amount']);
        $this->assertEquals('IDR', $result['currency']);
    }

    /** @test */
    public function it_generates_invoice_number_with_real_order(): void
    {
        $result = $this->service->generateInvoiceNumber(
            $this->tenantId->getValue(),
            $this->order->getId()->getValue()
        );

        $this->assertStringStartsWith('INV-' . $this->order->getOrderNumber() . '-', $result);
        $this->assertStringContainsString(date('Ymd'), $result);
    }

    /** @test */
    public function it_records_payment_transaction_with_real_data(): void
    {
        $result = $this->service->recordPaymentTransaction(
            $this->tenantId->getValue(),
            $this->order->getId()->getValue(),
            50000.00,
            'bank_transfer',
            'TXN-12345'
        );

        $this->assertIsArray($result);
        $this->assertEquals($this->tenantId->getValue(), $result['tenant_id']);
        $this->assertEquals($this->order->getId()->getValue(), $result['order_id']);
        $this->assertEquals(50000.00, $result['amount']);
        $this->assertEquals('bank_transfer', $result['payment_method']);
        $this->assertEquals('TXN-12345', $result['transaction_reference']);
        $this->assertEquals('recorded', $result['status']);
    }

    /** @test */
    public function it_fails_when_order_not_found(): void
    {
        $nonExistentOrderId = '999e8400-e29b-41d4-a716-446655440999';
        
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("Order not found with ID: {$nonExistentOrderId}");

        $this->service->verifyPayment(
            $this->tenantId->getValue(),
            $nonExistentOrderId,
            100000.00
        );
    }

    /** @test */
    public function it_fails_when_order_belongs_to_different_tenant(): void
    {
        $otherTenantId = '660e8400-e29b-41d4-a716-446655440001';
        
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Order belongs to different tenant');

        $this->service->verifyPayment(
            $otherTenantId,
            $this->order->getId()->getValue(),
            100000.00
        );
    }

    /** @test */
    public function it_validates_negative_payment_amount(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Payment amount must be non-negative');

        $this->service->verifyPayment(
            $this->tenantId->getValue(),
            $this->order->getId()->getValue(),
            -1000.00
        );
    }

    /** @test */
    public function it_validates_payment_transaction_amount(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Payment amount must be greater than zero');

        $this->service->recordPaymentTransaction(
            $this->tenantId->getValue(),
            $this->order->getId()->getValue(),
            0.00,
            'bank_transfer'
        );
    }

    /** @test */
    public function it_handles_partial_payment_calculation(): void
    {
        $result = $this->service->verifyPayment(
            $this->tenantId->getValue(),
            $this->order->getId()->getValue(),
            50000.00 // Half payment
        );

        $this->assertEquals('partial_payment', $result['payment_status']);
        $this->assertEquals(50000.00, $result['pending_amount']);
    }

    /** @test */
    public function it_validates_down_payment_percentage_range(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Percentage must be between 0 and 100');

        $this->service->calculateDownPayment(
            $this->tenantId->getValue(),
            $this->order->getId()->getValue(),
            150.0 // Invalid percentage
        );
    }
}