<?php

namespace Tests\Feature\Tenant\Api;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VendorPerformanceApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected TenantEloquentModel $tenant;
    protected string $tenantHost;
    protected Vendor $vendor;

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
    }

    public function test_can_get_delivery_metrics(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order1->id,
            'delivery_status' => 'on_time',
            'total_price' => 100000,
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order2->id,
            'delivery_status' => 'early',
            'total_price' => 150000,
        ]);

        $order3 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order3->id,
            'delivery_status' => 'late',
            'total_price' => 120000,
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendor-performance/delivery-metrics');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'name',
                    'value',
                    'color',
                ]
            ],
            'meta' => [
                'period',
                'total_orders',
                'on_time_count',
                'early_count',
                'late_count',
                'generated_at',
            ]
        ]);

        $this->assertTrue($response->json('success'));
        $this->assertEquals(3, $response->json('meta.total_orders'));
        $this->assertEquals(1, $response->json('meta.on_time_count'));
        $this->assertEquals(1, $response->json('meta.early_count'));
        $this->assertEquals(1, $response->json('meta.late_count'));
    }

    public function test_delivery_metrics_filters_by_period(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        $recentOrder = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'created_at' => now()->subDays(15),
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $recentOrder->id,
            'delivery_status' => 'on_time',
            'total_price' => 100000,
        ]);

        $oldOrder = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'created_at' => now()->subMonths(8),
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $oldOrder->id,
            'delivery_status' => 'late',
            'total_price' => 100000,
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendor-performance/delivery-metrics?period=1m');

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('meta.total_orders'));
        $this->assertEquals('1m', $response->json('meta.period'));
    }

    public function test_delivery_metrics_filters_by_vendor(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);
        $vendor2 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);

        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order1->id,
            'delivery_status' => 'on_time',
            'total_price' => 100000,
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $vendor2->id,
            'order_id' => $order2->id,
            'delivery_status' => 'late',
            'total_price' => 100000,
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendor-performance/delivery-metrics?vendor_id=' . $this->vendor->id);

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('meta.total_orders'));
        $this->assertEquals(1, $response->json('meta.on_time_count'));
        $this->assertEquals(0, $response->json('meta.late_count'));
    }

    public function test_delivery_metrics_handles_no_data(): void
    {
        $response = $this->tenantGet('/api/v1/tenant/vendor-performance/delivery-metrics');

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
        $this->assertEquals(0, $response->json('meta.total_orders'));
        $this->assertCount(3, $response->json('data'));
    }

    public function test_can_get_quality_metrics(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order1->id,
            'quality_rating' => 4.8,
            'total_price' => 100000,
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order2->id,
            'quality_rating' => 4.2,
            'total_price' => 150000,
        ]);

        $order3 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order3->id,
            'quality_rating' => 3.7,
            'total_price' => 120000,
        ]);

        $order4 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order4->id,
            'quality_rating' => 3.2,
            'total_price' => 130000,
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendor-performance/quality-metrics');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                '*' => [
                    'category',
                    'count',
                    'percentage',
                ]
            ],
            'meta' => [
                'period',
                'total_orders',
                'average_rating',
                'excellent_count',
                'good_count',
                'average_count',
                'poor_count',
                'generated_at',
            ]
        ]);

        $this->assertTrue($response->json('success'));
        $this->assertEquals(4, $response->json('meta.total_orders'));
        $this->assertEquals(1, $response->json('meta.excellent_count'));
        $this->assertEquals(1, $response->json('meta.good_count'));
        $this->assertEquals(1, $response->json('meta.average_count'));
        $this->assertEquals(1, $response->json('meta.poor_count'));
    }

    public function test_quality_metrics_excludes_null_ratings(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order1->id,
            'quality_rating' => 4.5,
            'total_price' => 100000,
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order2->id,
            'quality_rating' => null,
            'total_price' => 150000,
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendor-performance/quality-metrics');

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('meta.total_orders'));
    }

    public function test_quality_metrics_handles_no_data(): void
    {
        $response = $this->tenantGet('/api/v1/tenant/vendor-performance/quality-metrics');

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
        $this->assertEquals(0, $response->json('meta.total_orders'));
        $this->assertCount(4, $response->json('data'));
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
