<?php

namespace Tests\Integration\Infrastructure\Controllers;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Domain\Order\Enums\OrderStatus;
use App\Domain\Order\Enums\PaymentStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class OrderApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected $tenant;
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);
        
        Sanctum::actingAs($this->user);
    }

    protected function setTenantContext(): void
    {
        app()->instance('current_tenant', $this->tenant);
        config(['multitenancy.current_tenant' => $this->tenant]);
    }

    public function test_can_approve_draft_order(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        app()->instance('current_tenant', $this->tenant);
        config(['multitenancy.current_tenant' => $this->tenant]);

        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'status' => OrderStatus::DRAFT->value,
            'payment_status' => PaymentStatus::Pending->value,
        ]);

        $response = $this->withHeaders([
            'X-Tenant-ID' => $this->tenant->uuid,
        ])->postJson("/api/v1/tenant/orders/{$order->uuid}/approve");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'uuid',
                    'orderNumber',
                    'status',
                ]
            ]);

        $order->refresh();
        $this->assertEquals(OrderStatus::PENDING->value, $order->status);
    }

    public function test_cannot_approve_non_draft_order(): void
    {
        $this->setTenantContext();

        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        $order = Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'status' => OrderStatus::PENDING->value,
        ]);

        $response = $this->postJson("/api/v1/tenant/orders/{$order->uuid}/approve", [], [
            'X-Tenant-ID' => $this->tenant->uuid
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Hanya pesanan dengan status Draft yang dapat disetujui',
            ]);

        $order->refresh();
        $this->assertEquals(OrderStatus::PENDING->value, $order->status);
    }

    public function test_cannot_approve_order_from_different_tenant(): void
    {
        $anotherTenant = TenantEloquentModel::factory()->create();
        
        app()->forgetInstance('current_tenant');
        app()->instance('current_tenant', $anotherTenant);
        config(['multitenancy.current_tenant' => $anotherTenant]);
        
        $customer = Customer::factory()->create(['tenant_id' => $anotherTenant->id]);

        $order = Order::factory()->create([
            'tenant_id' => $anotherTenant->id,
            'customer_id' => $customer->id,
            'status' => OrderStatus::DRAFT->value,
        ]);
        
        $this->setTenantContext();

        $response = $this->postJson("/api/v1/tenant/orders/{$order->uuid}/approve", [], [
            'X-Tenant-ID' => $this->tenant->uuid
        ]);

        $response->assertStatus(404);
    }
}
