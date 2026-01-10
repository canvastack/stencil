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

class VendorEvaluationApiTest extends TestCase
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

    public function test_can_list_vendor_evaluations(): void
    {
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order1->id,
            'quality_rating' => 4.5,
            'service_score' => 4.2,
            'communication_score' => 4.8,
            'notes' => 'Great quality work',
            'total_price' => 100000,
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order2->id,
            'quality_rating' => 4.0,
            'service_score' => 3.8,
            'communication_score' => 4.2,
            'notes' => 'Good service',
            'total_price' => 150000,
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/evaluations');

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
                    'rating',
                    'quality_score',
                    'delivery_score',
                    'service_score',
                    'communication_score',
                    'comment',
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
                'average_rating',
            ]
        ]);

        $this->assertTrue($response->json('success'));
        $this->assertCount(2, $response->json('data'));
        $this->assertEquals($this->vendor->name, $response->json('meta.vendor_name'));
    }

    public function test_evaluations_list_excludes_null_quality_ratings(): void
    {
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order1->id,
            'quality_rating' => 4.5,
            'total_price' => 100000,
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order2->id,
            'quality_rating' => null,
            'total_price' => 150000,
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/evaluations');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }

    public function test_evaluations_list_supports_pagination(): void
    {
        for ($i = 0; $i < 25; $i++) {
            $order = Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $this->customer->id,
            ]);
            VendorOrder::create([
                'vendor_id' => $this->vendor->id,
                'order_id' => $order->id,
                'quality_rating' => 4.0 + ($i * 0.02),
                'total_price' => 100000,
            ]);
        }

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/evaluations?per_page=10');

        $response->assertStatus(200);
        $this->assertCount(10, $response->json('data'));
        $this->assertEquals(25, $response->json('meta.total'));
        $this->assertEquals(3, $response->json('meta.last_page'));
    }

    public function test_evaluations_list_supports_sorting(): void
    {
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
            'created_at' => now()->subDays(2),
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order1->id,
            'quality_rating' => 3.5,
            'total_price' => 100000,
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
            'quality_rating' => 4.8,
            'total_price' => 150000,
            'created_at' => now()->subDays(1),
        ]);

        $response = $this->tenantGet('/api/v1/tenant/vendors/' . $this->vendor->id . '/evaluations?sort_by=rating&sort_order=desc');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertEquals(4.8, $data[0]['rating']);
        $this->assertEquals(3.5, $data[1]['rating']);
    }

    public function test_can_create_vendor_evaluation(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order->id,
            'total_price' => 100000,
        ]);

        $evaluationData = [
            'order_id' => $order->id,
            'rating' => 4.5,
            'quality_score' => 4.5,
            'delivery_score' => 4.2,
            'service_score' => 4.7,
            'communication_score' => 4.8,
            'comment' => 'Excellent work quality and timely delivery',
        ];

        $response = $this->tenantPost('/api/v1/tenant/vendors/' . $this->vendor->id . '/evaluations', $evaluationData);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'vendor_id',
                'order_id',
                'rating',
                'quality_score',
                'delivery_score',
                'service_score',
                'communication_score',
                'comment',
                'created_at',
                'updated_at',
            ]
        ]);

        $this->assertTrue($response->json('success'));
        $this->assertEquals(4.5, $response->json('data.rating'));
        $this->assertEquals($this->vendor->id, $response->json('data.vendor_id'));
    }

    public function test_creating_evaluation_updates_vendor_rating(): void
    {
        $order1 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order1->id,
            'quality_rating' => 4.0,
            'total_price' => 100000,
        ]);

        $order2 = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order2->id,
            'total_price' => 150000,
        ]);

        $evaluationData = [
            'order_id' => $order2->id,
            'rating' => 5.0,
            'quality_score' => 5.0,
            'comment' => 'Perfect service',
        ];

        $response = $this->tenantPost('/api/v1/tenant/vendors/' . $this->vendor->id . '/evaluations', $evaluationData);

        $response->assertStatus(201);

        $this->vendor->refresh();
        $this->assertEquals(4.5, $this->vendor->rating);
    }

    public function test_create_evaluation_validates_required_fields(): void
    {
        $response = $this->tenantPost('/api/v1/tenant/vendors/' . $this->vendor->id . '/evaluations', []);

        $response->assertStatus(422);
        $response->assertJsonStructure([
            'success',
            'message',
            'errors',
        ]);
        $this->assertFalse($response->json('success'));
    }

    public function test_create_evaluation_validates_rating_range(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);
        VendorOrder::create([
            'vendor_id' => $this->vendor->id,
            'order_id' => $order->id,
            'total_price' => 100000,
        ]);

        $evaluationData = [
            'order_id' => $order->id,
            'rating' => 6.0,
        ];

        $response = $this->tenantPost('/api/v1/tenant/vendors/' . $this->vendor->id . '/evaluations', $evaluationData);

        $response->assertStatus(422);
    }

    public function test_create_evaluation_returns_404_for_non_existent_vendor(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);

        $evaluationData = [
            'order_id' => $order->id,
            'rating' => 4.5,
        ];

        $response = $this->tenantPost('/api/v1/tenant/vendors/99999/evaluations', $evaluationData);

        $response->assertStatus(404);
        $this->assertFalse($response->json('success'));
    }

    public function test_create_evaluation_returns_404_for_non_existent_vendor_order(): void
    {
        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $this->customer->id,
        ]);

        $evaluationData = [
            'order_id' => $order->id,
            'rating' => 4.5,
        ];

        $response = $this->tenantPost('/api/v1/tenant/vendors/' . $this->vendor->id . '/evaluations', $evaluationData);

        $response->assertStatus(404);
        $this->assertFalse($response->json('success'));
        $this->assertStringContainsString('not found', $response->json('message'));
    }

    public function test_list_evaluations_returns_404_for_non_existent_vendor(): void
    {
        $response = $this->tenantGet('/api/v1/tenant/vendors/99999/evaluations');

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
