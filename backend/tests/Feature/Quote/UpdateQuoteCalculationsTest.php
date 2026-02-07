<?php

namespace Tests\Feature\Quote;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use Laravel\Sanctum\Sanctum;

/**
 * Test Quote Update Method Calculations
 * 
 * Tests Task 2.4 Requirements:
 * - Calculations update correctly when quote items are updated
 * - Total vendor cost, total unit price, and profit margins are recalculated
 */
class UpdateQuoteCalculationsTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private User $user;
    private Order $order;
    private Vendor $vendor;
    private Customer $customer;
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

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);
        
        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create product
        $this->product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Custom Plakat',
            'sku' => 'PLAKAT-001',
        ]);
    }

    /** @test */
    public function test_update_quote_recalculates_totals_when_quantity_changes(): void
    {
        // Create quote with initial values
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'quote_details' => [
                'title' => 'Original Quote',
                'items' => [
                    [
                        'id' => 'item-1',
                        'product_id' => $this->product->uuid,
                        'description' => 'Custom Plakat',
                        'quantity' => 2,
                        'unit_price' => 500000,
                        'vendor_cost' => 250000,
                    ],
                ],
            ],
        ]);

        // Update quantity to 5
        $response = $this->putJson("/api/v1/tenant/quotes/{$quote->uuid}", [
            'items' => [
                [
                    'id' => 'item-1',
                    'product_id' => $this->product->uuid,
                    'description' => 'Custom Plakat',
                    'quantity' => 5, // Changed from 2 to 5
                    'unit_price' => 500000,
                    'vendor_cost' => 250000,
                ],
            ],
        ]);

        $response->assertStatus(200);

        // Verify calculations in response
        $responseData = $response->json('data');
        $item = $responseData['items'][0];

        // Expected calculations:
        // total_vendor_cost = 250000 * 5 = 1250000
        // total_unit_price = 500000 * 5 = 2500000
        // profit_per_piece = 500000 - 250000 = 250000
        // profit_per_piece_percent = (250000 / 250000) * 100 = 100%
        // profit_total = 2500000 - 1250000 = 1250000
        // profit_total_percent = (1250000 / 1250000) * 100 = 100%

        $this->assertEquals(5, $item['quantity']);
        $this->assertEquals(1250000, $item['total_vendor_cost']);
        $this->assertEquals(2500000, $item['total_unit_price']);
        $this->assertEquals(250000, $item['profit_per_piece']);
        $this->assertEquals(100, $item['profit_per_piece_percent']);
        $this->assertEquals(1250000, $item['profit_total']);
        $this->assertEquals(100, $item['profit_total_percent']);
    }

    /** @test */
    public function test_update_quote_recalculates_profit_when_prices_change(): void
    {
        // Create quote
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'quote_details' => [
                'title' => 'Original Quote',
                'items' => [
                    [
                        'id' => 'item-1',
                        'product_id' => $this->product->uuid,
                        'description' => 'Custom Plakat',
                        'quantity' => 3,
                        'unit_price' => 600000,
                        'vendor_cost' => 300000,
                    ],
                ],
            ],
        ]);

        // Update prices
        $response = $this->putJson("/api/v1/tenant/quotes/{$quote->uuid}", [
            'items' => [
                [
                    'id' => 'item-1',
                    'product_id' => $this->product->uuid,
                    'description' => 'Custom Plakat',
                    'quantity' => 3,
                    'unit_price' => 750000, // Increased
                    'vendor_cost' => 250000, // Decreased
                ],
            ],
        ]);

        $response->assertStatus(200);

        // Verify calculations
        $item = $response->json('data.items.0');

        // Expected calculations:
        // total_vendor_cost = 250000 * 3 = 750000
        // total_unit_price = 750000 * 3 = 2250000
        // profit_per_piece = 750000 - 250000 = 500000
        // profit_per_piece_percent = (500000 / 250000) * 100 = 200%
        // profit_total = 2250000 - 750000 = 1500000
        // profit_total_percent = (1500000 / 750000) * 100 = 200%

        $this->assertEquals(750000, $item['total_vendor_cost']);
        $this->assertEquals(2250000, $item['total_unit_price']);
        $this->assertEquals(500000, $item['profit_per_piece']);
        $this->assertEquals(200, $item['profit_per_piece_percent']);
        $this->assertEquals(1500000, $item['profit_total']);
        $this->assertEquals(200, $item['profit_total_percent']);
    }

    /** @test */
    public function test_update_quote_handles_zero_vendor_cost_edge_case(): void
    {
        // Create quote with zero vendor cost
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'quote_details' => [
                'title' => 'Free Sample Quote',
                'items' => [
                    [
                        'id' => 'item-1',
                        'product_id' => $this->product->uuid,
                        'description' => 'Free Sample',
                        'quantity' => 1,
                        'unit_price' => 100000,
                        'vendor_cost' => 0, // Zero cost
                    ],
                ],
            ],
        ]);

        // Update quantity
        $response = $this->putJson("/api/v1/tenant/quotes/{$quote->uuid}", [
            'items' => [
                [
                    'id' => 'item-1',
                    'product_id' => $this->product->uuid,
                    'description' => 'Free Sample',
                    'quantity' => 2,
                    'unit_price' => 100000,
                    'vendor_cost' => 0,
                ],
            ],
        ]);

        $response->assertStatus(200);

        // Verify calculations handle zero cost gracefully
        $item = $response->json('data.items.0');

        $this->assertEquals(0, $item['total_vendor_cost']);
        $this->assertEquals(200000, $item['total_unit_price']);
        $this->assertEquals(100000, $item['profit_per_piece']);
        $this->assertEquals(0, $item['profit_per_piece_percent']); // Should be 0, not infinity
        $this->assertEquals(200000, $item['profit_total']);
        $this->assertEquals(0, $item['profit_total_percent']); // Should be 0, not infinity
    }

    /** @test */
    public function test_update_quote_with_multiple_items_calculates_each_correctly(): void
    {
        // Create second product
        $product2 = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Trophy',
            'sku' => 'TROPHY-001',
        ]);

        // Create quote with multiple items
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'quote_details' => [
                'title' => 'Multi-Item Quote',
                'items' => [
                    [
                        'id' => 'item-1',
                        'product_id' => $this->product->uuid,
                        'description' => 'Custom Plakat',
                        'quantity' => 2,
                        'unit_price' => 500000,
                        'vendor_cost' => 250000,
                    ],
                    [
                        'id' => 'item-2',
                        'product_id' => $product2->uuid,
                        'description' => 'Trophy',
                        'quantity' => 3,
                        'unit_price' => 300000,
                        'vendor_cost' => 150000,
                    ],
                ],
            ],
        ]);

        // Update both items
        $response = $this->putJson("/api/v1/tenant/quotes/{$quote->uuid}", [
            'items' => [
                [
                    'id' => 'item-1',
                    'product_id' => $this->product->uuid,
                    'description' => 'Custom Plakat',
                    'quantity' => 4, // Changed
                    'unit_price' => 550000, // Changed
                    'vendor_cost' => 250000,
                ],
                [
                    'id' => 'item-2',
                    'product_id' => $product2->uuid,
                    'description' => 'Trophy',
                    'quantity' => 5, // Changed
                    'unit_price' => 350000, // Changed
                    'vendor_cost' => 150000,
                ],
            ],
        ]);

        $response->assertStatus(200);

        $items = $response->json('data.items');

        // Verify first item calculations
        $this->assertEquals(1000000, $items[0]['total_vendor_cost']); // 250000 * 4
        $this->assertEquals(2200000, $items[0]['total_unit_price']); // 550000 * 4
        $this->assertEquals(300000, $items[0]['profit_per_piece']); // 550000 - 250000
        $this->assertEquals(120, $items[0]['profit_per_piece_percent']); // (300000 / 250000) * 100

        // Verify second item calculations
        $this->assertEquals(750000, $items[1]['total_vendor_cost']); // 150000 * 5
        $this->assertEquals(1750000, $items[1]['total_unit_price']); // 350000 * 5
        $this->assertEquals(200000, $items[1]['profit_per_piece']); // 350000 - 150000
        $this->assertEquals(133.33, $items[1]['profit_per_piece_percent']); // (200000 / 150000) * 100
    }

    /** @test */
    public function test_update_quote_quantity_to_one_shows_correct_calculations(): void
    {
        // Create quote with quantity > 1
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'quote_details' => [
                'title' => 'Original Quote',
                'items' => [
                    [
                        'id' => 'item-1',
                        'product_id' => $this->product->uuid,
                        'description' => 'Custom Plakat',
                        'quantity' => 5,
                        'unit_price' => 500000,
                        'vendor_cost' => 250000,
                    ],
                ],
            ],
        ]);

        // Update quantity to 1
        $response = $this->putJson("/api/v1/tenant/quotes/{$quote->uuid}", [
            'items' => [
                [
                    'id' => 'item-1',
                    'product_id' => $this->product->uuid,
                    'description' => 'Custom Plakat',
                    'quantity' => 1, // Changed to 1
                    'unit_price' => 500000,
                    'vendor_cost' => 250000,
                ],
            ],
        ]);

        $response->assertStatus(200);

        $item = $response->json('data.items.0');

        // When quantity is 1, per-piece and total should be the same
        $this->assertEquals(1, $item['quantity']);
        $this->assertEquals(250000, $item['total_vendor_cost']);
        $this->assertEquals(500000, $item['total_unit_price']);
        $this->assertEquals(250000, $item['profit_per_piece']);
        $this->assertEquals(250000, $item['profit_total']);
        $this->assertEquals($item['profit_per_piece_percent'], $item['profit_total_percent']);
    }

    /** @test */
    public function test_update_quote_preserves_calculations_accuracy_with_decimals(): void
    {
        // Create quote with values that might cause rounding issues
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'quote_details' => [
                'title' => 'Decimal Test Quote',
                'items' => [
                    [
                        'id' => 'item-1',
                        'product_id' => $this->product->uuid,
                        'description' => 'Custom Plakat',
                        'quantity' => 3,
                        'unit_price' => 333333,
                        'vendor_cost' => 111111,
                    ],
                ],
            ],
        ]);

        // Update
        $response = $this->putJson("/api/v1/tenant/quotes/{$quote->uuid}", [
            'items' => [
                [
                    'id' => 'item-1',
                    'product_id' => $this->product->uuid,
                    'description' => 'Custom Plakat',
                    'quantity' => 3,
                    'unit_price' => 333333,
                    'vendor_cost' => 111111,
                ],
            ],
        ]);

        $response->assertStatus(200);

        $item = $response->json('data.items.0');

        // Verify calculations are accurate
        $this->assertEquals(333333, $item['total_vendor_cost']); // 111111 * 3
        $this->assertEquals(999999, $item['total_unit_price']); // 333333 * 3
        $this->assertEquals(222222, $item['profit_per_piece']); // 333333 - 111111
        $this->assertEquals(666666, $item['profit_total']); // 999999 - 333333
        
        // Percentages should be numeric and rounded to 2 decimal places
        $this->assertIsNumeric($item['profit_per_piece_percent']);
        $this->assertIsNumeric($item['profit_total_percent']);
        $this->assertEquals(200, $item['profit_per_piece_percent']); // (222222 / 111111) * 100 = 200%
        $this->assertEquals(200, $item['profit_total_percent']); // (666666 / 333333) * 100 = 200%
    }
}
