<?php

namespace Tests\Unit\Quote;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Models\ProductFormConfiguration;
use ReflectionClass;
use App\Infrastructure\Presentation\Http\Controllers\Tenant\QuoteController;

class QuoteFormSchemaEnrichmentTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private Order $order;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        
        // Set tenant context
        $this->app->instance('current_tenant', $this->tenant);

        // Create order and product
        $this->order = Order::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->product = Product::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    /**
     * Test enrichItemsWithFormSchema method enriches items with form schema.
     */
    public function test_enriches_items_with_form_schema_when_configuration_exists()
    {
        // Create product form configuration
        $formSchema = [
            'fields' => [
                [
                    'name' => 'material',
                    'label' => 'Material Type',
                    'type' => 'select',
                    'options' => ['Stainless Steel', 'Aluminum', 'Brass'],
                ],
                [
                    'name' => 'dimensions',
                    'label' => 'Dimensions',
                    'type' => 'text',
                ],
            ],
        ];

        ProductFormConfiguration::create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $this->product->id,
            'product_uuid' => $this->product->uuid,
            'form_schema' => $formSchema,
            'is_active' => true,
        ]);

        // Prepare items
        $items = [
            [
                'product_id' => $this->product->uuid,
                'description' => 'Custom Etching Plate',
                'quantity' => 2,
                'unit_price' => 500.00,
                'vendor_cost' => 300.00,
                'specifications' => [
                    'material' => 'Stainless Steel',
                    'dimensions' => '10x15cm',
                ],
            ],
        ];

        // Call the private method using reflection
        $controller = new QuoteController();
        $reflection = new ReflectionClass($controller);
        $method = $reflection->getMethod('enrichItemsWithFormSchema');
        $method->setAccessible(true);

        $enrichedItems = $method->invoke($controller, $items, $this->order);

        // Assertions
        $this->assertCount(1, $enrichedItems);
        $this->assertArrayHasKey('form_schema', $enrichedItems[0]);
        $this->assertNotNull($enrichedItems[0]['form_schema']);
        $this->assertArrayHasKey('fields', $enrichedItems[0]['form_schema']);
        $this->assertCount(2, $enrichedItems[0]['form_schema']['fields']);
        $this->assertEquals('material', $enrichedItems[0]['form_schema']['fields'][0]['name']);
        $this->assertEquals('Material Type', $enrichedItems[0]['form_schema']['fields'][0]['label']);
    }

    /**
     * Test enrichItemsWithFormSchema returns null form_schema when no configuration exists.
     */
    public function test_enriches_items_with_null_form_schema_when_no_configuration()
    {
        // Don't create ProductFormConfiguration
        $items = [
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
        ];

        // Call the private method using reflection
        $controller = new QuoteController();
        $reflection = new ReflectionClass($controller);
        $method = $reflection->getMethod('enrichItemsWithFormSchema');
        $method->setAccessible(true);

        $enrichedItems = $method->invoke($controller, $items, $this->order);

        // Assertions
        $this->assertCount(1, $enrichedItems);
        $this->assertArrayHasKey('form_schema', $enrichedItems[0]);
        $this->assertNull($enrichedItems[0]['form_schema']);
    }

    /**
     * Test enrichItemsWithFormSchema handles inactive form configurations.
     */
    public function test_enriches_items_with_null_form_schema_when_configuration_inactive()
    {
        // Create inactive product form configuration
        $formSchema = [
            'fields' => [
                [
                    'name' => 'material',
                    'label' => 'Material Type',
                    'type' => 'select',
                ],
            ],
        ];

        ProductFormConfiguration::create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $this->product->id,
            'product_uuid' => $this->product->uuid,
            'form_schema' => $formSchema,
            'is_active' => false, // Inactive
        ]);

        $items = [
            [
                'product_id' => $this->product->uuid,
                'description' => 'Custom Etching Plate',
                'quantity' => 2,
                'specifications' => [],
            ],
        ];

        // Call the private method using reflection
        $controller = new QuoteController();
        $reflection = new ReflectionClass($controller);
        $method = $reflection->getMethod('enrichItemsWithFormSchema');
        $method->setAccessible(true);

        $enrichedItems = $method->invoke($controller, $items, $this->order);

        // Assertions - should not include inactive form schema
        $this->assertCount(1, $enrichedItems);
        $this->assertArrayHasKey('form_schema', $enrichedItems[0]);
        $this->assertNull($enrichedItems[0]['form_schema']);
    }

    /**
     * Test enrichItemsWithFormSchema handles multiple items.
     */
    public function test_enriches_multiple_items_with_different_form_schemas()
    {
        // Create second product
        $product2 = Product::factory()->create(['tenant_id' => $this->tenant->id]);

        // Create form configurations for both products
        $formSchema1 = [
            'fields' => [
                ['name' => 'material', 'label' => 'Material Type', 'type' => 'select'],
            ],
        ];

        $formSchema2 = [
            'fields' => [
                ['name' => 'color', 'label' => 'Color', 'type' => 'select'],
                ['name' => 'size', 'label' => 'Size', 'type' => 'text'],
            ],
        ];

        ProductFormConfiguration::create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $this->product->id,
            'product_uuid' => $this->product->uuid,
            'form_schema' => $formSchema1,
            'is_active' => true,
        ]);

        ProductFormConfiguration::create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $product2->id,
            'product_uuid' => $product2->uuid,
            'form_schema' => $formSchema2,
            'is_active' => true,
        ]);

        $items = [
            [
                'product_id' => $this->product->uuid,
                'description' => 'Product 1',
                'quantity' => 1,
                'specifications' => [],
            ],
            [
                'product_id' => $product2->uuid,
                'description' => 'Product 2',
                'quantity' => 2,
                'specifications' => [],
            ],
        ];

        // Call the private method using reflection
        $controller = new QuoteController();
        $reflection = new ReflectionClass($controller);
        $method = $reflection->getMethod('enrichItemsWithFormSchema');
        $method->setAccessible(true);

        $enrichedItems = $method->invoke($controller, $items, $this->order);

        // Assertions
        $this->assertCount(2, $enrichedItems);
        
        // First item should have formSchema1
        $this->assertNotNull($enrichedItems[0]['form_schema']);
        $this->assertCount(1, $enrichedItems[0]['form_schema']['fields']);
        $this->assertEquals('material', $enrichedItems[0]['form_schema']['fields'][0]['name']);
        
        // Second item should have formSchema2
        $this->assertNotNull($enrichedItems[1]['form_schema']);
        $this->assertCount(2, $enrichedItems[1]['form_schema']['fields']);
        $this->assertEquals('color', $enrichedItems[1]['form_schema']['fields'][0]['name']);
        $this->assertEquals('size', $enrichedItems[1]['form_schema']['fields'][1]['name']);
    }

    /**
     * Test enrichItemsWithFormSchema handles items without product_id.
     */
    public function test_enriches_items_without_product_id_with_null_form_schema()
    {
        $items = [
            [
                'description' => 'Custom Item without Product',
                'quantity' => 1,
                'unit_price' => 100.00,
                'specifications' => [],
            ],
        ];

        // Call the private method using reflection
        $controller = new QuoteController();
        $reflection = new ReflectionClass($controller);
        $method = $reflection->getMethod('enrichItemsWithFormSchema');
        $method->setAccessible(true);

        $enrichedItems = $method->invoke($controller, $items, $this->order);

        // Assertions
        $this->assertCount(1, $enrichedItems);
        $this->assertArrayHasKey('form_schema', $enrichedItems[0]);
        $this->assertNull($enrichedItems[0]['form_schema']);
    }

    /**
     * Test enrichItemsWithFormSchema handles empty items array.
     */
    public function test_enriches_empty_items_array()
    {
        $items = [];

        // Call the private method using reflection
        $controller = new QuoteController();
        $reflection = new ReflectionClass($controller);
        $method = $reflection->getMethod('enrichItemsWithFormSchema');
        $method->setAccessible(true);

        $enrichedItems = $method->invoke($controller, $items, $this->order);

        // Assertions
        $this->assertCount(0, $enrichedItems);
        $this->assertIsArray($enrichedItems);
    }

    /**
     * Test enrichItemsWithFormSchema preserves existing item data.
     */
    public function test_enriches_items_preserves_existing_data()
    {
        // Create product form configuration
        $formSchema = [
            'fields' => [
                ['name' => 'material', 'label' => 'Material Type', 'type' => 'select'],
            ],
        ];

        ProductFormConfiguration::create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $this->product->id,
            'product_uuid' => $this->product->uuid,
            'form_schema' => $formSchema,
            'is_active' => true,
        ]);

        $items = [
            [
                'product_id' => $this->product->uuid,
                'description' => 'Custom Etching Plate',
                'quantity' => 2,
                'unit_price' => 500.00,
                'vendor_cost' => 300.00,
                'specifications' => [
                    'material' => 'Stainless Steel',
                    'dimensions' => '10x15cm',
                ],
                'notes' => 'Special handling required',
            ],
        ];

        // Call the private method using reflection
        $controller = new QuoteController();
        $reflection = new ReflectionClass($controller);
        $method = $reflection->getMethod('enrichItemsWithFormSchema');
        $method->setAccessible(true);

        $enrichedItems = $method->invoke($controller, $items, $this->order);

        // Assertions - all original data should be preserved
        $this->assertEquals($this->product->uuid, $enrichedItems[0]['product_id']);
        $this->assertEquals('Custom Etching Plate', $enrichedItems[0]['description']);
        $this->assertEquals(2, $enrichedItems[0]['quantity']);
        $this->assertEquals(500.00, $enrichedItems[0]['unit_price']);
        $this->assertEquals(300.00, $enrichedItems[0]['vendor_cost']);
        $this->assertEquals('Stainless Steel', $enrichedItems[0]['specifications']['material']);
        $this->assertEquals('10x15cm', $enrichedItems[0]['specifications']['dimensions']);
        $this->assertEquals('Special handling required', $enrichedItems[0]['notes']);
        
        // And form_schema should be added
        $this->assertNotNull($enrichedItems[0]['form_schema']);
    }

    /**
     * Test enrichItemsWithFormSchema respects tenant isolation.
     */
    public function test_enriches_items_respects_tenant_isolation()
    {
        // Create another tenant with a product
        $otherTenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $otherProduct = Product::factory()->create(['tenant_id' => $otherTenant->id]);

        // Create form configuration for other tenant's product
        $formSchema = [
            'fields' => [
                ['name' => 'material', 'label' => 'Material Type', 'type' => 'select'],
            ],
        ];

        ProductFormConfiguration::create([
            'tenant_id' => $otherTenant->id,
            'product_id' => $otherProduct->id,
            'product_uuid' => $otherProduct->uuid,
            'form_schema' => $formSchema,
            'is_active' => true,
        ]);

        // Try to enrich items with other tenant's product
        $items = [
            [
                'product_id' => $otherProduct->uuid,
                'description' => 'Other Tenant Product',
                'quantity' => 1,
                'specifications' => [],
            ],
        ];

        // Call the private method using reflection
        $controller = new QuoteController();
        $reflection = new ReflectionClass($controller);
        $method = $reflection->getMethod('enrichItemsWithFormSchema');
        $method->setAccessible(true);

        $enrichedItems = $method->invoke($controller, $items, $this->order);

        // Assertions - should not find product from other tenant
        $this->assertCount(1, $enrichedItems);
        $this->assertArrayHasKey('form_schema', $enrichedItems[0]);
        $this->assertNull($enrichedItems[0]['form_schema']);
    }
}
