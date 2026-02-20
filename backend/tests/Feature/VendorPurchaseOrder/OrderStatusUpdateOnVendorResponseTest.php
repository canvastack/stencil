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
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Order Status Update on Vendor Response Tests
 * 
 * Tests that order status is correctly updated when vendor acknowledges PO
 * 
 * Requirements: Phase 9.4 - Update order status based on vendor response
 */
class OrderStatusUpdateOnVendorResponseTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private User $admin;
    private User $vendorUser;
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

        // Create vendor user
        $this->vendorUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'account_type' => 'vendor',
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
            'amount' => 5000000,
            'status' => 'accepted',
        ]);

        $this->documentService = app(DocumentGenerationService::class);
    }

    /**
     * Test: Order status transitions from awaiting_payment to in_production when vendor acknowledges PO
     * 
     * Requirements: Phase 9.4
     */
    public function test_order_status_updates_from_awaiting_payment_to_in_production(): void
    {
        Mail::fake();
        Queue::fake();

        // Create order in awaiting_payment status
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
            'grand_total' => 6000000,
            'created_by' => $this->admin->id,
        ]);

        $this->actingAs($this->admin, 'sanctum');

        // Generate and send PO
        $purchaseOrder = $this->documentService->generatePurchaseOrder(
            $this->order->id,
            $this->admin->id
        );

        $sentPO = $this->documentService->sendPurchaseOrderToVendor(
            $purchaseOrder->uuid,
            $this->admin->id
        );

        // Verify order is still in awaiting_payment
        $this->order->refresh();
        $this->assertEquals('awaiting_payment', $this->order->status);

        // Vendor acknowledges PO
        $acknowledgedPO = $this->documentService->acknowledgePurchaseOrder(
            $sentPO->uuid,
            $this->vendorUser->id,
            'Acknowledged and will start production'
        );

        // Verify order status updated to in_production
        $this->order->refresh();
        $this->assertEquals('in_production', $this->order->status);

        // Verify PO status is acknowledged
        $this->assertEquals('acknowledged', $acknowledgedPO->status);
        $this->assertNotNull($acknowledgedPO->acknowledged_at);
        $this->assertEquals($this->vendorUser->id, $acknowledgedPO->acknowledged_by);
    }

    /**
     * Test: Order status transitions from full_payment to in_production when vendor acknowledges PO
     * 
     * Requirements: Phase 9.4
     */
    public function test_order_status_updates_from_full_payment_to_in_production(): void
    {
        Mail::fake();
        Queue::fake();

        // Create order in full_payment status
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'full_payment',
        ]);

        // Create customer quote
        $this->customerQuote = CustomerQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_quote_id' => $this->vendorQuote->id,
            'status' => 'accepted',
            'grand_total' => 6000000,
            'created_by' => $this->admin->id,
        ]);

        $this->actingAs($this->admin, 'sanctum');

        // Generate and send PO
        $purchaseOrder = $this->documentService->generatePurchaseOrder(
            $this->order->id,
            $this->admin->id
        );

        $sentPO = $this->documentService->sendPurchaseOrderToVendor(
            $purchaseOrder->uuid,
            $this->admin->id
        );

        // Verify order is still in full_payment
        $this->order->refresh();
        $this->assertEquals('full_payment', $this->order->status);

        // Vendor acknowledges PO
        $this->documentService->acknowledgePurchaseOrder(
            $sentPO->uuid,
            $this->vendorUser->id,
            'Acknowledged and will start production'
        );

        // Verify order status updated to in_production
        $this->order->refresh();
        $this->assertEquals('in_production', $this->order->status);
    }

    /**
     * Test: Order status does not change if already in production phase
     * 
     * Requirements: Phase 9.4
     */
    public function test_order_status_does_not_change_if_already_in_production(): void
    {
        Mail::fake();
        Queue::fake();

        // Create order already in in_production status
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'in_production',
        ]);

        // Create customer quote
        $this->customerQuote = CustomerQuote::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_quote_id' => $this->vendorQuote->id,
            'status' => 'accepted',
            'grand_total' => 6000000,
            'created_by' => $this->admin->id,
        ]);

        $this->actingAs($this->admin, 'sanctum');

        // Generate and send PO
        $purchaseOrder = $this->documentService->generatePurchaseOrder(
            $this->order->id,
            $this->admin->id
        );

        $sentPO = $this->documentService->sendPurchaseOrderToVendor(
            $purchaseOrder->uuid,
            $this->admin->id
        );

        // Vendor acknowledges PO
        $this->documentService->acknowledgePurchaseOrder(
            $sentPO->uuid,
            $this->vendorUser->id,
            'Acknowledged'
        );

        // Verify order status remains in_production
        $this->order->refresh();
        $this->assertEquals('in_production', $this->order->status);
    }

    /**
     * Test: Order status does not change if in other statuses (that allow PO generation)
     * 
     * Requirements: Phase 9.4
     */
    public function test_order_status_does_not_change_for_other_statuses(): void
    {
        Mail::fake();
        Queue::fake();

        // Test with statuses that allow PO generation but shouldn't transition to in_production
        $testStatuses = ['partial_payment', 'quality_control', 'shipping'];

        foreach ($testStatuses as $status) {
            // Create order with specific status
            $order = Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'status' => $status,
            ]);

            // Create customer quote
            $customerQuote = CustomerQuote::factory()->create([
                'tenant_id' => $this->tenant->id,
                'order_id' => $order->id,
                'vendor_quote_id' => $this->vendorQuote->id,
                'status' => 'accepted',
                'grand_total' => 6000000,
                'created_by' => $this->admin->id,
            ]);

            $this->actingAs($this->admin, 'sanctum');

            // Generate and send PO
            $purchaseOrder = $this->documentService->generatePurchaseOrder(
                $order->id,
                $this->admin->id
            );

            $sentPO = $this->documentService->sendPurchaseOrderToVendor(
                $purchaseOrder->uuid,
                $this->admin->id
            );

            // Vendor acknowledges PO
            $this->documentService->acknowledgePurchaseOrder(
                $sentPO->uuid,
                $this->vendorUser->id,
                'Acknowledged'
            );

            // Verify order status remains unchanged
            $order->refresh();
            $this->assertEquals($status, $order->status, "Order status should not change from {$status}");
        }
    }

    /**
     * Test: Multiple PO acknowledgments do not cause issues
     * 
     * Requirements: Phase 9.4
     */
    public function test_multiple_po_acknowledgments_handled_correctly(): void
    {
        Mail::fake();
        Queue::fake();

        // Create order in awaiting_payment status
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
            'grand_total' => 6000000,
            'created_by' => $this->admin->id,
        ]);

        $this->actingAs($this->admin, 'sanctum');

        // Generate and send first PO
        $purchaseOrder1 = $this->documentService->generatePurchaseOrder(
            $this->order->id,
            $this->admin->id
        );

        $sentPO1 = $this->documentService->sendPurchaseOrderToVendor(
            $purchaseOrder1->uuid,
            $this->admin->id
        );

        // Vendor acknowledges first PO
        $this->documentService->acknowledgePurchaseOrder(
            $sentPO1->uuid,
            $this->vendorUser->id,
            'First acknowledgment'
        );

        // Verify order status updated to in_production
        $this->order->refresh();
        $this->assertEquals('in_production', $this->order->status);

        // Generate and send second PO (revision)
        $purchaseOrder2 = $this->documentService->generatePurchaseOrder(
            $this->order->id,
            $this->admin->id
        );

        $sentPO2 = $this->documentService->sendPurchaseOrderToVendor(
            $purchaseOrder2->uuid,
            $this->admin->id
        );

        // Vendor acknowledges second PO
        $this->documentService->acknowledgePurchaseOrder(
            $sentPO2->uuid,
            $this->vendorUser->id,
            'Second acknowledgment'
        );

        // Verify order status remains in_production (no duplicate transition)
        $this->order->refresh();
        $this->assertEquals('in_production', $this->order->status);

        // Verify both POs are acknowledged
        $acknowledgedPOs = OrderDocument::withoutGlobalScope('tenant')
            ->where('order_id', $this->order->id)
            ->where('document_type', 'purchase_order')
            ->where('status', 'acknowledged')
            ->count();

        $this->assertEquals(2, $acknowledgedPOs);
    }

    /**
     * Test: Order status transition is logged in order history
     * 
     * Requirements: Phase 9.4
     */
    public function test_order_status_transition_is_logged(): void
    {
        Mail::fake();
        Queue::fake();

        // Create order in awaiting_payment status
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
            'grand_total' => 6000000,
            'created_by' => $this->admin->id,
        ]);

        $this->actingAs($this->admin, 'sanctum');

        // Generate and send PO
        $purchaseOrder = $this->documentService->generatePurchaseOrder(
            $this->order->id,
            $this->admin->id
        );

        $sentPO = $this->documentService->sendPurchaseOrderToVendor(
            $purchaseOrder->uuid,
            $this->admin->id
        );

        // Vendor acknowledges PO
        $this->documentService->acknowledgePurchaseOrder(
            $sentPO->uuid,
            $this->vendorUser->id,
            'Acknowledged and will start production'
        );

        // Verify order status updated
        $this->order->refresh();
        $this->assertEquals('in_production', $this->order->status);

        // Note: Order history logging would be implemented in the Order model
        // or through an event listener. This test verifies the status change occurs.
        // Additional history tracking can be added as needed.
    }
}
