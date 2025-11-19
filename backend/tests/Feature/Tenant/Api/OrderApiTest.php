<?php

namespace Tests\Feature\Tenant\Api;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Tenant $tenant;
    protected string $tenantHost;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->tenantHost = $this->tenant->slug . '.canvastencil.test';
        $this->tenant->update(['domain' => $this->tenantHost]);

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        
        Sanctum::actingAs($this->user);
        auth('tenant')->setUser($this->user);

        Notification::fake();

        app()->instance('current_tenant', $this->tenant);
        config(['multitenancy.current_tenant' => $this->tenant]);
    }

    public function test_can_list_orders(): void
    {
        Order::factory()->count(5)->create(['tenant_id' => $this->tenant->id]);

        $response = $this->tenantGet('/api/orders');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                '*' => [
                    'id',
                    'tenantId',
                    'orderNumber',
                    'financial' => [
                        'totalAmount',
                    ],
                    'status' => [
                        'orderStatus',
                    ],
                    'timestamps' => [
                        'createdAt',
                    ],
                ]
            ]
        ]);
    }

    public function test_order_list_excludes_other_tenant_data(): void
    {
        $otherTenant = Tenant::factory()->create();
        Order::factory()->create(['tenant_id' => $otherTenant->id]);
        Order::factory()->create(['tenant_id' => $this->tenant->id]);

        $response = $this->tenantGet('/api/orders');

        $response->assertStatus(200);
        $orders = $response->json('data');
        $this->assertGreaterThan(0, count($orders));
        foreach ($orders as $order) {
            $this->assertEquals($this->tenant->id, $order['tenantId']);
        }
    }

    public function test_can_filter_orders_by_status(): void
    {
        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'new'
        ]);
        
        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'completed'
        ]);

        $response = $this->tenantGet('/api/orders?status=new');

        $response->assertStatus(200);
        $this->assertEquals(1, count($response->json('data')));
    }

    public function test_can_create_order(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $product = Product::query()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Product',
            'sku' => 'SKU-' . Str::random(8),
            'price' => 5000000,
            'slug' => 'test-product-' . Str::random(8),
        ]);

        $orderData = [
            'customer_id' => $customer->id,
            'status' => 'new',
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'unit_price' => 5000000,
                ],
            ],
            'subtotal' => 5000000,
            'tax' => 0,
            'shipping_cost' => 0,
            'total_amount' => 5000000,
            'shipping_address' => 'Jl. Test 123',
            'customer_notes' => 'Test order',
        ];

        $response = $this->tenantPost('/api/orders', $orderData);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'tenantId',
                'orderNumber',
                'financial' => [
                    'totalAmount',
                ],
                'status' => [
                    'orderStatus',
                ],
            ]
        ]);

        $this->assertDatabaseHas('orders', [
            'customer_id' => $customer->id,
            'tenant_id' => $this->tenant->id,
            'status' => 'new',
        ]);
    }

    public function test_can_show_order_detail(): void
    {
        $order = Order::factory()->create(['tenant_id' => $this->tenant->id]);

        $response = $this->tenantGet("/api/orders/{$order->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'id',
                'tenantId',
                'orderNumber',
                'financial' => [
                    'totalAmount',
                ],
                'status' => [
                    'orderStatus',
                ],
                'customer' => [
                    'id',
                    'name',
                ],
            ]
        ]);
    }

    public function test_can_update_order(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'notes' => 'Original notes'
        ]);

        $response = $this->tenantPut("/api/orders/{$order->id}", [
            'internal_notes' => 'Updated notes'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'internal_notes' => 'Updated notes'
        ]);
    }

    public function test_can_update_order_status(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'new'
        ]);

        $response = $this->tenantPut("/api/orders/{$order->id}/status", [
            'status' => 'sourcing_vendor'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'sourcing_vendor'
        ]);
    }

    public function test_cannot_update_to_invalid_status(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'new'
        ]);

        $response = $this->tenantPut("/api/orders/{$order->id}/status", [
            'status' => 'completed'
        ]);

        $response->assertStatus(422);
    }

    public function test_can_ship_order_with_tracking_number(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'ready_to_ship'
        ]);

        $response = $this->tenantPost("/api/orders/{$order->id}/ship", [
            'tracking_number' => 'TRACK123456'
        ]);

        $response->assertStatus(200);
        
        $order->refresh();
        $this->assertEquals('shipped', $order->status);
        $this->assertEquals('TRACK123456', $order->tracking_number);
        $this->assertNotNull($order->shipped_at);
    }

    public function test_can_cancel_order_with_reason(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'new'
        ]);

        $response = $this->tenantPost("/api/orders/{$order->id}/cancel", [
            'reason' => 'Customer request'
        ]);

        $response->assertStatus(200);
        
        $order->refresh();
        $this->assertEquals('cancelled', $order->status);
        $this->assertArrayHasKey('cancellation_reason', $order->metadata);
    }

    public function test_can_get_available_transitions(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'new'
        ]);

        $response = $this->tenantGet("/api/orders/{$order->id}/available-transitions");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'data' => [
                'currentStatus',
                'availableTransitions' => [
                    '*' => [
                        'status',
                        'label',
                        'description',
                    ]
                ]
            ]
        ]);
    }

    public function test_cannot_update_other_tenant_order(): void
    {
        $otherTenant = Tenant::factory()->create();
        $otherOrder = Order::factory()->create(['tenant_id' => $otherTenant->id]);

        $response = $this->tenantPut("/api/orders/{$otherOrder->id}", [
            'notes' => 'Unauthorized update'
        ]);

        $response->assertStatus(404);
    }

    public function test_cannot_delete_other_tenant_order(): void
    {
        $otherTenant = Tenant::factory()->create();
        $otherOrder = Order::factory()->create(['tenant_id' => $otherTenant->id]);

        $response = $this->tenantDelete("/api/orders/{$otherOrder->id}");

        $response->assertStatus(404);
    }

    public function test_cannot_access_other_tenant_orders(): void
    {
        $otherTenant = Tenant::factory()->create();
        $otherOrder = Order::factory()->create(['tenant_id' => $otherTenant->id]);

        $response = $this->tenantGet("/api/orders/{$otherOrder->id}");

        $response->assertStatus(404);
    }

    public function test_order_search_works_correctly(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_number' => 'ORD-12345'
        ]);

        $response = $this->tenantGet('/api/orders?search=ORD-123');

        $response->assertStatus(200);
        $this->assertGreaterThan(0, count($response->json('data')));
    }

    public function test_order_date_range_filter_works(): void
    {
        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => Customer::factory()->create(['tenant_id' => $this->tenant->id])->id,
            'created_at' => now()->subDays(10)
        ]);

        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => Customer::factory()->create(['tenant_id' => $this->tenant->id])->id,
            'created_at' => now()->subDays(5)
        ]);

        $response = $this->tenantGet('/api/orders?date_from=' . now()->subDays(7)->format('Y-m-d'));

        $response->assertStatus(200);
        $this->assertEquals(1, count($response->json('data')));
    }

    public function test_status_endpoint_is_tenant_scoped(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'status' => 'new'
        ]);

        $otherTenant = Tenant::factory()->create();
        $otherCustomer = Customer::factory()->create(['tenant_id' => $otherTenant->id]);
        Order::factory()->create([
            'tenant_id' => $otherTenant->id,
            'customer_id' => $otherCustomer->id,
            'status' => 'new'
        ]);

        $response = $this->tenantGet('/api/orders/status/new');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($order->id, $data[0]['id']);
        $this->assertEquals($this->tenant->id, $data[0]['tenantId']);
    }

    public function test_customer_endpoint_is_tenant_scoped(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
        ]);

        $otherTenant = Tenant::factory()->create();
        $otherCustomer = Customer::factory()->create(['tenant_id' => $otherTenant->id]);
        Order::factory()->create([
            'tenant_id' => $otherTenant->id,
            'customer_id' => $otherCustomer->id,
        ]);

        $response = $this->tenantGet('/api/orders/customer/' . $customer->id);

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($order->id, $data[0]['id']);
        $this->assertEquals($this->tenant->id, $data[0]['tenantId']);
    }

    public function test_quotations_endpoint_is_tenant_scoped(): void
    {
        $vendor = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'vendor_id' => $vendor->id,
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
        ]);

        $otherTenant = Tenant::factory()->create();
        $otherVendor = Vendor::factory()->create(['tenant_id' => $otherTenant->id]);
        $otherCustomer = Customer::factory()->create(['tenant_id' => $otherTenant->id]);
        $otherOrder = Order::factory()->create([
            'tenant_id' => $otherTenant->id,
            'customer_id' => $otherCustomer->id,
            'vendor_id' => $otherVendor->id,
        ]);

        OrderVendorNegotiation::factory()->create([
            'tenant_id' => $otherTenant->id,
            'order_id' => $otherOrder->id,
            'vendor_id' => $otherVendor->id,
        ]);

        $response = $this->tenantGet('/api/orders/' . $order->id . '/quotations');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($this->tenant->id, $data[0]['tenantId']);
        $this->assertEquals($order->id, $data[0]['orderId']);
    }

    private function tenantGet(string $uri)
    {
        return $this->getJson('https://' . $this->tenantHost . $this->tenantUri($uri));
    }

    private function tenantPost(string $uri, array $data = [])
    {
        return $this->postJson('https://' . $this->tenantHost . $this->tenantUri($uri), $data);
    }

    private function tenantPut(string $uri, array $data = [])
    {
        return $this->putJson('https://' . $this->tenantHost . $this->tenantUri($uri), $data);
    }

    private function tenantPatch(string $uri, array $data = [])
    {
        return $this->patchJson('https://' . $this->tenantHost . $this->tenantUri($uri), $data);
    }

    private function tenantDelete(string $uri, array $data = [])
    {
        return $this->deleteJson('https://' . $this->tenantHost . $this->tenantUri($uri), $data);
    }

    private function tenantUri(string $uri): string
    {
        if (str_starts_with($uri, '/api/v1/')) {
            return $uri;
        }

        if (str_starts_with($uri, '/api/')) {
            return '/api/v1/' . ltrim(substr($uri, 5), '/');
        }

        return $uri;
    }
}
