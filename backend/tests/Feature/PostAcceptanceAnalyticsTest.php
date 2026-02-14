<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

class PostAcceptanceAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private Vendor $vendor;
    private Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create(['email' => 'admin@test.com', 'account_type' => 'tenant']);
        $this->vendor = Vendor::factory()->create();
        $this->customer = Customer::factory()->create();
    }

    /** @test */
    public function it_can_fetch_dashboard_metrics()
    {
        Order::factory()->create([
            'customer_id' => $this->customer->id,
            'vendor_id' => $this->vendor->id,
            'vendor_quote_accepted_at' => now()->subDays(5),
            'vendor_estimated_delivery_days' => 10,
            'status' => 'production',
        ]);

        Sanctum::actingAs($this->adminUser);
        $response = $this->getJson('/api/v1/admin/analytics/post-acceptance/dashboard/metrics?time_range=30d');
        $response->assertStatus(200)->assertJsonStructure(['metrics', 'period']);
    }

    /** @test */
    public function it_can_fetch_production_timeline()
    {
        Sanctum::actingAs($this->adminUser);
        $response = $this->getJson('/api/v1/admin/analytics/post-acceptance/dashboard/production-timeline?time_range=30d');
        $response->assertStatus(200)->assertJsonStructure(['timeline']);
    }

    /** @test */
    public function it_can_fetch_vendor_performance()
    {
        Sanctum::actingAs($this->adminUser);
        $response = $this->getJson('/api/v1/admin/analytics/post-acceptance/dashboard/vendor-performance');
        $response->assertStatus(200)->assertJsonStructure(['vendors', 'pagination']);
    }

    /** @test */
    public function it_can_fetch_delivery_status_distribution()
    {
        Sanctum::actingAs($this->adminUser);
        $response = $this->getJson('/api/v1/admin/analytics/post-acceptance/dashboard/delivery-status');
        $response->assertStatus(200)->assertJsonStructure(['distribution', 'total']);
    }

    /** @test */
    public function it_can_fetch_recent_activity()
    {
        Sanctum::actingAs($this->adminUser);
        $response = $this->getJson('/api/v1/admin/analytics/post-acceptance/dashboard/recent-activity?limit=10');
        $response->assertStatus(200)->assertJsonStructure(['activities']);
    }
}
