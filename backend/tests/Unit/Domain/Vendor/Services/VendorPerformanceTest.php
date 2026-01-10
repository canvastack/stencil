<?php

namespace Tests\Unit\Domain\Vendor\Services;

use App\Domain\Vendor\Services\VendorEvaluationService;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorPerformanceTest extends TestCase
{
    use RefreshDatabase;

    protected VendorEvaluationService $evaluationService;
    protected TenantEloquentModel $tenant;
    protected Vendor $vendor;

    protected function setUp(): void
    {
        parent::setUp();
        $this->evaluationService = app(VendorEvaluationService::class);
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'lead_time' => 7,
        ]);
    }

    public function test_vendor_sla_compliance_tracking(): void
    {
        $this->createOrders(5, [
            'delivered_at' => now()->toDateString(),
            'status' => 'completed',
        ]);

        $slaReport = $this->evaluationService->trackSLA($this->vendor);

        $this->assertArrayHasKey('vendor_id', $slaReport);
        $this->assertArrayHasKey('vendor_name', $slaReport);
        $this->assertArrayHasKey('metrics', $slaReport);
        $this->assertArrayHasKey('compliance', $slaReport);
        $this->assertArrayHasKey('compliance_rate', $slaReport);
        $this->assertArrayHasKey('sla_status', $slaReport);
    }

    public function test_quality_score_calculation(): void
    {
        $this->createOrders(10, [
            'status' => 'completed',
            'metadata' => ['quality_issues' => false],
        ]);

        $evaluation = $this->evaluationService->evaluateVendor($this->vendor);

        $this->assertArrayHasKey('metrics', $evaluation);
        $this->assertArrayHasKey('quality_score', $evaluation['metrics']);
        $this->assertGreaterThanOrEqual(0, $evaluation['metrics']['quality_score']['score']);
        $this->assertLessThanOrEqual(100, $evaluation['metrics']['quality_score']['score']);
    }

    public function test_on_time_delivery_metrics(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        Order::factory(8)->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'customer_id' => $customer->id,
            'created_at' => now()->subDays(10),
            'estimated_delivery' => now()->subDays(3)->toDateString(),
            'delivered_at' => now()->subDays(3)->toDateString(),
            'status' => 'completed',
        ]);

        Order::factory(2)->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'customer_id' => $customer->id,
            'created_at' => now()->subDays(10),
            'estimated_delivery' => now()->subDays(3)->toDateString(),
            'delivered_at' => now()->subDays(1)->toDateString(),
            'status' => 'completed',
        ]);

        $evaluation = $this->evaluationService->evaluateVendor($this->vendor);

        $this->assertArrayHasKey('delivery_performance', $evaluation['metrics']);
        $this->assertGreaterThan(0, $evaluation['metrics']['delivery_performance']['on_time_rate']);
    }

    public function test_rating_updates(): void
    {
        $this->createOrders(10, [
            'status' => 'completed',
            'metadata' => ['quality_issues' => false],
        ]);

        $evaluation = $this->evaluationService->evaluateVendor($this->vendor);

        $this->assertArrayHasKey('overall_score', $evaluation);
        $this->assertArrayHasKey('performance_rating', $evaluation);
        $this->assertArrayHasKey('performance_label', $evaluation);
        $this->assertNotEmpty($evaluation['performance_rating']);
        $this->assertNotEmpty($evaluation['performance_label']);
    }

    public function test_performance_ranking(): void
    {
        $vendor1 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $vendor2 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $vendor3 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);

        $this->createOrdersForVendor($vendor1, 10, ['status' => 'completed']);
        $this->createOrdersForVendor($vendor2, 8, ['status' => 'completed']);
        $this->createOrdersForVendor($vendor3, 5, ['status' => 'completed']);

        $evaluations = $this->evaluationService->evaluateAllVendors();

        $this->assertNotEmpty($evaluations);
        foreach ($evaluations as $index => $evaluation) {
            if ($index > 0) {
                $this->assertGreaterThanOrEqual(
                    $evaluations[$index]->overall_score,
                    $evaluations[$index - 1]->overall_score
                );
            }
        }
    }

    public function test_top_performing_vendors(): void
    {
        for ($i = 0; $i < 15; $i++) {
            $vendor = Vendor::factory()->create([
                'tenant_id' => $this->tenant->id,
                'code' => 'VND-' . str_pad($i + 1000, 5, '0', STR_PAD_LEFT),
            ]);
            $this->createOrdersForVendor($vendor, 5 + $i, ['status' => 'completed']);
        }

        $topVendors = $this->evaluationService->getTopPerformingVendors(10);

        $this->assertCount(10, $topVendors);

        foreach ($topVendors as $index => $vendor) {
            if ($index > 0) {
                $this->assertGreaterThanOrEqual(
                    $topVendors[$index]->overall_score,
                    $topVendors[$index - 1]->overall_score
                );
            }
        }
    }

    public function test_underperforming_vendors_identification(): void
    {
        $vendor1 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $vendor2 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);

        $this->createOrdersForVendor($vendor1, 10, [
            'status' => 'completed',
            'metadata' => ['quality_issues' => false],
        ]);

        $this->createOrdersForVendor($vendor2, 10, [
            'status' => 'cancelled',
        ]);

        $underperformers = $this->evaluationService->getUnderperformingVendors(70.0);

        $this->assertGreaterThan(0, count($underperformers));
    }

    public function test_vendor_trend_analysis(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        for ($month = 5; $month >= 0; $month--) {
            for ($i = 0; $i < 3; $i++) {
                Order::factory()->create([
                    'tenant_id' => $this->tenant->id,
                    'vendor_id' => $this->vendor->id,
                    'customer_id' => $customer->id,
                    'created_at' => now()->subMonths($month),
                    'delivered_at' => now()->subMonths($month)->addDays(3),
                    'status' => 'completed',
                    'total_amount' => 500000 + ($month * 50000),
                ]);
            }
        }

        $trend = $this->evaluationService->getVendorTrend($this->vendor, 6);

        $this->assertArrayHasKey('vendor_id', $trend);
        $this->assertArrayHasKey('trends', $trend);
        $this->assertArrayHasKey('summary', $trend);
        $this->assertCount(6, $trend['trends']);
    }

    public function test_vendor_comparison(): void
    {
        $vendor1 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $vendor2 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);
        $vendor3 = Vendor::factory()->create(['tenant_id' => $this->tenant->id]);

        $this->createOrdersForVendor($vendor1, 15, ['status' => 'completed']);
        $this->createOrdersForVendor($vendor2, 10, ['status' => 'completed']);
        $this->createOrdersForVendor($vendor3, 5, ['status' => 'completed']);

        $comparison = $this->evaluationService->compareVendors([
            $vendor1->id,
            $vendor2->id,
            $vendor3->id,
        ]);

        $this->assertCount(3, $comparison);

        $scores = $comparison->pluck('overall_score')->toArray();
        $sortedScores = $scores;
        rsort($sortedScores);
        $this->assertEquals($scores, $sortedScores);
    }

    public function test_sla_metrics_calculation(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        Order::factory(8)->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'customer_id' => $customer->id,
            'created_at' => now()->subDays(60),
            'delivered_at' => now()->subDays(50),
            'status' => 'completed',
        ]);

        $slaReport = $this->evaluationService->trackSLA($this->vendor, [
            'max_lead_time_days' => 14,
            'min_on_time_delivery_rate' => 90,
            'min_quality_acceptance_rate' => 95,
            'max_response_time_hours' => 24,
        ]);

        $this->assertArrayHasKey('metrics', $slaReport);
        $this->assertArrayHasKey('average_lead_time', $slaReport['metrics']);
        $this->assertArrayHasKey('on_time_delivery_rate', $slaReport['metrics']);
    }

    public function test_sla_compliance_rate(): void
    {
        $this->createOrders(10, ['status' => 'completed']);

        $slaReport = $this->evaluationService->trackSLA($this->vendor);

        $this->assertArrayHasKey('compliance_rate', $slaReport);
        $this->assertIsNumeric($slaReport['compliance_rate']);
        $this->assertGreaterThanOrEqual(0, $slaReport['compliance_rate']);
        $this->assertLessThanOrEqual(100, $slaReport['compliance_rate']);
    }

    public function test_sla_status_determination(): void
    {
        $this->createOrders(15, ['status' => 'completed']);

        $slaReport = $this->evaluationService->trackSLA($this->vendor);

        $this->assertArrayHasKey('sla_status', $slaReport);
        $this->assertArrayHasKey('sla_status_label', $slaReport);
        $this->assertNotEmpty($slaReport['sla_status']);
    }

    public function test_sla_violations_identification(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        Order::factory(5)->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'customer_id' => $customer->id,
            'created_at' => now()->subDays(60),
            'delivered_at' => now()->subDays(10),
            'status' => 'completed',
        ]);

        $slaReport = $this->evaluationService->trackSLA($this->vendor, [
            'max_lead_time_days' => 5,
        ]);

        $this->assertArrayHasKey('violations', $slaReport);
        $this->assertIsArray($slaReport['violations']);
    }

    public function test_vendor_evaluation_includes_all_metrics(): void
    {
        $this->createOrders(10, ['status' => 'completed']);

        $evaluation = $this->evaluationService->evaluateVendor($this->vendor);

        $this->assertArrayHasKey('overall_score', $evaluation);
        $this->assertArrayHasKey('metrics', $evaluation);
        $this->assertArrayHasKey('delivery_performance', $evaluation['metrics']);
        $this->assertArrayHasKey('quality_score', $evaluation['metrics']);
        $this->assertArrayHasKey('response_time', $evaluation['metrics']);
        $this->assertArrayHasKey('price_competitiveness', $evaluation['metrics']);
        $this->assertArrayHasKey('reliability', $evaluation['metrics']);
    }

    public function test_vendor_evaluation_score_range(): void
    {
        $this->createOrders(10, ['status' => 'completed']);

        $evaluation = $this->evaluationService->evaluateVendor($this->vendor);

        $this->assertGreaterThanOrEqual(0, $evaluation['overall_score']);
        $this->assertLessThanOrEqual(100, $evaluation['overall_score']);
    }

    public function test_performance_recommendations_generation(): void
    {
        $this->createOrders(10, ['status' => 'completed']);

        $evaluation = $this->evaluationService->evaluateVendor($this->vendor);

        $this->assertArrayHasKey('recommendations', $evaluation);
        $this->assertIsArray($evaluation['recommendations']);
    }

    public function test_vendor_reliability_score_calculation(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        Order::factory(8)->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'customer_id' => $customer->id,
            'status' => 'completed',
        ]);

        Order::factory(2)->create([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->id,
            'customer_id' => $customer->id,
            'status' => 'cancelled',
        ]);

        $evaluation = $this->evaluationService->evaluateVendor($this->vendor);

        $this->assertArrayHasKey('reliability', $evaluation['metrics']);
        $this->assertArrayHasKey('score', $evaluation['metrics']['reliability']);
        $this->assertArrayHasKey('completion_rate', $evaluation['metrics']['reliability']);
        $this->assertArrayHasKey('cancellation_rate', $evaluation['metrics']['reliability']);
    }

    public function test_price_competitiveness_scoring(): void
    {
        $this->createOrders(10, ['total_amount' => 500000, 'status' => 'completed']);

        $evaluation = $this->evaluationService->evaluateVendor($this->vendor);

        $this->assertArrayHasKey('price_competitiveness', $evaluation['metrics']);
        $this->assertArrayHasKey('score', $evaluation['metrics']['price_competitiveness']);
        $this->assertArrayHasKey('competitiveness_level', $evaluation['metrics']['price_competitiveness']);
    }

    public function test_response_time_scoring(): void
    {
        $this->createOrders(10, [
            'status' => 'completed',
            'metadata' => ['vendor_response_time_hours' => 6],
        ]);

        $evaluation = $this->evaluationService->evaluateVendor($this->vendor);

        $this->assertArrayHasKey('response_time', $evaluation['metrics']);
        $this->assertArrayHasKey('score', $evaluation['metrics']['response_time']);
        $this->assertArrayHasKey('avg_response_hours', $evaluation['metrics']['response_time']);
    }

    public function test_empty_vendor_evaluation(): void
    {
        $evaluation = $this->evaluationService->evaluateVendor($this->vendor);

        $this->assertArrayHasKey('overall_score', $evaluation);
        $this->assertArrayHasKey('metrics', $evaluation);
        $this->assertIsNumeric($evaluation['overall_score']);
    }

    public function test_trend_summary_calculation(): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        for ($month = 5; $month >= 0; $month--) {
            Order::factory(3)->create([
                'tenant_id' => $this->tenant->id,
                'vendor_id' => $this->vendor->id,
                'customer_id' => $customer->id,
                'created_at' => now()->subMonths($month),
                'delivered_at' => now()->subMonths($month)->addDays(3),
                'status' => 'completed',
                'total_amount' => 500000,
            ]);
        }

        $trend = $this->evaluationService->getVendorTrend($this->vendor, 6);

        $this->assertArrayHasKey('total_orders', $trend['summary']);
        $this->assertArrayHasKey('total_value', $trend['summary']);
        $this->assertArrayHasKey('avg_monthly_orders', $trend['summary']);
        $this->assertArrayHasKey('performance_trend', $trend['summary']);
    }

    public function test_tenant_scoping_in_evaluation(): void
    {
        $tenant2 = TenantEloquentModel::factory()->create();
        $vendor2 = Vendor::factory()->create(['tenant_id' => $tenant2->id]);

        $this->createOrdersForVendor($this->vendor, 5, ['status' => 'completed']);
        $this->createOrdersForVendor($vendor2, 10, ['status' => 'completed']);

        $evaluation1 = $this->evaluationService->evaluateVendor($this->vendor);
        $evaluation2 = $this->evaluationService->evaluateVendor($vendor2);

        $this->assertEquals($this->vendor->id, $evaluation1['vendor_id']);
        $this->assertEquals($vendor2->id, $evaluation2['vendor_id']);
    }

    protected function createOrders(int $count, array $overrides = []): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $this->tenant->id]);

        for ($i = 0; $i < $count; $i++) {
            Order::factory()->create(
                array_merge([
                    'tenant_id' => $this->tenant->id,
                    'vendor_id' => $this->vendor->id,
                    'customer_id' => $customer->id,
                    'created_at' => now()->subDays(60),
                ], $overrides)
            );
        }
    }

    protected function createOrdersForVendor(Vendor $vendor, int $count, array $overrides = []): void
    {
        $customer = Customer::factory()->create(['tenant_id' => $vendor->tenant_id]);

        for ($i = 0; $i < $count; $i++) {
            Order::factory()->create(
                array_merge([
                    'tenant_id' => $vendor->tenant_id,
                    'vendor_id' => $vendor->id,
                    'customer_id' => $customer->id,
                    'created_at' => now()->subDays(60),
                ], $overrides)
            );
        }
    }
}
