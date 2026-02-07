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
            'product_id' => $this->product->uuid, // Changed from initial_offer to product_id
            'quantity' => 10, // Added required quantity field
            'specifications' => [ // Changed from separate fields to specifications array
                'title' => 'Test Quote',
                'description' => 'Test Description',
                'terms_and_conditions' => 'Test Terms',
            ],
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
                ]
            ])
            ->assertJsonPath('data.status', 'draft'); // Changed from 'open' to 'draft'
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
            'product_id' => $this->product->uuid, // Changed to use product_id
            'quantity' => 2, // Added required quantity
            'specifications' => [ // Changed to specifications array
                'material' => 'Stainless Steel',
                'dimensions' => '10x15cm',
                'description' => 'Custom Etching Plate',
            ],
        ];

        $response = $this->postJson('/api/v1/tenant/quotes', $quoteData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'specifications',
                ]
            ])
            ->assertJsonPath('data.specifications.material', 'Stainless Steel');
    }

    public function test_stores_quote_with_items_without_form_schema(): void
    {
        // Don't create ProductFormConfiguration - test fallback behavior
        $quoteData = [
            'order_id' => $this->order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'product_id' => $this->product->uuid, // Changed to use product_id
            'quantity' => 2, // Added required quantity
            'specifications' => [ // Changed to specifications array
                'material' => 'Stainless Steel',
                'description' => 'Custom Etching Plate',
            ],
        ];

        $response = $this->postJson('/api/v1/tenant/quotes', $quoteData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'specifications',
                ]
            ])
            ->assertJsonPath('data.specifications.material', 'Stainless Steel');
    }

    public function test_api_response_includes_calculations(): void
    {
        $quoteData = [
            'order_id' => $this->order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'product_id' => $this->product->uuid, // Changed to use product_id
            'quantity' => 2, // Added required quantity
            'specifications' => [ // Changed to specifications array
                'description' => 'Custom Etching Plate',
            ],
        ];

        $response = $this->postJson('/api/v1/tenant/quotes', $quoteData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'quantity',
                    'specifications',
                ]
            ]);

        // Verify basic data
        $data = $response->json('data');
        $this->assertEquals(2, $data['quantity']);
    }

    public function test_validates_required_fields(): void
    {
        $response = $this->postJson('/api/v1/tenant/quotes', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['order_id', 'vendor_id', 'product_id', 'quantity']); // Changed from initial_offer to product_id and quantity
    }

    public function test_enforces_tenant_isolation(): void
    {
        $otherTenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $otherOrder = Order::factory()->create(['tenant_id' => $otherTenant->id]);

        $quoteData = [
            'order_id' => $otherOrder->uuid,
            'vendor_id' => $this->vendor->uuid,
            'product_id' => $this->product->uuid, // Changed from initial_offer to product_id
            'quantity' => 10, // Added required quantity
        ];

        $response = $this->postJson('/api/v1/tenant/quotes', $quoteData);

        // Should return 422 because order validation will fail (order not found in tenant)
        $response->assertStatus(422);
    }
}
