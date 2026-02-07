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
use App\Models\ProductFormConfiguration;
use Laravel\Sanctum\Sanctum;

/**
 * Test Quote Update Method Preserves form_schema
 * 
 * Tests Task 2.4 Requirements:
 * - Quote updates preserve form_schema when updating items
 * - form_schema is not lost during item updates
 * - form_schema can be fetched if missing
 */
class UpdateQuoteWithFormSchemaTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private User $user;
    private Order $order;
    private Vendor $vendor;
    private Customer $customer;
    private Product $product;
    private ProductFormConfiguration $formConfig;

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

        // Create product with form configuration
        $this->product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Custom Plakat',
            'sku' => 'PLAKAT-001',
        ]);

        // Create form configuration
        $this->formConfig = ProductFormConfiguration::create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $this->product->id,
            'product_uuid' => $this->product->uuid,
            'is_active' => true,
            'form_schema' => [
                'fields' => [
                    [
                        'name' => 'jenis_plakat',
                        'label' => 'Jenis Plakat',
                        'type' => 'select',
                        'options' => ['Plakat Logam', 'Plakat Akrilik'],
                    ],
                    [
                        'name' => 'ukuran',
                        'label' => 'Ukuran',
                        'type' => 'text',
                    ],
                ],
            ],
        ]);
    }

    /** @test */
    public function test_update_quote_preserves_existing_form_schema(): void
    {
        // Create quote with form_schema
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
                        'specifications' => [
                            'jenis_plakat' => 'Plakat Logam',
                            'ukuran' => '30x40cm',
                        ],
                        'form_schema' => [
                            'fields' => [
                                [
                                    'name' => 'jenis_plakat',
                                    'label' => 'Jenis Plakat',
                                    'type' => 'select',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ]);

        // Update quote items (change quantity and price)
        $response = $this->putJson("/api/v1/tenant/quotes/{$quote->uuid}", [
            'items' => [
                [
                    'id' => 'item-1',
                    'product_id' => $this->product->uuid,
                    'description' => 'Custom Plakat',
                    'quantity' => 3, // Changed
                    'unit_price' => 550000, // Changed
                    'vendor_cost' => 250000,
                    'specifications' => [
                        'jenis_plakat' => 'Plakat Logam',
                        'ukuran' => '30x40cm',
                    ],
                ],
            ],
        ]);

        $response->assertStatus(200);

        // Verify form_schema is preserved
        $quote->refresh();
        $items = $quote->quote_details['items'] ?? [];
        
        $this->assertNotEmpty($items);
        $this->assertArrayHasKey('form_schema', $items[0]);
        $this->assertNotNull($items[0]['form_schema']);
        $this->assertArrayHasKey('fields', $items[0]['form_schema']);
        $this->assertEquals('jenis_plakat', $items[0]['form_schema']['fields'][0]['name']);
    }

    /** @test */
    public function test_update_quote_fetches_form_schema_if_missing(): void
    {
        // Create quote WITHOUT form_schema
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'quote_details' => [
                'title' => 'Quote Without Schema',
                'items' => [
                    [
                        'id' => 'item-1',
                        'product_id' => $this->product->uuid,
                        'description' => 'Custom Plakat',
                        'quantity' => 2,
                        'unit_price' => 500000,
                        'vendor_cost' => 250000,
                        'specifications' => [
                            'jenis_plakat' => 'Plakat Logam',
                        ],
                        // NO form_schema here
                    ],
                ],
            ],
        ]);

        // Update quote items
        $response = $this->putJson("/api/v1/tenant/quotes/{$quote->uuid}", [
            'items' => [
                [
                    'id' => 'item-1',
                    'product_id' => $this->product->uuid,
                    'description' => 'Custom Plakat',
                    'quantity' => 3,
                    'unit_price' => 550000,
                    'vendor_cost' => 250000,
                    'specifications' => [
                        'jenis_plakat' => 'Plakat Logam',
                    ],
                ],
            ],
        ]);

        $response->assertStatus(200);

        // Verify form_schema was fetched and added
        $quote->refresh();
        $items = $quote->quote_details['items'] ?? [];
        
        $this->assertNotEmpty($items);
        $this->assertArrayHasKey('form_schema', $items[0]);
        $this->assertNotNull($items[0]['form_schema']);
        $this->assertArrayHasKey('fields', $items[0]['form_schema']);
        $this->assertCount(2, $items[0]['form_schema']['fields']); // Should have 2 fields from ProductFormConfiguration
    }

    /** @test */
    public function test_update_quote_handles_multiple_items_with_form_schema(): void
    {
        // Create second product with form config
        $product2 = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Trophy',
            'sku' => 'TROPHY-001',
        ]);

        $formConfig2 = ProductFormConfiguration::create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $product2->id,
            'product_uuid' => $product2->uuid,
            'is_active' => true,
            'form_schema' => [
                'fields' => [
                    [
                        'name' => 'material',
                        'label' => 'Material',
                        'type' => 'select',
                    ],
                ],
            ],
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
                        'form_schema' => $this->formConfig->form_schema,
                    ],
                    [
                        'id' => 'item-2',
                        'product_id' => $product2->uuid,
                        'description' => 'Trophy',
                        'quantity' => 1,
                        'unit_price' => 300000,
                        'vendor_cost' => 150000,
                        'form_schema' => $formConfig2->form_schema,
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
                    'quantity' => 3, // Changed
                    'unit_price' => 500000,
                    'vendor_cost' => 250000,
                ],
                [
                    'id' => 'item-2',
                    'product_id' => $product2->uuid,
                    'description' => 'Trophy',
                    'quantity' => 2, // Changed
                    'unit_price' => 300000,
                    'vendor_cost' => 150000,
                ],
            ],
        ]);

        $response->assertStatus(200);

        // Verify both items preserved their form_schema
        $quote->refresh();
        $items = $quote->quote_details['items'] ?? [];
        
        $this->assertCount(2, $items);
        
        // Check first item
        $this->assertArrayHasKey('form_schema', $items[0]);
        $this->assertNotNull($items[0]['form_schema']);
        $this->assertEquals('jenis_plakat', $items[0]['form_schema']['fields'][0]['name']);
        
        // Check second item
        $this->assertArrayHasKey('form_schema', $items[1]);
        $this->assertNotNull($items[1]['form_schema']);
        $this->assertEquals('material', $items[1]['form_schema']['fields'][0]['name']);
    }

    /** @test */
    public function test_update_quote_without_items_does_not_affect_form_schema(): void
    {
        // Create quote with form_schema
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'draft',
            'quote_details' => [
                'title' => 'Original Quote',
                'description' => 'Original description',
                'items' => [
                    [
                        'id' => 'item-1',
                        'product_id' => $this->product->uuid,
                        'description' => 'Custom Plakat',
                        'quantity' => 2,
                        'unit_price' => 500000,
                        'vendor_cost' => 250000,
                        'form_schema' => $this->formConfig->form_schema,
                    ],
                ],
            ],
        ]);

        // Update only title and description (not items)
        $response = $this->putJson("/api/v1/tenant/quotes/{$quote->uuid}", [
            'title' => 'Updated Quote Title',
            'description' => 'Updated description',
        ]);

        $response->assertStatus(200);

        // Verify form_schema is still intact
        $quote->refresh();
        $items = $quote->quote_details['items'] ?? [];
        
        $this->assertNotEmpty($items);
        $this->assertArrayHasKey('form_schema', $items[0]);
        $this->assertNotNull($items[0]['form_schema']);
        $this->assertEquals($this->formConfig->form_schema, $items[0]['form_schema']);
    }

    /** @test */
    public function test_update_quote_response_includes_form_schema(): void
    {
        // Create quote with form_schema
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
                        'form_schema' => $this->formConfig->form_schema,
                    ],
                ],
            ],
        ]);

        // Update quote
        $response = $this->putJson("/api/v1/tenant/quotes/{$quote->uuid}", [
            'title' => 'Updated Quote',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'items' => [
                        '*' => [
                            'form_schema',
                        ],
                    ],
                ],
            ]);

        // Verify form_schema is in response
        $responseData = $response->json('data');
        $this->assertNotEmpty($responseData['items']);
        $this->assertArrayHasKey('form_schema', $responseData['items'][0]);
        $this->assertNotNull($responseData['items'][0]['form_schema']);
    }
}
