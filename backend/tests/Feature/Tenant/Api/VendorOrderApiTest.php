<?php

namespace Tests\Feature\Tenant\Api;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderItem;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VendorOrderApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected TenantEloquentModel $tenant;
    protected string $tenantHost;
    protected Vendor $vendor;
    protected Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = TenantEloquentModel::factory()->create();
        $this->tenantHost = $this->tenant->slug . '.canvastencil.test';
        $this->tenant->update(['domain' => $this->tenantHost]);

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        
        Sanctum::actingAs($this->user);
        auth('tenant')->setUser($this->user);

        app()->instance('current_tenant', $this->tenant);
        config(['multitenancy.current_tenant' => $this->tenant]);

        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Vendor',
        ]);

        $this->customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    public function test_can_list_vendor_orders(): void
    {
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'total_amount' => 500000,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order1->id,
            'final_price' => 500000,
            'estimated_price' => 400000,
            'status' => 'completed',
            'delivery_status' => 'on_time',
            'quality_rating' => 4.5,
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'total_amount' => 300000,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order2->id,
            'final_price' => 300000,
            'estimated_price' => 250000,
            'status' => 'in_progress',
            'delivery_status' => 'pending',
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/orders');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'id',
                    'vendor_id',
                    'order_id',
                    'order_code',
                    'customer_name',
                    'total_price',
                    'vendor_price',
                    'status',
                    'delivery_status',
                    'quality_rating',
                    'delivery_date',
                    'notes',
                    'created_at',
                    'updated_at',
                ]
            ],
            'meta' => [
                'current_page',
                'per_page',
                'total',
                'last_page',
                'vendor_id',
                'vendor_name',
            ],
            'summary' => [
                'total_orders',
                'completed_orders',
                'completion_rate',
                'on_time_deliveries',
                'on_time_rate',
                'average_rating',
                'total_revenue',
            ]
        ]);

        $this->assertTrue($response->json('success'));
        $this->assertCount(2, $response->json('data'));
        $this->assertEquals(2, $response->json('summary.total_orders'));
        $this->assertEquals(1, $response->json('summary.completed_orders'));
    }

    public function test_vendor_orders_list_supports_pagination(): void
    {
        for ($i = 0; $i < 25; $i++) {
            $order = Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $this->customer->id,
            ]);
            VendorOrder::create([
                'vendor_id' => $this->vendor->id,
                'order_id' => $order->id,
                'final_price' => 100000,
                'estimated_price' => 80000,
                'status' => 'completed',
            ]);
        }

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/orders?per_page=10');

        $response->assertStatus(200);
        $this->assertCount(10, $response->json('data'));
        $this->assertEquals(25, $response->json('meta.total'));
        $this->assertEquals(3, $response->json('meta.last_page'));
    }

    public function test_vendor_orders_list_supports_status_filter(): void
    {
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order1->id,
            'status' => 'completed',
            'final_price' => 100000,
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order2->id,
            'status' => 'pending',
            'final_price' => 100000,
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/orders?status=completed');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('completed', $response->json('data.0.status'));
    }

    public function test_vendor_orders_list_supports_delivery_status_filter(): void
    {
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order1->id,
            'delivery_status' => 'on_time',
            'final_price' => 100000,
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order2->id,
            'delivery_status' => 'late',
            'final_price' => 100000,
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/orders?delivery_status=on_time');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('on_time', $response->json('data.0.delivery_status'));
    }

    public function test_vendor_orders_list_supports_date_range_filter(): void
    {
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'created_at' => now()->subDays(10),
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order1->id,
            'final_price' => 100000,
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'created_at' => now()->subDays(30),
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order2->id,
            'final_price' => 100000,
        ]);

        $dateFrom = now()->subDays(15)->format('Y-m-d');
        $dateTo = now()->format('Y-m-d');

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/orders?date_from=' . $dateFrom . '&date_to=' . $dateTo);

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_vendor_orders_list_supports_sorting(): void
    {
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'created_at' => now()->subDays(2),
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order1->id,
            'final_price' => 100000,
            'created_at' => now()->subDays(2),
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'created_at' => now()->subDays(1),
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order2->id,
            'final_price' => 200000,
            'created_at' => now()->subDays(1),
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/orders?sort_by=created_at&sort_order=asc');

        $response->assertStatus(200);
        $this->assertEquals(100000, $response->json('data.0.total_price'));
        $this->assertEquals(200000, $response->json('data.1.total_price'));
    }

    public function test_vendor_orders_summary_calculates_correctly(): void
    {
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order1->id,
            'status' => 'completed',
            'delivery_status' => 'on_time',
            'quality_rating' => 4.5,
            'estimated_price' => 100000,
            'final_price' => 100000,
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order2->id,
            'status' => 'completed',
            'delivery_status' => 'on_time',
            'quality_rating' => 3.5,
            'estimated_price' => 200000,
            'final_price' => 200000,
        ]);

        $order3 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order3->id,
            'status' => 'pending',
            'delivery_status' => 'pending',
            'final_price' => 150000,
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/orders');

        $response->assertStatus(200);
        $summary = $response->json('summary');
        
        $this->assertEquals(3, $summary['total_orders']);
        $this->assertEquals(2, $summary['completed_orders']);
        $this->assertEquals(66.7, $summary['completion_rate']);
        $this->assertEquals(2, $summary['on_time_deliveries']);
        $this->assertEquals(100.0, $summary['on_time_rate']);
        $this->assertEquals(4.0, $summary['average_rating']);
        $this->assertEquals(300000, $summary['total_revenue']);
    }

    public function test_can_get_specific_vendor_order(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'total_amount' => 500000,
        ]);

        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order->id,
            'final_price' => 500000,
            'estimated_price' => 400000,
            'status' => 'completed',
            'delivery_status' => 'on_time',
            'quality_rating' => 4.5,
            'notes' => 'Excellent work',
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/orders/' . $order->id);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'vendor_id',
                'order_id',
                'order_code',
                'customer' => [
                    'id',
                    'name',
                    'email',
                    'phone',
                ],
                'items',
                'total_price',
                'vendor_price',
                'profit_margin',
                'status',
                'delivery_status',
                'quality_rating',
                'delivery_date',
                'notes',
                'created_at',
                'updated_at',
            ]
        ]);

        $this->assertTrue($response->json('success'));
        $this->assertEquals($this->vendor->id, $response->json('data.vendor_id'));
        $this->assertEquals($order->id, $response->json('data.order_id'));
        $this->assertEquals($this->customer->name, $response->json('data.customer.name'));
        $this->assertEquals(20.0, $response->json('data.profit_margin'));
    }

    public function test_vendor_order_show_calculates_profit_margin(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);

        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order->id,
            'final_price' => 1000000,
            'estimated_price' => 750000,
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/orders/' . $order->id);

        $response->assertStatus(200);
        $this->assertEquals(25.0, $response->json('data.profit_margin'));
    }

    public function test_vendor_order_show_returns_null_profit_margin_when_prices_missing(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);

        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order->id,
            'final_price' => null,
            'estimated_price' => null,
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/orders/' . $order->id);

        $response->assertStatus(200);
        $this->assertNull($response->json('data.profit_margin'));
    }

    public function test_vendor_order_show_returns_404_for_non_existent_order(): void
    {
        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/orders/99999');

        $response->assertStatus(404);
        $this->assertFalse($response->json('success'));
    }

    public function test_vendor_orders_list_returns_404_for_non_existent_vendor(): void
    {
        $response = $this->tenantGet('/api/v1/tenant/vendors/99999/orders');

        $response->assertStatus(404);
        $this->assertFalse($response->json('success'));
    }

    public function test_vendor_order_show_returns_404_for_non_existent_vendor(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendors/99999/orders/' . $order->id);

        $response->assertStatus(404);
        $this->assertFalse($response->json('success'));
    }

    protected function tenantGet(string $uri, array $headers = []): \Illuminate\Testing\TestResponse
    {
        return $this->get($uri, array_merge([
            'Host' => $this->tenantHost,
        ], $headers));
    }

    protected function tenantPost(string $uri, array $data = [], array $headers = []): \Illuminate\Testing\TestResponse
    {
        return $this->post($uri, $data, array_merge([
            'Host' => $this->tenantHost,
        ], $headers));
    }
}
