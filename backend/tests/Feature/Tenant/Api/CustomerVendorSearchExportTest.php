<?php

declare(strict_types=1);

namespace Tests\Feature\Tenant\Api;

use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use App\Infrastructure\Persistence\Eloquent\Models\ProductCategory;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerVendorSearchExportTest extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::factory()->create();
        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->user);
    }

    public function test_customer_search_returns_segmentation_data(): void
    {
        $customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
            'customer_type' => 'business',
        ]);

        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'status' => 'completed',
            'payment_status' => 'paid',
            'total_amount' => 7500000,
            'total_paid_amount' => 7500000,
            'created_at' => Carbon::now()->subDays(10),
        ]);

        $response = $this->getJson('/api/v1/tenant/customers/search?include_segmentation=1&query=' . urlencode($customer->name));

        $response->assertStatus(200);
        $results = $response->json('data.results');
        $this->assertNotEmpty($results);
        $first = $results[0];
        $this->assertArrayHasKey('segmentation', $first);
        $this->assertArrayHasKey('rfm', $first['segmentation']);
        $this->assertArrayHasKey('churnRisk', $first['segmentation']);
    }

    public function test_customer_export_streams_csv(): void
    {
        $customer = Customer::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
        ]);

        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'status' => 'completed',
            'payment_status' => 'paid',
            'total_amount' => 5500000,
            'total_paid_amount' => 5500000,
        ]);

        $response = $this->get('/api/v1/tenant/customers/export');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('content-type'));
        $this->assertStringContainsString('customers-export-', (string) $response->headers->get('content-disposition'));
        $csv = $response->streamedContent();
        $this->assertStringContainsString((string) $customer->id, $csv);
    }

    public function test_vendor_search_includes_performance_metrics(): void
    {
        $vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
            'category' => 'printing',
        ]);

        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $vendor->id,
            'status' => 'completed',
            'payment_status' => 'paid',
            'total_amount' => 8200000,
            'total_paid_amount' => 8200000,
            'delivered_at' => Carbon::now()->subDays(2),
            'estimated_delivery' => Carbon::now()->subDays(2),
            'metadata' => [
                'vendor_response_time_hours' => 6,
                'quality_issues' => false,
            ],
        ]);

        $response = $this->getJson('/api/v1/tenant/vendors/search?include_performance=1&query=' . urlencode($vendor->name));

        $response->assertStatus(200);
        $results = $response->json('data');
        $this->assertNotEmpty($results);
        $first = $results[0];
        $this->assertArrayHasKey('performance', $first);
        $this->assertGreaterThan(0, $first['performance']['overall_score']);
    }

    public function test_vendor_export_respects_min_score_filter(): void
    {
        $highVendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
            'code' => 'HV-001',
        ]);

        $lowVendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
            'code' => 'LV-001',
        ]);

        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $highVendor->id,
            'status' => 'completed',
            'payment_status' => 'paid',
            'total_amount' => 9000000,
            'total_paid_amount' => 9000000,
            'delivered_at' => Carbon::now()->subDays(5),
            'estimated_delivery' => Carbon::now()->subDays(5),
            'metadata' => [
                'vendor_response_time_hours' => 4,
                'quality_issues' => false,
            ],
        ]);

        Order::factory()->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $lowVendor->id,
            'status' => 'completed',
            'payment_status' => 'paid',
            'total_amount' => 1500000,
            'total_paid_amount' => 1500000,
            'delivered_at' => Carbon::now()->subDays(15),
            'estimated_delivery' => Carbon::now()->subDays(5),
            'metadata' => [
                'vendor_response_time_hours' => 72,
                'quality_issues' => true,
            ],
        ]);

        $response = $this->get('/api/v1/tenant/vendors/export?min_score=74');

        $response->assertStatus(200);
        $csv = $response->streamedContent();
        $this->assertStringContainsString('HV-001', $csv);
        $this->assertStringNotContainsString('LV-001', $csv);
    }

    public function test_product_taxonomy_helpers_return_data(): void
    {
        $rootCategory = ProductCategory::factory()->create([
            'tenant_id' => $this->tenant->id,
            'is_active' => true,
            'is_featured' => true,
        ]);

        ProductCategory::factory()->create([
            'tenant_id' => $this->tenant->id,
            'parent_id' => $rootCategory->id,
            'is_active' => true,
        ]);

        Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'category_id' => $rootCategory->id,
            'tags' => ['premium', 'custom'],
        ]);

        $categoriesResponse = $this->getJson('/api/v1/tenant/products/categories?include_children=1&with_counts=1');
        $categoriesResponse->assertStatus(200);
        $this->assertNotEmpty($categoriesResponse->json('data'));
        $meta = $categoriesResponse->json('meta.stats');
        $this->assertGreaterThanOrEqual(1, $meta['totalCategories']);

        $tagsResponse = $this->getJson('/api/v1/tenant/products/tags');
        $tagsResponse->assertStatus(200);
        $tags = $tagsResponse->json('data');
        $this->assertNotEmpty($tags);
        $this->assertSame('premium', $tags[0]['tag']);
    }
}
