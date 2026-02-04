<?php

namespace Tests\Integration;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Models\ProductFormConfiguration;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

/**
 * Integration Tests for Quote Enhancement: Dynamic Fields & Quantity Calculations
 * 
 * Tests the complete quote management workflow with:
 * - Dynamic form schema enrichment
 * - Quantity-based pricing calculations
 * - Form schema preservation during updates
 * - Real database data validation
 * 
 * Validates: Requirements from .kiro/specs/quote-enhancement-dynamic-fields/
 */
class QuoteEnhancementDynamicFieldsTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private Customer $customer;
    private Vendor $vendor;
    private User $user;
    private Order $order;
    private Product $product;
    private ProductFormConfiguration $formConfig;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = Tenant::factory()->create([
            'domain' => 'test-tenant.localhost',
        ]);

        // Create customer
        $this->customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Vendor',
        ]);

        // Create and authenticate user
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        Sanctum::actingAs($this->user);

        // Create product with form configuration
        $this->product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Custom Plakat',
            'sku' => 'PLAKAT-001',
        ]);

        // Create form configuration with dynamic fields
        $this->formConfig = ProductFormConfiguration::create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $this->product->id,
            'product_uuid' => $this->product->uuid,
            'form_schema' => [
                'fields' => [
                    [
                        'name' => 'jenis_plakat',
                        'label' => 'Jenis Plakat',
                        'type' => 'select',
                        'options' => ['Plakat Logam', 'Plakat Akrilik', 'Plakat Kayu'],
                        'required' => true,
                    ],
                    [
                        'name' => 'jenis_logam',
                        'label' => 'Jenis Logam',
                        'type' => 'radio',
                        'options' => [
                            'Stainless Steel 304 (Anti Karat)',
                            'Stainless Steel 316 (Marine Grade)',
                            'Kuningan Emas (Brass Gold)',
                        ],
                        'required' => true,
                    ],
                    [
                        'name' => 'ketebalan_plat',
                        'label' => 'Ketebalan Plat',
                        'type' => 'select',
                        'options' => ['1mm', '2mm', '3mm', '5mm'],
                        'required' => true,
                    ],
                    [
                        'name' => 'ukuran_plakat',
                        'label' => 'Ukuran Plakat',
                        'type' => 'text',
                        'required' => true,
                    ],
                    [
                        'name' => 'text_engraving',
                        'label' => 'Text untuk Engraving',
                        'type' => 'textarea',
                        'required' => false,
                    ],
                ],
            ],
            'is_active' => true,
        ]);

        // Create order with specifications
        $this->order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'product_name' => 'Custom Plakat',
                    'quantity' => 2,
                    'specifications' => [
                        'jenis_plakat' => 'Plakat Logam',
                        'jenis_logam' => 'Stainless Steel 304 (Anti Karat)',
                        'ketebalan_plat' => '2mm',
                        'ukuran_plakat' => '30x40cm',
                        'text_engraving' => '30 Years Beyond Partnership',
                    ],
                    'pricing' => [
                        'unit_price' => 3114510,
                        'total_price' => 6229020,
                    ],
                ],
            ],
        ]);
    }

    /**
     * Test quote creation API includes form_schema
     * 
     * Validates: Subtask 6.3.1 - Test quote creation API with form_schema
     * 
     * @test
     */
    public function test_quote_creation_includes_form_schema(): void
    {
        // Prepare quote data
        $quoteData = [
            'order_id' => $this->order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'initial_offer' => 50000, // IDR (will be converted to cents)
            'currency' => 'IDR',
            'title' => 'Quote for Custom Plakat',
            'description' => 'High-quality etching plaque',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'description' => 'Custom Plakat 30x40cm',
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
                ],
            ],
        ];

        // Create quote via API
        $response = $this->postJson('/api/v1/tenant/quotes', $quoteData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        // Assert response is successful
        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'order_id',
                'vendor_id',
                'status',
                'items' => [
                    '*' => [
                        'product_id',
                        'description',
                        'quantity',
                        'unit_price',
                        'vendor_cost',
                        'specifications',
                        'form_schema',
                    ],
                ],
            ],
        ]);

        // Assert form_schema is included in response
        $responseData = $response->json('data');
        $this->assertNotNull($responseData['items'][0]['form_schema']);
        $this->assertIsArray($responseData['items'][0]['form_schema']);
        $this->assertArrayHasKey('fields', $responseData['items'][0]['form_schema']);
        
        // Verify form_schema fields match configuration
        $formSchemaFields = $responseData['items'][0]['form_schema']['fields'];
        $this->assertCount(5, $formSchemaFields);
        $this->assertEquals('jenis_plakat', $formSchemaFields[0]['name']);
        $this->assertEquals('Jenis Plakat', $formSchemaFields[0]['label']);

        // Verify quote is stored in database with form_schema
        $quote = OrderVendorNegotiation::where('uuid', $responseData['id'])->first();
        $this->assertNotNull($quote);
        $this->assertNotNull($quote->quote_details);
        $this->assertArrayHasKey('items', $quote->quote_details);
        $this->assertNotNull($quote->quote_details['items'][0]['form_schema']);
    }

    /**
     * Test quote update API preserves form_schema
     * 
     * Validates: Subtask 6.3.2 - Test quote update API preserves form_schema
     * 
     * @test
     */
    public function test_quote_update_preserves_form_schema(): void
    {
        // Create initial quote with form_schema
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
            'quote_details' => [
                'title' => 'Initial Quote',
                'description' => 'Initial description',
                'items' => [
                    [
                        'product_id' => $this->product->uuid,
                        'description' => 'Custom Plakat',
                        'quantity' => 2,
                        'unit_price' => 3114510,
                        'vendor_cost' => 250000,
                        'specifications' => [
                            'jenis_plakat' => 'Plakat Logam',
                            'jenis_logam' => 'Stainless Steel 304 (Anti Karat)',
                        ],
                        'form_schema' => $this->formConfig->form_schema,
                    ],
                ],
            ],
        ]);

        // Update quote with new pricing
        $updateData = [
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'description' => 'Custom Plakat - Updated',
                    'quantity' => 3, // Changed quantity
                    'unit_price' => 3000000, // Changed price
                    'vendor_cost' => 240000, // Changed cost
                    'specifications' => [
                        'jenis_plakat' => 'Plakat Logam',
                        'jenis_logam' => 'Stainless Steel 316 (Marine Grade)', // Changed
                    ],
                ],
            ],
        ];

        $response = $this->putJson("/api/v1/tenant/quotes/{$quote->uuid}", $updateData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        // Assert response is successful
        $response->assertStatus(200);

        // Assert form_schema is preserved
        $responseData = $response->json('data');
        $this->assertNotNull($responseData['items'][0]['form_schema']);
        $this->assertArrayHasKey('fields', $responseData['items'][0]['form_schema']);
        
        // Verify form_schema fields are intact
        $formSchemaFields = $responseData['items'][0]['form_schema']['fields'];
        $this->assertCount(5, $formSchemaFields);
        $this->assertEquals('jenis_plakat', $formSchemaFields[0]['name']);

        // Verify updated values are reflected
        $this->assertEquals(3, $responseData['items'][0]['quantity']);
        $this->assertEquals(3000000, $responseData['items'][0]['unit_price']);
        $this->assertEquals('Stainless Steel 316 (Marine Grade)', 
            $responseData['items'][0]['specifications']['jenis_logam']);

        // Verify database record preserves form_schema
        $quote->refresh();
        $this->assertNotNull($quote->quote_details['items'][0]['form_schema']);
        $this->assertArrayHasKey('fields', $quote->quote_details['items'][0]['form_schema']);
    }

    /**
     * Test quote retrieval includes calculations
     * 
     * Validates: Subtask 6.3.3 - Test quote retrieval includes calculations
     * 
     * @test
     */
    public function test_quote_retrieval_includes_calculations(): void
    {
        // Create quote with specific pricing
        $quantity = 3;
        $unitPrice = 3114510;
        $vendorCost = 250000;
        
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
            'quote_details' => [
                'title' => 'Test Quote',
                'items' => [
                    [
                        'product_id' => $this->product->uuid,
                        'description' => 'Custom Plakat',
                        'quantity' => $quantity,
                        'unit_price' => $unitPrice,
                        'vendor_cost' => $vendorCost,
                        'specifications' => [
                            'jenis_plakat' => 'Plakat Logam',
                        ],
                        'form_schema' => $this->formConfig->form_schema,
                    ],
                ],
            ],
        ]);

        // Retrieve quote via API
        $response = $this->getJson("/api/v1/tenant/quotes/{$quote->uuid}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        // Assert response is successful
        $response->assertStatus(200);

        // Assert calculated fields are present
        $item = $response->json('data.items.0');
        
        // Verify per-piece values
        $this->assertEquals($unitPrice, $item['unit_price']);
        $this->assertEquals($vendorCost, $item['vendor_cost']);
        
        // Verify total values (calculated)
        $expectedTotalVendorCost = $vendorCost * $quantity;
        $expectedTotalUnitPrice = $unitPrice * $quantity;
        $this->assertEquals($expectedTotalVendorCost, $item['total_vendor_cost']);
        $this->assertEquals($expectedTotalUnitPrice, $item['total_unit_price']);
        $this->assertEquals($expectedTotalUnitPrice, $item['total_price']); // Alias
        
        // Verify profit margins
        $expectedProfitPerPiece = $unitPrice - $vendorCost;
        $expectedProfitPerPiecePercent = ($expectedProfitPerPiece / $vendorCost) * 100;
        $expectedProfitTotal = $expectedTotalUnitPrice - $expectedTotalVendorCost;
        $expectedProfitTotalPercent = ($expectedProfitTotal / $expectedTotalVendorCost) * 100;
        
        $this->assertEquals($expectedProfitPerPiece, $item['profit_per_piece']);
        $this->assertEquals(round($expectedProfitPerPiecePercent, 2), $item['profit_per_piece_percent']);
        $this->assertEquals($expectedProfitTotal, $item['profit_total']);
        $this->assertEquals(round($expectedProfitTotalPercent, 2), $item['profit_total_percent']);
    }

    /**
     * Test with real database data
     * 
     * Validates: Subtask 6.3.4 - Test with real database data
     * 
     * @test
     */
    public function test_with_real_database_data(): void
    {
        // Create multiple products with different form configurations
        $product2 = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Custom Trophy',
            'sku' => 'TROPHY-001',
        ]);

        $formConfig2 = ProductFormConfiguration::create([
            'tenant_id' => $this->tenant->id,
            'product_id' => $product2->id,
            'product_uuid' => $product2->uuid,
            'form_schema' => [
                'fields' => [
                    [
                        'name' => 'material',
                        'label' => 'Material',
                        'type' => 'select',
                        'options' => ['Crystal', 'Acrylic', 'Metal'],
                    ],
                    [
                        'name' => 'height',
                        'label' => 'Height (cm)',
                        'type' => 'number',
                    ],
                ],
            ],
            'is_active' => true,
        ]);

        // Create order with multiple items
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'product_name' => 'Custom Plakat',
                    'quantity' => 2,
                    'specifications' => [
                        'jenis_plakat' => 'Plakat Logam',
                        'ukuran_plakat' => '30x40cm',
                    ],
                ],
                [
                    'product_id' => $product2->uuid,
                    'product_name' => 'Custom Trophy',
                    'quantity' => 5,
                    'specifications' => [
                        'material' => 'Crystal',
                        'height' => '25',
                    ],
                ],
            ],
        ]);

        // Create quote with multiple items
        $quoteData = [
            'order_id' => $order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'initial_offer' => 100000,
            'currency' => 'IDR',
            'title' => 'Multi-Item Quote',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'description' => 'Custom Plakat',
                    'quantity' => 2,
                    'unit_price' => 3000000,
                    'vendor_cost' => 250000,
                    'specifications' => [
                        'jenis_plakat' => 'Plakat Logam',
                        'ukuran_plakat' => '30x40cm',
                    ],
                ],
                [
                    'product_id' => $product2->uuid,
                    'description' => 'Custom Trophy',
                    'quantity' => 5,
                    'unit_price' => 1500000,
                    'vendor_cost' => 120000,
                    'specifications' => [
                        'material' => 'Crystal',
                        'height' => '25',
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/tenant/quotes', $quoteData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(201);

        // Verify both items have their respective form schemas
        $items = $response->json('data.items');
        $this->assertCount(2, $items);
        
        // First item (Plakat) should have 5 fields
        $this->assertNotNull($items[0]['form_schema']);
        $this->assertCount(5, $items[0]['form_schema']['fields']);
        
        // Second item (Trophy) should have 2 fields
        $this->assertNotNull($items[1]['form_schema']);
        $this->assertCount(2, $items[1]['form_schema']['fields']);
        
        // Verify calculations for both items
        $this->assertEquals(2 * 250000, $items[0]['total_vendor_cost']);
        $this->assertEquals(5 * 120000, $items[1]['total_vendor_cost']);
    }

    /**
     * Test data consistency across operations
     * 
     * Validates: Subtask 6.3.5 - Verify data consistency
     * 
     * @test
     */
    public function test_data_consistency_across_operations(): void
    {
        // Create quote
        $quoteData = [
            'order_id' => $this->order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'initial_offer' => 50000,
            'currency' => 'IDR',
            'title' => 'Consistency Test Quote',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'description' => 'Custom Plakat',
                    'quantity' => 2,
                    'unit_price' => 3114510,
                    'vendor_cost' => 250000,
                    'specifications' => [
                        'jenis_plakat' => 'Plakat Logam',
                    ],
                ],
            ],
        ];

        $createResponse = $this->postJson('/api/v1/tenant/quotes', $quoteData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $createResponse->assertStatus(201);
        $quoteId = $createResponse->json('data.id');

        // Retrieve quote and verify consistency
        $getResponse = $this->getJson("/api/v1/tenant/quotes/{$quoteId}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $getResponse->assertStatus(200);
        
        // Compare created and retrieved data
        $createdItem = $createResponse->json('data.items.0');
        $retrievedItem = $getResponse->json('data.items.0');
        
        $this->assertEquals($createdItem['quantity'], $retrievedItem['quantity']);
        $this->assertEquals($createdItem['unit_price'], $retrievedItem['unit_price']);
        $this->assertEquals($createdItem['vendor_cost'], $retrievedItem['vendor_cost']);
        $this->assertEquals($createdItem['total_vendor_cost'], $retrievedItem['total_vendor_cost']);
        $this->assertEquals($createdItem['total_unit_price'], $retrievedItem['total_unit_price']);
        $this->assertEquals($createdItem['profit_per_piece'], $retrievedItem['profit_per_piece']);
        $this->assertEquals($createdItem['profit_total'], $retrievedItem['profit_total']);
        
        // Verify form_schema consistency
        $this->assertEquals($createdItem['form_schema'], $retrievedItem['form_schema']);

        // Update quote and verify consistency
        $updateData = [
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'description' => 'Custom Plakat - Updated',
                    'quantity' => 3,
                    'unit_price' => 3000000,
                    'vendor_cost' => 240000,
                    'specifications' => [
                        'jenis_plakat' => 'Plakat Logam',
                    ],
                ],
            ],
        ];

        $updateResponse = $this->putJson("/api/v1/tenant/quotes/{$quoteId}", $updateData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $updateResponse->assertStatus(200);

        // Retrieve again and verify updated calculations
        $getResponse2 = $this->getJson("/api/v1/tenant/quotes/{$quoteId}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $updatedItem = $getResponse2->json('data.items.0');
        
        // Verify updated values
        $this->assertEquals(3, $updatedItem['quantity']);
        $this->assertEquals(3000000, $updatedItem['unit_price']);
        $this->assertEquals(240000, $updatedItem['vendor_cost']);
        
        // Verify recalculated totals
        $this->assertEquals(3 * 240000, $updatedItem['total_vendor_cost']);
        $this->assertEquals(3 * 3000000, $updatedItem['total_unit_price']);
        
        // Verify form_schema still present
        $this->assertNotNull($updatedItem['form_schema']);
        $this->assertEquals($createdItem['form_schema'], $updatedItem['form_schema']);
    }

    /**
     * Test edge case: Quote with zero vendor cost
     * 
     * @test
     */
    public function test_calculations_with_zero_vendor_cost(): void
    {
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
            'quote_details' => [
                'title' => 'Zero Cost Quote',
                'items' => [
                    [
                        'product_id' => $this->product->uuid,
                        'description' => 'Free Sample',
                        'quantity' => 1,
                        'unit_price' => 1000000,
                        'vendor_cost' => 0, // Zero cost
                        'specifications' => [],
                        'form_schema' => $this->formConfig->form_schema,
                    ],
                ],
            ],
        ]);

        $response = $this->getJson("/api/v1/tenant/quotes/{$quote->uuid}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);
        
        $item = $response->json('data.items.0');
        
        // Verify calculations don't cause division by zero
        $this->assertEquals(0, $item['vendor_cost']);
        $this->assertEquals(0, $item['total_vendor_cost']);
        $this->assertEquals(1000000, $item['profit_per_piece']);
        $this->assertEquals(0, $item['profit_per_piece_percent']); // Should be 0, not error
        $this->assertEquals(1000000, $item['profit_total']);
        $this->assertEquals(0, $item['profit_total_percent']);
    }

    /**
     * Test edge case: Quote with quantity = 1
     * 
     * @test
     */
    public function test_calculations_with_single_quantity(): void
    {
        $unitPrice = 3114510;
        $vendorCost = 250000;
        
        $quote = OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $this->order->id,
            'vendor_id' => $this->vendor->id,
            'status' => 'open',
            'latest_offer' => 5000000,
            'quote_details' => [
                'title' => 'Single Item Quote',
                'items' => [
                    [
                        'product_id' => $this->product->uuid,
                        'description' => 'Single Plakat',
                        'quantity' => 1,
                        'unit_price' => $unitPrice,
                        'vendor_cost' => $vendorCost,
                        'specifications' => [],
                        'form_schema' => $this->formConfig->form_schema,
                    ],
                ],
            ],
        ]);

        $response = $this->getJson("/api/v1/tenant/quotes/{$quote->uuid}", [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);
        
        $item = $response->json('data.items.0');
        
        // When quantity = 1, per-piece and total should be the same
        $this->assertEquals($unitPrice, $item['unit_price']);
        $this->assertEquals($unitPrice, $item['total_unit_price']);
        $this->assertEquals($vendorCost, $item['vendor_cost']);
        $this->assertEquals($vendorCost, $item['total_vendor_cost']);
        $this->assertEquals($item['profit_per_piece'], $item['profit_total']);
        $this->assertEquals($item['profit_per_piece_percent'], $item['profit_total_percent']);
    }

    /**
     * Test form_schema is null when product has no configuration
     * 
     * @test
     */
    public function test_form_schema_null_when_no_configuration(): void
    {
        // Create product without form configuration
        $productWithoutConfig = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Simple Product',
            'sku' => 'SIMPLE-001',
        ]);

        $quoteData = [
            'order_id' => $this->order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'initial_offer' => 50000,
            'currency' => 'IDR',
            'title' => 'Quote Without Form Schema',
            'items' => [
                [
                    'product_id' => $productWithoutConfig->uuid,
                    'description' => 'Simple Product',
                    'quantity' => 1,
                    'unit_price' => 1000000,
                    'vendor_cost' => 80000,
                    'specifications' => [],
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/tenant/quotes', $quoteData, [
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(201);
        
        // Verify form_schema is null
        $item = $response->json('data.items.0');
        $this->assertNull($item['form_schema']);
    }

    /**
     * Helper method to get current tenant ID from request
     */
    private function getCurrentTenantId(Request $request): int
    {
        return $request->header('X-Tenant-ID') ?? $this->tenant->id;
    }
}
