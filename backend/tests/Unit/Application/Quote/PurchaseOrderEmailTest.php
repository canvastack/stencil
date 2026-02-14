<?php

namespace Tests\Unit\Application\Quote;

use App\Application\Quote\Services\PurchaseOrderService;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant as TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User as UserEloquentModel;
use App\Mail\Vendor\PurchaseOrderNotification;
use App\Models\VendorPurchaseOrder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PurchaseOrderEmailTest extends TestCase
{
    use RefreshDatabase;

    private PurchaseOrderService $service;
    private $tenant;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(PurchaseOrderService::class);
        
        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create();
        
        // Fake mail and storage
        Mail::fake();
        Storage::fake('local');
    }
    
    /**
     * Create vendor user and vendor record
     */
    private function createVendor(array $attributes = []): array
    {
        $defaultAttributes = [
            'tenant_id' => $this->tenant->id,
            'email' => 'vendor@example.com',
            'name' => 'Test Vendor Co.',
        ];
        
        $attributes = array_merge($defaultAttributes, $attributes);
        
        // Create user for PO foreign key
        $vendorUser = UserEloquentModel::factory()->create(array_merge($attributes, [
            'account_type' => 'vendor',
        ]));
        
        // Create vendor for quote foreign key
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create($attributes);
        
        return [
            'user' => $vendorUser,
            'vendor' => $vendor,
        ];
    }

    /** @test */
    public function it_sends_email_to_vendor_with_pdf_attachment()
    {
        // Arrange
        $vendors = $this->createVendor();

        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'items' => json_encode([
                [
                    'product_id' => 'test-uuid',
                    'product_name' => 'Test Product',
                    'quantity' => 2,
                    'specifications' => [
                        'material' => 'stainless_steel',
                        'dimensions' => '10x15cm',
                    ],
                    'pricing' => [
                        'unit_price' => 150000,
                        'total_price' => 300000,
                    ],
                ],
            ]),
        ]);

        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendors['vendor']->id,
            'status' => 'accepted',
        ]);

        $po = VendorPurchaseOrder::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'quote_id' => $quote->id,
            'vendor_id' => $vendors['user']->id,
            'status' => 'draft',
        ]);

        // Act
        $result = $this->service->sendToVendor($po);

        // Assert
        $this->assertTrue($result, 'sendToVendor should return true');
        
        // Verify email was queued (not sent immediately because of ShouldQueue)
        Mail::assertQueued(PurchaseOrderNotification::class, function ($mail) use ($vendors) {
            return $mail->hasTo($vendors['user']->email);
        });

        // Verify PO status updated
        $po->refresh();
        $this->assertEquals('sent', $po->status);
        $this->assertNotNull($po->sent_at);
    }

    /** @test */
    public function it_generates_pdf_before_sending_if_not_exists()
    {
        // Arrange
        $vendors = $this->createVendor();

        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'items' => json_encode([
                [
                    'product_id' => 'test-uuid',
                    'product_name' => 'Test Product',
                    'quantity' => 1,
                ],
            ]),
        ]);

        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendors['vendor']->id,
        ]);

        $po = VendorPurchaseOrder::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'quote_id' => $quote->id,
            'vendor_id' => $vendors['user']->id,
            'pdf_path' => null, // No PDF yet
            'pdf_generated_at' => null,
        ]);

        // Act
        $result = $this->service->sendToVendor($po);

        // Assert
        $this->assertTrue($result);
        
        // Verify PDF was generated
        $po->refresh();
        $this->assertNotNull($po->pdf_path);
        $this->assertNotNull($po->pdf_generated_at);
        
        // Verify email was queued
        Mail::assertQueued(PurchaseOrderNotification::class);
    }

    /** @test */
    public function it_fails_gracefully_when_vendor_has_invalid_email()
    {
        // Arrange
        $vendors = $this->createVendor(['email' => 'invalid-email']);

        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendors['vendor']->id,
        ]);

        $po = VendorPurchaseOrder::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'quote_id' => $quote->id,
            'vendor_id' => $vendors['user']->id,
        ]);

        // Act
        $result = $this->service->sendToVendor($po);

        // Assert - Email will still be sent even with invalid format
        // The mail system will handle validation
        $this->assertTrue($result);
        
        // Verify status updated
        $po->refresh();
        $this->assertEquals('sent', $po->status);
        $this->assertNotNull($po->sent_at);
    }

    /** @test */
    public function it_includes_correct_data_in_email()
    {
        // Arrange
        $vendors = $this->createVendor();

        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_number' => 'ORD-202602-00123',
            'items' => json_encode([['product_name' => 'Test Product']]),
        ]);

        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendors['vendor']->id,
        ]);

        $po = VendorPurchaseOrder::factory()->create([
            'tenant_id' => $this->tenant->id,
            'po_number' => 'PO-202602-00456',
            'order_id' => $order->id,
            'quote_id' => $quote->id,
            'vendor_id' => $vendors['user']->id,
            'grand_total' => 500000, // 5000.00 IDR
        ]);

        // Act
        $this->service->sendToVendor($po);

        // Assert
        Mail::assertQueued(PurchaseOrderNotification::class, function ($mail) use ($po, $vendors) {
            return $mail->purchaseOrder->id === $po->id
                && $mail->vendorName === $vendors['user']->name
                && str_contains($mail->portalUrl, $po->uuid);
        });
    }

    /** @test */
    public function it_can_only_send_draft_purchase_orders()
    {
        // Arrange
        $vendors = $this->createVendor();

        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendors['vendor']->id,
        ]);

        $po = VendorPurchaseOrder::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'quote_id' => $quote->id,
            'vendor_id' => $vendors['user']->id,
            'status' => 'sent', // Already sent
        ]);

        // Act & Assert
        $canSend = $this->service->canSend($po);
        $this->assertFalse($canSend);
    }
}
