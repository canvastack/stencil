<?php

namespace Tests\Feature\Order;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Presentation\Http\Resources\Order\OrderResource;

/**
 * Test OrderResource includes vendor quote fields for post-acceptance workflow
 * 
 * @see .kiro/specs/post-acceptance-workflow/tasks.md - Task 1.4.2
 */
class OrderResourceVendorQuoteFieldsTest extends TestCase
{
    use RefreshDatabase;

    protected Order $order;
    protected OrderVendorNegotiation $vendorQuote;
    protected Vendor $vendor;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $tenant = Tenant::factory()->create();

        // Create customer
        $customer = Customer::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'name' => 'PT Test Vendor',
        ]);

        // Create vendor quote (accepted)
        $this->vendorQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'accepted',
            'latest_offer' => 15000000, // 150,000 IDR in cents
        ]);

        // Create order with vendor quote information
        $this->order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'vendor_id' => $this->vendor->id,
            'vendor_quote_id' => $this->vendorQuote->id,
            'vendor_quote_accepted_at' => now()->subDays(5),
            'vendor_agreed_price' => 15000000, // 150,000 IDR in cents
            'vendor_estimated_delivery_days' => 18,
            'status' => 'customer_quote',
        ]);

        // Reload with relationships
        $this->order->load(['vendorQuote.vendor']);
    }

    /** @test */
    public function it_includes_vendor_quote_id()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertEquals($this->vendorQuote->id, $data['vendor_quote_id']);
    }

    /** @test */
    public function it_includes_vendor_quote_uuid()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertEquals($this->vendorQuote->uuid, $data['vendor_quote_uuid']);
    }

    /** @test */
    public function it_includes_vendor_quote_status()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertEquals('accepted', $data['vendor_quote_status']);
    }

    /** @test */
    public function it_includes_vendor_quote_status_label()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertEquals('Accepted', $data['vendor_quote_status_label']);
    }

    /** @test */
    public function it_includes_vendor_quote_accepted_at()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertNotNull($data['vendor_quote_accepted_at']);
        $this->assertStringContainsString('T', $data['vendor_quote_accepted_at']); // ISO 8601 format
    }

    /** @test */
    public function it_includes_vendor_agreed_price()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertEquals(15000000, $data['vendor_agreed_price']);
    }

    /** @test */
    public function it_includes_vendor_estimated_delivery_days()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertEquals(18, $data['vendor_estimated_delivery_days']);
    }

    /** @test */
    public function it_includes_vendor_name_from_quote()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertEquals('PT Test Vendor', $data['vendor_name']);
    }

    /** @test */
    public function it_includes_production_progress()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertNotNull($data['production_progress']);
        $this->assertIsArray($data['production_progress']);
        $this->assertArrayHasKey('days_elapsed', $data['production_progress']);
        $this->assertArrayHasKey('days_remaining', $data['production_progress']);
        $this->assertArrayHasKey('progress_percentage', $data['production_progress']);
        $this->assertArrayHasKey('is_overdue', $data['production_progress']);
    }

    /** @test */
    public function it_calculates_production_progress_correctly()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $progress = $data['production_progress'];
        
        // Order was accepted 5 days ago with 18 days estimate
        $this->assertEquals(5, $progress['days_elapsed']);
        // Days remaining should be approximately 13 (allow for timing differences)
        $this->assertGreaterThanOrEqual(12, $progress['days_remaining']);
        $this->assertLessThanOrEqual(14, $progress['days_remaining']);
        $this->assertFalse($progress['is_overdue']);
        $this->assertGreaterThan(0, $progress['progress_percentage']);
        $this->assertLessThan(100, $progress['progress_percentage']);
    }

    /** @test */
    public function it_returns_null_production_progress_when_no_vendor_quote()
    {
        // Create order without vendor quote
        $order = Order::factory()->create([
            'tenant_id' => $this->order->tenant_id,
            'customer_id' => $this->order->customer_id,
            'vendor_quote_id' => null,
            'vendor_quote_accepted_at' => null,
            'vendor_estimated_delivery_days' => null,
        ]);

        $resource = new OrderResource($order);
        $data = $resource->toArray(request());

        $this->assertNull($data['production_progress']);
    }

    /** @test */
    public function it_handles_null_vendor_quote_fields_gracefully()
    {
        // Create order without vendor quote
        $order = Order::factory()->create([
            'tenant_id' => $this->order->tenant_id,
            'customer_id' => $this->order->customer_id,
            'vendor_quote_id' => null,
            'vendor_quote_accepted_at' => null,
            'vendor_agreed_price' => null,
            'vendor_estimated_delivery_days' => null,
        ]);

        $resource = new OrderResource($order);
        $data = $resource->toArray(request());

        $this->assertNull($data['vendor_quote_id']);
        $this->assertNull($data['vendor_quote_uuid']);
        $this->assertNull($data['vendor_quote_status']);
        $this->assertNull($data['vendor_quote_status_label']);
        $this->assertNull($data['vendor_quote_accepted_at']);
        $this->assertNull($data['vendor_agreed_price']);
        $this->assertNull($data['vendor_estimated_delivery_days']);
        $this->assertNull($data['vendor_name']);
        $this->assertNull($data['production_progress']);
    }
}
