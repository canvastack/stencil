<?php

namespace Tests\Unit\Domain\Customer\Services;

use App\Domain\Customer\Services\CustomerSegmentationService;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class CustomerSegmentationServiceTest extends TestCase
{
    use RefreshDatabase;

    protected CustomerSegmentationService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new CustomerSegmentationService();
    }

    public function test_calculate_rfm_score_for_champion_customer(): void
    {
        $customer = Customer::factory()->create([
            'last_order_date' => Carbon::now()->subDays(10),
        ]);

        Order::factory()->count(15)->create([
            'customer_id' => $customer->id,
            'status' => 'completed',
            'payment_status' => 'paid',
            'total_amount' => 5000000,
        ]);

        $customer->load('orders');
        $rfm = $this->service->calculateRFMScore($customer);

        $this->assertEquals($customer->id, $rfm['customer_id']);
        $this->assertArrayHasKey('recency_score', $rfm);
        $this->assertArrayHasKey('frequency_score', $rfm);
        $this->assertArrayHasKey('monetary_score', $rfm);
        $this->assertArrayHasKey('segment', $rfm);
        $this->assertGreaterThanOrEqual(4, $rfm['recency_score']);
        $this->assertGreaterThanOrEqual(4, $rfm['frequency_score']);
    }

    public function test_calculate_rfm_score_for_new_customer(): void
    {
        $customer = Customer::factory()->create([
            'last_order_date' => Carbon::now()->subDays(5),
        ]);

        Order::factory()->create([
            'customer_id' => $customer->id,
            'status' => 'completed',
            'payment_status' => 'paid',
            'total_amount' => 1000000,
        ]);

        $customer->load('orders');
        $rfm = $this->service->calculateRFMScore($customer);

        $this->assertEquals(5, $rfm['recency_score']);
        $this->assertEquals(1, $rfm['frequency_score']);
        $this->assertContains($rfm['segment'], ['new_customers', 'need_attention']);
    }

    public function test_segment_all_customers_returns_collection(): void
    {
        Customer::factory()->count(5)->create(['status' => 'active']);

        $segments = $this->service->segmentAllCustomers();

        $this->assertGreaterThan(0, $segments->count());
        
        foreach ($segments as $segment) {
            $this->assertArrayHasKey('customer_id', $segment);
            $this->assertArrayHasKey('rfm_score', $segment);
            $this->assertArrayHasKey('segment', $segment);
        }
    }

    public function test_get_segment_distribution_returns_valid_data(): void
    {
        Customer::factory()->count(10)->create(['status' => 'active']);

        $distribution = $this->service->getSegmentDistribution();

        $this->assertIsArray($distribution);
        
        foreach ($distribution as $segment => $data) {
            $this->assertArrayHasKey('count', $data);
            $this->assertArrayHasKey('percentage', $data);
            $this->assertArrayHasKey('total_value', $data);
            $this->assertArrayHasKey('avg_frequency', $data);
        }
    }

    public function test_get_lifetime_value_calculates_correctly(): void
    {
        $customer = Customer::factory()->create();

        Order::factory()->count(5)->create([
            'customer_id' => $customer->id,
            'status' => 'completed',
            'payment_status' => 'paid',
            'total_amount' => 2000000,
            'created_at' => Carbon::now()->subMonths(rand(1, 6)),
        ]);

        $customer->load('orders');
        $ltv = $this->service->getLifetimeValue($customer);

        $this->assertEquals($customer->id, $ltv['customer_id']);
        $this->assertEquals(5, $ltv['total_orders']);
        $this->assertEquals(10000000, $ltv['total_spent']);
        $this->assertEquals(2000000, $ltv['average_order_value']);
        $this->assertArrayHasKey('predicted_lifetime_value', $ltv);
    }

    public function test_get_churn_risk_identifies_at_risk_customer(): void
    {
        $customer = Customer::factory()->create([
            'last_order_date' => Carbon::now()->subDays(180),
        ]);

        Order::factory()->count(2)->create([
            'customer_id' => $customer->id,
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        $churnRisk = $this->service->getChurnRisk($customer);

        $this->assertGreaterThan(50, $churnRisk['churn_risk_score']);
        $this->assertContains($churnRisk['risk_level'], ['high', 'critical']);
        $this->assertArrayHasKey('recommendation', $churnRisk);
    }

    public function test_get_churn_risk_identifies_low_risk_customer(): void
    {
        $customer = Customer::factory()->create([
            'last_order_date' => Carbon::now()->subDays(15),
        ]);

        Order::factory()->count(10)->create([
            'customer_id' => $customer->id,
            'status' => 'completed',
            'payment_status' => 'paid',
            'created_at' => Carbon::now()->subMonths(rand(0, 6)),
        ]);

        $churnRisk = $this->service->getChurnRisk($customer);

        $this->assertLessThan(50, $churnRisk['churn_risk_score']);
        $this->assertContains($churnRisk['risk_level'], ['low', 'medium']);
    }

    public function test_get_high_value_customers_filters_correctly(): void
    {
        Customer::factory()->count(5)->create(['status' => 'active']);
        
        $highValue = Customer::factory()->create([
            'status' => 'active',
            'last_order_date' => Carbon::now()->subDays(10),
        ]);

        Order::factory()->count(20)->create([
            'customer_id' => $highValue->id,
            'status' => 'completed',
            'payment_status' => 'paid',
            'total_amount' => 10000000,
        ]);

        $customers = $this->service->getHighValueCustomers(10);

        $this->assertGreaterThan(0, $customers->count());
        $this->assertTrue($customers->contains('customer_id', $highValue->id));
    }

    public function test_get_at_risk_customers_returns_high_churn_risk(): void
    {
        $atRiskCustomer = Customer::factory()->create([
            'status' => 'active',
            'last_order_date' => Carbon::now()->subDays(200),
        ]);

        Order::factory()->count(2)->create([
            'customer_id' => $atRiskCustomer->id,
            'status' => 'completed',
            'payment_status' => 'paid',
        ]);

        Customer::factory()->count(3)->create(['status' => 'active']);

        $atRiskCustomers = $this->service->getAtRiskCustomers(10);

        $this->assertGreaterThan(0, $atRiskCustomers->count());
        
        foreach ($atRiskCustomers as $customer) {
            $this->assertContains($customer['risk_level'], ['high', 'critical']);
        }
    }
}
