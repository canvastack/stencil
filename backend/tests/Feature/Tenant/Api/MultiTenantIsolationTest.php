<?php

namespace Tests\Feature\Tenant\Api;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MultiTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenantA;
    protected Tenant $tenantB;
    protected User $userA;
    protected User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenantA = Tenant::factory()->create(['name' => 'Tenant A']);
        $this->tenantB = Tenant::factory()->create(['name' => 'Tenant B']);

        $this->userA = User::factory()->create(['tenant_id' => $this->tenantA->id]);
        $this->userB = User::factory()->create(['tenant_id' => $this->tenantB->id]);
    }

    public function test_tenant_a_cannot_see_tenant_b_orders(): void
    {
        Sanctum::actingAs($this->userA);

        $orderA = Order::factory()->create(['tenant_id' => $this->tenantA->id]);
        $orderB = Order::factory()->create(['tenant_id' => $this->tenantB->id]);

        $response = $this->getJson('/api/v1/tenant/orders');

        $response->assertStatus(200);
        
        $orderIds = collect($response->json('data'))->pluck('id')->toArray();
        
        $this->assertContains($orderA->id, $orderIds);
        $this->assertNotContains($orderB->id, $orderIds);
    }

    public function test_tenant_a_cannot_access_tenant_b_order_detail(): void
    {
        Sanctum::actingAs($this->userA);

        $orderB = Order::factory()->create(['tenant_id' => $this->tenantB->id]);

        $response = $this->getJson("/api/v1/tenant/orders/{$orderB->id}");

        $response->assertStatus(404);
    }

    public function test_tenant_a_cannot_see_tenant_b_customers(): void
    {
        Sanctum::actingAs($this->userA);

        $customerA = Customer::factory()->create(['tenant_id' => $this->tenantA->id]);
        $customerB = Customer::factory()->create(['tenant_id' => $this->tenantB->id]);

        $response = $this->getJson('/api/v1/tenant/customers');

        $response->assertStatus(200);
        
        $customerIds = collect($response->json('data'))->pluck('id')->toArray();
        
        $this->assertContains($customerA->id, $customerIds);
        $this->assertNotContains($customerB->id, $customerIds);
    }

    public function test_tenant_a_cannot_access_tenant_b_customer_detail(): void
    {
        Sanctum::actingAs($this->userA);

        $customerB = Customer::factory()->create(['tenant_id' => $this->tenantB->id]);

        $response = $this->getJson("/api/v1/tenant/customers/{$customerB->id}");

        $response->assertStatus(404);
    }

    public function test_tenant_a_cannot_see_tenant_b_products(): void
    {
        Sanctum::actingAs($this->userA);

        $productA = Product::factory()->create(['tenant_id' => $this->tenantA->id]);
        $productB = Product::factory()->create(['tenant_id' => $this->tenantB->id]);

        $response = $this->getJson('/api/v1/tenant/products');

        $response->assertStatus(200);
        
        $productIds = collect($response->json('data'))->pluck('id')->toArray();
        
        $this->assertContains($productA->id, $productIds);
        $this->assertNotContains($productB->id, $productIds);
    }

    public function test_tenant_a_cannot_see_tenant_b_vendors(): void
    {
        Sanctum::actingAs($this->userA);

        $vendorA = Vendor::factory()->create(['tenant_id' => $this->tenantA->id]);
        $vendorB = Vendor::factory()->create(['tenant_id' => $this->tenantB->id]);

        $response = $this->getJson('/api/v1/tenant/vendors');

        $response->assertStatus(200);
        
        $vendorIds = collect($response->json('data'))->pluck('id')->toArray();
        
        $this->assertContains($vendorA->id, $vendorIds);
        $this->assertNotContains($vendorB->id, $vendorIds);
    }

    public function test_tenant_a_cannot_update_tenant_b_order(): void
    {
        Sanctum::actingAs($this->userA);

        $orderB = Order::factory()->create(['tenant_id' => $this->tenantB->id]);

        $response = $this->putJson("/api/v1/tenant/orders/{$orderB->id}", [
            'notes' => 'Attempting to update'
        ]);

        $response->assertStatus(404);
    }

    public function test_tenant_a_cannot_delete_tenant_b_customer(): void
    {
        Sanctum::actingAs($this->userA);

        $customerB = Customer::factory()->create(['tenant_id' => $this->tenantB->id]);

        $response = $this->deleteJson("/api/v1/tenant/customers/{$customerB->id}");

        $response->assertStatus(404);

        $this->assertDatabaseHas('customers', ['id' => $customerB->id]);
    }

    public function test_orders_include_only_tenant_specific_customers(): void
    {
        Sanctum::actingAs($this->userA);

        $customerA = Customer::factory()->create(['tenant_id' => $this->tenantA->id]);
        $customerB = Customer::factory()->create(['tenant_id' => $this->tenantB->id]);

        $orderData = [
            'customer_id' => $customerB->id,
            'status' => 'new',
            'total_amount' => 1000000,
        ];

        $response = $this->postJson('/api/v1/tenant/orders', $orderData);

        $response->assertStatus(422);
    }

    public function test_analytics_only_show_tenant_data(): void
    {
        Sanctum::actingAs($this->userA);

        Order::factory()->count(5)->create([
            'tenant_id' => $this->tenantA->id,
            'status' => 'completed',
            'total_amount' => 1000000,
        ]);

        Order::factory()->count(10)->create([
            'tenant_id' => $this->tenantB->id,
            'status' => 'completed',
            'total_amount' => 2000000,
        ]);

        $response = $this->getJson('/api/v1/tenant/analytics/overview');

        $response->assertStatus(200);
        
        $totalOrders = $response->json('data.totalOrders');
        $this->assertEquals(5, $totalOrders);
    }

    public function test_dashboard_stats_isolated_by_tenant(): void
    {
        Sanctum::actingAs($this->userA);

        Order::factory()->count(3)->create(['tenant_id' => $this->tenantA->id]);
        Order::factory()->count(7)->create(['tenant_id' => $this->tenantB->id]);

        $response = $this->getJson('/api/v1/tenant/dashboard');

        $response->assertStatus(200);
        
        $totalOrders = $response->json('data.totalOrders');
        $this->assertEquals(3, $totalOrders);
    }

    public function test_switching_tenant_context_works_correctly(): void
    {
        Sanctum::actingAs($this->userA);

        Order::factory()->create(['tenant_id' => $this->tenantA->id]);

        $responseA = $this->getJson('/api/v1/tenant/orders');
        $responseA->assertStatus(200);
        $this->assertEquals(1, count($responseA->json('data')));

        Sanctum::actingAs($this->userB);

        Order::factory()->count(2)->create(['tenant_id' => $this->tenantB->id]);

        $responseB = $this->getJson('/api/v1/tenant/orders');
        $responseB->assertStatus(200);
        $this->assertEquals(2, count($responseB->json('data')));
    }

    public function test_database_queries_automatically_scope_by_tenant(): void
    {
        Sanctum::actingAs($this->userA);

        Customer::factory()->count(3)->create(['tenant_id' => $this->tenantA->id]);
        Customer::factory()->count(5)->create(['tenant_id' => $this->tenantB->id]);

        $customers = Customer::all();

        $this->assertEquals(3, $customers->count());
        $this->assertTrue($customers->every(fn($c) => $c->tenant_id === $this->tenantA->id));
    }
}
