<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant\Api;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AnalyticsSegmentationExportTest extends TestCase
{
    use RefreshDatabase;

    protected TenantEloquentModel $tenant;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = TenantEloquentModel::factory()->create();
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->user);
    }

    public function test_customer_segmentation_endpoint_returns_distribution(): void
    {
        $this->seedAnalyticsData();

        $response = $this->getJson('/api/v1/tenant/analytics/customers/segmentation?limit=5');

        $response->assertStatus(200);
        $this->assertNotEmpty($response->json('data.distribution'));
        $this->assertNotEmpty($response->json('data.topCustomers'));
        $this->assertNotEmpty($response->json('data.atRiskCustomers'));
    }

    public function test_vendor_analytics_endpoint_returns_summary(): void
    {
        $this->seedAnalyticsData();

        $response = $this->getJson('/api/v1/tenant/analytics/vendors?limit=3&underperforming_threshold=50');

        $response->assertStatus(200);
        $summary = $response->json('data.summary');
        $this->assertGreaterThan(0, $summary['totalVendors']);
        $this->assertArrayHasKey('ratingBreakdown', $summary);
        $this->assertNotEmpty($response->json('data.topPerformers'));
    }

    public function test_analytics_export_endpoints_return_data(): void
    {
        $this->seedAnalyticsData();

        $salesResponse = $this->getJson('/api/v1/tenant/analytics/export/sales');
        $salesResponse->assertStatus(200);
        $this->assertNotEmpty($salesResponse->json('data'));

        $customersResponse = $this->getJson('/api/v1/tenant/analytics/export/customers');
        $customersResponse->assertStatus(200);
        $this->assertNotEmpty($customersResponse->json('data'));
    }

    public function test_inventory_reconciliation_flow_and_export(): void
    {
        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'track_inventory' => true,
            'stock_quantity' => 0,
            'low_stock_threshold' => 5,
        ]);

        $locationResponse = $this->postJson('/api/v1/tenant/inventory/locations', [
            'location_code' => 'MAIN-001',
            'location_name' => 'Primary Warehouse',
            'location_type' => 'warehouse',
        ]);

        $locationResponse->assertStatus(201);
        $locationId = $locationResponse->json('data.id');

        $stockResponse = $this->postJson("/api/v1/tenant/inventory/items/{$product->id}/locations/{$locationId}/stock", [
            'quantity' => 120,
            'reason' => 'initial_load',
        ]);
        $stockResponse->assertStatus(200);

        $reconciliationResponse = $this->postJson('/api/v1/tenant/inventory/reconciliations/run', [
            'source' => 'automated_test',
            'async' => false,
        ]);
        $reconciliationResponse->assertStatus(200);

        $recordsResponse = $this->getJson('/api/v1/tenant/inventory/reconciliations');
        $recordsResponse->assertStatus(200);

        $inventoryExport = $this->getJson('/api/v1/tenant/analytics/export/inventory');
        $inventoryExport->assertStatus(200);
        $this->assertNotEmpty($inventoryExport->json('data'));
    }

    private function seedAnalyticsData(): void
    {
        $vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
        ]);

        Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'track_inventory' => true,
            'stock_quantity' => 15,
            'low_stock_threshold' => 5,
            'tags' => ['premium'],
        ]);

        $highValueCustomer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
            'customer_type' => 'business',
        ]);

        $lastOrderDate = null;
        for ($i = 0; $i < 10; $i++) {
            $orderDate = Carbon::now()->subDays($i);
            if ($i === 0) {
                $lastOrderDate = $orderDate;
            }
            Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $highValueCustomer->id,
                'vendor_id' => $vendor->id,
                'status' => 'completed',
                'payment_status' => 'paid',
                'total_amount' => 10000000,
                'total_paid_amount' => 10000000,
                'created_at' => $orderDate,
                'delivered_at' => $orderDate,
                'estimated_delivery' => $orderDate,
                'metadata' => [
                    'vendor_response_time_hours' => 5,
                    'quality_issues' => false,
                ],
            ]);
        }
        $highValueCustomer->update(['last_order_date' => $lastOrderDate]);

        $atRiskCustomer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
            'customer_type' => 'individual',
        ]);

        $lastAtRiskOrderDate = Carbon::now()->subDays(180);
        for ($i = 0; $i < 4; $i++) {
            $orderDate = Carbon::now()->subDays(180 + ($i * 30));
            Order::factory()->create([
                'tenant_id' => $this->tenant->id,
                'customer_id' => $atRiskCustomer->id,
                'vendor_id' => $vendor->id,
                'status' => 'completed',
                'payment_status' => 'paid',
                'total_amount' => 10000000,
                'total_paid_amount' => 10000000,
                'created_at' => $orderDate,
                'delivered_at' => $orderDate,
                'estimated_delivery' => $orderDate,
                'metadata' => [
                    'vendor_response_time_hours' => 5,
                    'quality_issues' => false,
                ],
            ]);
        }
        $atRiskCustomer->update(['last_order_date' => $lastAtRiskOrderDate]);
    }
}
