<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

class QuoteTransformationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private Order $order;
    private Vendor $vendor;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = Tenant::factory()->create();

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create order
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
    }

    public function test_transform_quote_with_calculations(): void
    {
        // Create negotiation with quote_details containing items
        $negotiation = OrderVendorNegotiation::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'quote_details' => [
                'title' => 'Test Quote',
                'description' => 'Test Description',
                'items' => [
                    [
                        'id' => 'item-1',
                        'product_id' => 'prod-123',
                        'description' => 'Test Product',
                        'quantity' => 2,
                        'unit_price' => 3000,
                        'vendor_cost' => 2000,
                        'specifications' => [
                            'material' => 'Stainless Steel',
                            'size' => '10x15cm',
                        ],
                        'form_schema' => [
                            'fields' => [
                                [
                                    'name' => 'material',
                                    'label' => 'Material Type',
                                    'type' => 'select',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        $negotiation->load(['order.customer', 'vendor']);

        // Get the transformed data using reflection to access private method
        $reflection = new \ReflectionClass($negotiation);
        $controller = new \App\Infrastructure\Presentation\Http\Controllers\Tenant\QuoteController();
        $method = new \ReflectionMethod($controller, 'transformQuoteToFrontend');
        $method->setAccessible(true);
        
        $result = $method->invoke($controller, $negotiation);

        // Verify basic structure
        $this->assertArrayHasKey('items', $result);
        $this->assertCount(1, $result['items']);

        // Verify item calculations
        $item = $result['items'][0];
        
        // Check per-piece values
        $this->assertEquals(2000, $item['vendor_cost']);
        $this->assertEquals(3000, $item['unit_price']);
        
        // Check calculated totals
        $this->assertEquals(4000, $item['total_vendor_cost']); // 2000 * 2
        $this->assertEquals(6000, $item['total_unit_price']); // 3000 * 2
        $this->assertEquals(6000, $item['total_price']); // Alias
        
        // Check profit margins
        $this->assertEquals(1000, $item['profit_per_piece']); // 3000 - 2000
        $this->assertEquals(50.0, $item['profit_per_piece_percent']); // (1000 / 2000) * 100
        $this->assertEquals(2000, $item['profit_total']); // 6000 - 4000
        $this->assertEquals(50.0, $item['profit_total_percent']); // (2000 / 4000) * 100
        
        // Check form_schema is included
        $this->assertArrayHasKey('form_schema', $item);
        $this->assertIsArray($item['form_schema']);
        $this->assertArrayHasKey('fields', $item['form_schema']);
        
        // Check specifications are included
        $this->assertArrayHasKey('specifications', $item);
        $this->assertEquals('Stainless Steel', $item['specifications']['material']);
    }

    public function test_transform_quote_with_zero_vendor_cost(): void
    {
        // Test edge case: zero vendor cost
        $negotiation = OrderVendorNegotiation::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'quote_details' => [
                'items' => [
                    [
                        'id' => 'item-1',
                        'product_id' => 'prod-123',
                        'description' => 'Free Sample',
                        'quantity' => 1,
                        'unit_price' => 1000,
                        'vendor_cost' => 0,
                    ],
                ],
            ],
        ]);

        $negotiation->load(['order.customer', 'vendor']);

        $controller = new \App\Infrastructure\Presentation\Http\Controllers\Tenant\QuoteController();
        $method = new \ReflectionMethod($controller, 'transformQuoteToFrontend');
        $method->setAccessible(true);
        
        $result = $method->invoke($controller, $negotiation);
        $item = $result['items'][0];

        // Should not divide by zero
        $this->assertEquals(0, $item['profit_per_piece_percent']);
        $this->assertEquals(0, $item['profit_total_percent']);
    }

    public function test_transform_quote_with_quantity_one(): void
    {
        // Test with quantity = 1
        $negotiation = OrderVendorNegotiation::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'initial_offer' => 100000,
            'latest_offer' => 100000,
            'currency' => 'IDR',
            'quote_details' => [
                'items' => [
                    [
                        'id' => 'item-1',
                        'product_id' => 'prod-123',
                        'description' => 'Single Item',
                        'quantity' => 1,
                        'unit_price' => 5000,
                        'vendor_cost' => 3000,
                    ],
                ],
            ],
        ]);

        $negotiation->load(['order.customer', 'vendor']);

        $controller = new \App\Infrastructure\Presentation\Http\Controllers\Tenant\QuoteController();
        $method = new \ReflectionMethod($controller, 'transformQuoteToFrontend');
        $method->setAccessible(true);
        
        $result = $method->invoke($controller, $negotiation);
        $item = $result['items'][0];

        // Total should equal per-piece when quantity is 1
        $this->assertEquals($item['vendor_cost'], $item['total_vendor_cost']);
        $this->assertEquals($item['unit_price'], $item['total_unit_price']);
        $this->assertEquals($item['profit_per_piece'], $item['profit_total']);
        $this->assertEquals($item['profit_per_piece_percent'], $item['profit_total_percent']);
    }

    public function test_enrich_items_with_form_schema(): void
    {
        // Create a product with form configuration
        $product = \App\Infrastructure\Persistence\Eloquent\Models\Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'name' => 'Test Product with Form',
        ]);

        // Create form configuration for the product
        $formConfig = \App\Models\ProductFormConfiguration::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'product_uuid' => $product->uuid,
            'name' => 'Test Form Config',
            'is_active' => true,
            'form_schema' => [
                'fields' => [
                    [
                        'name' => 'material',
                        'label' => 'Material Type',
                        'type' => 'select',
                        'options' => ['Stainless Steel', 'Aluminum', 'Brass'],
                    ],
                    [
                        'name' => 'size',
                        'label' => 'Size',
                        'type' => 'text',
                    ],
                ],
            ],
        ]);

        // Create items array with product_id
        $items = [
            [
                'id' => 'item-1',
                'product_id' => $product->uuid,
                'description' => 'Test Product',
                'quantity' => 2,
                'unit_price' => 3000,
                'vendor_cost' => 2000,
                'specifications' => [
                    'material' => 'Stainless Steel',
                    'size' => '10x15cm',
                ],
            ],
        ];

        // Use reflection to call the private method
        $controller = new \App\Infrastructure\Presentation\Http\Controllers\Tenant\QuoteController();
        $method = new \ReflectionMethod($controller, 'enrichItemsWithFormSchema');
        $method->setAccessible(true);
        
        $enrichedItems = $method->invoke($controller, $items, $this->order);

        // Verify form_schema was added
        $this->assertCount(1, $enrichedItems);
        $this->assertArrayHasKey('form_schema', $enrichedItems[0]);
        $this->assertIsArray($enrichedItems[0]['form_schema']);
        $this->assertArrayHasKey('fields', $enrichedItems[0]['form_schema']);
        $this->assertCount(2, $enrichedItems[0]['form_schema']['fields']);
        
        // Verify field details
        $fields = $enrichedItems[0]['form_schema']['fields'];
        $this->assertEquals('material', $fields[0]['name']);
        $this->assertEquals('Material Type', $fields[0]['label']);
        $this->assertEquals('select', $fields[0]['type']);
    }

    public function test_enrich_items_with_missing_product(): void
    {
        // Test with non-existent but valid UUID format
        $items = [
            [
                'id' => 'item-1',
                'product_id' => \Ramsey\Uuid\Uuid::uuid4()->toString(), // Valid UUID that doesn't exist
                'description' => 'Test Product',
                'quantity' => 1,
                'unit_price' => 1000,
                'vendor_cost' => 500,
            ],
        ];

        $controller = new \App\Infrastructure\Presentation\Http\Controllers\Tenant\QuoteController();
        $method = new \ReflectionMethod($controller, 'enrichItemsWithFormSchema');
        $method->setAccessible(true);
        
        $enrichedItems = $method->invoke($controller, $items, $this->order);

        // Should handle gracefully with null form_schema
        $this->assertCount(1, $enrichedItems);
        $this->assertArrayHasKey('form_schema', $enrichedItems[0]);
        $this->assertNull($enrichedItems[0]['form_schema']);
    }

    public function test_enrich_items_with_no_form_configuration(): void
    {
        // Create a product without form configuration
        $product = \App\Infrastructure\Persistence\Eloquent\Models\Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'name' => 'Product Without Form',
        ]);

        $items = [
            [
                'id' => 'item-1',
                'product_id' => $product->uuid,
                'description' => 'Test Product',
                'quantity' => 1,
                'unit_price' => 1000,
                'vendor_cost' => 500,
            ],
        ];

        $controller = new \App\Infrastructure\Presentation\Http\Controllers\Tenant\QuoteController();
        $method = new \ReflectionMethod($controller, 'enrichItemsWithFormSchema');
        $method->setAccessible(true);
        
        $enrichedItems = $method->invoke($controller, $items, $this->order);

        // Should handle gracefully with null form_schema
        $this->assertCount(1, $enrichedItems);
        $this->assertArrayHasKey('form_schema', $enrichedItems[0]);
        $this->assertNull($enrichedItems[0]['form_schema']);
    }

    public function test_enrich_items_with_inactive_form_configuration(): void
    {
        // Create a product with inactive form configuration
        $product = \App\Infrastructure\Persistence\Eloquent\Models\Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'name' => 'Product With Inactive Form',
        ]);

        // Create inactive form configuration
        \App\Models\ProductFormConfiguration::create([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenant->id,
            'product_id' => $product->id,
            'product_uuid' => $product->uuid,
            'name' => 'Inactive Form Config',
            'is_active' => false,
            'form_schema' => [
                'fields' => [
                    ['name' => 'test', 'label' => 'Test', 'type' => 'text'],
                ],
            ],
        ]);

        $items = [
            [
                'id' => 'item-1',
                'product_id' => $product->uuid,
                'description' => 'Test Product',
                'quantity' => 1,
                'unit_price' => 1000,
                'vendor_cost' => 500,
            ],
        ];

        $controller = new \App\Infrastructure\Presentation\Http\Controllers\Tenant\QuoteController();
        $method = new \ReflectionMethod($controller, 'enrichItemsWithFormSchema');
        $method->setAccessible(true);
        
        $enrichedItems = $method->invoke($controller, $items, $this->order);

        // Should not include inactive form configuration
        $this->assertCount(1, $enrichedItems);
        $this->assertArrayHasKey('form_schema', $enrichedItems[0]);
        $this->assertNull($enrichedItems[0]['form_schema']);
    }
}
