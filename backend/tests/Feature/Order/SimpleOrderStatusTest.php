<?php

namespace Tests\Feature\Order;

use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class SimpleOrderStatusTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_can_update_order_status()
    {
        // Create test data
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'status' => 'pending',
        ]);

        // Update status
        $order->update(['status' => 'confirmed']);

        // Assert status was updated
        $this->assertEquals('confirmed', $order->fresh()->status);
    }

    /** @test */
    public function it_detects_status_changes()
    {
        // Create test data
        $tenant = Tenant::factory()->create();
        $customer = Customer::factory()->create(['tenant_id' => $tenant->id]);
        $order = Order::factory()->create([
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'status' => 'pending',
        ]);

        // Store original status before change
        $originalStatus = $order->status;
        
        // Check if wasChanged works
        $order->status = 'confirmed';
        
        // Check before save
        $this->assertTrue($order->isDirty('status'));
        $this->assertEquals('pending', $order->getOriginal('status'));
        
        $order->save();

        // Check after save
        $this->assertTrue($order->wasChanged('status'));
        $this->assertEquals('confirmed', $order->status);
        $this->assertEquals('pending', $originalStatus);
    }
}