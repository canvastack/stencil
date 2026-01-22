<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use App\Infrastructure\Persistence\Eloquent\Models\Shipment;
use App\Infrastructure\Persistence\Eloquent\Models\ShippingMethod;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Domain\Shipping\Services\ShippingService;

class ShippingTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected TenantEloquentModel $tenant;
    protected Customer $customer;
    protected Order $order;
    protected ShippingMethod $shippingMethod;
    protected ShippingService $shippingService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = TenantEloquentModel::factory()->create();
        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->shippingMethod = ShippingMethod::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_active' => true
        ]);
        $this->shippingService = app(ShippingService::class);

        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'items' => [
                [
                    'product_id' => 1,
                    'name' => 'Test Product',
                    'weight_kg' => 1.5,
                    'quantity' => 2,
                ]
            ],
            'shipping_address' => [
                'recipient_name' => 'John Doe',
                'address_line_1' => '123 Main St',
                'city' => 'Jakarta',
                'state_province' => 'DKI Jakarta',
                'postal_code' => '12345',
                'country_code' => 'IDN',
            ]
        ]);
    }

    public function test_calculate_shipping_cost()
    {
        $costDetails = $this->shippingService->calculateShippingCost($this->order, $this->shippingMethod);

        $this->assertArrayHasKey('base_cost', $costDetails);
        $this->assertArrayHasKey('weight_cost', $costDetails);
        $this->assertArrayHasKey('total_cost', $costDetails);
        $this->assertArrayHasKey('weight_kg', $costDetails);
        $this->assertArrayHasKey('estimated_days', $costDetails);

        $this->assertGreaterThanOrEqual($this->shippingMethod->base_cost, $costDetails['total_cost']);
    }

    public function test_create_shipment()
    {
        $shipment = $this->shippingService->createShipment($this->order, [
            'shipping_method_id' => $this->shippingMethod->id,
            'special_instructions' => 'Please handle with care',
        ]);

        $this->assertInstanceOf(Shipment::class, $shipment);
        $this->assertEquals($this->order->id, $shipment->order_id);
        $this->assertEquals($this->shippingMethod->id, $shipment->shipping_method_id);
        $this->assertEquals('pending', $shipment->status);
        $this->assertNotNull($shipment->estimated_delivery);
    }

    public function test_process_shipment()
    {
        $shipment = Shipment::factory()->pending()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'shipping_method_id' => $this->shippingMethod->id,
        ]);

        $result = $this->shippingService->processShipment($shipment);

        $this->assertTrue($result);
        $this->assertEquals('processing', $shipment->fresh()->status);
        $this->assertNotNull($shipment->fresh()->tracking_number);
    }

    public function test_cannot_process_non_pending_shipment()
    {
        $shipment = Shipment::factory()->shipped()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'shipping_method_id' => $this->shippingMethod->id,
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Only pending shipments can be processed');

        $this->shippingService->processShipment($shipment);
    }

    public function test_update_tracking()
    {
        $shipment = Shipment::factory()->shipped()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'shipping_method_id' => $this->shippingMethod->id,
        ]);

        $trackingEvents = $this->shippingService->updateTracking($shipment);

        $this->assertIsArray($trackingEvents);
        $this->assertGreaterThan(0, count($trackingEvents));
        $this->assertArrayHasKey('status', $trackingEvents[0]);
        $this->assertArrayHasKey('timestamp', $trackingEvents[0]);
    }

    public function test_cancel_shipment()
    {
        $shipment = Shipment::factory()->pending()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'shipping_method_id' => $this->shippingMethod->id,
        ]);

        $result = $this->shippingService->cancelShipment($shipment, 'Customer request');

        $this->assertTrue($result);
        $this->assertEquals('cancelled', $shipment->fresh()->status);
        $this->assertIsArray($shipment->fresh()->metadata);
    }

    public function test_cannot_cancel_delivered_shipment()
    {
        $shipment = Shipment::factory()->delivered()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'shipping_method_id' => $this->shippingMethod->id,
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Only pending or processing shipments can be cancelled');

        $this->shippingService->cancelShipment($shipment);
    }

    public function test_shipment_has_correct_delivery_status()
    {
        $deliveredShipment = Shipment::factory()->delivered()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
        ]);

        $status = $deliveredShipment->getDeliveryStatus();
        $this->assertStringContainsString('Delivered', $status);

        $pendingShipment = Shipment::factory()->pending()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
        ]);

        $status = $pendingShipment->getDeliveryStatus();
        $this->assertStringContainsString('Delivery date not set', $status);
    }

    public function test_get_latest_tracking_event()
    {
        $shipment = Shipment::factory()->shipped()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
        ]);

        $latestEvent = $shipment->getLatestTrackingEvent();
        $this->assertIsArray($latestEvent);
        $this->assertArrayHasKey('status', $latestEvent);
    }

    public function test_shipping_method_scopes()
    {
        ShippingMethod::factory(5)->create(['tenant_id' => $this->tenant->id, 'is_active' => true]);
        ShippingMethod::factory(3)->create(['tenant_id' => $this->tenant->id, 'is_active' => false]);

        $activeMethods = ShippingMethod::active()->count();
        $this->assertEquals(5 + 1, $activeMethods); // +1 from setUp

        $byCarrier = ShippingMethod::byCarrier('JNE')->count();
        $this->assertGreaterThanOrEqual(0, $byCarrier);
    }

    public function test_shipment_scopes()
    {
        Shipment::factory(3)->pending()->create(['tenant_id' => $this->tenant->id]);
        Shipment::factory(2)->shipped()->create(['tenant_id' => $this->tenant->id]);
        Shipment::factory(1)->delivered()->create(['tenant_id' => $this->tenant->id]);

        $pending = Shipment::pending()->count();
        $shipped = Shipment::shipped()->count();
        $delivered = Shipment::delivered()->count();

        $this->assertEquals(3, $pending);
        $this->assertEquals(2, $shipped);
        $this->assertEquals(1, $delivered);
    }
}
