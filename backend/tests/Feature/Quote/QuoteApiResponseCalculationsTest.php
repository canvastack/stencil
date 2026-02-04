<?php

namespace Tests\Feature\Quote;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Laravel\Sanctum\Sanctum;

class QuoteApiResponseCalculationsTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private User $user;
    private Order $order;
    private Vendor $vendor;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant and user
        $this->tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Set tenant context
        $this->app->instance('current_tenant', $this->tenant);
        
        // Authenticate user with Sanctum
        Sanctum::actingAs($this->user);

        // Create order, vendor, and product
        $this->order = Order::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    public function test_show_endpoint_includes_all_calculated_fields(): void
    {
        // Create a quote with items
        $quote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 100000, // 1000.00 in cents
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'status' => 'open',
            'quote_details' => [
                'title' => 'Test Quote',
                'description' => 'Test Description',
                'items' => [
                    [
                        'product_id' => $this->product->uuid,
                        'description' => 'Custom Etching Plate',
                        'quantity' => 2,
                        'unit_price' => 500.00,
                        'vendor_cost' => 300.00,
                        'specifications' => [
                            'material' => 'Stainless Steel',
                        ],
                    ],
                ],
            ],
        ]);

        $response = $this->getJson("/api/v1/tenant/quotes/{$quote->uuid}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'items' => [
                        '*' => [
                            'product_id',
                            'description',
                            'quantity',
                            'unit_price',
                            'vendor_cost',
                            'total_vendor_cost',
                            'total_unit_price',
                            'total_price',
                            'profit_per_piece',
                            'profit_per_piece_percent',
                            'profit_total',
                            'profit_total_percent',
                            'specifications',
                        ],
                    ],
                ]
            ]);

        // Verify calculations are correct
        $item = $response->json('data.items.0');
        
        $this->assertEquals(500.00, $item['unit_price'], 'Unit price should be 500.00');
        $this->assertEquals(300.00, $item['vendor_cost'], 'Vendor cost should be 300.00');
        $this->assertEquals(2, $item['quantity'], 'Quantity should be 2');
        
        // Total calculations
        $this->assertEquals(600.00, $item['total_vendor_cost'], 'Total vendor cost should be 300 * 2 = 600');
        $this->assertEquals(1000.00, $item['total_unit_price'], 'Total unit price should be 500 * 2 = 1000');
        $this->assertEquals(1000.00, $item['total_price'], 'Total price should equal total unit price');
        
        // Profit calculations
        $this->assertEquals(200.00, $item['profit_per_piece'], 'Profit per piece should be 500 - 300 = 200');
        $this->assertEquals(400.00, $item['profit_total'], 'Total profit should be 1000 - 600 = 400');
        
        // Profit percentages
        $expectedProfitPerPiecePercent = round((200.00 / 300.00) * 100, 2);
        $this->assertEquals($expectedProfitPerPiecePercent, $item['profit_per_piece_percent'], 
            'Profit per piece percent should be (200/300)*100 = 66.67%');
        
        $expectedProfitTotalPercent = round((400.00 / 600.00) * 100, 2);
        $this->assertEquals($expectedProfitTotalPercent, $item['profit_total_percent'], 
            'Total profit percent should be (400/600)*100 = 66.67%');
    }

    public function test_index_endpoint_includes_calculated_fields(): void
    {
        // Create a quote with items
        OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'status' => 'open',
            'quote_details' => [
                'title' => 'Test Quote',
                'items' => [
                    [
                        'product_id' => $this->product->uuid,
                        'description' => 'Custom Etching Plate',
                        'quantity' => 3,
                        'unit_price' => 400.00,
                        'vendor_cost' => 250.00,
                        'specifications' => [],
                    ],
                ],
            ],
        ]);

        $response = $this->getJson('/api/v1/tenant/quotes');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'items' => [
                            '*' => [
                                'total_vendor_cost',
                                'total_unit_price',
                                'profit_per_piece',
                                'profit_per_piece_percent',
                                'profit_total',
                                'profit_total_percent',
                            ],
                        ],
                    ],
                ],
            ]);

        // Verify calculations
        $item = $response->json('data.0.items.0');
        
        $this->assertEquals(750.00, $item['total_vendor_cost'], 'Total vendor cost should be 250 * 3 = 750');
        $this->assertEquals(1200.00, $item['total_unit_price'], 'Total unit price should be 400 * 3 = 1200');
        $this->assertEquals(150.00, $item['profit_per_piece'], 'Profit per piece should be 400 - 250 = 150');
        $this->assertEquals(450.00, $item['profit_total'], 'Total profit should be 1200 - 750 = 450');
    }

    public function test_calculations_handle_zero_vendor_cost(): void
    {
        // Create a quote with zero vendor cost
        $quote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'status' => 'open',
            'quote_details' => [
                'title' => 'Test Quote',
                'items' => [
                    [
                        'product_id' => $this->product->uuid,
                        'description' => 'Free Sample',
                        'quantity' => 1,
                        'unit_price' => 500.00,
                        'vendor_cost' => 0.00,
                        'specifications' => [],
                    ],
                ],
            ],
        ]);

        $response = $this->getJson("/api/v1/tenant/quotes/{$quote->uuid}");

        $response->assertStatus(200);

        $item = $response->json('data.items.0');
        
        // Should handle division by zero gracefully
        $this->assertEquals(0.00, $item['profit_per_piece_percent'], 
            'Profit percent should be 0 when vendor cost is 0');
        $this->assertEquals(0.00, $item['profit_total_percent'], 
            'Total profit percent should be 0 when vendor cost is 0');
    }

    public function test_calculations_handle_quantity_of_one(): void
    {
        // Create a quote with quantity = 1
        $quote = OrderVendorNegotiation::create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'status' => 'open',
            'quote_details' => [
                'title' => 'Test Quote',
                'items' => [
                    [
                        'product_id' => $this->product->uuid,
                        'description' => 'Single Item',
                        'quantity' => 1,
                        'unit_price' => 500.00,
                        'vendor_cost' => 300.00,
                        'specifications' => [],
                    ],
                ],
            ],
        ]);

        $response = $this->getJson("/api/v1/tenant/quotes/{$quote->uuid}");

        $response->assertStatus(200);

        $item = $response->json('data.items.0');
        
        // When quantity is 1, per-piece and total should be the same
        $this->assertEquals($item['unit_price'], $item['total_unit_price'], 
            'Total unit price should equal unit price when quantity is 1');
        $this->assertEquals($item['vendor_cost'], $item['total_vendor_cost'], 
            'Total vendor cost should equal vendor cost when quantity is 1');
        $this->assertEquals($item['profit_per_piece'], $item['profit_total'], 
            'Total profit should equal per-piece profit when quantity is 1');
        $this->assertEquals($item['profit_per_piece_percent'], $item['profit_total_percent'], 
            'Total profit percent should equal per-piece profit percent when quantity is 1');
    }
}
