<?php

namespace Tests\Feature\Quote;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Models\ProductFormConfiguration;
use Laravel\Sanctum\Sanctum;

class StoreQuoteWithFormSchemaTest extends TestCase
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

    public function test_stores_quote_with_basic_data(): void
    {
        $quoteData = [
            'order_id' => $this->order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'initial_offer' => 1000.00,
            'currency' => 'IDR',
            'title' => 'Test Quote',
            'description' => 'Test Description',
            'terms_and_conditions' => 'Test Terms',
            'notes' => 'Test Notes',
        ];

        $response = $this->postJson('/api/v1/tenant/quotes', $quoteData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'quote_number',
                    'order_id',
                    'vendor_id',
                    'status',
                    'quoted_price',
                    'title',
                    'description',
                    'terms_and_conditions',
                    'notes',
                ]
            ])
            ->assertJsonPath('data.title', 'Test Quote')
            ->assertJsonPath('data.description', 'Test Description')
            ->assertJsonPath('data.status', 'open');
    }

    public function test_stores_quote_with_items_and_enriches_with_form_schema(): void
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

        $quoteData = [
            'order_id' => $this->order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'initial_offer' => 1000.00,
            'currency' => 'IDR',
            'title' => 'Test Quote with Items',
            'items' => [
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
            ],
        ];

        $response = $this->postJson('/api/v1/tenant/quotes', $quoteData);

        $response->assertStatus(201)
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
                            'specifications',
                            'form_schema',
                        ],
                    ],
                ]
            ])
            ->assertJsonPath('data.items.0.form_schema.fields.0.name', 'material')
            ->assertJsonPath('data.items.0.form_schema.fields.0.label', 'Material Type')
            ->assertJsonPath('data.items.0.specifications.material', 'Stainless Steel');
    }

    public function test_stores_quote_with_items_without_form_schema(): void
    {
        // Don't create ProductFormConfiguration - test fallback behavior
        $quoteData = [
            'order_id' => $this->order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'initial_offer' => 1000.00,
            'currency' => 'IDR',
            'title' => 'Test Quote without Form Schema',
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
        ];

        $response = $this->postJson('/api/v1/tenant/quotes', $quoteData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'items' => [
                        '*' => [
                            'product_id',
                            'description',
                            'quantity',
                            'specifications',
                        ],
                    ],
                ]
            ])
            ->assertJsonPath('data.items.0.form_schema', null);
    }

    public function test_api_response_includes_calculations(): void
    {
        $quoteData = [
            'order_id' => $this->order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'initial_offer' => 1000.00,
            'currency' => 'IDR',
            'title' => 'Test Quote with Calculations',
            'items' => [
                [
                    'product_id' => $this->product->uuid,
                    'description' => 'Custom Etching Plate',
                    'quantity' => 2,
                    'unit_price' => 500.00,
                    'vendor_cost' => 300.00,
                    'specifications' => [],
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/tenant/quotes', $quoteData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'items' => [
                        '*' => [
                            'unit_price',
                            'vendor_cost',
                            'total_vendor_cost',
                            'total_unit_price',
                            'profit_per_piece',
                            'profit_per_piece_percent',
                            'profit_total',
                            'profit_total_percent',
                        ],
                    ],
                ]
            ]);

        // Verify calculations
        $item = $response->json('data.items.0');
        $this->assertEquals(500.00, $item['unit_price']);
        $this->assertEquals(300.00, $item['vendor_cost']);
        $this->assertEquals(600.00, $item['total_vendor_cost']); // 300 * 2
        $this->assertEquals(1000.00, $item['total_unit_price']); // 500 * 2
        $this->assertEquals(200.00, $item['profit_per_piece']); // 500 - 300
        $this->assertEquals(400.00, $item['profit_total']); // 1000 - 600
    }

    public function test_validates_required_fields(): void
    {
        $response = $this->postJson('/api/v1/tenant/quotes', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['order_id', 'vendor_id', 'initial_offer']);
    }

    public function test_enforces_tenant_isolation(): void
    {
        $otherTenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $otherOrder = Order::factory()->create(['tenant_id' => $otherTenant->id]);

        $quoteData = [
            'order_id' => $otherOrder->uuid,
            'vendor_id' => $this->vendor->uuid,
            'initial_offer' => 1000.00,
        ];

        $response = $this->postJson('/api/v1/tenant/quotes', $quoteData);

        // Should return 404 because order doesn't belong to current tenant
        $response->assertStatus(404);
    }
}
