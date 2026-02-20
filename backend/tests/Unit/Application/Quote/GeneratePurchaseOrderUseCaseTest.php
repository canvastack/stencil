<?php

namespace Tests\Unit\Application\Quote;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Application\Quote\Commands\GeneratePurchaseOrderCommand;
use App\Application\Quote\UseCases\GeneratePurchaseOrderUseCase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Models\VendorPurchaseOrder;
use InvalidArgumentException;

class GeneratePurchaseOrderUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private GeneratePurchaseOrderUseCase $useCase;
    private TenantEloquentModel $tenant;
    private UserEloquentModel $admin;
    private UserEloquentModel $vendorUser;
    private Vendor $vendor;
    private Order $order;
    private OrderVendorNegotiation $quote;

    protected function setUp(): void
    {
        parent::setUp();

        $this->useCase = app(GeneratePurchaseOrderUseCase::class);

        // Create test data
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->admin = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'account_type' => 'tenant',
        ]);
        
        // Create vendor record (for order_vendor_negotiations foreign key)
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        // Create vendor user (for vendor_purchase_orders foreign key)
        // The users.vendor_id references vendors.uuid
        $this->vendorUser = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenant->id,
            'account_type' => 'vendor',
            'vendor_id' => $this->vendor->uuid, // Link user to vendor via UUID
        ]);
        
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'vendor_negotiation',
        ]);

        $this->quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id, // References vendors table
            'status' => 'accepted',
            'latest_offer' => 15000000, // Rp 150,000.00 in cents
            'responded_at' => now(),
            'quote_details' => [
                'estimated_delivery_days' => 18,
            ],
        ]);
    }

    /** @test */
    public function it_generates_purchase_order_from_accepted_quote()
    {
        // Arrange
        $command = new GeneratePurchaseOrderCommand(
            quoteUuid: $this->quote->uuid,
            tenantId: (string) $this->tenant->id,
            userId: (string) $this->admin->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test'
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertIsArray($result);
        $this->assertArrayHasKey('po_uuid', $result);
        $this->assertArrayHasKey('po_number', $result);
        $this->assertArrayHasKey('status', $result);
        $this->assertEquals('draft', $result['status']);

        // Verify PO created in database
        $po = VendorPurchaseOrder::where('uuid', $result['po_uuid'])->first();
        $this->assertNotNull($po);
        $this->assertEquals($this->quote->id, $po->quote_id);
        $this->assertEquals($this->order->id, $po->order_id);
        $this->assertEquals($this->vendorUser->id, $po->vendor_id); // vendor_id references users table
    }

    /** @test */
    public function it_generates_unique_po_number()
    {
        // Arrange
        $command = new GeneratePurchaseOrderCommand(
            quoteUuid: $this->quote->uuid,
            tenantId: (string) $this->tenant->id,
            userId: (string) $this->admin->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test'
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertMatchesRegularExpression('/^PO-\d{6}-\d{5}$/', $result['po_number']);
    }

    /** @test */
    public function it_calculates_expected_delivery_date_correctly()
    {
        // Arrange
        $command = new GeneratePurchaseOrderCommand(
            quoteUuid: $this->quote->uuid,
            tenantId: (string) $this->tenant->id,
            userId: (string) $this->admin->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test'
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $po = VendorPurchaseOrder::where('uuid', $result['po_uuid'])->first();
        $expectedDate = $this->quote->responded_at->addDays(18);
        
        $this->assertEquals(
            $expectedDate->format('Y-m-d'),
            $po->expected_delivery_date->format('Y-m-d')
        );
    }

    /** @test */
    public function it_calculates_pricing_with_tax()
    {
        // Arrange
        $command = new GeneratePurchaseOrderCommand(
            quoteUuid: $this->quote->uuid,
            tenantId: (string) $this->tenant->id,
            userId: (string) $this->admin->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test'
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $po = VendorPurchaseOrder::where('uuid', $result['po_uuid'])->first();
        
        $this->assertEquals(15000000, $po->subtotal); // Rp 150,000.00
        $this->assertEquals(1650000, $po->tax); // 11% of subtotal
        $this->assertEquals(16650000, $po->grand_total); // subtotal + tax
    }

    /** @test */
    public function it_throws_exception_for_non_accepted_quote()
    {
        // Arrange
        $this->quote->update(['status' => 'sent']);
        
        $command = new GeneratePurchaseOrderCommand(
            quoteUuid: $this->quote->uuid,
            tenantId: (string) $this->tenant->id,
            userId: (string) $this->admin->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test'
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Can only generate PO for accepted quotes');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_if_po_already_exists()
    {
        // Arrange
        VendorPurchaseOrder::factory()->create([
            'tenant_id' => $this->tenant->id,
            'quote_id' => $this->quote->id,
        ]);

        $command = new GeneratePurchaseOrderCommand(
            quoteUuid: $this->quote->uuid,
            tenantId: (string) $this->tenant->id,
            userId: (string) $this->admin->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test'
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Purchase order already exists for this quote');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_uses_custom_delivery_address_when_provided()
    {
        // Arrange
        $customAddress = json_encode([
            'street' => 'Custom Street 456',
            'city' => 'Bandung',
            'postal_code' => '54321',
        ]);

        $command = new GeneratePurchaseOrderCommand(
            quoteUuid: $this->quote->uuid,
            tenantId: (string) $this->tenant->id,
            userId: (string) $this->admin->id,
            deliveryAddress: $customAddress,
            ipAddress: '127.0.0.1',
            userAgent: 'Test'
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $po = VendorPurchaseOrder::where('uuid', $result['po_uuid'])->first();
        $this->assertEquals($customAddress, $po->delivery_address);
    }

    /** @test */
    public function it_uses_custom_payment_schedule_when_provided()
    {
        // Arrange
        $customSchedule = [
            'down_payment_percentage' => 30,
            'balance_on_delivery' => false,
            'installments' => 3,
        ];

        $command = new GeneratePurchaseOrderCommand(
            quoteUuid: $this->quote->uuid,
            tenantId: (string) $this->tenant->id,
            userId: (string) $this->admin->id,
            paymentSchedule: $customSchedule,
            ipAddress: '127.0.0.1',
            userAgent: 'Test'
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $po = VendorPurchaseOrder::where('uuid', $result['po_uuid'])->first();
        $this->assertEquals($customSchedule, $po->payment_schedule);
    }

    /** @test */
    public function it_sets_validity_date_to_30_days_from_issue()
    {
        // Arrange
        $command = new GeneratePurchaseOrderCommand(
            quoteUuid: $this->quote->uuid,
            tenantId: (string) $this->tenant->id,
            userId: (string) $this->admin->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test'
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $po = VendorPurchaseOrder::where('uuid', $result['po_uuid'])->first();
        $expectedValidity = $po->issue_date->addDays(30);
        
        $this->assertEquals(
            $expectedValidity->format('Y-m-d'),
            $po->validity_date->format('Y-m-d')
        );
    }

    /** @test */
    public function it_records_creator_user_id()
    {
        // Arrange
        $command = new GeneratePurchaseOrderCommand(
            quoteUuid: $this->quote->uuid,
            tenantId: $this->tenant->id,
            userId: (string) $this->admin->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test'
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $po = VendorPurchaseOrder::where('uuid', $result['po_uuid'])->first();
        $this->assertEquals($this->admin->id, $po->created_by);
    }
}
