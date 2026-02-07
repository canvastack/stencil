<?php

namespace Tests\Feature\Order;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Presentation\Http\Resources\Order\OrderResource;

class OrderResourceQuoteInfoTest extends TestCase
{
    use RefreshDatabase;

    private $tenant;
    private $customer;
    private $vendor;
    private $order;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'vendor_id' => $this->vendor->id,
            'vendor_quoted_price' => 1000000, // 10,000.00 in cents
            'quotation_amount' => 1350000, // 13,500.00 in cents
            'vendor_lead_time_days' => 14,
            'negotiation_notes' => 'Test negotiation notes',
            'vendor_terms' => ['payment' => 'net30', 'warranty' => '1 year'],
        ]);
    }

    /** @test */
    public function it_exposes_vendor_quoted_price_converted_from_cents_to_decimal()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertEquals(10000.00, $data['vendor_quoted_price']);
        $this->assertEquals(10000.00, $data['vendorQuotedPrice']);
    }

    /** @test */
    public function it_exposes_quotation_amount_converted_from_cents_to_decimal()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertEquals(13500.00, $data['quotation_amount']);
        $this->assertEquals(13500.00, $data['quotationAmount']);
    }

    /** @test */
    public function it_exposes_vendor_terms()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertEquals(['payment' => 'net30', 'warranty' => '1 year'], $data['vendor_terms']);
        $this->assertEquals(['payment' => 'net30', 'warranty' => '1 year'], $data['vendorTerms']);
    }

    /** @test */
    public function it_exposes_vendor_lead_time_days()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertEquals(14, $data['vendor_lead_time_days']);
        $this->assertEquals(14, $data['vendorLeadTimeDays']);
    }

    /** @test */
    public function it_exposes_negotiation_notes()
    {
        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertEquals('Test negotiation notes', $data['negotiation_notes']);
        $this->assertEquals('Test negotiation notes', $data['negotiationNotes']);
    }

    /** @test */
    public function it_calculates_active_quotes_count()
    {
        // Create some quotes with different statuses
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'sent', // Changed from 'draft' to 'sent'
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'countered',
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'accepted',
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'rejected',
        ]);

        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        // Should count only 'sent', 'pending_response', and 'countered' statuses
        $this->assertEquals(2, $data['active_quotes']);
        $this->assertEquals(2, $data['activeQuotes']);
    }

    /** @test */
    public function it_exposes_accepted_quote_uuid()
    {
        $acceptedQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'accepted',
        ]);

        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertEquals($acceptedQuote->uuid, $data['accepted_quote']);
        $this->assertEquals($acceptedQuote->uuid, $data['acceptedQuote']);
    }

    /** @test */
    public function it_returns_null_for_accepted_quote_when_none_exists()
    {
        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
        ]);

        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        $this->assertNull($data['accepted_quote']);
        $this->assertNull($data['acceptedQuote']);
    }

    /** @test */
    public function it_returns_latest_accepted_quote_when_multiple_exist()
    {
        $olderQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'accepted',
            'created_at' => now()->subDays(2),
        ]);

        $newerQuote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'accepted',
            'created_at' => now()->subDay(),
        ]);

        $resource = new OrderResource($this->order);
        $data = $resource->toArray(request());

        // Should return the newer quote
        $this->assertEquals($newerQuote->uuid, $data['accepted_quote']);
        $this->assertEquals($newerQuote->uuid, $data['acceptedQuote']);
    }

    /** @test */
    public function it_handles_null_vendor_quoted_price()
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'vendor_quoted_price' => null,
        ]);

        $resource = new OrderResource($order);
        $data = $resource->toArray(request());

        $this->assertNull($data['vendor_quoted_price']);
        $this->assertNull($data['vendorQuotedPrice']);
    }

    /** @test */
    public function it_handles_null_quotation_amount()
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'quotation_amount' => null,
        ]);

        $resource = new OrderResource($order);
        $data = $resource->toArray(request());

        $this->assertNull($data['quotation_amount']);
        $this->assertNull($data['quotationAmount']);
    }
}
