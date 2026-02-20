<?php

namespace Tests\Feature\VendorPurchaseOrder;

use App\Application\CustomerQuote\Services\DocumentGenerationService;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use App\Infrastructure\Persistence\Eloquent\Models\VendorSourcing;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Vendor Purchase Order Generation Tests
 * 
 * Tests the generation and management of vendor purchase orders
 * 
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.6, 20.7, 20.8
 */
class VendorPurchaseOrderGenerationTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private User $admin;
    private Vendor $vendor;
    private Order $order;
    private CustomerQuote $customerQuote;
    private VendorQuote $vendorQuote;
    private DocumentGenerationService $documentService;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create();

        // Create admin user
        $this->admin = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'account_type' => 'tenant',
        ]);

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Vendor',
            'email' => 'vendor@test.com',
        ]);

        // Create vendor sourcing
        $sourcing = VendorSourcing::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create vendor quote
        $this->vendorQuote = VendorQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'sourcing_request_id' => $sourcing->id,
            'amount' => 5000000, // 50,000 IDR
            'status' => 'accepted',
        ]);

        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'awaiting_payment',
        ]);

        // Create customer quote
        $this->customerQuote = CustomerQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_quote_id' => $this->vendorQuote->id,
            'status' => 'accepted',
            'grand_total' => 6000000, // 60,000 IDR (with markup)
            'created_by' => $this->admin->id,
        ]);

        $this->documentService = app(DocumentGenerationService::class);
    }

    /**
     * Test: Generate vendor PO after customer acceptance
     * 
     * Requirements: 20.1, 20.2
     */
    public function test_can_generate_vendor_po_after_customer_acceptance(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $purchaseOrder = $this->documentService->generatePurchaseOrder(
            $this->order->id,
            $this->admin->id
        );

        $this->assertInstanceOf(OrderDocument::class, $purchaseOrder);
        $this->assertEquals('purchase_order', $purchaseOrder->document_type);
        $this->assertEquals('draft', $purchaseOrder->status);
        $this->assertEquals($this->order->id, $purchaseOrder->order_id);
        $this->assertEquals($this->vendorQuote->id, $purchaseOrder->vendor_quote_id);
        $this->assertEquals('vendor', $purchaseOrder->recipient_type);
        $this->assertEquals($this->vendor->id, $purchaseOrder->recipient_id);
        $this->assertEquals($this->vendor->email, $purchaseOrder->recipient_email);
        $this->assertStringStartsWith('PO-', $purchaseOrder->document_number);
    }

    /**
     * Test: PO includes all required information
     * 
     * Requirements: 20.3
     */
    public function test_po_includes_required_information(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $purchaseOrder = $this->documentService->generatePurchaseOrder(
            $this->order->id,
            $this->admin->id
        );

        $metadata = $purchaseOrder->metadata;
        $this->assertArrayHasKey('vendor_quote_id', $metadata);
        $this->assertArrayHasKey('vendor_name', $metadata);
        $this->assertArrayHasKey('order_number', $metadata);
        $this->assertArrayHasKey('customer_quote_number', $metadata);
    }

    /**
     * Test: Cannot generate PO without vendor quote
     * 
     * Requirements: 20.1
     */
    public function test_cannot_generate_po_without_vendor_quote(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        // Create order without customer quote
        $orderWithoutQuote = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'awaiting_payment',
        ]);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Order must have customer quote with vendor quote to generate PO');

        $this->documentService->generatePurchaseOrder(
            $orderWithoutQuote->id,
            $this->admin->id
        );
    }

    /**
     * Test: Send PO to vendor
     * 
     * Requirements: 20.4
     */
    public function test_can_send_po_to_vendor(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        \Mail::fake();

        $purchaseOrder = $this->documentService->generatePurchaseOrder(
            $this->order->id,
            $this->admin->id
        );

        $sentPO = $this->documentService->sendPurchaseOrderToVendor(
            $purchaseOrder->uuid,
            $this->admin->id
        );

        $this->assertEquals('sent', $sentPO->status);
        $this->assertNotNull($sentPO->sent_at);
        $this->assertEquals($this->admin->id, $sentPO->sent_by);

        // Mail is queued, not sent directly
        \Mail::assertQueued(\App\Mail\VendorPurchaseOrderMail::class, function ($mail) {
            return $mail->hasTo($this->vendor->email);
        });
    }

    /**
     * Test: Vendor can acknowledge PO
     * 
     * Requirements: 20.7
     */
    public function test_vendor_can_acknowledge_po(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        \Mail::fake();
        \Queue::fake();

        $purchaseOrder = $this->documentService->generatePurchaseOrder(
            $this->order->id,
            $this->admin->id
        );

        $sentPO = $this->documentService->sendPurchaseOrderToVendor(
            $purchaseOrder->uuid,
            $this->admin->id
        );

        // Create vendor user
        $vendorUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'account_type' => 'vendor',
        ]);

        $acknowledgedPO = $this->documentService->acknowledgePurchaseOrder(
            $sentPO->uuid,
            $vendorUser->id,
            'Acknowledged and will start production'
        );

        $this->assertEquals('acknowledged', $acknowledgedPO->status);
        $this->assertNotNull($acknowledgedPO->acknowledged_at);
        $this->assertEquals($vendorUser->id, $acknowledgedPO->acknowledged_by);
        $this->assertArrayHasKey('acknowledgment_notes', $acknowledgedPO->metadata);
    }

    /**
     * Test: Order status updates after PO acknowledgment
     * 
     * Requirements: 20.7
     */
    public function test_order_status_updates_after_po_acknowledgment(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        \Mail::fake();
        \Queue::fake();

        $purchaseOrder = $this->documentService->generatePurchaseOrder(
            $this->order->id,
            $this->admin->id
        );

        $sentPO = $this->documentService->sendPurchaseOrderToVendor(
            $purchaseOrder->uuid,
            $this->admin->id
        );

        $vendorUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'account_type' => 'vendor',
        ]);

        $this->documentService->acknowledgePurchaseOrder(
            $sentPO->uuid,
            $vendorUser->id
        );

        $this->order->refresh();
        $this->assertEquals('in_production', $this->order->status);
    }

    /**
     * Test: Cannot send non-draft PO
     * 
     * Requirements: 20.4
     */
    public function test_cannot_send_non_draft_po(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        \Mail::fake();
        \Queue::fake();

        $purchaseOrder = $this->documentService->generatePurchaseOrder(
            $this->order->id,
            $this->admin->id
        );

        // Send once
        $this->documentService->sendPurchaseOrderToVendor(
            $purchaseOrder->uuid,
            $this->admin->id
        );

        // Try to send again
        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Only draft purchase orders can be sent');

        $this->documentService->sendPurchaseOrderToVendor(
            $purchaseOrder->uuid,
            $this->admin->id
        );
    }

    /**
     * Test: Cannot acknowledge non-sent PO
     * 
     * Requirements: 20.7
     */
    public function test_cannot_acknowledge_non_sent_po(): void
    {
        $this->actingAs($this->admin, 'sanctum');

        $purchaseOrder = $this->documentService->generatePurchaseOrder(
            $this->order->id,
            $this->admin->id
        );

        $vendorUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'account_type' => 'vendor',
        ]);

        $this->expectException(\DomainException::class);
        $this->expectExceptionMessage('Only sent purchase orders can be acknowledged');

        $this->documentService->acknowledgePurchaseOrder(
            $purchaseOrder->uuid,
            $vendorUser->id
        );
    }
}
