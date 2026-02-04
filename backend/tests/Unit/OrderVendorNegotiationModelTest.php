<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OrderVendorNegotiationModelTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected Order $order;
    protected Vendor $vendor;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = Tenant::factory()->create();

        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
    }

    /**
     * Test that quote_details can be written and read as JSON
     */
    public function test_quote_details_can_be_written_and_read(): void
    {
        $quoteDetailsData = [
            'title' => 'Quote for Custom Plakat',
            'description' => 'High-quality etching plaque',
            'terms_and_conditions' => 'Payment within 30 days',
            'notes' => 'Special handling required',
            'items' => [
                [
                    'id' => 'item-1',
                    'product_id' => '40',
                    'description' => 'Plakat 30 Years Beyond Partnership',
                    'quantity' => 2,
                    'unit_price' => 3114510,
                    'vendor_cost' => 250000,
                    'total_price' => 6229020,
                    'specifications' => [
                        'jenis_plakat' => 'Plakat Logam',
                        'jenis_logam' => 'Stainless Steel 304 (Anti Karat)',
                        'ketebalan_plat' => '2mm',
                        'ukuran_plakat' => '30x40cm',
                        'text_engraving' => '30 Years Beyond Partnership',
                    ],
                    'notes' => 'Special engraving required',
                ],
            ],
        ];

        // Create negotiation with quote_details
        $negotiation = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'initial_offer' => 5000000,
            'latest_offer' => 5000000,
            'currency' => 'IDR',
            'quote_details' => $quoteDetailsData,
            'expires_at' => now()->addDays(7),
        ]);

        // Verify the negotiation was created
        $this->assertNotNull($negotiation->id);
        $this->assertNotNull($negotiation->uuid);

        // Refresh from database
        $negotiation->refresh();

        // Verify quote_details is properly stored and retrieved
        $this->assertIsArray($negotiation->quote_details);
        $this->assertEquals('Quote for Custom Plakat', $negotiation->quote_details['title']);
        $this->assertEquals('High-quality etching plaque', $negotiation->quote_details['description']);
        $this->assertCount(1, $negotiation->quote_details['items']);
        
        // Verify nested item data
        $item = $negotiation->quote_details['items'][0];
        $this->assertEquals('item-1', $item['id']);
        $this->assertEquals(2, $item['quantity']);
        $this->assertEquals(3114510, $item['unit_price']);
        
        // Verify specifications
        $this->assertArrayHasKey('specifications', $item);
        $this->assertEquals('Plakat Logam', $item['specifications']['jenis_plakat']);
        $this->assertEquals('2mm', $item['specifications']['ketebalan_plat']);
    }

    /**
     * Test that quote_details can be updated
     */
    public function test_quote_details_can_be_updated(): void
    {
        // Create negotiation with initial quote_details
        $negotiation = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'initial_offer' => 5000000,
            'latest_offer' => 5000000,
            'currency' => 'IDR',
            'quote_details' => [
                'title' => 'Initial Quote',
                'items' => [],
            ],
            'expires_at' => now()->addDays(7),
        ]);

        // Update quote_details
        $updatedDetails = [
            'title' => 'Updated Quote',
            'description' => 'Updated description',
            'items' => [
                [
                    'id' => 'item-1',
                    'product_id' => '50',
                    'quantity' => 5,
                ],
            ],
        ];

        $negotiation->update([
            'quote_details' => $updatedDetails,
        ]);

        // Refresh and verify
        $negotiation->refresh();

        $this->assertEquals('Updated Quote', $negotiation->quote_details['title']);
        $this->assertEquals('Updated description', $negotiation->quote_details['description']);
        $this->assertCount(1, $negotiation->quote_details['items']);
        $this->assertEquals(5, $negotiation->quote_details['items'][0]['quantity']);
    }

    /**
     * Test that quote_details handles null values
     */
    public function test_quote_details_handles_null_values(): void
    {
        // Create negotiation without quote_details
        $negotiation = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'initial_offer' => 5000000,
            'latest_offer' => 5000000,
            'currency' => 'IDR',
            'expires_at' => now()->addDays(7),
        ]);

        // Verify quote_details is null
        $this->assertNull($negotiation->quote_details);
    }

    /**
     * Test that quote_details is cast to json type
     */
    public function test_quote_details_is_cast_to_json(): void
    {
        $negotiation = new OrderVendorNegotiation();
        
        $casts = $negotiation->getCasts();
        
        $this->assertArrayHasKey('quote_details', $casts);
        $this->assertEquals('json', $casts['quote_details']);
    }
}
