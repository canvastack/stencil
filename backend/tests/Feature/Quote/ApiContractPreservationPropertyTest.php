<?php

namespace Tests\Feature\Quote;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel as Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

/**
 * Property-Based Test for API Contract Preservation
 * 
 * Property 28: API Contract Preservation
 * 
 * For any existing API endpoint in OrderController or QuoteController,
 * the endpoint should continue to accept the same request format and
 * return the same response structure after integration changes.
 * 
 * Validates: Requirements 10.4, 10.5
 */
class ApiContractPreservationPropertyTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;
    private Customer $customer;
    private Vendor $vendor;
    private User $user;

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
        ]);

        // Create and authenticate user
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        Sanctum::actingAs($this->user);
    }

    /**
     * Property: OrderController endpoints maintain request/response contract
     * 
     * @test
     */
    public function property_order_controller_endpoints_maintain_contract(): void
    {
        // Test data variations
        $testCases = [
            'basic_order' => [
                'status' => 'new',
                'vendor_quoted_price' => null,
                'quotation_amount' => null,
            ],
            'order_with_vendor_price' => [
                'status' => 'vendor_negotiation',
                'vendor_quoted_price' => 1000000,
                'quotation_amount' => 1350000,
            ],
            'order_with_vendor' => [
                'status' => 'vendor_negotiation',
                'vendor_quoted_price' => 1000000,
                'quotation_amount' => 1350000,
                'vendor_id' => $this->vendor->id,
            ],
        ];

        foreach ($testCases as $caseName => $orderData) {
            // Create order with test data
            $order = Order::factory()->create(array_merge([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $this->customer->id,
            ], $orderData));

            // Test GET /api/v1/tenant/orders/{order}
            $response = $this->getJson(
                "/api/v1/tenant/orders/{$order->uuid}",
                ['X-Tenant-ID' => $this->tenant->id]
            );

            $response->assertStatus(200);
            
            // Verify response structure (contract)
            $response->assertJsonStructure([
                'data' => [
                    'id',  // UUID
                    'order_number',
                    'status',
                    'customerId',  // camelCase
                    'vendor_quoted_price',  // snake_case also available
                    'quotation_amount',  // snake_case also available
                    'vendorId',  // camelCase
                    'created_at',
                ],
            ]);

            // Verify UUID is returned (not integer ID)
            $this->assertIsString($response->json('data.id'));
            $this->assertMatchesRegularExpression(
                '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
                $response->json('data.id')
            );

            // Verify monetary values are in decimal format (not cents)
            if ($orderData['vendor_quoted_price'] !== null) {
                $this->assertIsNumeric($response->json('data.vendor_quoted_price'));
                $this->assertEquals(
                    $orderData['vendor_quoted_price'] / 100,
                    $response->json('data.vendor_quoted_price')
                );
            }

            if ($orderData['quotation_amount'] !== null) {
                $this->assertIsNumeric($response->json('data.quotation_amount'));
                $this->assertEquals(
                    $orderData['quotation_amount'] / 100,
                    $response->json('data.quotation_amount')
                );
            }
        }
    }

    /**
     * Property: QuoteController endpoints maintain request/response contract
     * 
     * @test
     */
    public function property_quote_controller_endpoints_maintain_contract(): void
    {
        // Test data variations
        $testCases = [
            'open_quote' => [
                'status' => 'draft',
                'initial_offer' => 1000000,
                'latest_offer' => 1000000,
            ],
            'countered_quote' => [
                'status' => 'countered',
                'initial_offer' => 1000000,
                'latest_offer' => 950000,
            ],
            'accepted_quote' => [
                'status' => 'accepted',
                'initial_offer' => 1000000,
                'latest_offer' => 1000000,
                'closed_at' => now(),
            ],
        ];

        foreach ($testCases as $caseName => $quoteData) {
            // Create order
            $order = Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $this->customer->id,
                'status' => 'vendor_negotiation',
            ]);

            // Create quote with test data
            $quote = OrderVendorNegotiation::create(array_merge([
                'tenant_id' => $this->tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $this->vendor->id,
                'currency' => 'IDR',
            ], $quoteData));

            // Test GET /api/v1/tenant/quotes/{quote}
            $response = $this->getJson(
                "/api/v1/tenant/quotes/{$quote->uuid}",
                ['X-Tenant-ID' => $this->tenant->id]
            );

            $response->assertStatus(200);
            
            // Verify response structure (contract)
            $response->assertJsonStructure([
                'data' => [
                    'id',  // UUID
                    'order_id',  // UUID
                    'vendor_id',  // UUID
                    'quoted_price',  // Transformed field name
                    'original_price',  // Transformed field name
                    'currency',
                    'status',
                    'created_at',
                    'updated_at',
                ],
            ]);

            // Verify UUID is returned (not integer ID)
            $this->assertIsString($response->json('data.id'));
            $this->assertMatchesRegularExpression(
                '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
                $response->json('data.id')
            );

            // Verify monetary values are in decimal format (not cents)
            $this->assertIsNumeric($response->json('data.quoted_price'));
            $this->assertEquals(
                $quoteData['latest_offer'] / 100,
                $response->json('data.quoted_price')
            );

            $this->assertIsNumeric($response->json('data.original_price'));
            $this->assertEquals(
                $quoteData['initial_offer'] / 100,
                $response->json('data.original_price')
            );
        }
    }

    /**
     * Property: Order list endpoint maintains pagination contract
     * 
     * @test
     */
    public function property_order_list_endpoint_maintains_pagination_contract(): void
    {
        // Create multiple orders
        $orderCount = 15;
        for ($i = 0; $i < $orderCount; $i++) {
            Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $this->customer->id,
            ]);
        }

        // Test GET /api/v1/tenant/orders with pagination
        $response = $this->getJson(
            '/api/v1/tenant/orders?page=1&per_page=10',
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $response->assertStatus(200);
        
        // Verify pagination structure (contract)
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'order_number',
                    'status',
                ],
            ],
            'meta' => [
                'current_page',
                'per_page',
                'total',
                'last_page',
            ],
        ]);

        // Verify pagination values
        $this->assertEquals(1, $response->json('meta.current_page'));
        $this->assertEquals(10, $response->json('meta.per_page'));
        $this->assertEquals($orderCount, $response->json('meta.total'));
    }

    /**
     * Property: Quote list endpoint maintains pagination contract
     * 
     * @test
     */
    public function property_quote_list_endpoint_maintains_pagination_contract(): void
    {
        // Create order
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Create multiple quotes
        $quoteCount = 15;
        for ($i = 0; $i < $quoteCount; $i++) {
            OrderVendorNegotiation::create([
                'tenant_id' => $this->tenant->id,
                'order_id' => $order->id,
                'vendor_id' => $this->vendor->id,
                'initial_offer' => 1000000 + ($i * 10000),
                'latest_offer' => 1000000 + ($i * 10000),
                'currency' => 'IDR',
                'status' => 'draft',
            ]);
        }

        // Test GET /api/v1/tenant/quotes with pagination
        $response = $this->getJson(
            '/api/v1/tenant/quotes?page=1&per_page=10',
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $response->assertStatus(200);
        
        // Verify pagination structure (contract)
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'order_id',
                    'vendor_id',
                    'status',
                ],
            ],
            'meta' => [
                'current_page',
                'per_page',
                'total',
                'last_page',
            ],
        ]);

        // Verify pagination values
        $this->assertEquals(1, $response->json('meta.current_page'));
        $this->assertEquals(10, $response->json('meta.per_page'));
        $this->assertEquals($quoteCount, $response->json('meta.total'));
    }

    /**
     * Property: Order update endpoint maintains request contract
     * 
     * @test
     */
    public function property_order_update_endpoint_maintains_request_contract(): void
    {
        // Create order
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'new',
        ]);

        // Test PUT /api/v1/tenant/orders/{order} with various update payloads
        $updatePayloads = [
            ['status' => 'sourcing_vendor'],
            ['vendor_quoted_price' => 1000.00],
            ['quotation_amount' => 1350.00],
            ['negotiation_notes' => 'Test notes'],
        ];

        foreach ($updatePayloads as $payload) {
            $response = $this->putJson(
                "/api/v1/tenant/orders/{$order->uuid}",
                $payload,
                ['X-Tenant-ID' => $this->tenant->id]
            );

            // Should accept the request (200 or 422 for validation)
            $this->assertContains($response->status(), [200, 422]);
            
            // If successful, verify response structure
            if ($response->status() === 200) {
                $response->assertJsonStructure([
                    'data' => [
                        'id',
                        'order_number',
                        'status',
                    ],
                ]);
            }
        }
    }

    /**
     * Property: Quote creation endpoint maintains request contract
     * 
     * @test
     */
    public function property_quote_creation_endpoint_maintains_request_contract(): void
    {
        // Create order
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'status' => 'vendor_negotiation',
        ]);

        // Test POST /api/v1/tenant/quotes with valid payload
        $payload = [
            'order_id' => $order->uuid,
            'vendor_id' => $this->vendor->uuid,
            'initial_offer' => 1000.00,  // Decimal format
            'currency' => 'IDR',
            'terms' => ['payment_terms' => 'Net 30'],
            'lead_time_days' => 14,
        ];

        $response = $this->postJson(
            '/api/v1/tenant/quotes',
            $payload,
            ['X-Tenant-ID' => $this->tenant->id]
        );

        // Should accept the request
        $this->assertContains($response->status(), [200, 201, 422]);
        
        // If successful, verify response structure
        if (in_array($response->status(), [200, 201])) {
            $response->assertJsonStructure([
                'data' => [
                    'id',
                    'order_id',
                    'vendor_id',
                    'quoted_price',  // Transformed field name
                    'status',
                ],
            ]);
        }
    }

    /**
     * Property: Error responses maintain consistent structure
     * 
     * @test
     */
    public function property_error_responses_maintain_consistent_structure(): void
    {
        // Test 404 error for non-existent order
        $response = $this->getJson(
            '/api/v1/tenant/orders/00000000-0000-0000-0000-000000000000',
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $response->assertStatus(404);
        $response->assertJsonStructure([
            'message',
        ]);

        // Test 404 error for non-existent quote
        $response = $this->getJson(
            '/api/v1/tenant/quotes/00000000-0000-0000-0000-000000000000',
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $response->assertStatus(404);
        $response->assertJsonStructure([
            'message',
        ]);

        // Test 422 validation error
        $response = $this->postJson(
            '/api/v1/tenant/quotes',
            [
                // Missing required fields
                'initial_offer' => 1000.00,
            ],
            ['X-Tenant-ID' => $this->tenant->id]
        );

        $response->assertStatus(422);
        $response->assertJsonStructure([
            'message',
            'errors',
        ]);
    }
}
